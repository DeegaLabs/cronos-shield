/**
 * Types for Risk Oracle API
 */

export interface RiskAnalysisRequest {
  contract: string;
  amount?: string;
  tokenAddress?: string;
}

export interface RiskAnalysisResponse {
  score: number; // 0-100, where 0 = safe, 100 = very risky
  proof: string; // Proof of Risk (cryptographic signature)
  details: RiskDetails;
  timestamp: number;
  contract: string;
  verified?: boolean; // On-chain verification status
}

export interface RiskDetails {
  liquidity?: string;
  contractAge?: string;
  holders?: number;
  verified?: boolean;
  warnings?: string[];
}
