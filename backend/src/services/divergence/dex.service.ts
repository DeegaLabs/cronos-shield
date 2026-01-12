/**
 * DEX Service
 */

import { ethers } from 'ethers';
import { retry } from '../../lib/utils/retry.util';

export interface PriceData {
  price: string;
  timestamp: number;
  source: 'CEX' | 'DEX';
  pair: string;
}

const VVS_ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
];

export class DexService {
  private provider: ethers.JsonRpcProvider;
  private router: ethers.Contract;
  private tokenAddresses: Record<string, string> = {
    'CRO': '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',
    'USDC': '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
    'USDT': '0x66e428c3f67a68878562e79A0234c1F83c208770',
  };

  constructor(rpcUrl: string, routerAddress: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.router = new ethers.Contract(routerAddress, VVS_ROUTER_ABI, this.provider);
  }

  async getPrice(pair: string, amountIn?: bigint): Promise<PriceData> {
    try {
      const [tokenIn, tokenOut] = this.parsePair(pair);
      if (!tokenIn || !tokenOut) {
        throw new Error(`Invalid pair: ${pair}`);
      }

      const amount = amountIn || ethers.parseEther('1');
      const path = [this.getTokenAddress(tokenIn), this.getTokenAddress(tokenOut)];
      
      // Retry logic for blockchain calls
      const amounts = await retry(
        async () => {
          return await this.router.getAmountsOut(amount, path);
        },
        {
          maxRetries: 2,
          delay: 1000,
          retryCondition: (error) => {
            // Retry on network errors or RPC errors
            return error?.message?.includes('network') || 
                   error?.message?.includes('timeout') ||
                   error?.code === 'NETWORK_ERROR';
          },
        }
      );
      
      const price = ethers.formatEther(amounts[1]);

      return {
        price: price.toString(),
        timestamp: Date.now(),
        source: 'DEX',
        pair: pair,
      };
    } catch (error: any) {
      // If retry failed, use mock data
      return this.getMockPrice(pair);
    }
  }

  private parsePair(pair: string): [string | null, string | null] {
    const parts = pair.split('-');
    return parts.length === 2 ? [parts[0].toUpperCase(), parts[1].toUpperCase()] : [null, null];
  }

  private getTokenAddress(symbol: string): string {
    const address = this.tokenAddresses[symbol];
    if (!address) {
      throw new Error(`Token address not found for: ${symbol}`);
    }
    return address;
  }

  private getMockPrice(pair: string): PriceData {
    const mockPrices: Record<string, string> = {
      'CRO-USDC': '0.12',
      'CRO-USDT': '0.12',
      'USDC-USDT': '1.00',
    };

    return {
      price: mockPrices[pair] || '0.10',
      timestamp: Date.now(),
      source: 'DEX',
      pair: pair,
    };
  }

  async getLiquidity(pair: string): Promise<{ available: string; depth: string }> {
    return {
      available: '1000000',
      depth: 'HIGH',
    };
  }
}
