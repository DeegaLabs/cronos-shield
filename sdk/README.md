# Cronos Shield SDK

TypeScript SDK for Cronos Shield - Risk Oracle, Shielded Vaults, CEX-DEX Synergy, and Observability.

## Installation

```bash
npm install @cronos-shield/sdk
# or
pnpm add @cronos-shield/sdk
# or
yarn add @cronos-shield/sdk
```

## Quick Start

```typescript
import { CronosShieldClient } from '@cronos-shield/sdk';

const client = new CronosShieldClient({
  backendUrl: 'https://cronos-shield-backend-production.up.railway.app',
  network: 'cronos-testnet',
});

// Analyze contract risk
const analysis = await client.risk.analyze('0x...');

// Get vault balance
const balance = await client.vault.getBalance('0x...');

// Analyze divergence
const divergence = await client.divergence.analyze('ETH-USDT');

// Get metrics
const metrics = await client.observability.getMetrics();
```

## API Reference

### Risk Oracle Client

```typescript
// Analyze contract risk
const analysis = await client.risk.analyze(contractAddress, {
  paymentId?: string,
});

// Verify proof
const isValid = await client.risk.verifyProof(proof);

// Get recent analyses
const recent = await client.risk.getRecentAnalyses(10);
```

### Vault Client

```typescript
// Get balance
const balance = await client.vault.getBalance(address);

// Get stats
const stats = await client.vault.getStats();

// Get transactions
const transactions = await client.vault.getTransactions(address, 10);

// Deposit (requires wallet client)
const deposit = await client.vault.deposit(amount, {
  walletClient,
  paymentId?: string,
});

// Withdraw (requires wallet client)
const withdraw = await client.vault.withdraw(amount, {
  walletClient,
  paymentId?: string,
});

// Execute protected transaction (requires wallet client)
const tx = await client.vault.executeProtectedTransaction({
  target: contractAddress,
  value: amount,
  callData: data,
}, {
  walletClient,
  paymentId?: string,
});
```

### Divergence Client

```typescript
// Analyze divergence
const divergence = await client.divergence.analyze('ETH-USDT', {
  amount?: string,
  paymentId?: string,
});

// Get available pairs
const pairs = await client.divergence.getAvailablePairs();

// Get history
const history = await client.divergence.getHistory('ETH-USDT', 7);

// Get alerts
const alerts = await client.divergence.getAlerts(10);
```

### Observability Client

```typescript
// Get metrics
const metrics = await client.observability.getMetrics();

// Get logs
const logs = await client.observability.getLogs({
  type?: string,
  limit?: number,
  offset?: number,
});

// Get blocked transactions
const blocked = await client.observability.getBlockedTransactions();
```

### x402 Payment Handler

```typescript
// Handle payment challenge
const result = await client.x402.handlePaymentChallenge(
  challenge,
  walletClient
);

// Verify payment
const verified = await client.x402.verifyPayment(paymentId);
```

## Error Handling

The SDK provides custom error types:

```typescript
import { PaymentRequiredError, NetworkError, CronosShieldError } from '@cronos-shield/sdk';

try {
  const analysis = await client.risk.analyze(contractAddress);
} catch (error) {
  if (error instanceof PaymentRequiredError) {
    // Handle payment challenge
    const challenge = error.challenge;
    // ... handle payment
  } else if (error instanceof NetworkError) {
    // Handle network error
    console.error('Network error:', error.message);
  } else {
    // Handle other errors
    console.error('Error:', error);
  }
}
```

## Examples

See the `examples/` directory for more detailed examples:

- `basic-usage.ts` - Basic SDK usage
- `risk-analysis.ts` - Risk analysis example
- `divergence-analysis.ts` - Divergence analysis example
- `vault-operations.ts` - Vault operations example

## License

MIT
