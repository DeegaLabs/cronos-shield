/**
 * x402 Payment Protocol Types
 */

export interface PaymentChallenge {
  x402Version: number;
  error: string;
  message: string;
  accepts: PaymentAccept[];
  service?: ServiceMetadata;
}

export interface PaymentAccept {
  scheme: string;
  network: string;
  asset: string;
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
