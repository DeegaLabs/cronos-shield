/**
 * Divergence Controller
 */

import type { Request, Response, NextFunction } from 'express';
import { DivergenceService } from '../services/divergence/divergence.service';
import { FacilitatorService } from '../lib/x402/facilitator.service';
import { validateTokenSymbol } from '../lib/utils/validation.util';
import { logPayment } from '../lib/utils/logger.util';
import { recordPayment } from '../lib/x402/require-x402.middleware';
import type { DivergenceRequest } from '../types/divergence.types';

export class DivergenceController {
  constructor(
    private divergenceService: DivergenceService,
    private facilitatorService: FacilitatorService
  ) {}

  async analyzeDivergence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, amount } = req.query;

      if (!token || typeof token !== 'string') {
        res.status(400).json({ 
          error: 'missing_token',
          message: 'Token symbol is required (e.g., "CRO")' 
        });
        return;
      }

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
}
