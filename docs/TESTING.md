# Testing Guide

Complete testing guide for Cronos Shield.

## Quick Test Checklist

### 1. Backend Health Check
```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok",...}`

### 2. Frontend Access
Open: http://localhost:5173

Expected: Dashboard loads with wallet connection button

### 3. Swagger Documentation
Open: http://localhost:3000/api-docs

Expected: All 8 endpoints visible and documented

### 4. Wallet Connection
1. Click "Connect Wallet" in frontend
2. Approve MetaMask connection
3. Verify address appears in header

### 5. Risk Analysis (with x402)
1. Navigate to "Risk Oracle" page
2. Enter contract address: `0x1234567890123456789012345678901234567890`
3. Click "Analyze"
4. Complete x402 payment in MetaMask
5. View results

### 6. Observability Dashboard
1. Navigate to Dashboard
2. Verify metrics display
3. Check logs appear
4. Verify blocked transactions list

## Automated Tests

Run the test script:
```bash
./scripts/test-all.sh
```

## Manual Testing Steps

### Test 1: Backend API

#### Health Check
```bash
curl http://localhost:3000/health | jq .
```

#### Observability Metrics
```bash
curl http://localhost:3000/api/observability/metrics | jq .
```

#### Risk Analysis (should return 402)
```bash
curl "http://localhost:3000/api/risk/risk-analysis?contract=0x1234567890123456789012345678901234567890" | jq .
```

Expected: HTTP 402 with payment challenge

### Test 2: Frontend

1. **Start Frontend**
   ```bash
   cd frontend
   pnpm dev
   ```

2. **Open Browser**
   - Navigate to http://localhost:5173
   - Should see Cronos Shield header

3. **Connect Wallet**
   - Click "Connect Wallet"
   - Approve in MetaMask
   - Verify address shows in header

4. **Test Dashboard**
   - Should see metrics cards
   - Logs should appear (if any)
   - Blocked transactions list

5. **Test Risk Oracle**
   - Navigate to Risk Oracle page
   - Enter contract address
   - Click Analyze
   - Complete payment
   - View results

6. **Test CEX-DEX Synergy**
   - Navigate to CEX-DEX page
   - Enter token (e.g., "CRO")
   - Click Analyze
   - Complete payment
   - View divergence results

### Test 3: x402 Payment Flow

1. Request protected endpoint (returns 402)
2. Extract payment challenge from response
3. Use Facilitator SDK to generate payment
4. Send payment to blockchain
5. Settle payment via `/pay` endpoint
6. Retry original request with `x-payment-id` header

### Test 4: Observability Integration

1. Make a risk analysis request
2. Check Dashboard for new log entry
3. Verify metrics updated
4. Check human-readable translation

## Test Scenarios

### Scenario 1: Complete Risk Analysis Flow

1. Frontend → Risk Oracle page
2. Enter contract: `0x1234567890123456789012345678901234567890`
3. Click "Analyze"
4. MetaMask → Approve payment
5. View results:
   - Risk score (0-100)
   - Details (liquidity, holders, etc.)
   - Proof of Risk
   - Warnings (if any)

### Scenario 2: CEX-DEX Divergence

1. Frontend → CEX-DEX Synergy page
2. Enter token: `CRO`
3. Click "Analyze"
4. MetaMask → Approve payment
5. View results:
   - CEX price
   - DEX price
   - Divergence percentage
   - Recommendation

### Scenario 3: Observability Dashboard

1. Make several API calls (risk analysis, divergence)
2. Navigate to Dashboard
3. Verify:
   - Total payments count
   - Total analyses count
   - Logs appear in real-time
   - Metrics update automatically

## Expected Results

### Backend
- ✅ Health check returns 200 OK
- ✅ All endpoints respond correctly
- ✅ 402 returned for protected endpoints
- ✅ Swagger docs accessible
- ✅ Logs being created

### Frontend
- ✅ Pages load correctly
- ✅ Wallet connects successfully
- ✅ Navigation works
- ✅ API calls succeed
- ✅ Real-time updates work

### Integration
- ✅ x402 payments work
- ✅ Logs appear in dashboard
- ✅ Metrics update
- ✅ All services communicate

## Troubleshooting

### Backend not starting
- Check port 3000 is free
- Verify .env file exists
- Check dependencies installed

### Frontend not connecting
- Verify backend is running
- Check CORS configuration
- Verify .env file

### Wallet connection fails
- Ensure MetaMask installed
- Check Cronos Testnet configured
- Verify network is selected

### x402 payment fails
- Check devUSDC.e balance
- Verify network is Cronos Testnet
- Check Facilitator SDK version
