/**
 * Types for Observability API
 */

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'x402_payment' | 'risk_analysis' | 'transaction_blocked' | 'transaction_allowed' | 'divergence_analysis' | 'error';
  service: 'risk-oracle' | 'shielded-vault' | 'cex-dex-synergy' | 'observability';
  data: Record<string, any>;
  humanReadable?: string;
}

export interface Metrics {
  totalPayments: number;
  totalAnalyses: number;
  totalBlocks: number;
  totalDivergences: number;
  averageRiskScore: number;
  totalRevenue: string; // In devUSDC.e
  last24Hours: {
    payments: number;
    analyses: number;
    blocks: number;
    divergences: number;
  };
}

export interface BlockedTransaction {
  id: string;
  timestamp: number;
  user: string;
  target: string;
  riskScore: number;
  reason: string;
  service: 'risk-oracle' | 'shielded-vault';
}
