/**
 * Observability Controller
 */

import type { Request, Response, NextFunction } from 'express';
import { LogService } from '../services/observability/log.service';
import { MetricsService } from '../services/observability/metrics.service';
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

      const log = this.logService.addLog(type, service, data);
      res.status(201).json(log);
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, type, service } = req.query;
      const logs = this.logService.getLogs(
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
      const metrics = this.metricsService.getMetrics();
      res.status(200).json(metrics);
    } catch (error) {
      next(error);
    }
  }

  async getBlockedTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit } = req.query;
      const transactions = store.getBlockedTransactions(
        limit ? parseInt(limit as string) : undefined
      );
      res.status(200).json(transactions);
    } catch (error) {
      next(error);
    }
  }
}
