/**
 * Types for CEX-DEX Divergence API
 */

export interface DivergenceRequest {
  token: string; // Token symbol (e.g., "CRO", "USDC")
  amount?: string; // Optional amount for price calculation
}

export interface DivergenceResponse {
  token: string;
  cexPrice: string;
  dexPrice: string;
  divergence: string; // Percentage difference
  divergenceAmount: string; // Absolute difference
  recommendation: 'buy_on_cex' | 'buy_on_dex' | 'no_arbitrage';
  timestamp: number;
  details: {
    cexExchange: string;
    dexExchange: string;
    liquidity: {
      cex: string;
      dex: string;
    };
  };
}
