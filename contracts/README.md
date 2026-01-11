# Cronos Shield - Smart Contracts

Solidity smart contracts for Cronos Shield.

## Contracts

### RiskOracle.sol

Stores and verifies risk analysis results on-chain.

**Features:**
- Store risk analysis results
- Verify Proof of Risk signatures
- Manage authorized oracles
- On-chain result retrieval

### ShieldedVault.sol

Protected vault with risk-based transaction blocking.

**Features:**
- Deposit/withdraw native tokens
- Risk-based transaction blocking
- Integration with Risk Oracle
- Emergency withdrawal functions

## Setup

```bash
cd contracts
cp .env.example .env
# Edit .env with your configuration
pnpm install
```

## Compile

```bash
pnpm compile
```

## Test

```bash
pnpm test
```

## Deploy

### Deploy Risk Oracle

```bash
pnpm deploy:risk-oracle
```

After deployment, authorize the backend's signing address:

```bash
pnpm authorize-oracle
```

### Deploy Shielded Vault

```bash
# Set RISK_ORACLE_CONTRACT_ADDRESS in .env first
pnpm deploy:shielded-vault
```

## Environment Variables

See `.env.example` for required configuration.
