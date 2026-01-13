/**
 * PostgreSQL Storage for Observability
 * 
 * Replaces in-memory store with persistent PostgreSQL storage
 */

import { query } from '../database/db';
import type { LogEntry, BlockedTransaction, Metrics } from '../../types/observability.types';

export class PostgresStore {
  private maxLogs = 10000;

  async addLog(log: LogEntry): Promise<void> {
    await query(
      `INSERT INTO logs (id, timestamp, type, service, data, human_readable)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        log.id,
        log.timestamp,
        log.type,
        log.service,
        JSON.stringify(log.data),
        log.humanReadable || null,
      ]
    );

    // Clean up old logs if we exceed max
    await query(
      `DELETE FROM logs
       WHERE id NOT IN (
         SELECT id FROM logs
         ORDER BY timestamp DESC
         LIMIT $1
       )`,
      [this.maxLogs]
    );
  }

  async getLogs(limit?: number, type?: string, service?: string): Promise<LogEntry[]> {
    let sql = 'SELECT * FROM logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      sql += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (service) {
      sql += ` AND service = $${paramIndex}`;
      params.push(service);
      paramIndex++;
    }

    sql += ' ORDER BY timestamp DESC';

    if (limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(limit);
    }

    const result = await query(sql, params);
    return result.rows.map((row: any) => ({
      id: row.id,
      timestamp: Number(row.timestamp),
      type: row.type,
      service: row.service,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      humanReadable: row.human_readable,
    }));
  }

  async getLogById(id: string): Promise<LogEntry | undefined> {
    const result = await query('SELECT * FROM logs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return undefined;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      timestamp: Number(row.timestamp),
      type: row.type,
      service: row.service,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      humanReadable: row.human_readable,
    };
  }

  async addBlockedTransaction(block: BlockedTransaction): Promise<void> {
    await query(
      `INSERT INTO blocked_transactions (id, timestamp, user_address, target, risk_score, reason, service)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        block.id,
        block.timestamp,
        block.user,
        block.target,
        block.riskScore,
        block.reason,
        block.service,
      ]
    );

    // Clean up old transactions if we exceed max
    await query(
      `DELETE FROM blocked_transactions
       WHERE id NOT IN (
         SELECT id FROM blocked_transactions
         ORDER BY timestamp DESC
         LIMIT $1
       )`,
      [1000]
    );
  }

  async getBlockedTransactions(limit?: number): Promise<BlockedTransaction[]> {
    const sql = limit
      ? 'SELECT * FROM blocked_transactions ORDER BY timestamp DESC LIMIT $1'
      : 'SELECT * FROM blocked_transactions ORDER BY timestamp DESC';
    
    const params = limit ? [limit] : [];
    const result = await query(sql, params);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      timestamp: Number(row.timestamp),
      user: row.user_address,
      target: row.target,
      riskScore: row.risk_score,
      reason: row.reason,
      service: row.service as 'risk-oracle' | 'shielded-vault',
    }));
  }

  async getMetrics(): Promise<Metrics> {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);

    // Get all metrics in one query
    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'x402_payment') as total_payments,
        COUNT(*) FILTER (WHERE type = 'risk_analysis') as total_analyses,
        COUNT(*) FILTER (WHERE type = 'transaction_blocked') as total_blocks,
        COUNT(*) FILTER (WHERE type = 'divergence_analysis') as total_divergences,
        COUNT(*) FILTER (WHERE type = 'x402_payment' AND timestamp >= $1) as payments_24h,
        COUNT(*) FILTER (WHERE type = 'risk_analysis' AND timestamp >= $1) as analyses_24h,
        COUNT(*) FILTER (WHERE type = 'transaction_blocked' AND timestamp >= $1) as blocks_24h,
        COUNT(*) FILTER (WHERE type = 'divergence_analysis' AND timestamp >= $1) as divergences_24h,
        AVG((data->>'score')::numeric) FILTER (WHERE data->>'score' IS NOT NULL) as avg_risk_score,
        SUM((data->>'amount')::numeric) FILTER (WHERE type = 'x402_payment' AND data->>'amount' IS NOT NULL) as total_revenue
      FROM logs
    `, [last24Hours]);

    const row = result.rows[0];

    return {
      totalPayments: parseInt(row.total_payments) || 0,
      totalAnalyses: parseInt(row.total_analyses) || 0,
      totalBlocks: parseInt(row.total_blocks) || 0,
      totalDivergences: parseInt(row.total_divergences) || 0,
      averageRiskScore: parseFloat(row.avg_risk_score) || 0,
      totalRevenue: (parseFloat(row.total_revenue) || 0).toFixed(6),
      last24Hours: {
        payments: parseInt(row.payments_24h) || 0,
        analyses: parseInt(row.analyses_24h) || 0,
        blocks: parseInt(row.blocks_24h) || 0,
        divergences: parseInt(row.divergences_24h) || 0,
      },
    };
  }

  async clear(): Promise<void> {
    await query('TRUNCATE TABLE logs, blocked_transactions');
  }
}
