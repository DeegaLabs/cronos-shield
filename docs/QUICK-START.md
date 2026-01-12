# ⚡ Quick Start Guide

Get started with Cronos Shield API in 5 minutes.

## Prerequisites

- Node.js 18+ and pnpm
- MetaMask wallet with Cronos Testnet configured
- devUSDC.e tokens for payments

## 1. Install Dependencies

```bash
npm install @crypto.com/facilitator-client ethers
# or
pnpm add @crypto.com/facilitator-client ethers
```

## 2. Basic Example

```typescript
import { FacilitatorClient } from '@crypto.com/facilitator-client';
import { ethers } from 'ethers';

const BASE_URL = 'https://cronos-shield-backend-production.up.railway.app';
const facilitator = new FacilitatorClient({ network: 'cronos-testnet' });

// Get signer (MetaMask)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Make API request
let response = await fetch(
  `${BASE_URL}/api/risk/risk-analysis?contract=0x1234567890123456789012345678901234567890`
);

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
  response = await fetch(
    `${BASE_URL}/api/risk/risk-analysis?contract=0x1234567890123456789012345678901234567890`,
    {
      headers: {
        'x-payment-header': paymentHeader,
        'x-payment-id': accept.extra.paymentId,
      },
    }
  );
}

const result = await response.json();
console.log('Risk Score:', result.score);
```

## 3. Using Postman

1. Import `postman/Cronos-Shield-API.postman_collection.json`
2. Set `baseUrl` variable
3. Run requests - 402 responses extract `paymentId` automatically
4. Generate payment header using Facilitator SDK
5. Set `paymentHeader` variable and retry

## 4. Next Steps

- Read [Developer Documentation](./DEVELOPER.md) for complete guide
- Check [API Reference](./API.md) for all endpoints
- Explore [Swagger UI](https://cronos-shield-backend-production.up.railway.app/api-docs)

## Need Help?

- [Developer Docs](./DEVELOPER.md)
- [Integration Guide](./INTEGRATION.md)
- [Cronos Discord](https://discord.gg/cronos)
