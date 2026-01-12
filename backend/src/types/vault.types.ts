/**
 * Vault Types
 * 
 * TypeScript interfaces for Shielded Vault API
 */

export interface VaultBalance {
  address: string;
  balance: string; // Wei amount as string
  balanceFormatted: string; // Human-readable format (CRO)
}

export interface VaultInfo {
  contractAddress: string;
  maxRiskScore: number;
  riskOracleAddress: string;
  riskOracleUrl: string;
  isPaused: boolean;
  owner: string;
}

export interface DepositRequest {
  amount: string; // Amount in CRO (will be converted to Wei)
}

export interface WithdrawRequest {
  amount: string; // Amount in CRO (will be converted to Wei)
}

export interface ExecuteTransactionRequest {
  target: string; // Target contract address
  callData: string; // Hex-encoded calldata
  value: string; // Amount in CRO (will be converted to Wei)
  contractAddress?: string; // Optional: contract to analyze for risk
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  blocked?: boolean;
  riskScore?: number;
  reason?: string;
}

export interface BlockedTransaction {
  user: string;
  target: string;
  riskScore: number;
  reason: string;
  timestamp: number;
}
