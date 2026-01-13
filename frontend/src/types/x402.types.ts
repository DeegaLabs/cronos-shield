/**
 * x402 Payment Protocol Types
 * 
 * NOTE: Do NOT import types from @crypto.com/facilitator-client here
 * This causes the SDK to be bundled even with dynamic imports
 * Use string literals instead to avoid bundling the SDK
 */

// Use string literals instead of importing types from SDK
export type CronosNetwork = 'cronos-mainnet' | 'cronos-testnet';

export interface Contract {
  address: string;
  chainId: number;
}

export interface PaymentChallenge {
  x402Version: number;
  error: string;
  message: string;
  accepts: PaymentAccept[];
  service?: ServiceMetadata;
}

export interface PaymentAccept {
  scheme: string;
  network: CronosNetwork; // Use our own type instead of SDK type
  asset: Contract; // Use our own type instead of SDK type
  payTo: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
  description: string;
  resource: string;
  mimeType: string;
  extra?: {
    paymentId: string;
    service?: ServiceMetadata;
  };
}

export interface ServiceMetadata {
  name: string;
  version: string;
  description: string;
  features?: string[];
  documentation?: string;
  support?: string;
}

export interface PaymentState {
  isProcessing: boolean;
  error: string | null;
  paymentId: string | null;
  txHash: string | null;
}
