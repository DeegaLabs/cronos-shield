# 🚀 Production Setup Guide

This guide covers the configuration needed to run Cronos Shield in production with real API integrations.

## 📋 Prerequisites

- Production environment (Railway, AWS, etc.)
- Cronos Mainnet access
- API keys for external services
- Deployed smart contracts on Cronos Mainnet

## 🔑 API Keys Configuration

### Crypto.com Exchange API

1. **Get API Key:**
   - Sign up at [Crypto.com Exchange](https://crypto.com/exchange)
   - Navigate to API Management
   - Create a new API key with read-only permissions
   - Copy the API key and secret

2. **Configure Environment Variables:**
   ```env
   CRYPTO_COM_API_URL=https://api.crypto.com/v2
   CRYPTO_COM_API_KEY=your_api_key_here
   ```

3. **API Documentation:**
   - Public API: https://exchange-docs.crypto.com/
   - Rate Limits: 10 requests per second per endpoint

### Alternative CEX APIs (Optional)

If you prefer other exchanges:
- **CoinGecko**: Free tier available, no API key required
- **Binance**: https://binance-docs.github.io/apidocs/
- **Coinbase**: https://docs.cloud.coinbase.com/

## 🌐 DEX Configuration

### VVS Finance (Cronos Mainnet)

**Router Address:**
```
0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae
```

**Token Addresses (Mainnet):**
```env
# Native CRO (Wrapped)
CRO_TOKEN=0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23

# USDC (Native)
USDC_TOKEN=0xc21223249CA28397B4B6541dfFaEcC539BfF0c59

# USDT (Native)
USDT_TOKEN=0x66e428c3f67a68878562e79A0234c1F83c208770
```

**Verify Addresses:**
- Check on [Cronoscan](https://cronoscan.com)
- Verify router contract: https://cronoscan.com/address/0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae

### Alternative DEXs (Optional)

- **MM Finance**: Router at `0x145677fc4d9b8F19B5D56d1820c48e0443049a30`
- **Tectonic**: Different router architecture

## 🔧 Environment Variables for Production

### Backend (.env)

```env
# Environment
NODE_ENV=production
PORT=3000

# Network (Mainnet)
NETWORK=cronos-mainnet
RPC_URL=https://evm.cronos.org
CHAIN_ID=25

# Merchant (x402)
MERCHANT_ADDRESS=0xYourProductionWallet
PRIVATE_KEY=0xYourProductionPrivateKey
PRICE_BASE_UNITS=1000000  # 1 USDC (6 decimals)

# Smart Contracts (Deployed on Mainnet)
RISK_ORACLE_CONTRACT_ADDRESS=0x...
SHIELDED_VAULT_CONTRACT_ADDRESS=0x...

# CEX-DEX Integration
CRYPTO_COM_API_URL=https://api.crypto.com/v2
CRYPTO_COM_API_KEY=your_api_key_here
DEX_ROUTER_ADDRESS=0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae

# Frontend
FRONTEND_URL=https://cronosshield.vercel.app

# Observability
SWAGGER_ENABLED=true
```

### Railway Variables

When deploying to Railway, set these variables:

```bash
railway variables set NODE_ENV=production
railway variables set NETWORK=cronos-mainnet
railway variables set RPC_URL=https://evm.cronos.org
railway variables set CHAIN_ID=25
railway variables set CRYPTO_COM_API_KEY=your_api_key
railway variables set DEX_ROUTER_ADDRESS=0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae
# ... other variables
```

## 📊 Liquidity Requirements

### Minimum Liquidity for Pairs

For reliable price discovery, ensure sufficient liquidity:

- **CRO-USDC**: Minimum $10,000 liquidity
- **CRO-USDT**: Minimum $10,000 liquidity
- **USDC-USDT**: Minimum $5,000 liquidity

### Checking Liquidity

1. Visit VVS Finance: https://vvs.finance/
2. Check pool reserves for your trading pairs
3. Verify on-chain using contract calls

## 🔒 Security Best Practices

### API Keys

- ✅ Store API keys in environment variables (never commit)
- ✅ Use read-only API keys when possible
- ✅ Rotate keys regularly
- ✅ Monitor API usage for anomalies

### Private Keys

- ✅ Use hardware wallets for production
- ✅ Never expose private keys in logs
- ✅ Use key management services (AWS Secrets Manager, etc.)
- ✅ Implement key rotation policies

### Smart Contracts

- ✅ Audit all contracts before mainnet deployment
- ✅ Use multi-sig wallets for contract ownership
- ✅ Implement upgrade mechanisms if needed
- ✅ Monitor contract interactions

## 🧪 Testing Production Configuration

### Test API Connectivity

```bash
# Test Crypto.com API
curl "https://api.crypto.com/v2/public/get-ticker?instrument_name=CRO_USDC"

# Test DEX Router (via RPC)
# Use ethers.js to call getAmountsOut
```

### Verify Contract Addresses

```bash
# Check contract on Cronoscan
# Verify ABI matches deployed contract
# Test contract functions
```

## 📈 Monitoring

### Key Metrics to Monitor

1. **API Response Times**
   - Crypto.com API latency
   - DEX query response times

2. **Error Rates**
   - API failures
   - DEX query failures
   - Fallback to mock data frequency

3. **Liquidity**
   - Pool reserves
   - Price impact for swaps

4. **Smart Contract**
   - Transaction success rate
   - Gas costs
   - Contract interactions

## 🚨 Troubleshooting

### API Errors

**Problem:** "Invalid response format"
- **Solution:** Check API endpoint URL and response structure
- **Fallback:** System automatically uses mock data

**Problem:** Rate limiting
- **Solution:** Implement request throttling
- **Solution:** Use API key for higher limits

### DEX Errors

**Problem:** "could not decode result data (value='0x')"
- **Cause:** No liquidity for pair or invalid contract
- **Solution:** Verify router address and token addresses
- **Solution:** Check liquidity on DEX

**Problem:** "execution reverted"
- **Cause:** Contract call failed
- **Solution:** Verify contract is deployed and accessible
- **Solution:** Check RPC endpoint connectivity

## 📚 Additional Resources

- [Cronos Documentation](https://docs.cronos.org)
- [Crypto.com Exchange API](https://exchange-docs.crypto.com/)
- [VVS Finance Docs](https://docs.vvs.finance/)
- [Cronoscan Explorer](https://cronoscan.com)

## ✅ Production Checklist

- [ ] API keys configured and tested
- [ ] DEX router address verified on mainnet
- [ ] Token addresses updated for mainnet
- [ ] Smart contracts deployed and verified
- [ ] Environment variables set in production
- [ ] Liquidity verified for trading pairs
- [ ] Monitoring and alerts configured
- [ ] Security best practices implemented
- [ ] Backup and disaster recovery plan
- [ ] Documentation updated
