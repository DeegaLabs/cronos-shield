/**
 * Observability Controller
 */

import type { Request, Response, NextFunction } from 'express';
import { LogService } from '../services/observability/log.service';
import { MetricsService } from '../services/observability/metrics.service';
import { PostgresStore } from '../lib/storage/postgres.store';
import { store } from '../lib/storage/in-memory.store';

export class ObservabilityController {
  constructor(
    private logService: LogService,
    private metricsService: MetricsService
  ) {}

  async addLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, service, data } = req.body;

      if (!type || !service || !data) {
        res.status(400).json({ 
          error: 'missing_fields',
          message: 'type, service, and data are required' 
        });
        return;
      }

      const log = await this.logService.addLog(type, service, data);
      res.status(201).json(log);
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, type, service } = req.query;
      const logs = await this.logService.getLogs(
        limit ? parseInt(limit as string) : undefined,
        type as string | undefined,
        service as string | undefined
      );
      res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  }

  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await this.metricsService.getMetrics();
      res.status(200).json(metrics);
    } catch (error) {
      next(error);
    }
  }

  async getBlockedTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit } = req.query;
      
      const usePostgres = !!process.env.DATABASE_URL;
      const postgresStore = usePostgres ? new PostgresStore() : null;
      
      let transactions = usePostgres && postgresStore
        ? await postgresStore.getBlockedTransactions(limit ? parseInt(limit as string) : undefined)
        : store.getBlockedTransactions(limit ? parseInt(limit as string) : undefined);
      
      // If no transactions in dedicated store, try to get from logs
      if (!transactions || transactions.length === 0) {
        const logs = usePostgres && postgresStore
          ? await postgresStore.getLogs(limit ? parseInt(limit as string) : undefined, 'transaction_blocked')
          : store.getLogs(limit ? parseInt(limit as string) : undefined, 'transaction_blocked');
        
        // Convert logs to blocked transactions format
        transactions = logs.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          user: log.data?.user || 'unknown',
          target: log.data?.target || log.data?.contract || 'unknown',
          riskScore: log.data?.score || 0,
          reason: log.data?.reason || 'Risk detected',
          service: log.service as 'risk-oracle' | 'shielded-vault',
        }));
        
        // If we found transactions from logs, save them to the dedicated store for future queries
        if (transactions.length > 0) {
          for (const tx of transactions) {
            if (usePostgres && postgresStore) {
              await postgresStore.addBlockedTransaction(tx).catch(() => {
                // Ignore errors (might already exist)
              });
            } else {
              store.addBlockedTransaction(tx);
            }
          }
        }
      }
      
      res.status(200).json(transactions);
    } catch (error) {
      next(error);
    }
  }
}
