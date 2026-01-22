# 🏆 Cronos Shield - Hackathon Submission

**AI-powered security layer for Cronos blockchain with x402 payment protocol**

---

## 📋 Quick Links

- **🌐 Live Demo**: [https://frontend-seven-mu-53.vercel.app](https://frontend-seven-mu-53.vercel.app)
- **🔌 API Backend**: [https://cronos-shield-backend-production.up.railway.app](https://cronos-shield-backend-production.up.railway.app)
- **📚 API Documentation**: [https://cronos-shield-backend-production.up.railway.app/api-doc](https://cronos-shield-backend-production.up.railway.app/api-doc)
- **📖 Redoc Docs**: [https://cronos-shield-backend-production.up.railway.app/docs](https://cronos-shield-backend-production.up.railway.app/docs)
- **📦 Postman Collection**: [postman/Cronos-Shield-API.postman_collection.json](./postman/Cronos-Shield-API.postman_collection.json)

---

## 🎯 Project Overview

**Cronos Shield** is a comprehensive security and monetization platform for AI agents operating on the Cronos blockchain. It provides real-time risk analysis, protected vaults, CEX-DEX price validation, and full observability of AI decision-making processes.

### Core Value Proposition

- **🛡️ Security First**: Real-time risk scoring with cryptographic proof
- **💰 Monetization**: Native x402 payment protocol integration
- **📊 Transparency**: Complete observability of AI decisions
- **🔗 Ecosystem**: Deep integration with Crypto.com Exchange and Cronos DEXs

---

## ✨ Key Features

### 1. 🔍 Risk Oracle
- **Real-time risk scoring** (0-100 scale) for smart contracts
- **Cryptographic Proof of Risk** signatures
- **On-chain verification** support
- **AI-powered explanations** for risk decisions
- **x402 payment-protected** API

### 2. 🏦 Shielded Vaults
- **Protected deposits** with risk-based transaction blocking
- **Programmable circuit breakers**
- **Integration with Risk Oracle**
- **Emergency withdrawal** capabilities
- **Real-time balance tracking**

### 3. 📈 CEX-DEX Synergy
- **Real-time price divergence** detection via REST API (with WebSocket support implemented for future)
- **Arbitrage opportunity** identification
- **Integration with Crypto.com Exchange** (real API)
- **VVS Finance DEX** integration
- **Dynamic trading pair** discovery
- **Resilient architecture**: Automatic fallback to REST API when WebSocket unavailable

### 4. 📊 Observability Dashboard
- **Real-time metrics** and KPIs
- **Decision log** with human-readable translations
- **Blocked transactions** tracking
- **Complete audit trail**
- **Performance monitoring**

---

## 🏗️ Architecture

### Technology Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Blockchain**: Solidity, Hardhat, Ethers.js
- **Payment**: x402 Protocol, @crypto.com/facilitator-client
- **Network**: Cronos EVM (Testnet)
- **Real-time**: WebSocket for live price updates
- **AI/ML**: Crypto.com AI SDK integration (with fallback)

### Project Structure

```
cronos-shield/
├── backend/          # Unified Express.js API
├── frontend/         # React + Vite + Tailwind CSS
├── contracts/        # Solidity smart contracts
├── sdk/              # TypeScript SDK for developers
├── mcp-server/       # MCP Server for AI assistants
├── ai/               # ML/AI models (preview)
└── docs/             # Complete documentation
```

---

## 🚀 How to Test

### 1. Access Live Demo

Visit: [https://frontend-seven-mu-53.vercel.app](https://frontend-seven-mu-53.vercel.app)

### 2. Connect Wallet

1. Click "Connect Wallet" button
2. Select MetaMask (or compatible wallet)
3. Switch to **Cronos Testnet** (Chain ID: 338)
4. Ensure you have **devUSDC.e** tokens for x402 payments

### 3. Test Risk Oracle

1. Navigate to **Risk Oracle** page
2. Enter a contract address (e.g., `0x391e8EaC07567e9107744668FA083d64743D452A`)
3. Click "Analyze Risk"
4. Approve x402 payment when prompted
5. View risk score, proof, and AI explanation

### 4. Test Shielded Vaults

1. Navigate to **Vaults** page
2. **Deposit**: Enter amount and deposit CRO
3. **Withdraw**: Withdraw from vault
4. **Protected Transaction**: Execute transaction with risk check
5. View real-time balance and transaction history

### 5. Test CEX-DEX Synergy

1. Navigate to **CEX-DEX Synergy** page
2. Select a trading pair (e.g., ETH-USDT)
3. Click "Analyze Divergence"
4. View real-time prices (WebSocket updates)
5. See divergence percentage and arbitrage recommendations

### 6. Test Observability Dashboard

1. Navigate to **Dashboard** page
2. View real-time metrics
3. Check decision logs
4. Review blocked transactions

---

## 🔗 API Endpoints

### Base URL
```
https://cronos-shield-backend-production.up.railway.app
```

### Interactive Documentation
- **Swagger UI**: [https://cronos-shield-backend-production.up.railway.app/api-doc](https://cronos-shield-backend-production.up.railway.app/api-doc)
- **Redoc**: [https://cronos-shield-backend-production.up.railway.app/docs](https://cronos-shield-backend-production.up.railway.app/docs)

### Key Endpoints

#### Risk Oracle
- `GET /api/risk/analyze?contract=0x...` - Analyze contract risk (x402)
- `POST /api/risk/pay` - Settle x402 payment

#### Shielded Vaults
- `GET /api/vault/balance?address=0x...` - Get vault balance
- `POST /api/vault/deposit` - Deposit tokens
- `POST /api/vault/withdraw` - Withdraw tokens
- `POST /api/vault/execute-protected` - Execute protected transaction

#### CEX-DEX Synergy
- `GET /api/divergence/pairs` - Get available trading pairs
- `GET /api/divergence/analyze?token=ETH-USDT` - Analyze divergence (x402)
- `GET /api/divergence/history?pair=ETH-USDT` - Get divergence history
- `GET /api/divergence/alerts` - Get recent alerts
- `WS /ws` - WebSocket for real-time prices

#### Observability
- `GET /api/observability/metrics` - Get system metrics
- `GET /api/observability/logs` - Get decision logs
- `GET /api/observability/blocked-transactions` - Get blocked transactions

---

## 🎯 Hackathon Track Alignment

### Track 1: Main Track (x402 Payment Protocol)
✅ **Fully Aligned**
- x402 payment protocol integrated in all services
- Risk Oracle, CEX-DEX Synergy require x402 payments
- Native micropayments for AI services
- Complete payment flow with settlement

### Track 2: Agentic Finance
✅ **Fully Aligned**
- Risk-managed agentic portfolios via Shielded Vaults
- Real-time risk scoring for financial decisions
- Circuit breakers for transaction protection
- CEX-DEX arbitrage automation

### Track 3: Crypto.com x Cronos Ecosystem
✅ **Fully Aligned**
- Real integration with Crypto.com Exchange API
- WebSocket connection for live prices
- Dynamic trading pair discovery
- Ecosystem connections with VVS Finance DEX

### Track 4: Developer Tooling
✅ **Fully Aligned**
- Complete TypeScript SDK
- MCP Server for AI assistants
- Comprehensive API documentation
- Postman collection
- Developer-friendly observability tools

---

## 🛠️ Developer Resources

### TypeScript SDK

```bash
npm install @cronos-shield/sdk
```

**Quick Start:**
```typescript
import { CronosShieldClient } from '@cronos-shield/sdk';

const client = new CronosShieldClient({
  backendUrl: 'https://cronos-shield-backend-production.up.railway.app',
  rpcUrl: 'https://evm-t3.cronos.org',
  network: 'cronos-testnet',
  walletClient: yourWalletClient,
});

// Analyze risk
const analysis = await client.risk.analyze('0x...');

// Get vault balance
const balance = await client.vault.getBalance('0x...');

// Analyze divergence
const divergence = await client.divergence.analyze('ETH-USDT');
```

**Documentation**: [sdk/README.md](./sdk/README.md)

### MCP Server

For AI assistants (Claude Desktop, etc.):

```json
{
  "mcpServers": {
    "cronos-shield": {
      "command": "pnpm",
      "args": ["-C", "/path/to/mcp-server", "start"],
      "env": {
        "BACKEND_URL": "https://cronos-shield-backend-production.up.railway.app"
      }
    }
  }
}
```

**Available Tools:**
- `analyze_risk` - Analyze smart contract risk
- `get_vault_balance` - Get vault balance
- `get_vault_stats` - Get vault statistics
- `analyze_divergence` - Analyze CEX-DEX divergence
- `get_available_pairs` - Get available trading pairs
- `get_metrics` - Get system metrics
- `get_logs` - Get decision logs
- `get_blocked_transactions` - Get blocked transactions

**Documentation**: [mcp-server/README.md](./mcp-server/README.md)

---

## 🔐 Smart Contracts

### RiskOracle.sol
- **Address**: `0x391e8EaC07567e9107744668FA083d64743D452A`
- **Network**: Cronos Testnet
- **Functions**: `storeResult()`, `verifyProof()`, `getResult()`

### ShieldedVault.sol
- **Address**: `0x858f3A33AFDFA6Be341809710885ccF6071Dc364`
- **Network**: Cronos Testnet
- **Functions**: `deposit()`, `withdraw()`, `executeWithRiskCheck()`

**Contract Documentation**: [docs/CONTRACTS.md](./docs/CONTRACTS.md)

---

## 📊 Technical Highlights

### Real-time Features
- ✅ **REST API polling** for price updates (CEX-DEX Synergy) - works reliably
- ✅ **WebSocket support** implemented (ready for production when infrastructure supports)
- ✅ **Automatic fallback** to REST API when WebSocket unavailable
- ✅ **Real-time metrics** in Observability Dashboard
- ✅ **Live balance updates** in Shielded Vaults

### Data Integration
- ✅ **Crypto.com Exchange API** (real data, not mock)
- ✅ **VVS Finance DEX** integration (on-chain liquidity)
- ✅ **Cronoscan API** for contract verification
- ✅ **Fallback mechanisms** for resilience

### AI/ML Integration
- ✅ **AI-powered explanations** for risk decisions
- ✅ **Crypto.com AI SDK** integration (with fallback)
- ✅ **Human-readable** decision explanations

### Developer Experience
- ✅ **TypeScript SDK** for easy integration
- ✅ **MCP Server** for AI assistants
- ✅ **Complete API documentation** (Swagger + Redoc)
- ✅ **Postman collection** for testing

---

## 🎬 Demo Video Script

### Introduction (0:00 - 0:30)
- Show live demo URL
- Explain Cronos Shield's purpose
- Highlight 4 core modules

### Risk Oracle (0:30 - 2:00)
- Analyze a contract address
- Show x402 payment flow
- Display risk score and proof
- Show AI explanation

### Shielded Vaults (2:00 - 3:30)
- Deposit tokens
- Show real-time balance
- Execute protected transaction
- Show transaction history

### CEX-DEX Synergy (3:30 - 5:00)
- Select trading pair
- Show real-time prices (WebSocket)
- Analyze divergence
- Show arbitrage recommendations

### Observability Dashboard (5:00 - 6:00)
- Show real-time metrics
- Display decision logs
- Review blocked transactions

### Developer Tools (6:00 - 7:00)
- Show SDK usage
- Show MCP Server integration
- Show API documentation

### Conclusion (7:00 - 7:30)
- Recap key features
- Highlight hackathon alignment
- Call to action

---

## 📸 Screenshots

### Recommended Screenshots:
1. **Landing Page** - Overview of all features
2. **Risk Oracle** - Risk analysis with AI explanation
3. **Shielded Vaults** - Deposit/Withdraw interface
4. **CEX-DEX Synergy** - Real-time price divergence
5. **Observability Dashboard** - Metrics and logs
6. **API Documentation** - Swagger UI
7. **SDK Example** - Code snippet

---

## 🚀 Future Roadmap

### Short-term (Post-Hackathon)
- [ ] Publish SDK to NPM
- [ ] Add more trading pairs
- [ ] Enhance AI explanations
- [ ] Add more ML models

### Medium-term
- [ ] Mainnet deployment
- [ ] Advanced ML models (risk prediction, anomaly detection)
- [ ] MCP Server HTTP mode
- [ ] Mobile app

### Long-term
- [ ] Multi-chain support
- [ ] Advanced analytics
- [ ] Community governance
- [ ] Enterprise features

---

## 📝 Additional Documentation

- **Architecture**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **API Reference**: [docs/API.md](./docs/API.md)
- **Developer Guide**: [docs/DEVELOPER.md](./docs/DEVELOPER.md)
- **Production Guide**: [docs/PRODUCTION.md](./docs/PRODUCTION.md)
- **Integration Guide**: [docs/INTEGRATION.md](./docs/INTEGRATION.md)
- **Testing Guide**: [docs/TESTING.md](./docs/TESTING.md)

---

## 👥 Team

Built for the **Cronos x402 Paytech Hackathon** by DeegaLabs

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 🔗 Links

- **Live Demo**: [https://frontend-seven-mu-53.vercel.app](https://frontend-seven-mu-53.vercel.app)
- **API Backend**: [https://cronos-shield-backend-production.up.railway.app](https://cronos-shield-backend-production.up.railway.app)
- **API Docs**: [https://cronos-shield-backend-production.up.railway.app/api-doc](https://cronos-shield-backend-production.up.railway.app/api-doc)
- **Cronos Documentation**: [https://docs.cronos.org](https://docs.cronos.org)
- **x402 Protocol**: [https://docs.cronos.org/cronos-x402-facilitator/introduction](https://docs.cronos.org/cronos-x402-facilitator/introduction)

---

**🎉 Thank you for reviewing Cronos Shield!**
