/**
 * Core Types for Cronos Shield SDK
 */

export interface ClientConfig {
  backendUrl: string;
  network?: string;
  rpcUrl?: string;
  walletClient?: any; // Wallet client from wagmi/ethers
}

export interface RiskAnalysis {
  score: number;
  contract: string;
  hasProof: boolean;
  proof?: string;
  details?: {
    holders?: number;
    contractAge?: number;
    verified?: boolean;
    liquidity?: string;
    complexity?: string;
    transactionCount?: number;
  };
}

export interface VaultBalance {
  balance: string;
  address: string;
}

export interface VaultTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
}

export interface DivergenceResponse {
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

export interface DivergenceAlert {
  pair: string;
  divergence: number;
  severity: 'high' | 'medium' | 'low';
  time: string;
  description: string;
}

export interface Metrics {
  totalAnalyses: number;
  totalBlocked: number;
  totalAllowed: number;
  averageRiskScore: number;
  uptime: number;
}

export interface Log {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface BlockedTransaction {
  id: string;
  contract: string;
  reason: string;
  timestamp: number;
  riskScore: number;
}

export interface PaymentChallenge {
  x402Version: number;
  error: string;
  message: string;
  accepts: Array<{
    type: string;
    amount: string;
    recipient: string;
  }>;
}

export interface PaymentResult {
  paymentId: string;
  txHash: string;
  settled: boolean;
}

// Re-export error types for convenience
export { CronosShieldError, PaymentRequiredError, NetworkError } from '../utils/errors';
