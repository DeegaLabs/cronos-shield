/**
 * Vault Types
 * 
 * TypeScript interfaces for Shielded Vault frontend
 */

export interface VaultBalance {
  address: string;
  balance: string;
  balanceFormatted: string;
}

export interface VaultInfo {
  contractAddress: string;
  maxRiskScore: number;
  riskOracleAddress: string;
  riskOracleUrl: string;
  isPaused: boolean;
  owner: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  blocked?: boolean;
  riskScore?: number;
  reason?: string;
}
