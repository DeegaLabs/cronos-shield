/**
 * In-Memory Storage for Observability
 */

import type { LogEntry, BlockedTransaction, Metrics } from '../../types/observability.types';

class InMemoryStore {
  private logs: LogEntry[] = [];
  private blockedTransactions: BlockedTransaction[] = [];
  private maxLogs = 10000;

  addLog(log: LogEntry): void {
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  getLogs(limit?: number, type?: string, service?: string): LogEntry[] {
    let filtered = [...this.logs];
    if (type) filtered = filtered.filter(log => log.type === type);
    if (service) filtered = filtered.filter(log => log.service === service);
    if (limit) filtered = filtered.slice(0, limit);
    return filtered;
  }

  getLogById(id: string): LogEntry | undefined {
    return this.logs.find(log => log.id === id);
  }

  addBlockedTransaction(block: BlockedTransaction): void {
    this.blockedTransactions.unshift(block);
    if (this.blockedTransactions.length > 1000) {
      this.blockedTransactions = this.blockedTransactions.slice(0, 1000);
    }
  }

  getBlockedTransactions(limit?: number): BlockedTransaction[] {
    return limit ? this.blockedTransactions.slice(0, limit) : this.blockedTransactions;
  }

  getMetrics(): Metrics {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const recentLogs = this.logs.filter(log => log.timestamp >= last24Hours);

    const payments = this.logs.filter(log => log.type === 'x402_payment');
    const analyses = this.logs.filter(log => log.type === 'risk_analysis');
    const blocks = this.logs.filter(log => log.type === 'transaction_blocked');
    const divergences = this.logs.filter(log => log.type === 'divergence_analysis');

    const riskScores = this.logs
      .filter(log => log.data?.score !== undefined)
      .map(log => log.data.score as number);

    const averageRiskScore = riskScores.length > 0
      ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
      : 0;

    return {
      totalPayments: payments.length,
      totalAnalyses: analyses.length,
      totalBlocks: blocks.length,
      totalDivergences: divergences.length,
      averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      totalRevenue: payments
        .filter(p => p.data?.amount)
        .reduce((sum, p) => {
          const amount = parseFloat(p.data.amount as string) || 0;
          return sum + amount;
        }, 0)
        .toFixed(6),
      last24Hours: {
        payments: recentLogs.filter(log => log.type === 'x402_payment').length,
        analyses: recentLogs.filter(log => log.type === 'risk_analysis').length,
        blocks: recentLogs.filter(log => log.type === 'transaction_blocked').length,
        divergences: recentLogs.filter(log => log.type === 'divergence_analysis').length,
      },
    };
  }

  clear(): void {
    this.logs = [];
    this.blockedTransactions = [];
  }
}

export const store = new InMemoryStore();
