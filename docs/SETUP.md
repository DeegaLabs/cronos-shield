# Setup Guide

Complete setup instructions for Cronos Shield.

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **Package Manager**: pnpm (recommended) or npm
- **Wallet**: MetaMask or compatible Web3 wallet
- **Network**: Cronos Testnet configured
- **Tokens**: devUSDC.e for x402 payments

## Step 1: Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies
cd cronos-shield
pnpm install
```

## Step 2: Configure MetaMask

### Add Cronos Testnet

1. Open MetaMask
2. Go to Settings → Networks → Add Network
3. Enter the following details:

```
Network Name: Cronos Testnet
RPC URL: https://evm-t3.cronos.org
Chain ID: 338
Currency Symbol: CRO
Block Explorer: https://testnet.cronoscan.com
```

### Get Test Tokens

1. Get TCRO from [Cronos Faucet](https://cronos.org/faucet)
2. Get devUSDC.e from the testnet faucet or swap TCRO for devUSDC.e

## Step 3: Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Network
NETWORK=cronos-testnet
RPC_URL=https://evm-t3.cronos.org
CHAIN_ID=338

# Merchant (x402)
MERCHANT_ADDRESS=0xYourWalletAddress
PRIVATE_KEY=0xYourPrivateKey
PRICE_BASE_UNITS=1000000  # 1 devUSDC.e (6 decimals)

# Contracts (optional for POC)
RISK_ORACLE_CONTRACT_ADDRESS=
DEX_ROUTER_ADDRESS=0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Start Backend

```bash
pnpm dev
```

Backend will be available at `http://localhost:3000`

## Step 4: Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_NETWORK=cronos-testnet
VITE_RPC_URL=https://evm-t3.cronos.org
VITE_CHAIN_ID=338
```

### Start Frontend

```bash
pnpm dev
```

Frontend will be available at `http://localhost:5173`

## Step 5: Deploy Smart Contracts (Optional)

If you want to use on-chain features:

```bash
cd contracts
cp .env.example .env
# Edit .env with your private key and RPC URL

pnpm compile
pnpm deploy
```

After deployment, update `RISK_ORACLE_CONTRACT_ADDRESS` in backend `.env`.

## Step 6: Verify Installation

1. Open http://localhost:5173
2. Connect your MetaMask wallet
3. Navigate to "Risk Oracle"
4. Enter a contract address and click "Analyze"
5. Complete the x402 payment
6. View results

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### MetaMask Connection Issues

- Ensure Cronos Testnet is selected
- Check that you have TCRO for gas
- Verify devUSDC.e balance for payments

### API Errors

- Verify backend is running on port 3000
- Check `.env` configuration
- Review backend logs for errors

## Next Steps

- Read the [API Documentation](./API.md)
- Explore the [Architecture](./ARCHITECTURE.md)
- Check out the [Smart Contracts](./CONTRACTS.md)
