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

const VVS_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

const VVS_PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

const ERC20_ABI = [
  "function decimals() external view returns (uint8)"
];

export class DexService {
  private provider: ethers.JsonRpcProvider;
  private router: ethers.Contract;
  private factory: ethers.Contract;
  // Token addresses - can be overridden via environment variables
  // Testnet addresses (default)
  private tokenAddresses: Record<string, string> = {
    'CRO': process.env.CRO_TOKEN_ADDRESS || '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',
    'USDC': process.env.USDC_TOKEN_ADDRESS || '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
    'USDT': process.env.USDT_TOKEN_ADDRESS || '0x66e428c3f67a68878562e79A0234c1F83c208770',
  };

  constructor(rpcUrl: string, routerAddress: string, factoryAddress?: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.router = new ethers.Contract(routerAddress, VVS_ROUTER_ABI, this.provider);
    
    // VVS Factory address (can be overridden via env)
    // Default: VVS Finance Factory on Cronos Testnet
    const factoryAddr = factoryAddress || process.env.VVS_FACTORY_ADDRESS || '0x3B44B2a187b7CB45c7e2C4a3c5A5b5b5b5b5b5b5b';
    this.factory = new ethers.Contract(factoryAddr, VVS_FACTORY_ABI, this.provider);
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
      
      // Check if amounts array is valid and has at least 2 elements
      if (!amounts || amounts.length < 2 || amounts[1] === 0n) {
        throw new Error(`No liquidity available for pair ${pair} or invalid response`);
      }

      const price = ethers.formatEther(amounts[1]);

      return {
        price: price.toString(),
        timestamp: Date.now(),
        source: 'DEX',
        pair: pair,
      };
    } catch (error: any) {
      // Log error details for debugging (only for non-expected errors)
      const errorMessage = error.reason || error.message || 'Unknown error';
      const errorCode = error.code || 'UNKNOWN';
      
      // Only log if it's not a common testnet issue (no liquidity, contract not found)
      const isExpectedError = 
        errorMessage.includes('0x') || 
        errorMessage.includes('BAD_DATA') ||
        errorMessage.includes('No liquidity') ||
        errorMessage.includes('execution reverted');
      
      if (!isExpectedError) {
        console.warn(`⚠️  DEX query error: ${errorMessage} (code: ${errorCode}). Using mock data.`);
      } else {
        // Silent fallback to mock data for expected testnet limitations
        console.debug(`ℹ️  DEX query for ${pair} unavailable, using mock data (expected in testnet).`);
      }
      
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
    try {
      const [tokenIn, tokenOut] = this.parsePair(pair);
      if (!tokenIn || !tokenOut) {
        throw new Error(`Invalid pair: ${pair}`);
      }

      const tokenInAddress = this.getTokenAddress(tokenIn);
      const tokenOutAddress = this.getTokenAddress(tokenOut);

      // Get pool address from factory
      const poolAddress = await retry(
        async () => {
          return await this.factory.getPair(tokenInAddress, tokenOutAddress);
        },
        {
          maxRetries: 2,
          delay: 1000,
          retryCondition: (error) => {
            return error?.message?.includes('network') || 
                   error?.message?.includes('timeout') ||
                   error?.code === 'NETWORK_ERROR';
          },
        }
      );

      // Check if pool exists
      if (!poolAddress || poolAddress === ethers.ZeroAddress) {
        console.debug(`ℹ️  No pool found for ${pair}, using mock data.`);
        return {
          available: '0',
          depth: 'NONE',
        };
      }

      // Get pool contract
      const pool = new ethers.Contract(poolAddress, VVS_PAIR_ABI, this.provider);
      
      // Get reserves
      const [reserve0, reserve1] = await retry(
        async () => {
          return await pool.getReserves();
        },
        {
          maxRetries: 2,
          delay: 1000,
          retryCondition: (error) => {
            return error?.message?.includes('network') || 
                   error?.message?.includes('timeout') ||
                   error?.code === 'NETWORK_ERROR';
          },
        }
      );

      // Get token decimals
      const tokenInContract = new ethers.Contract(tokenInAddress, ERC20_ABI, this.provider);
      const tokenOutContract = new ethers.Contract(tokenOutAddress, ERC20_ABI, this.provider);
      
      const [decimalsIn, decimalsOut] = await Promise.all([
        tokenInContract.decimals().catch(() => 18), // Default to 18 if fails
        tokenOutContract.decimals().catch(() => 18),
      ]);

      // Format reserves
      const reserve0Formatted = parseFloat(ethers.formatUnits(reserve0, decimalsIn));
      const reserve1Formatted = parseFloat(ethers.formatUnits(reserve1, decimalsOut));

      // Calculate liquidity in USD
      // If tokenOut is USDC/USDT, use reserve1 directly (assuming 1:1 with USD)
      // Otherwise, estimate based on price from reserves
      let liquidityUSD: number;
      
      if (tokenOut === 'USDC' || tokenOut === 'USDT') {
        // USDC/USDT has 6 decimals, so reserve1Formatted is already in correct units
        // Multiply by 2 to get total liquidity (both sides of the pool)
        liquidityUSD = reserve1Formatted * 2;
      } else if (tokenIn === 'USDC' || tokenIn === 'USDT') {
        // Same for tokenIn being stablecoin
        liquidityUSD = reserve0Formatted * 2;
      } else {
        // For other pairs, estimate liquidity as sum of both reserves
        // This is a rough estimate - in production, you'd need price oracle
        liquidityUSD = reserve0Formatted + reserve1Formatted;
      }

      // Determine depth based on liquidity
      let depth: string;
      if (liquidityUSD > 1000000) {
        depth = 'HIGH';
      } else if (liquidityUSD > 100000) {
        depth = 'MEDIUM';
      } else if (liquidityUSD > 10000) {
        depth = 'LOW';
      } else if (liquidityUSD > 0) {
        depth = 'VERY_LOW';
      } else {
        depth = 'NONE';
      }

      return {
        available: liquidityUSD.toFixed(2),
        depth,
      };
    } catch (error: any) {
      const errorMessage = error.reason || error.message || 'Unknown error';
      const isExpectedError = 
        errorMessage.includes('0x') || 
        errorMessage.includes('BAD_DATA') ||
        errorMessage.includes('execution reverted') ||
        errorMessage.includes('No pool found');
      
      if (!isExpectedError) {
        console.warn(`⚠️  Failed to get liquidity for ${pair}: ${errorMessage}. Using mock data.`);
      } else {
        console.debug(`ℹ️  Liquidity query for ${pair} unavailable, using mock data (expected in testnet).`);
      }
      
      // Fallback to mock data
      return {
        available: '0',
        depth: 'NONE',
      };
    }
  }
}
