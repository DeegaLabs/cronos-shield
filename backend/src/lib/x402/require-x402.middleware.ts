/**
 * x402 Payment Middleware
 * 
 * Unified x402 payment middleware for all endpoints
 * Enforces x402 payment protocol on protected endpoints
 */

import * as crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export interface PaymentChallenge {
  x402Version: number;
  error: string;
  message?: string;
  service?: {
    name: string;
    version: string;
    description: string;
    features?: string[];
    documentation?: string;
    support?: string;
  };
  accepts: Array<{
    scheme: string;
    network: string;
    payTo: string;
    asset: string;
    maxAmountRequired: string;
    maxTimeoutSeconds: number;
    description: string;
    resource: string;
    mimeType?: string;
    extra?: {
      paymentId: string;
    };
  }>;
}

interface PaymentAccept {
  scheme: string;
  network: string;
  asset: string;
  payTo: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
  description: string;
  resource: string;
  mimeType?: string;
  extra?: {
    paymentId: string;
    service?: any;
  };
}

interface PaidRecord {
  settled: boolean;
  txHash?: string;
  at: number;
}

interface ServiceMetadata {
  name?: string;
  version?: string;
  description?: string;
  features?: string[];
  documentation?: string;
  support?: string;
}

const paid = new Map<string, PaidRecord>();

function newPaymentId(): string {
  return `pay_${crypto.randomUUID()}`;
}

export interface RequireX402Options {
  network: string;
  payTo: string;
  asset: string;
  maxAmountRequired: string;
  maxTimeoutSeconds?: number;
  description: string;
  resource: string;
  mimeType?: string;
  serviceMetadata?: ServiceMetadata;
}

export function requireX402Payment(options: RequireX402Options) {
  const {
    network,
    payTo,
    asset,
    maxAmountRequired,
    maxTimeoutSeconds = 300,
    description,
    resource,
    mimeType = 'application/json',
    serviceMetadata,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const entitlementKey = (req.header('x-payment-id') ?? '').trim();

    if (entitlementKey && paid.get(entitlementKey)?.settled) {
      next();
      return;
    }

    const paymentId = newPaymentId();
    const decimals = asset === '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' ? 6 : 18;
    const formattedAmount = (parseInt(maxAmountRequired) / Math.pow(10, decimals)).toFixed(decimals === 6 ? 1 : 4);
    const assetName = network.includes('testnet') ? 'devUSDC.e' : 'USDC.e';

    const enhancedDescription = `${description}\n\n💰 Payment: ${formattedAmount} ${assetName}\n⏱️  Valid for: ${maxTimeoutSeconds} seconds`;

    const serviceInfo = serviceMetadata ? {
      name: serviceMetadata.name || 'Cronos Shield',
      version: serviceMetadata.version || '1.0.0',
      description: serviceMetadata.description || 'AI-powered security layer for Cronos blockchain',
      features: serviceMetadata.features || ['Risk Analysis', 'x402 Payments', 'CEX-DEX Synergy', 'Observability'],
      documentation: serviceMetadata.documentation || 'https://docs.cronos.org',
      support: serviceMetadata.support || 'https://discord.gg/cronos',
    } : {
      name: 'Cronos Shield',
      version: '1.0.0',
      description: 'AI-powered security layer for Cronos blockchain',
      features: ['Risk Analysis', 'x402 Payments', 'CEX-DEX Synergy', 'Observability'],
      documentation: 'https://docs.cronos.org',
      support: 'https://discord.gg/cronos',
    };

    const accepts: PaymentAccept = {
      scheme: 'exact',
      network,
      asset,
      payTo,
      maxAmountRequired,
      maxTimeoutSeconds,
      description: enhancedDescription,
      resource,
      mimeType,
      extra: {
        paymentId,
        service: serviceInfo,
      },
    };

    const response: PaymentChallenge = {
      x402Version: 1,
      error: 'payment_required',
      message: `Payment required to access ${serviceInfo.name}. Pay ${formattedAmount} ${assetName} to proceed.`,
      accepts: [accepts],
      service: serviceInfo,
    };

    res.status(402).json(response);
  };
}

export function recordPayment(paymentId: string, txHash?: string): void {
  paid.set(paymentId, {
    settled: true,
    txHash,
    at: Date.now(),
  });
}

export function isPaymentSettled(paymentId: string): boolean {
  return paid.get(paymentId)?.settled ?? false;
}

export function getPaymentRecord(paymentId: string): PaidRecord | undefined {
  return paid.get(paymentId);
}
