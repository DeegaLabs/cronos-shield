/**
 * Type definitions for frontend
 */

export interface RiskAnalysis {
  score: number;
  proof: string;
  details: {
    liquidity?: string;
    contractAge?: string;
    holders?: number;
    verified?: boolean;
    warnings?: string[];
  };
  timestamp: number;
  contract: string;
  verified?: boolean;
}

export interface DivergenceAnalysis {
  token: string;
  cexPrice: string;
  dexPrice: string;
  divergence: string;
  divergenceAmount: string;
  recommendation: 'buy_on_cex' | 'buy_on_dex' | 'no_arbitrage';
  timestamp: number;
  details: {
    cexExchange: string;
    dexExchange: string;
    liquidity: {
      cex: string;
      dex: string;
    };
  };
}

export interface Metrics {
  totalPayments: number;
  totalAnalyses: number;
  totalBlocks: number;
  totalDivergences: number;
  averageRiskScore: number;
  totalRevenue: string;
  last24Hours: {
    payments: number;
    analyses: number;
    blocks: number;
    divergences: number;
  };
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'x402_payment' | 'risk_analysis' | 'transaction_blocked' | 'transaction_allowed' | 'divergence_analysis' | 'error';
  service: 'risk-oracle' | 'shielded-vault' | 'cex-dex-synergy' | 'observability';
  data: Record<string, any>;
  humanReadable?: string;
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
