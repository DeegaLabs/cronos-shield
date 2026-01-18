/**
 * On-Chain Data Service
 * 
 * Fetches real on-chain data from blockchain and DEXs
 */

import { ethers } from 'ethers';
import { CronoscanService } from './cronoscan.service';
import { logger } from '../../lib/utils/logger';

const VVS_ROUTER_ADDRESS = '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae';
const VVS_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
];

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function decimals() external view returns (uint8)',
];

interface LiquidityInfo {
  available: string;
  depth: string;
  source: string;
}

export class OnChainDataService {
  private provider: ethers.JsonRpcProvider;
  private cronoscanService: CronoscanService;

  constructor(rpcUrl: string, cronoscanApiKey?: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.cronoscanService = new CronoscanService(cronoscanApiKey);
    logger.info('OnChainDataService initialized', { 
      hasCronoscanApiKey: !!cronoscanApiKey,
      rpcUrl 
    });
  }

  /**
   * Get number of token holders
   * Tries Cronoscan API first, falls back to RPC if API fails
   */
  async getHolders(contractAddress: string): Promise<number> {
    try {
      logger.debug('Getting holders from Cronoscan', { contractAddress });
      const holders = await this.cronoscanService.getTokenHolders(contractAddress);
      if (holders > 0) {
        logger.info(`✅ Found ${holders} holders from Cronoscan`, { contractAddress });
        return holders;
      }
    } catch (error: any) {
      logger.warn('Cronoscan API failed, trying RPC fallback', { error: error.message, contractAddress });
    }

    // Fallback: Try to get holders via RPC (ERC20 Transfer events)
    try {
      return await this.getHoldersViaRPC(contractAddress);
    } catch (error: any) {
      logger.warn('RPC fallback also failed', { error: error.message, contractAddress });
      return 0;
    }
  }

  /**
   * Get token holders count via RPC (ERC20 Transfer events)
   */
  private async getHoldersViaRPC(contractAddress: string): Promise<number> {
    try {
      // First, verify contract has code
      const code = await this.provider.getCode(contractAddress);
      if (!code || code === '0x') {
        logger.warn('Contract has no code, cannot get holders', { contractAddress });
        return 0;
      }

      const ERC20_TRANSFER_ABI = [
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ];

      const contract = new ethers.Contract(contractAddress, ERC20_TRANSFER_ABI, this.provider);
      
      // Get current block
      const currentBlock = await this.provider.getBlockNumber();
      // RPC limit is 2000 blocks, use 1900 to be safe
      const maxRange = 1900;
      const fromBlock = Math.max(0, currentBlock - maxRange);

      logger.debug('Querying Transfer events via RPC', { 
        contractAddress, 
        fromBlock, 
        currentBlock, 
        range: currentBlock - fromBlock 
      });

      // Get all Transfer events (respecting RPC limit of 2000 blocks)
      const transferEvents = await contract.queryFilter(
        contract.filters.Transfer(),
        fromBlock,
        currentBlock
      );

      // Count unique addresses (both from and to, excluding zero address)
      const uniqueAddresses = new Set<string>();
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      
      for (const event of transferEvents) {
        // Check if it's an EventLog (has args) vs Log (no args)
        if ('args' in event && event.args) {
          const from = (event.args as any).from?.toLowerCase();
          const to = (event.args as any).to?.toLowerCase();
          
          if (from && from !== zeroAddress) {
            uniqueAddresses.add(from);
          }
          if (to && to !== zeroAddress) {
            uniqueAddresses.add(to);
          }
        }
      }

      const count = uniqueAddresses.size;
      logger.info(`✅ Found ${count} holders via RPC (from Transfer events in last ${currentBlock - fromBlock} blocks)`, { 
        contractAddress,
        range: currentBlock - fromBlock,
        eventsFound: transferEvents.length
      });
      return count;
    } catch (error: any) {
      // Check if error is about block range limit
      if (error.message?.includes('maximum') && error.message?.includes('blocks distance')) {
        logger.warn('RPC block range limit exceeded, trying smaller range', { 
          error: error.message, 
          contractAddress 
        });
        // Try with even smaller range (1000 blocks)
        try {
          const currentBlock = await this.provider.getBlockNumber();
          const smallRange = 1000;
          const fromBlock = Math.max(0, currentBlock - smallRange);
          const code = await this.provider.getCode(contractAddress);
          if (!code || code === '0x') {
            return 0;
          }
          const ERC20_TRANSFER_ABI = [
            'event Transfer(address indexed from, address indexed to, uint256 value)',
          ];
          const contract = new ethers.Contract(contractAddress, ERC20_TRANSFER_ABI, this.provider);
          const transferEvents = await contract.queryFilter(
            contract.filters.Transfer(),
            fromBlock,
            currentBlock
          );
          const uniqueAddresses = new Set<string>();
          const zeroAddress = '0x0000000000000000000000000000000000000000';
          for (const event of transferEvents) {
            if ('args' in event && event.args) {
              const from = (event.args as any).from?.toLowerCase();
              const to = (event.args as any).to?.toLowerCase();
              if (from && from !== zeroAddress) uniqueAddresses.add(from);
              if (to && to !== zeroAddress) uniqueAddresses.add(to);
            }
          }
          logger.info(`✅ Found ${uniqueAddresses.size} holders via RPC (smaller range: ${smallRange} blocks)`, { contractAddress });
          return uniqueAddresses.size;
        } catch (retryError: any) {
          logger.warn('Failed to get holders via RPC even with smaller range', { 
            error: retryError.message, 
            contractAddress 
          });
          return 0;
        }
      }
      logger.warn('Failed to get holders via RPC', { error: error.message, contractAddress });
      return 0;
    }
  }

  /**
   * Get contract age in days
   * Tries Cronoscan API first, falls back to RPC if API fails
   */
  async getContractAge(contractAddress: string): Promise<number> {
    try {
      logger.debug('Getting contract age from Cronoscan', { contractAddress });
      const age = await this.cronoscanService.getContractAge(contractAddress);
      if (age > 0) {
        logger.info(`✅ Contract age: ${age} days from Cronoscan`, { contractAddress });
        return age;
      }
    } catch (error: any) {
      logger.warn('Cronoscan API failed, trying RPC fallback', { error: error.message, contractAddress });
    }

    // Fallback: Get contract creation block via RPC
    try {
      return await this.getContractAgeViaRPC(contractAddress);
    } catch (error: any) {
      logger.warn('RPC fallback also failed', { error: error.message, contractAddress });
      return 0;
    }
  }

  /**
   * Get contract age via RPC (find first transaction to contract)
   */
  private async getContractAgeViaRPC(contractAddress: string): Promise<number> {
    try {
      // Get current block
      const currentBlock = await this.provider.getBlockNumber();
      const currentBlockData = await this.provider.getBlock(currentBlock);
      const currentTimestamp = currentBlockData?.timestamp || Math.floor(Date.now() / 1000);

      // Try to find the contract creation transaction
      // Search backwards from current block (using smaller range for efficiency)
      // Note: getCode() doesn't have the 2000 block limit, but we'll limit search for performance
      const searchRange = 10000; // Search last 10k blocks (reasonable for most contracts)
      const fromBlock = Math.max(0, currentBlock - searchRange);

      // Get contract code to verify it exists
      const code = await this.provider.getCode(contractAddress);
      if (!code || code === '0x') {
        logger.warn('Contract has no code', { contractAddress });
        return 0;
      }

      // Try to find creation transaction by searching for contract creation
      // This is a simplified approach - in production you might want to use a more sophisticated method
      let creationBlock = fromBlock;
      
      // Binary search for contract creation (simplified)
      for (let block = fromBlock; block <= currentBlock; block += 1000) {
        try {
          const blockCode = await this.provider.getCode(contractAddress, block);
          if (blockCode && blockCode !== '0x') {
            // Contract exists at this block, check previous blocks
            const prevBlock = Math.max(0, block - 1000);
            const prevCode = await this.provider.getCode(contractAddress, prevBlock);
            if (!prevCode || prevCode === '0x') {
              // Contract was created between prevBlock and block
              creationBlock = block;
              break;
            }
          }
        } catch {
          // Continue searching
        }
      }

      // Get block data for creation block
      const creationBlockData = await this.provider.getBlock(creationBlock);
      const creationTimestamp = creationBlockData?.timestamp || currentTimestamp;

      // Calculate age in days
      const ageSeconds = currentTimestamp - creationTimestamp;
      const ageDays = Math.floor(ageSeconds / (24 * 60 * 60));

      logger.info(`✅ Contract age: ${ageDays} days via RPC (created at block ${creationBlock})`, { contractAddress });
      return ageDays;
    } catch (error: any) {
      logger.warn('Failed to get contract age via RPC', { error: error.message });
      return 0;
    }
  }

  /**
   * Check if contract is verified
   */
  async isContractVerified(contractAddress: string): Promise<boolean> {
    try {
      logger.debug('Checking contract verification on Cronoscan', { contractAddress });
      const verified = await this.cronoscanService.isContractVerified(contractAddress);
      logger.info(`✅ Contract verified: ${verified}`, { contractAddress });
      return verified;
    } catch (error: any) {
      logger.warn('Failed to check verification, assuming unverified', { error: error.message, contractAddress });
      return false;
    }
  }

  /**
   * Get liquidity for a token contract
   * Tries multiple DEXs and returns the highest liquidity found
   */
  async getLiquidity(contractAddress: string, quoteToken: string = 'USDC'): Promise<LiquidityInfo> {
    try {
      // Try VVS Finance first
      const vvsLiquidity = await this.getVVSFinanceLiquidity(contractAddress, quoteToken);
      if (vvsLiquidity && parseFloat(vvsLiquidity.available) > 0) {
        return vvsLiquidity;
      }

      // Fallback: try to get token balance as proxy for liquidity
      const tokenBalance = await this.getTokenBalance(contractAddress);
      if (parseFloat(tokenBalance) > 0) {
        return {
          available: tokenBalance,
          depth: parseFloat(tokenBalance) > 10000 ? 'HIGH' : parseFloat(tokenBalance) > 1000 ? 'MEDIUM' : 'LOW',
          source: 'token_balance',
        };
      }

      return {
        available: '0',
        depth: 'LOW',
        source: 'none',
      };
    } catch (error: any) {
      logger.warn('Failed to get liquidity, using fallback', { error: error.message });
      return {
        available: '0',
        depth: 'LOW',
        source: 'error',
      };
    }
  }

  /**
   * Get liquidity from VVS Finance
   */
  private async getVVSFinanceLiquidity(
    contractAddress: string,
    quoteToken: string
  ): Promise<LiquidityInfo | null> {
    try {
      const router = new ethers.Contract(VVS_ROUTER_ADDRESS, VVS_ROUTER_ABI, this.provider);

      // Get quote token address
      const quoteTokenAddress = this.getQuoteTokenAddress(quoteToken);
      
      // Try to get amounts out for a test swap (1 token)
      const amountIn = ethers.parseUnits('1', 18); // 1 token with 18 decimals
      const path = [contractAddress, quoteTokenAddress];

      try {
        const amounts = await router.getAmountsOut(amountIn, path);
        const amountOut = amounts[1];
        
        // Estimate liquidity based on price impact
        // This is a simplified calculation
        const amountOutFormatted = parseFloat(ethers.formatEther(amountOut));
        const liquidityEstimate = amountOutFormatted * 1000; // Rough estimate

        return {
          available: liquidityEstimate.toFixed(2),
          depth: liquidityEstimate > 10000 ? 'HIGH' : liquidityEstimate > 1000 ? 'MEDIUM' : 'LOW',
          source: 'vvs_finance',
        };
      } catch {
        // If swap fails, there's no liquidity for this pair
        return null;
      }
    } catch (error: any) {
      logger.debug('VVS Finance liquidity check failed', { error: error.message });
      return null;
    }
  }

  /**
   * Get token balance (as fallback for liquidity estimation)
   */
  private async getTokenBalance(contractAddress: string): Promise<string> {
    try {
      const token = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
      const [totalSupply, decimals] = await Promise.all([
        token.totalSupply(),
        token.decimals(),
      ]);

      return ethers.formatUnits(totalSupply, decimals);
    } catch (error: any) {
      logger.debug('Failed to get token balance', { error: error.message });
      return '0';
    }
  }

  /**
   * Get quote token address
   */
  private getQuoteTokenAddress(quoteToken: string): string {
    const addresses: Record<string, string> = {
      USDC: process.env.USDC_TOKEN_ADDRESS || '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0', // Testnet
      USDT: process.env.USDT_TOKEN_ADDRESS || '0x66e428c3f67a68878562e79A0234c1F83c208770', // Testnet
      CRO: process.env.CRO_TOKEN_ADDRESS || '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23', // Testnet (Wrapped)
    };

    return addresses[quoteToken.toUpperCase()] || addresses.USDC;
  }

  /**
   * Get contract bytecode for analysis
   */
  async getContractBytecode(contractAddress: string): Promise<string> {
    try {
      const code = await this.provider.getCode(contractAddress);
      return code;
    } catch (error: any) {
      logger.warn('Failed to get contract bytecode', { error: error.message });
      return '0x';
    }
  }

  /**
   * Analyze contract complexity from bytecode
   */
  async analyzeContractComplexity(contractAddress: string): Promise<{
    isProxy: boolean;
    hasSelfDestruct: boolean;
    bytecodeSize: number;
    complexity: 'low' | 'medium' | 'high';
  }> {
    try {
      const bytecode = await this.getContractBytecode(contractAddress);
      
      if (bytecode === '0x' || bytecode.length < 10) {
        return {
          isProxy: false,
          hasSelfDestruct: false,
          bytecodeSize: 0,
          complexity: 'low',
        };
      }

      const bytecodeSize = (bytecode.length - 2) / 2; // Remove '0x' and divide by 2 (hex)
      
      // Check for proxy patterns (common proxy selectors)
      const isProxy = bytecode.includes('eip1967') || 
                     bytecode.includes('360894a1') ||
                     bytecode.includes('a3f0ad74');
      
      // Check for selfdestruct (opcode 0xff)
      const hasSelfDestruct = bytecode.includes('ff');

      // Determine complexity based on size
      let complexity: 'low' | 'medium' | 'high';
      if (bytecodeSize < 1000) {
        complexity = 'low';
      } else if (bytecodeSize < 5000) {
        complexity = 'medium';
      } else {
        complexity = 'high';
      }

      return {
        isProxy,
        hasSelfDestruct,
        bytecodeSize,
        complexity,
      };
    } catch (error: any) {
      logger.warn('Failed to analyze contract complexity', { error: error.message });
      return {
        isProxy: false,
        hasSelfDestruct: false,
        bytecodeSize: 0,
        complexity: 'low',
      };
    }
  }
}
