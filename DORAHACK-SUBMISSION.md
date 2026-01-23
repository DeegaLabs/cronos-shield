# 📝 DoraHack Submission - Cronos Shield

## Vision (255 caracteres)

```
AI agents on Cronos lack security: no risk assessment, fund protection, or price validation. Cronos Shield provides real-time risk scoring, protected vaults with circuit breakers, CEX-DEX validation, and full observability. Enables safe AI operations with x402 payments.
```

---

## Details (Descrição Completa do Projeto)

### 🎯 Project Overview

**Cronos Shield** is a comprehensive security and monetization platform for AI agents operating on the Cronos blockchain. It provides real-time risk analysis, protected vaults, CEX-DEX price validation, and full observability of AI decision-making processes.

### ✨ Key Features

#### 1. 🔍 Risk Oracle
- **Real-time risk scoring** (0-100 scale) for smart contracts using on-chain data analysis
- **Cryptographic Proof of Risk** signatures for verifiable security assessments
- **On-chain verification** support via RiskOracle smart contract
- **AI-powered explanations** for all risk decisions (using Crypto.com AI SDK)
- **x402 payment-protected** API for monetization
- **Real on-chain data**: Contract age, holders, liquidity, verification status, complexity analysis

#### 2. 🏦 Shielded Vaults
- **Protected deposits** with risk-based transaction blocking
- **Programmable circuit breakers** that automatically block high-risk transactions
- **Integration with Risk Oracle** for real-time risk assessment
- **Emergency withdrawal** capabilities for fund recovery
- **Real-time balance tracking** and transaction history
- **AI explanations** for blocked transactions

#### 3. 📈 CEX-DEX Synergy
- **Real-time price divergence** detection between Crypto.com Exchange and VVS Finance DEX
- **Arbitrage opportunity** identification and recommendations
- **Integration with Crypto.com Exchange** using real API data (not mock)
- **VVS Finance DEX** integration for on-chain liquidity data
- **Dynamic trading pair** discovery from Crypto.com API
- **Resilient architecture**: Automatic fallback to REST API when WebSocket unavailable
- **WebSocket support** implemented for future real-time updates

#### 4. 📊 Observability Dashboard
- **Real-time metrics** and KPIs (payments, analyses, blocks, deposits)
- **Decision log** with human-readable translations
- **Blocked transactions** tracking with full audit trail
- **Complete transparency** of all AI decisions
- **Performance monitoring** and system health

### 🏗️ Technical Architecture

**Technology Stack:**
- **Backend**: Node.js, TypeScript, Express.js, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Wagmi, RainbowKit
- **Blockchain**: Solidity, Hardhat, Ethers.js
- **Payment**: x402 Protocol (@crypto.com/facilitator-client)
- **Network**: Cronos EVM Testnet (Chain ID: 338)
- **Real-time**: WebSocket for live price updates (with REST API fallback)
- **AI/ML**: Crypto.com AI SDK integration with fallback mechanisms
- **APIs**: Crypto.com Exchange API, Cronoscan API, VVS Finance (on-chain)

**Project Structure:**
```
cronos-shield/
├── backend/          # Unified Express.js API with x402 payments
├── frontend/         # React + Vite + Tailwind CSS
├── contracts/        # Solidity smart contracts (RiskOracle, ShieldedVault)
├── sdk/              # TypeScript SDK for developers
├── mcp-server/       # MCP Server for AI assistants (8 tools)
├── docs/             # Complete documentation
└── postman/          # API testing collection
```

### 🛠️ Developer Resources

#### TypeScript SDK
Complete SDK for easy integration:
```typescript
import { CronosShieldClient } from '@cronos-shield/sdk';

const client = new CronosShieldClient({
  backendUrl: 'https://cronos-shield-backend-production.up.railway.app'
});

const analysis = await client.risk.analyze('0x...');
const balance = await client.vault.getBalance('0x...');
const divergence = await client.divergence.analyze('ETH-USDT');
```

**Documentation**: https://github.com/DeegaLabs/cronos-shield/tree/main/sdk

#### MCP Server
Model Context Protocol server with 8 tools for AI assistants:
- `analyze_risk` - Analyze smart contract risk
- `get_vault_balance` - Get vault balance
- `get_vault_stats` - Get vault statistics
- `analyze_divergence` - Analyze CEX-DEX divergence
- `get_available_pairs` - Get available trading pairs
- `get_metrics` - Get system metrics
- `get_logs` - Get decision logs
- `get_blocked_transactions` - Get blocked transactions

**Documentation**: https://github.com/DeegaLabs/cronos-shield/tree/main/mcp-server

### 🔐 Smart Contracts

**RiskOracle.sol**
- Address: `0x391e8EaC07567e9107744668FA083d64743D452A`
- Network: Cronos Testnet
- Functions: `storeResult()`, `verifyProof()`, `getResult()`

**ShieldedVault.sol**
- Address: `0x858f3A33AFDFA6Be341809710885ccF6071Dc364`
- Network: Cronos Testnet
- Functions: `deposit()`, `withdraw()`, `executeWithRiskCheck()`, `checkRiskScore()`

### 📊 Technical Highlights

**Real-time Features:**
- ✅ REST API polling for price updates (CEX-DEX Synergy) - works reliably in production
- ✅ WebSocket support implemented (backend ready, graceful fallback)
- ✅ Automatic fallback to REST API when WebSocket unavailable - demonstrates resilience
- ✅ Real-time metrics in Observability Dashboard
- ✅ Live balance updates in Shielded Vaults

**Data Integration:**
- ✅ Crypto.com Exchange API (real data, not mock)
- ✅ VVS Finance DEX integration (on-chain liquidity)
- ✅ Cronoscan API for contract verification
- ✅ Fallback mechanisms for resilience

**AI/ML Integration:**
- ✅ AI-powered explanations for risk decisions
- ✅ Crypto.com AI SDK integration (with fallback)
- ✅ Human-readable decision explanations

**Developer Experience:**
- ✅ TypeScript SDK for easy integration
- ✅ MCP Server for AI assistants
- ✅ Complete API documentation (Swagger + Redoc)
- ✅ Postman collection for testing

### 🎯 Hackathon Track Alignment

**Track 1: Main Track (x402 Payment Protocol)**
- ✅ x402 payment protocol integrated in all services
- ✅ Risk Oracle and CEX-DEX Synergy require x402 payments
- ✅ Native micropayments for AI services
- ✅ Complete payment flow with settlement

**Track 2: Agentic Finance**
- ✅ Risk-managed agentic portfolios via Shielded Vaults
- ✅ Real-time risk scoring for financial decisions
- ✅ Circuit breakers for transaction protection
- ✅ CEX-DEX arbitrage automation

**Track 3: Crypto.com x Cronos Ecosystem**
- ✅ Real integration with Crypto.com Exchange API
- ✅ WebSocket connection for live prices (with fallback)
- ✅ Dynamic trading pair discovery
- ✅ Ecosystem connections with VVS Finance DEX

**Track 4: Developer Tooling**
- ✅ Complete TypeScript SDK
- ✅ MCP Server for AI assistants
- ✅ Comprehensive API documentation
- ✅ Postman collection
- ✅ Developer-friendly observability tools

### 🚀 Live Demo & Links

**Live Demo**: https://cronosshield.vercel.app

**API Backend**: https://cronos-shield-backend-production.up.railway.app

**API Documentation**:
- Swagger UI: https://cronos-shield-backend-production.up.railway.app/api-doc
- Redoc: https://cronos-shield-backend-production.up.railway.app/docs

**GitHub Repository**: https://github.com/DeegaLabs/cronos-shield

**Demo Video**: [INSERIR LINK DO VÍDEO DO YOUTUBE AQUI]

### 📸 Key Screenshots

1. **Landing Page** - Overview of all 4 tools + SDK + MCP Server
2. **Risk Oracle** - Risk analysis with AI explanation and x402 payment
3. **Shielded Vaults** - Protected transaction being blocked with explanation
4. **CEX-DEX Synergy** - Real-time price divergence analysis
5. **Observability Dashboard** - Metrics, logs, and blocked transactions
6. **For Developers Section** - SDK and MCP Server showcase

### 🎬 Demo Video Highlights

**4-minute pitch covering:**
- Introduction: Cronos Shield overview (0:00-0:30)
- Risk Oracle: Real-time analysis with x402 payment (0:30-1:00)
- Shielded Vaults: Protected transaction blocking (1:00-1:30)
- CEX-DEX Synergy: Price divergence detection (1:30-2:00)
- Observability Dashboard: Real-time metrics (2:00-2:30)
- SDK & MCP Server: Developer tools showcase (2:30-3:30)
- Conclusion: Track alignment and call to action (3:30-4:00)

### 🚀 Future Roadmap

**Short-term:**
- Publish SDK to NPM
- Add more trading pairs
- Enhance AI explanations
- WebSocket production deployment

**Medium-term:**
- Mainnet deployment
- Advanced ML models (risk prediction, anomaly detection)
- MCP Server HTTP mode
- Mobile app

**Long-term:**
- Multi-chain support
- Advanced analytics
- Community governance
- Enterprise features

---

## Team

**DeegaLabs**

**Dayane Gorgonha - Product Architect**
- Role: Product Architecture & Philosophical Logic
- Current: Product Architect @ DeegaLabs
- Education: Philosophy @ UFSC (Federal University of Santa Catarina)
- Expertise: Digital product architecture in pre-development stage, structuring solutions before they become code. Uses philosophical logic as analytical method to create resilient architectures.
- LinkedIn: https://www.linkedin.com/in/dayanegorgonha/
- GitHub: https://github.com/daygorgonha

**Daniel Gorgonha - Blockchain Engineer & Senior Software Engineer**
- Role: Blockchain Engineer | Senior Software Engineer
- Current: Software Engineer @ TCS Industrial
- Education: Postgraduate in Blockchain Technology
- Experience: Over 9 years of software development experience, specialized in Blockchain and Web3
- Expertise: Smart contracts, decentralized applications, tokenization systems using Node.js, Python, Rust, and Solidity
- Tech Stack: React, Next.js, Vue, Angular, TypeScript, Node.js, Solidity, Hardhat, Web3, PostgreSQL, MongoDB
- Location: Florianópolis, Brazil
- LinkedIn: https://www.linkedin.com/in/danielgorgonha/
- GitHub: https://github.com/danielgorgonha

**Team Strengths:**
- Combined expertise in product architecture, blockchain development, and Web3 technologies
- Strong background in full-stack development (frontend, backend, smart contracts)
- Experience with x402 payment protocol, MCP servers, and AI integration
- Focus on building secure, scalable, and user-friendly decentralized applications
- Located in Florianópolis, Brazil - active in the Brazilian blockchain community

**Built for Cronos x402 Paytech Hackathon 2025**

---

## Contact

**GitHub**: https://github.com/DeegaLabs/cronos-shield

**Project Website**: https://cronosshield.vercel.app

**API Documentation**: 
- Swagger: https://cronos-shield-backend-production.up.railway.app/api-doc
- Redoc: https://cronos-shield-backend-production.up.railway.app/docs

**Demo Video**: [INSERIR LINK DO VÍDEO DO YOUTUBE]

**Social Links**:
- LinkedIn (Dayane): https://www.linkedin.com/in/dayanegorgonha/
- LinkedIn (Daniel): https://www.linkedin.com/in/danielgorgonha/
- GitHub (Dayane): https://github.com/daygorgonha
- GitHub (Daniel): https://github.com/danielgorgonha

---

## 📋 Checklist para Preenchimento

### Profile Section
- [x] BUIDL name: **Cronos Shield**
- [x] BUIDL logo: [Upload do logo]
- [x] Vision: [Texto de 255 caracteres acima]
- [x] Category: **Crypto / Web3** ou **Other**
- [x] Is this BUIDL an AI Agent?: **No**

### Details Section
- [x] Details: [Usar conteúdo completo acima]
- [x] GitHub: https://github.com/DeegaLabs/cronos-shield
- [x] Project website: https://cronosshield.vercel.app
- [x] Demo video: [Link do YouTube]

### Team Section
- [x] Team: [Usar conteúdo completo acima]

### Contact Section
- [x] Social links: [LinkedIn, GitHub, etc.]

---

**Nota**: Lembre-se de substituir `[INSERIR LINK DO VÍDEO DO YOUTUBE]` pelo link real do vídeo do pitch antes de submeter!
