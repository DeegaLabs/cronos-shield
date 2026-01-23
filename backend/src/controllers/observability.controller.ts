/**
 * Observability Controller
 */

import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'node:crypto';
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

  /**
   * Seed test blocked transactions for demo purposes
   * POST /api/observability/seed-blocked-transactions
   */
  async seedBlockedTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = parseInt(req.body.count as string) || 10;
      const usePostgres = !!process.env.DATABASE_URL;
      const postgresStore = usePostgres ? new PostgresStore() : null;
      
      const testTransactions = [];
      const now = Date.now();
      const testTargets = [
        '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0', // High risk contract from checklist
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321',
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        '0xfedcbafedcbafedcbafedcbafedcbafedcbafedc',
      ];
      const testReasons = [
        'High risk score detected',
        'Unverified contract',
        'Suspicious activity',
        'Low liquidity',
        'New contract with no history',
        'Risk score exceeds threshold',
        'Contract not verified on Cronoscan',
      ];
      const testUsers = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333',
      ];

      for (let i = 0; i < count; i++) {
        const transaction = {
          id: crypto.randomUUID(),
          timestamp: now - (i * 60000), // Spread over time (1 minute apart)
          user: testUsers[i % testUsers.length],
          target: testTargets[i % testTargets.length],
          riskScore: 70 + Math.floor(Math.random() * 30), // Risk score between 70-100
          reason: testReasons[i % testReasons.length],
          service: (i % 2 === 0 ? 'shielded-vault' : 'risk-oracle') as 'risk-oracle' | 'shielded-vault',
        };
        testTransactions.push(transaction);

        if (usePostgres && postgresStore) {
          await postgresStore.addBlockedTransaction(transaction);
        } else {
          store.addBlockedTransaction(transaction);
        }
      }

      res.status(201).json({
        message: `Created ${count} test blocked transactions`,
        count: testTransactions.length,
        transactions: testTransactions,
      });
    } catch (error) {
      next(error);
    }
  }
}
