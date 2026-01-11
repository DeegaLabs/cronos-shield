# API Documentation

Complete API reference for Cronos Shield backend.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require x402 payment. See [x402 Protocol](#x402-protocol) for details.

## Endpoints

### Health Check

#### GET /health

Check API health status.

**Response:**
```json
{
  "status": "ok",
  "service": "Cronos Shield Backend",
  "version": "1.0.0",
  "timestamp": "2024-01-11T00:00:00.000Z"
}
```

---

### Risk Oracle

#### GET /risk/risk-analysis

Analyze risk for a smart contract.

**Query Parameters:**
- `contract` (required): Contract address to analyze
- `amount` (optional): Transaction amount
- `tokenAddress` (optional): Token address
- `verify` (optional): Verify proof on-chain (true/false)

**Payment:** x402 required

**Response (200):**
```json
{
  "score": 45,
  "proof": "0x...",
  "details": {
    "liquidity": "sufficient",
    "contractAge": "30 days",
    "holders": 1234,
    "verified": true,
    "warnings": []
  },
  "timestamp": 1705017600000,
  "contract": "0x...",
  "verified": true
}
```

**Response (402):**
```json
{
  "x402Version": 1,
  "error": "payment_required",
  "message": "Payment required to access Cronos Shield Risk Oracle...",
  "accepts": [...]
}
```

#### POST /risk/pay

Settle x402 payment for risk analysis.

**Request Body:**
```json
{
  "paymentId": "pay_...",
  "paymentHeader": "x402-payment: ...",
  "paymentRequirements": {...}
}
```

**Response:**
```json
{
  "ok": true,
  "txHash": "0x..."
}
```

---

### CEX-DEX Synergy

#### GET /divergence/divergence

Analyze price divergence between CEX and DEX.

**Query Parameters:**
- `token` (required): Token symbol (e.g., "CRO", "USDC")
- `amount` (optional): Amount for price calculation

**Payment:** x402 required

**Response (200):**
```json
{
  "token": "CRO",
  "cexPrice": "0.11",
  "dexPrice": "0.12",
  "divergence": "9.09",
  "divergenceAmount": "0.01",
  "recommendation": "buy_on_cex",
  "timestamp": 1705017600000,
  "details": {
    "cexExchange": "Crypto.com",
    "dexExchange": "VVS Finance",
    "liquidity": {
      "cex": "N/A",
      "dex": "1000000"
    }
  }
}
```

#### POST /divergence/pay

Settle x402 payment for divergence analysis.

**Request Body:** Same as `/risk/pay`

---

### Observability

#### GET /observability/metrics

Get aggregated system metrics.

**Response:**
```json
{
  "totalPayments": 10,
  "totalAnalyses": 25,
  "totalBlocks": 5,
  "totalDivergences": 15,
  "averageRiskScore": 42.5,
  "totalRevenue": "10",
  "last24Hours": {
    "payments": 3,
    "analyses": 8,
    "blocks": 2,
    "divergences": 5
  }
}
```

#### GET /observability/logs

Get decision logs.

**Query Parameters:**
- `limit` (optional): Maximum number of logs
- `type` (optional): Filter by log type
- `service` (optional): Filter by service

**Response:**
```json
[
  {
    "id": "...",
    "timestamp": 1705017600000,
    "type": "risk_analysis",
    "service": "risk-oracle",
    "data": {...},
    "humanReadable": "🔍 Risk analysis performed for contract 0x123.... Score: 45/100. ✅ Acceptable risk"
  }
]
```

#### POST /observability/logs

Add a log entry.

**Request Body:**
```json
{
  "type": "risk_analysis",
  "service": "risk-oracle",
  "data": {
    "contract": "0x...",
    "score": 45
  }
}
```

#### GET /observability/blocked-transactions

Get blocked transactions.

**Query Parameters:**
- `limit` (optional): Maximum number of transactions

**Response:**
```json
[
  {
    "id": "...",
    "timestamp": 1705017600000,
    "user": "0x...",
    "target": "0x...",
    "riskScore": 85,
    "reason": "Risk score too high",
    "service": "risk-oracle"
  }
]
```

---

## x402 Protocol

Cronos Shield uses the x402 payment protocol for API monetization.

### Payment Flow

1. **Request Protected Endpoint**
   ```
   GET /api/risk/risk-analysis?contract=0x...
   ```

2. **Receive 402 Payment Required**
   ```json
   {
     "x402Version": 1,
     "error": "payment_required",
     "accepts": [{
       "scheme": "exact",
       "network": "cronos-testnet",
       "asset": "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0",
       "payTo": "0x...",
       "maxAmountRequired": "1000000",
       "maxTimeoutSeconds": 300,
       "resource": "http://localhost:3000/api/risk/risk-analysis",
       "extra": {
         "paymentId": "pay_..."
       }
     }]
   }
   ```

3. **Generate Payment Header**
   Use `@crypto.com/facilitator-client` SDK to generate payment header.

4. **Settle Payment**
   ```
   POST /api/risk/pay
   {
     "paymentId": "pay_...",
     "paymentHeader": "x402-payment: ...",
     "paymentRequirements": {...}
   }
   ```

5. **Access Resource**
   Include `x-payment-id` header in subsequent requests:
   ```
   GET /api/risk/risk-analysis?contract=0x...
   Header: x-payment-id: pay_...
   ```

### Payment Caching

Once a payment is settled, you can reuse it by including the `x-payment-id` header. Payments are valid for the duration specified in `maxTimeoutSeconds`.

## Error Responses

All endpoints may return standard HTTP error codes:

- `400 Bad Request` - Invalid request parameters
- `402 Payment Required` - x402 payment required
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "error": "error_code",
  "message": "Human-readable error message"
}
```

## Rate Limiting

Currently, rate limiting is handled by x402 payments. Each payment grants access to the resource for a limited time.

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api-docs
```
