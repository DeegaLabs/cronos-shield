/**
 * x402 Payment Protocol Types
 */

import type { CronosNetwork, Contract } from '@crypto.com/facilitator-client';

export interface PaymentChallenge {
  x402Version: number;
  error: string;
  message: string;
  accepts: PaymentAccept[];
  service?: ServiceMetadata;
}

export interface PaymentAccept {
  scheme: string;
  network: CronosNetwork; // Use correct type from SDK
  asset: Contract; // Use correct type from SDK
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
