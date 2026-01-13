# 🛡️ Cronos Shield

**AI-powered security layer for Cronos blockchain**

Cronos Shield is a comprehensive security and monetization platform for AI agents operating on the Cronos blockchain. It provides real-time risk analysis, protected vaults, CEX-DEX price validation, and full observability of AI decision-making processes.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Smart Contracts](#smart-contracts)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Cronos Shield addresses the critical need for security and transparency when AI agents interact with blockchain protocols. It provides:

- **Risk Oracle**: Real-time risk scoring for smart contracts with cryptographic proof
- **Shielded Vaults**: Protected vaults with programmable circuit breakers
- **CEX-DEX Synergy**: Price divergence detection between centralized and decentralized exchanges
- **Observability Dashboard**: Complete visibility into AI decision-making processes

All services are monetized using the **x402 payment protocol**, enabling native internet micropayments for AI services.

## ✨ Features

### 🔍 Risk Oracle
- Real-time risk scoring (0-100 scale)
- Cryptographic Proof of Risk signatures
- On-chain verification support
- Liquidity and contract safety analysis
- x402 payment-protected API

### 🏦 Shielded Vaults
- Protected deposits with risk-based transaction blocking
- Programmable circuit breakers
- Integration with Risk Oracle
- Emergency withdrawal capabilities

### 📈 CEX-DEX Synergy
- Real-time price divergence detection
- Arbitrage opportunity identification
- Risk-based transaction blocking
- Integration with Crypto.com Exchange and VVS Finance

### 📊 Observability Dashboard
- Real-time metrics and KPIs
- Decision log with human-readable translations
- Blocked transactions tracking
- Complete audit trail

## 🏗️ Architecture

```
cronos-shield/
├── backend/          # Unified Express.js API
├── frontend/         # React + Vite + Tailwind CSS
├── contracts/        # Solidity smart contracts
├── ai/               # ML/AI models (preview)
├── clients/          # Test clients
└── docs/             # Documentation
```

### Technology Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Blockchain**: Solidity, Hardhat, Ethers.js
- **Payment**: x402 Protocol, @crypto.com/facilitator-client
- **Network**: Cronos EVM (Testnet/Mainnet)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- MetaMask or compatible wallet
- Cronos Testnet configured in wallet
- devUSDC.e tokens for x402 payments

### 1. Clone and Install

```bash
cd cronos-shield
pnpm install
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
pnpm install
pnpm dev
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

### 4. Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api-doc
- **Redoc Docs**: http://localhost:3000/docs

## 📁 Project Structure

```
cronos-shield/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   │   ├── risk/        # Risk Oracle service
│   │   │   ├── divergence/  # CEX-DEX service
│   │   │   └── observability/ # Logging & metrics
│   │   ├── routes/          # API routes
│   │   ├── lib/
│   │   │   ├── x402/        # x402 payment middleware
│   │   │   └── utils/       # Utilities
│   │   └── types/           # TypeScript types
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── dashboard/   # Observability components
│   │   │   ├── risk/        # Risk Oracle UI
│   │   │   ├── divergence/  # CEX-DEX UI
│   │   │   └── common/      # Shared components
│   │   ├── pages/           # Page components
│   │   ├── lib/             # Utilities (API, wallet)
│   │   ├── hooks/           # React hooks
│   │   └── types/           # TypeScript types
│   └── package.json
│
├── contracts/
│   ├── contracts/           # Solidity contracts
│   ├── scripts/            # Deployment scripts
│   ├── test/               # Contract tests
│   └── hardhat.config.ts
│
└── docs/                   # Additional documentation
```

## 📚 API Documentation

### For Developers

**👉 [Complete Developer Documentation](./docs/DEVELOPER.md)**

Includes:
- Quick start guide
- x402 payment flow
- Complete API reference
- SDK integration examples
- Error handling
- Best practices

### Base URL

```
Production: https://cronos-shield-backend-production.up.railway.app
Local:      http://localhost:3000/api
```

### Interactive Documentation

- **Swagger UI** (Interactive Testing): http://localhost:3000/api-doc
- **Redoc** (Visual Documentation): http://localhost:3000/docs
- **Postman Collection**: `postman/Cronos-Shield-API.postman_collection.json`

### Endpoints

#### Risk Oracle

- `GET /risk/risk-analysis?contract=0x...` - Analyze contract risk (x402)
- `POST /risk/pay` - Settle x402 payment

#### CEX-DEX Synergy

- `GET /divergence/divergence?token=CRO` - Analyze price divergence (x402)
- `POST /divergence/pay` - Settle x402 payment

#### Observability

- `GET /observability/metrics` - Get system metrics
- `GET /observability/logs` - Get decision logs
- `POST /observability/logs` - Add log entry
- `GET /observability/blocked-transactions` - Get blocked transactions

### API Documentation

Full API documentation is available at:
- **Swagger UI**: http://localhost:3000/api-doc
- **Redoc**: http://localhost:3000/docs

## 🔐 Smart Contracts

### RiskOracle.sol

Stores and verifies risk analysis results on-chain.

**Functions:**
- `storeResult()` - Store risk analysis result
- `verifyProof()` - Verify Proof of Risk signature
- `getResult()` - Retrieve stored result

### ShieldedVault.sol

Protected vault with risk-based transaction blocking.

**Functions:**
- `deposit()` - Deposit native tokens
- `withdraw()` - Withdraw tokens
- `executeWithRiskCheck()` - Execute transaction with risk validation

## 🛠️ Development

### Backend Development

```bash
cd backend
pnpm dev          # Development server with hot reload
pnpm build        # Build for production
pnpm start        # Run production build
```

### Frontend Development

```bash
cd frontend
pnpm dev          # Development server
pnpm build        # Build for production
pnpm preview      # Preview production build
```

### Smart Contract Development

```bash
cd contracts
pnpm compile      # Compile contracts
pnpm test         # Run tests
pnpm deploy       # Deploy to network
```

## 📝 Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
NETWORK=cronos-testnet
RPC_URL=https://evm-t3.cronos.org
CHAIN_ID=338
MERCHANT_ADDRESS=0x...
PRIVATE_KEY=0x...
PRICE_BASE_UNITS=1000000
RISK_ORACLE_CONTRACT_ADDRESS=0x...
DEX_ROUTER_ADDRESS=0x...

# CEX-DEX Integration (Optional - uses mock data if not set)
CRYPTO_COM_API_URL=https://api.crypto.com/v2
CRYPTO_COM_API_KEY=your_api_key_here
CRO_TOKEN_ADDRESS=0x...  # Optional: override token addresses
USDC_TOKEN_ADDRESS=0x...
USDT_TOKEN_ADDRESS=0x...

FRONTEND_URL=http://localhost:5173
```

> **Note:** For production setup, see [Production Guide](./docs/PRODUCTION.md)

### Frontend (.env)

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_NETWORK=cronos-testnet
VITE_RPC_URL=https://evm-t3.cronos.org
VITE_CHAIN_ID=338
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pnpm test
```

### Frontend Tests

```bash
cd frontend
pnpm test
```

### Smart Contract Tests

```bash
cd contracts
pnpm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build process or auxiliary tool changes

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Cronos Documentation](https://docs.cronos.org)
- [x402 Protocol](https://docs.cronos.org/cronos-x402-facilitator/introduction)
- [Crypto.com Facilitator SDK](https://www.npmjs.com/package/@crypto.com/facilitator-client)

## 👥 Team

Built for the **Cronos x402 Paytech Hackathon**

---

**Note**: This is a Proof of Concept (POC) implementation. For production use, additional security audits and optimizations are recommended.
