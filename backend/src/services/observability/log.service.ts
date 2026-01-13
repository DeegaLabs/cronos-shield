/**
 * Log Service
 */

import * as crypto from 'node:crypto';
import { store } from '../../lib/storage/in-memory.store';
import { PostgresStore } from '../../lib/storage/postgres.store';
import type { LogEntry } from '../../types/observability.types';

// Use PostgreSQL if DATABASE_URL is set, otherwise fallback to in-memory
const usePostgres = !!process.env.DATABASE_URL;
const postgresStore = usePostgres ? new PostgresStore() : null;

type LogType = 'x402_payment' | 'risk_analysis' | 'transaction_blocked' | 'transaction_allowed' | 'divergence_analysis' | 'error';
type ServiceName = 'risk-oracle' | 'shielded-vault' | 'cex-dex-synergy' | 'observability';

export class LogService {
  private createHumanReadable(type: LogType, details: any, service: string): string {
    switch (type) {
      case 'x402_payment':
        return `💰 Agent paid ${details.amount || 'value'} via x402 to ${this.getServiceName(service)}. Reason: ${details.reason || 'risk analysis'}`;
      case 'risk_analysis':
        const score = details.score || 0;
        const contract = details.contract ? `contract ${details.contract.slice(0, 10)}...` : 'contract';
        return `🔍 Risk analysis performed for ${contract}. Score: ${score}/100. ${score > 50 ? '⚠️ High risk detected' : '✅ Acceptable risk'}`;
      case 'transaction_blocked':
        return `🚫 Transaction blocked! ${details.reason || 'Risk detected'}. ${details.score ? `Score: ${details.score}/100` : ''}`;
      case 'transaction_allowed':
        return `✅ Transaction allowed. ${details.score ? `Score: ${details.score}/100` : ''}`;
      case 'divergence_analysis':
        return `📊 CEX-DEX divergence check for pair ${details.pair || 'N/A'}. Divergence: ${details.divergence || 0}%`;
      default:
        return `📝 Event logged: ${type}`;
    }
  }

  private getServiceName(source: string): string {
    const names: Record<string, string> = {
      'risk-oracle': 'Risk Oracle',
      'shielded-vault': 'Shielded Vault',
      'cex-dex-synergy': 'CEX-DEX Synergy',
      'observability': 'Observability',
    };
    return names[source] || source;
  }

  async addLog(
    type: LogType,
    service: ServiceName,
    data: Record<string, any>
  ): Promise<LogEntry> {
    const log: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      service,
      data,
      humanReadable: this.createHumanReadable(type, data, service),
    };

    // Store log (async for PostgreSQL)
    if (usePostgres && postgresStore) {
      await postgresStore.addLog(log);
      
      if (type === 'transaction_blocked') {
        await postgresStore.addBlockedTransaction({
          id: log.id,
          timestamp: log.timestamp,
          user: data.user || 'unknown',
          target: data.target || data.contract || 'unknown',
          riskScore: data.score || 0,
          reason: data.reason || 'Risk detected',
          service: service as 'risk-oracle' | 'shielded-vault',
        });
      }
    } else {
      store.addLog(log);
      
      if (type === 'transaction_blocked') {
        store.addBlockedTransaction({
          id: log.id,
          timestamp: log.timestamp,
          user: data.user || 'unknown',
          target: data.target || data.contract || 'unknown',
          riskScore: data.score || 0,
          reason: data.reason || 'Risk detected',
          service: service as 'risk-oracle' | 'shielded-vault',
        });
      }
    }

    return log;
  }

  async getLogs(limit?: number, type?: string, service?: string): Promise<LogEntry[]> {
    if (usePostgres && postgresStore) {
      return await postgresStore.getLogs(limit, type, service);
    }
    return store.getLogs(limit, type, service);
  }

  async getLogById(id: string): Promise<LogEntry | undefined> {
    if (usePostgres && postgresStore) {
      return await postgresStore.getLogById(id);
    }
    return store.getLogById(id);
  }
}
