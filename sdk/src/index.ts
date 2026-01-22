/**
 * Cronos Shield SDK
 * 
 * TypeScript SDK for Cronos Shield - Risk Oracle, Shielded Vaults, CEX-DEX Synergy, and Observability
 */

import { RiskOracleClient } from './clients/risk.client';
import { VaultClient } from './clients/vault.client';
import { DivergenceClient } from './clients/divergence.client';
import { ObservabilityClient } from './clients/observability.client';
import { PaymentHandler } from './x402/payment-handler';
import type { ClientConfig } from './types';

export class CronosShieldClient {
  public readonly risk: RiskOracleClient;
  public readonly vault: VaultClient;
  public readonly divergence: DivergenceClient;
  public readonly observability: ObservabilityClient;
  public readonly x402: PaymentHandler;

  constructor(config: ClientConfig) {
    if (!config.backendUrl) {
      throw new Error('backendUrl is required');
    }

    // Remove trailing slash if present
    const baseUrl = config.backendUrl.replace(/\/$/, '');

    // Initialize clients
    this.risk = new RiskOracleClient(baseUrl);
    this.vault = new VaultClient(baseUrl);
    this.divergence = new DivergenceClient(baseUrl);
    this.observability = new ObservabilityClient(baseUrl);
    this.x402 = new PaymentHandler(baseUrl);
  }
}

// Export types
export * from './types';

// Export clients (for advanced usage)
export { RiskOracleClient } from './clients/risk.client';
export { VaultClient } from './clients/vault.client';
export { DivergenceClient } from './clients/divergence.client';
export { ObservabilityClient } from './clients/observability.client';
export { PaymentHandler } from './x402/payment-handler';

// Export utilities
export * from './utils/errors';
export * from './utils/validation';

// Default export
export default CronosShieldClient;
