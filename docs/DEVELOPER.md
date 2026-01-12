# 👨‍💻 Developer Documentation

Complete guide for developers integrating with Cronos Shield API.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [x402 Payment Flow](#x402-payment-flow)
- [API Reference](#api-reference)
- [SDK Integration](#sdk-integration)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [Best Practices](#best-practices)
- [Examples](#examples)

## 🚀 Quick Start

### 1. Get API Access

Cronos Shield uses the **x402 payment protocol** for API access. No API keys required - just pay per request!

### 2. Base URL

```
Production: https://cronos-shield-backend-production.up.railway.app
Local:      http://localhost:3000
```

### 3. First Request

```bash
curl https://cronos-shield-backend-production.up.railway.app/api/risk/risk-analysis?contract=0x...
```

**Response:** `402 Payment Required` with payment challenge.

## 🔐 Authentication

Cronos Shield uses **x402 payment protocol** - no traditional authentication needed.

### Payment Flow

1. Make API request → Receive `402 Payment Required`
2. Extract payment challenge from response
3. Generate payment header using Facilitator SDK
4. Retry request with `x-payment-header` header
5. Receive service response

## 💳 x402 Payment Flow

### Step 1: Request Service

```typescript
const response = await fetch(
  'https://cronos-shield-backend-production.up.railway.app/api/risk/risk-analysis?contract=0x...'
);

if (response.status === 402) {
  const challenge = await response.json();
  // challenge.accepts contains payment requirements
}
```

### Step 2: Generate Payment Header

```typescript
import { FacilitatorClient } from '@crypto.com/facilitator-client';

const facilitator = new FacilitatorClient({
  network: 'cronos-testnet',
});

const paymentHeader = await facilitator.generatePaymentHeader({
  to: challenge.accepts[0].payTo,
  value: challenge.accepts[0].maxAmountRequired,
  asset: challenge.accepts[0].asset,
  signer: walletSigner,
  validBefore: Math.floor(Date.now() / 1000) + 300, // 5 minutes
  validAfter: 0,
});
```

### Step 3: Retry with Payment

```typescript
const response = await fetch(
  'https://cronos-shield-backend-production.up.railway.app/api/risk/risk-analysis?contract=0x...',
  {
    headers: {
      'x-payment-header': paymentHeader,
      'x-payment-id': challenge.accepts[0].extra.paymentId,
    },
  }
);

const result = await response.json();
```

## 📚 API Reference

### Risk Oracle

#### Analyze Risk

```http
GET /api/risk/risk-analysis?contract={address}
```

**Parameters:**
- `contract` (required): Ethereum address to analyze
- `amount` (optional): Amount to analyze
- `tokenAddress` (optional): Token address
- `verify` (optional): Verify on-chain (true/false)

**Response (200):**
```json
{
  "score": 50,
  "proof": "0x...",
  "details": {
    "liquidity": "HIGH",
    "contractAge": "1 year",
    "holders": 1000,
    "verified": true
  },
  "timestamp": 1234567890,
  "contract": "0x...",
  "verified": true
}
```

**Response (402):**
```json
{
  "x402Version": 1,
  "error": "payment_required",
  "message": "Payment required to access this service",
  "accepts": [
    {
      "scheme": "x402",
      "network": "cronos-testnet",
      "payTo": "0x...",
      "asset": "0x...",
      "maxAmountRequired": "1000000",
      "maxTimeoutSeconds": 300,
      "description": "Risk analysis service",
      "resource": "/api/risk/risk-analysis",
      "extra": {
        "paymentId": "uuid-here"
      }
    }
  ]
}
```

#### Settle Payment

```http
POST /api/risk/pay
Content-Type: application/json

{
  "paymentId": "uuid",
  "paymentHeader": "x402 payment header",
  "paymentRequirements": {}
}
```

### CEX-DEX Synergy

#### Analyze Divergence

```http
GET /api/divergence/analyze?token={SYMBOL}
```

**Parameters:**
- `token` (required): Token symbol (CRO, USDC, USDT)

**Response:** Similar to Risk Oracle (200 or 402)

### Shielded Vault

#### Get Vault Info

```http
GET /api/vault/info
```

#### Get Balance

```http
GET /api/vault/balance?address={userAddress}
```

#### Get Blocked Transactions

```http
GET /api/vault/blocked-transactions?limit=10&userAddress={address}
```

### Observability

#### Get Metrics

```http
GET /api/observability/metrics
```

#### Get Logs

```http
GET /api/observability/logs?limit=20&type={type}&service={service}
```

#### Add Log

```http
POST /api/observability/logs
Content-Type: application/json

{
  "type": "risk_analysis",
  "service": "risk-oracle",
  "data": {
    "contract": "0x...",
    "score": 50
  }
}
```

## 🔧 SDK Integration

### TypeScript/JavaScript

```typescript
import { FacilitatorClient } from '@crypto.com/facilitator-client';
import { ethers } from 'ethers';

// Initialize
const facilitator = new FacilitatorClient({
  network: 'cronos-testnet',
});

// Get signer (MetaMask, etc.)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Make payment
const paymentHeader = await facilitator.generatePaymentHeader({
  to: '0x...',
  value: '1000000',
  asset: '0x...',
  signer,
  validBefore: Math.floor(Date.now() / 1000) + 300,
  validAfter: 0,
});
```

### Python

```python
# Python SDK coming soon
# For now, use HTTP requests with Facilitator SDK in Node.js
```

## ⚠️ Error Handling

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `402`: Payment Required (x402 challenge)
- `500`: Internal Server Error

### Error Response Format

```json
{
  "error": "error_code",
  "message": "Human-readable error message"
}
```

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `payment_required` | x402 payment needed | Generate payment header and retry |
| `missing_contract` | Contract address missing | Provide `contract` parameter |
| `invalid_address` | Invalid Ethereum address | Check address format |
| `insufficient_balance` | Not enough tokens | Add tokens to wallet |
| `payment_expired` | Payment header expired | Generate new payment header |

## 🚦 Rate Limits

Currently, no rate limits are enforced. However, we recommend:

- **Per user**: Max 100 requests/minute
- **Per IP**: Max 1000 requests/minute

Rate limiting will be implemented in production.

## ✅ Best Practices

### 1. Cache Payment Headers

Payment headers are valid for 5 minutes. Cache and reuse:

```typescript
const paymentCache = new Map<string, { header: string; expires: number }>();

async function getPaymentHeader(challenge: PaymentChallenge): Promise<string> {
  const paymentId = challenge.accepts[0].extra.paymentId;
  const cached = paymentCache.get(paymentId);
  
  if (cached && cached.expires > Date.now()) {
    return cached.header;
  }
  
  const header = await generatePaymentHeader(challenge);
  paymentCache.set(paymentId, {
    header,
    expires: Date.now() + 4 * 60 * 1000, // 4 minutes
  });
  
  return header;
}
```

### 2. Retry Logic

Implement retry for network errors:

```typescript
async function requestWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status === 402) {
        return response;
      }
      if (response.status >= 500 && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. Validate Addresses

Always validate Ethereum addresses:

```typescript
import { ethers } from 'ethers';

function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}
```

### 4. Handle 402 Gracefully

```typescript
async function makeRequest(url: string, signer: ethers.Signer) {
  let response = await fetch(url);
  
  if (response.status === 402) {
    const challenge = await response.json();
    const paymentHeader = await generatePaymentHeader(challenge, signer);
    
    response = await fetch(url, {
      headers: {
        'x-payment-header': paymentHeader,
        'x-payment-id': challenge.accepts[0].extra.paymentId,
      },
    });
  }
  
  return response;
}
```

## 📖 Examples

### Complete Risk Analysis Flow

```typescript
import { FacilitatorClient } from '@crypto.com/facilitator-client';
import { ethers } from 'ethers';

async function analyzeRisk(contractAddress: string, signer: ethers.Signer) {
  const BASE_URL = 'https://cronos-shield-backend-production.up.railway.app';
  const facilitator = new FacilitatorClient({ network: 'cronos-testnet' });
  
  // Step 1: Request analysis
  let response = await fetch(
    `${BASE_URL}/api/risk/risk-analysis?contract=${contractAddress}`
  );
  
  // Step 2: Handle payment
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
    
    // Step 3: Retry with payment
    response = await fetch(
      `${BASE_URL}/api/risk/risk-analysis?contract=${contractAddress}`,
      {
        headers: {
          'x-payment-header': paymentHeader,
          'x-payment-id': accept.extra.paymentId,
        },
      }
    );
  }
  
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  
  return await response.json();
}
```

### Using Postman Collection

1. Import `postman/Cronos-Shield-API.postman_collection.json`
2. Set `baseUrl` variable to your backend URL
3. Run requests - 402 responses will automatically extract `paymentId`
4. Generate payment header using Facilitator SDK
5. Set `paymentHeader` variable
6. Retry request

## 🔗 Resources

- [Swagger Documentation](https://cronos-shield-backend-production.up.railway.app/api-docs)
- [x402 Protocol Docs](https://docs.cronos.org/cronos-x402-facilitator/introduction)
- [Facilitator SDK](https://www.npmjs.com/package/@crypto.com/facilitator-client)
- [Cronos Documentation](https://docs.cronos.org)

## 💬 Support

- **Discord**: [Cronos Discord #dev-mainnet](https://discord.gg/cronos)
- **GitHub Issues**: [Create an issue](https://github.com/your-repo/issues)

---

**Built for the Cronos x402 Paytech Hackathon**
