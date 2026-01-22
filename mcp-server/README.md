# Cronos Shield MCP Server

Model Context Protocol (MCP) server for AI assistants to interact with Cronos Shield services.

## Overview

This MCP server provides tools for:
- 🔍 **Risk Oracle**: Analyze smart contract risk scores
- 🛡️ **Shielded Vaults**: Check balances and statistics
- 📊 **CEX-DEX Synergy**: Analyze price divergences
- 📈 **Observability**: Get metrics, logs, and blocked transactions

## Installation

### For Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cronos-shield": {
      "command": "pnpm",
      "args": [
        "--silent",
        "-C",
        "/path/to/cronos-shield/mcp-server",
        "start"
      ],
      "env": {
        "BACKEND_URL": "https://cronos-shield-backend-production.up.railway.app"
      }
    }
  }
}
```

### For Local Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Run
pnpm start
```

## Available Tools

### Risk Oracle

#### `analyze_risk`
Analyze smart contract risk score using the Risk Oracle.

**Parameters:**
- `contract` (string, required): Smart contract address (e.g., `0x...`)

**Example:**
```json
{
  "name": "analyze_risk",
  "arguments": {
    "contract": "0x391e8EaC07567e9107744668FA083d64743D452A"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 75,
    "proof": "0x...",
    "details": {
      "liquidity": "sufficient",
      "contractAge": "9 days",
      "holders": 0,
      "verified": false
    },
    "explanation": "Transaction allowed. Risk score: 75/100..."
  }
}
```

### Shielded Vaults

#### `get_vault_balance`
Get vault balance for a specific address.

**Parameters:**
- `address` (string, required): Wallet address (e.g., `0x...`)

#### `get_vault_stats`
Get overall vault statistics.

**Parameters:** None

### CEX-DEX Synergy

#### `analyze_divergence`
Analyze CEX-DEX price divergence for a trading pair.

**Parameters:**
- `pair` (string, required): Trading pair (e.g., `ETH-USDT`, `CRO-USDC`)

**Example:**
```json
{
  "name": "analyze_divergence",
  "arguments": {
    "pair": "ETH-USDT"
  }
}
```

#### `get_available_pairs`
Get list of available trading pairs from Crypto.com Exchange.

**Parameters:** None

### Observability

#### `get_metrics`
Get system metrics including total analyses, blocked transactions, and performance stats.

**Parameters:** None

#### `get_logs`
Get system logs with optional filtering.

**Parameters:**
- `type` (string, optional): Filter by log type (e.g., `risk_analysis`, `transaction_blocked`)
- `limit` (number, optional): Maximum number of logs (default: 10)

#### `get_blocked_transactions`
Get list of recently blocked transactions.

**Parameters:** None

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Cronos Shield backend API URL | `https://cronos-shield-backend-production.up.railway.app` |

## x402 Payment Protocol

Some tools require x402 payment. When a tool returns a `402 Payment Required` error, the response will include a payment challenge that needs to be handled.

**Example Error Response:**
```json
{
  "success": false,
  "error": "Payment required (x402)",
  "challenge": {
    "paymentId": "pay_...",
    "amount": "0.01",
    "currency": "USDC",
    "network": "cronos-testnet"
  },
  "message": "This tool requires x402 payment. Please handle the payment challenge."
}
```

## Development

### Project Structure

```
mcp-server/
├── src/
│   ├── index.ts          # Main MCP server
│   └── tools/
│       ├── risk.ts       # Risk Oracle tools
│       ├── vault.ts      # Vault tools
│       ├── divergence.ts # CEX-DEX tools
│       └── observability.ts # Observability tools
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
pnpm run build
```

### Running in Development

```bash
pnpm run dev
```

## License

MIT
