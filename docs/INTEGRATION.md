# 🔌 Integration Guide

Quick integration guide for developers.

## Installation

### NPM

```bash
npm install @crypto.com/facilitator-client ethers
```

### pnpm

```bash
pnpm add @crypto.com/facilitator-client ethers
```

## Basic Integration

```typescript
import { FacilitatorClient } from '@crypto.com/facilitator-client';
import { ethers } from 'ethers';

const BASE_URL = 'https://cronos-shield-backend-production.up.railway.app';
const facilitator = new FacilitatorClient({ network: 'cronos-testnet' });

async function callCronosShieldAPI(endpoint: string, signer: ethers.Signer) {
  // Make request
  let response = await fetch(`${BASE_URL}${endpoint}`);
  
  // Handle 402 payment
  if (response.status === 402) {
    const challenge = await response.json();
    const accept = challenge.accepts[0];
    
    const paymentHeader = await facilitator.generatePaymentHeader({
      to: accept.payTo,
      value: accept.maxAmountRequired,
      asset: accept.asset,
      signer,
      validBefore: Math.floor(Date.now() / 1000) + accept.maxTimeoutSeconds,
      validAfter: 0,
    });
    
    // Retry with payment
    response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'x-payment-header': paymentHeader,
        'x-payment-id': accept.extra.paymentId,
      },
    });
  }
  
  return await response.json();
}
```

## Examples

See [DEVELOPER.md](./DEVELOPER.md) for complete examples.
