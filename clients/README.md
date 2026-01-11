# Cronos Shield - Test Clients

Test clients for interacting with Cronos Shield services.

## Structure

```
clients/
├── risk-oracle/          # Risk Oracle test client
├── shielded-vaults/      # Shielded Vault test client
└── cex-dex-synergy/      # CEX-DEX Synergy test client
```

## Risk Oracle Client

Test client for Risk Oracle API with x402 payments.

### Setup

```bash
cd clients/risk-oracle
cp .env.example .env
# Edit .env with your configuration
pnpm install
```

### Run

```bash
pnpm test
```

## Shielded Vault Client

Test client for Shielded Vault interactions.

### Setup

```bash
cd clients/shielded-vaults
cp .env.example .env
# Edit .env with your configuration
pnpm install
```

### Run

```bash
pnpm test
```

## CEX-DEX Synergy Client

Test client for CEX-DEX divergence analysis.

### Setup

```bash
cd clients/cex-dex-synergy
cp .env.example .env
# Edit .env with your configuration
pnpm install
```

### Run

```bash
pnpm test
```

## Environment Variables

Each client has its own `.env.example` file. Copy and configure as needed.
