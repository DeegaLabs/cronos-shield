/**
 * Divergence Controller
 */

import type { Request, Response, NextFunction } from 'express';
import { DivergenceService } from '../services/divergence/divergence.service';
import { FacilitatorService } from '../lib/x402/facilitator.service';
import { validateTokenSymbol } from '../lib/utils/validation.util';
import { logPayment } from '../lib/utils/logger.util';
import { recordPayment } from '../lib/x402/require-x402.middleware';
import { query } from '../lib/database/db';
import type { DivergenceRequest } from '../types/divergence.types';

export class DivergenceController {
  constructor(
    private divergenceService: DivergenceService,
    private facilitatorService: FacilitatorService
  ) {}

  async analyzeDivergence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, amount } = req.query;

      validateTokenSymbol(token as string);

      const request: DivergenceRequest = {
        token: token as string,
        amount: amount as string | undefined,
      };

      const result = await this.divergenceService.calculateDivergence(request);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async settlePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentId, paymentHeader, paymentRequirements } = req.body;

      if (!paymentId || !paymentHeader || !paymentRequirements) {
        res.status(400).json({ 
          error: 'missing_fields',
          message: 'paymentId, paymentHeader, and paymentRequirements are required' 
        });
        return;
      }

      const result = await this.facilitatorService.verifyAndSettle({
        paymentId,
        paymentHeader,
        paymentRequirements,
      });

      if (result.ok && result.txHash) {
        recordPayment(paymentId, result.txHash);
        logPayment('cex-dex-synergy', {
          paymentId,
          txHash: result.txHash,
          reason: 'divergence_analysis',
        });
      }

      if (!result.ok) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      res.status(200).json({ success: true, txHash: result.txHash });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, days = '7' } = req.query;
      const daysNum = parseInt(days as string, 10);
      
      if (isNaN(daysNum) || daysNum < 1 || daysNum > 90) {
        res.status(400).json({ error: 'Invalid days parameter. Must be between 1 and 90.' });
        return;
      }

      const now = Date.now();
      const startTime = now - (daysNum * 24 * 60 * 60 * 1000);

      // Build query
      let sql = `
        SELECT 
          CAST(data->>'divergence' AS NUMERIC) as divergence,
          timestamp
        FROM logs
        WHERE type = 'divergence_analysis'
        AND timestamp >= $1
        AND timestamp < $2
      `;
      const params: any[] = [startTime, now];

      // Filter by token if provided
      if (token) {
        sql += ` AND data->>'token' = $3`;
        params.push(token);
      }

      sql += ` ORDER BY timestamp ASC`;

      const result = await query(sql, params);

      // Group by day and get average divergence per day
      const dayInMs = 24 * 60 * 60 * 1000;
      const dataPoints: number[] = [];
      
      for (let i = daysNum - 1; i >= 0; i--) {
        const dayStart = now - (i + 1) * dayInMs;
        const dayEnd = now - i * dayInMs;
        
        const dayData = result.rows.filter((row: any) => {
          const rowTime = parseInt(row.timestamp);
          return rowTime >= dayStart && rowTime < dayEnd;
        });

        if (dayData.length > 0) {
          const avgDivergence = dayData.reduce((sum: number, row: any) => {
            return sum + Math.abs(parseFloat(row.divergence) || 0);
          }, 0) / dayData.length;
          dataPoints.push(parseFloat(avgDivergence.toFixed(2)));
        } else {
          dataPoints.push(0);
        }
      }

      res.status(200).json({ data: dataPoints });
    } catch (error) {
      next(error);
    }
  }

  async getRecentAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '10' } = req.query;
      const limitNum = parseInt(limit as string, 10);
      
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        res.status(400).json({ error: 'Invalid limit parameter. Must be between 1 and 50.' });
        return;
      }

      const sql = `
        SELECT 
          data->>'token' as token,
          CAST(data->>'divergence' AS NUMERIC) as divergence,
          data->>'cexPrice' as cexPrice,
          data->>'dexPrice' as dexPrice,
          timestamp
        FROM logs
        WHERE type = 'divergence_analysis'
        AND ABS(CAST(data->>'divergence' AS NUMERIC)) > 1.0
        ORDER BY timestamp DESC
        LIMIT $1
      `;

      const result = await query(sql, [limitNum]);

      const alerts = result.rows.map((row: any) => {
        const divergence = parseFloat(row.divergence) || 0;
        const absDivergence = Math.abs(divergence);
        
        let severity: 'high' | 'medium' | 'low';
        if (absDivergence >= 5.0) {
          severity = 'high';
        } else if (absDivergence >= 2.0) {
          severity = 'medium';
        } else {
          severity = 'low';
        }

        // Calculate time ago
        const timestamp = parseInt(row.timestamp);
        const timeAgo = this.formatTimeAgo(timestamp);

        return {
          pair: `${row.token}/USDC`,
          divergence: absDivergence,
          severity,
          time: timeAgo,
          description: divergence > 0
            ? 'DEX price significantly higher than CEX'
            : 'CEX price significantly higher than DEX',
        };
      });

      res.status(200).json({ alerts });
    } catch (error) {
      next(error);
    }
  }

  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'just now';
    }
  }
}
