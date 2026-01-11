/**
 * Divergence Service
 */

import { ethers } from 'ethers';
import type { DivergenceRequest, DivergenceResponse } from '../../types/divergence.types';
import { CryptoComService } from './crypto-com.service';
import { DexService } from './dex.service';

export class DivergenceService {
  private cexService: CryptoComService;
  private dexService: DexService;
  private readonly DIVERGENCE_THRESHOLD_LOW = 0.5;
  private readonly DIVERGENCE_THRESHOLD_MEDIUM = 2.0;
  private readonly DIVERGENCE_THRESHOLD_HIGH = 5.0;

  constructor(cexService: CryptoComService, dexService: DexService) {
    this.cexService = cexService;
    this.dexService = dexService;
  }

  async calculateDivergence(request: DivergenceRequest): Promise<DivergenceResponse> {
    const { token, amount } = request;
    const pair = `${token}-USDC`; // Default pair

    const [cexPrice, dexPrice] = await Promise.all([
      this.cexService.getPrice(pair),
      this.dexService.getPrice(pair, amount ? ethers.parseEther(amount) : undefined),
    ]);

    const cexPriceNum = parseFloat(cexPrice.price);
    const dexPriceNum = parseFloat(dexPrice.price);
    const absoluteDiff = Math.abs(dexPriceNum - cexPriceNum);
    const percentage = ((dexPriceNum - cexPriceNum) / cexPriceNum) * 100;

    const liquidity = await this.dexService.getLiquidity(pair);
    const recommendation = this.generateRecommendation(Math.abs(percentage), liquidity);

    return {
      token,
      cexPrice: cexPrice.price,
      dexPrice: dexPrice.price,
      divergence: percentage.toFixed(4),
      divergenceAmount: absoluteDiff.toFixed(6),
      recommendation,
      timestamp: Date.now(),
      details: {
        cexExchange: 'Crypto.com',
        dexExchange: 'VVS Finance',
        liquidity: {
          cex: 'N/A',
          dex: liquidity.available,
        },
      },
    };
  }

  private generateRecommendation(
    divergencePercent: number,
    liquidity: { available: string; depth: string }
  ): 'buy_on_cex' | 'buy_on_dex' | 'no_arbitrage' {
    if (divergencePercent < this.DIVERGENCE_THRESHOLD_LOW) {
      return 'no_arbitrage';
    }

    if (divergencePercent >= this.DIVERGENCE_THRESHOLD_HIGH) {
      return liquidity.depth === 'LOW' ? 'no_arbitrage' : 'buy_on_cex';
    }

    return 'no_arbitrage';
  }
}
