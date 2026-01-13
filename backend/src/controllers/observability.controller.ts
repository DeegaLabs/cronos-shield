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
      
      const transactions = usePostgres && postgresStore
        ? await postgresStore.getBlockedTransactions(limit ? parseInt(limit as string) : undefined)
        : store.getBlockedTransactions(limit ? parseInt(limit as string) : undefined);
      
      res.status(200).json(transactions);
    } catch (error) {
      next(error);
    }
  }
}
