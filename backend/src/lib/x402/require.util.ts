/**
 * Utility to create x402 payment middleware
 * 
 * Resolves configuration from environment variables
 */

import 'dotenv/config';
import { CronosNetwork, Contract } from '@crypto.com/facilitator-client';
import { requireX402Payment } from './require-x402.middleware';

const NETWORK_STR = process.env.NETWORK || 'cronos-testnet';
const NETWORK = (NETWORK_STR === 'cronos-mainnet' 
  ? CronosNetwork.CronosMainnet 
  : CronosNetwork.CronosTestnet) as CronosNetwork;
const PAY_TO = process.env.MERCHANT_ADDRESS || '';
const ASSET = NETWORK === CronosNetwork.CronosMainnet ? Contract.USDCe : Contract.DevUSDCe;
const RESOURCE = process.env.PUBLIC_RESOURCE_URL || 'http://localhost:3000';
const PRICE = process.env.PRICE_BASE_UNITS || '1000000'; // 1 devUSDC.e

export function requirePaidAccess(opts?: { 
  description?: string;
  serviceMetadata?: {
    name?: string;
    version?: string;
    description?: string;
    features?: string[];
  };
}) {
  if (!PAY_TO) {
    throw new Error('MERCHANT_ADDRESS must be set in environment variables');
  }

  return requireX402Payment({
    network: NETWORK_STR,
    payTo: PAY_TO,
    asset: ASSET,
    maxAmountRequired: PRICE,
    maxTimeoutSeconds: 300,
    description: opts?.description || 'Cronos Shield service access',
    resource: RESOURCE,
    serviceMetadata: opts?.serviceMetadata,
  });
}

export const x402Config = {
  NETWORK,
  PAY_TO,
  ASSET,
  RESOURCE,
  PRICE,
};
