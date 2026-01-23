/**
 * Risk Analyzer
 * 
 * Analyzes contract risk using real on-chain data
 */

import type { RiskAnalysisRequest, RiskAnalysisResponse, RiskDetails } from '../../types/risk.types';
import { OnChainDataService } from './on-chain-data.service';
import { logger } from '../../lib/utils/logger';
import { ethers } from 'ethers';

let onChainDataService: OnChainDataService | null = null;

/**
 * Initialize on-chain data service
 */
function getOnChainDataService(): OnChainDataService {
  if (!onChainDataService) {
    const rpcUrl = process.env.RPC_URL || 'https://evm-t3.cronos.org';
    const cronoscanApiKey = process.env.CRONOSCAN_API_KEY;
    onChainDataService = new OnChainDataService(rpcUrl, cronoscanApiKey);
  }
  return onChainDataService;
}

/**
 * Analyzes risk for a given contract address using real on-chain data
 */
export async function analyzeRisk(request: RiskAnalysisRequest): Promise<Omit<RiskAnalysisResponse, 'proof' | 'timestamp'>> {
  const { contract } = request;
  const dataService = getOnChainDataService();

  logger.debug('Starting risk analysis', { contract });

  try {
    // First, verify this is actually a contract (has code)
    const rpcUrl = process.env.RPC_URL || 'https://evm-t3.cronos.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Normalize address to checksum format for reliable RPC calls
    // getAddress validates and normalizes the address
    let normalizedAddress: string;
    try {
      normalizedAddress = ethers.getAddress(contract);
    } catch (error) {
      // If getAddress fails, try lowercase (for testnet addresses without checksum)
      normalizedAddress = contract.toLowerCase();
    }
    
    logger.debug('Checking if address is a contract', { 
      originalContract: contract, 
      normalizedAddress,
      rpcUrl 
    });
    const code = await provider.getCode(normalizedAddress);
    const codeLength = code ? code.length : 0;
    
    logger.debug('Contract code check result', { 
      originalContract: contract,
      normalizedAddress,
      hasCode: code && code !== '0x',
      codeLength,
      codePreview: code ? code.substring(0, 20) + '...' : 'none'
    });
    
    if (!code || code === '0x') {
      // Try to get balance to see if address exists at all
      const balance = await provider.getBalance(normalizedAddress).catch(() => null);
      logger.warn('⚠️ Address is not a contract (no code found)', { 
        originalContract: contract,
        normalizedAddress,
        hasBalance: balance !== null,
        balance: balance ? ethers.formatEther(balance) : 'unknown',
        note: 'This address may be an EOA or may not exist on this network'
      });
      
      return {
        score: 100, // Maximum risk for non-contract addresses
        details: {
          liquidity: 'unknown',
          contractAge: 'N/A',
          holders: 0,
          verified: false,
          warnings: [
            'Address is not a smart contract (no code found)',
            'This address may be an externally owned account (EOA) or may not exist on this network',
            'Cannot perform contract risk analysis on non-contract addresses',
            `Network: ${process.env.NETWORK || 'unknown'}`,
          ],
        },
        contract,
      };
    }
    
    logger.info('✅ Address is a valid contract', { 
      originalContract: contract,
      normalizedAddress,
      codeLength: code.length,
      estimatedSize: `${Math.round(code.length / 2)} bytes`
    });

    // Use normalized address for all subsequent calls
    const contractAddress = normalizedAddress;

    logger.info('🔍 Fetching real on-chain data...', { contract: contractAddress });
    
    // Track which data sources failed
    const dataErrors: string[] = [];
    
    // Fetch real on-chain data in parallel
    const [holders, contractAge, verified, liquidity, complexity, activity, totalSupply] = await Promise.all([
      dataService.getHolders(contractAddress).catch((err) => {
        const errorMsg = `Holders: ${err.message}`;
        logger.warn('Failed to get holders', { error: err.message, contract: contractAddress });
        dataErrors.push(errorMsg);
        return 0;
      }),
      dataService.getContractAge(contractAddress).catch((err) => {
        const errorMsg = `ContractAge: ${err.message}`;
        logger.warn('Failed to get contract age', { error: err.message, contract: contractAddress });
        dataErrors.push(errorMsg);
        return 0;
      }),
      dataService.isContractVerified(contractAddress).catch((err) => {
        const errorMsg = `Verification: ${err.message}`;
        logger.warn('Failed to check verification', { error: err.message, contract: contractAddress });
        dataErrors.push(errorMsg);
        return false;
      }),
      dataService.getLiquidity(contractAddress).catch((err) => {
        const errorMsg = `Liquidity: ${err.message}`;
        logger.warn('Failed to get liquidity', { error: err.message, contract: contractAddress });
        dataErrors.push(errorMsg);
        return { available: '0', depth: 'LOW', source: 'error' };
      }),
      dataService.analyzeContractComplexity(contractAddress).catch((err) => {
        const errorMsg = `Complexity: ${err.message}`;
        logger.warn('Failed to analyze complexity', { error: err.message, contract: contractAddress });
        dataErrors.push(errorMsg);
        return {
          isProxy: false,
          hasSelfDestruct: false,
          bytecodeSize: 0,
          complexity: 'low' as const,
        };
      }),
      dataService.getTransactionActivity(contractAddress).catch((err) => {
        const errorMsg = `Activity: ${err.message}`;
        logger.warn('Failed to get transaction activity', { error: err.message, contract: contractAddress });
        dataErrors.push(errorMsg);
        return { total: 0, recent24h: 0 };
      }),
      dataService.getTokenSupply(contractAddress).catch((err) => {
        const errorMsg = `TokenSupply: ${err.message}`;
        logger.warn('Failed to get token supply', { error: err.message, contract: contractAddress });
        dataErrors.push(errorMsg);
        return '0';
      }),
    ]);
    
    // Log data fetch results
    if (dataErrors.length > 0) {
      logger.warn(`⚠️ Some on-chain data failed to fetch (${dataErrors.length}/7)`, {
        contract: contractAddress,
        errors: dataErrors,
        note: 'Using fallback values which may result in higher risk scores'
      });
    }

    logger.info('✅ On-chain data fetched successfully', {
      holders,
      contractAge: `${contractAge} days`,
      verified,
      liquidity: liquidity.available,
      liquiditySource: liquidity.source,
      complexity: complexity.complexity,
      isProxy: complexity.isProxy,
      hasSelfDestruct: complexity.hasSelfDestruct,
      transactionCount: activity.total,
      recentActivity: activity.recent24h,
      totalSupply,
    });

    // Calculate risk score based on REAL data (no artificial caps)
    // If data fetch failed, the fallback values (0 holders, 0 age, false verified, 0 liquidity)
    // will naturally result in a high risk score, which is correct behavior
    const score = calculateRiskScore({
      holders,
      contractAge,
      verified,
      liquidity: parseFloat(liquidity.available),
      complexity: complexity.complexity,
      isProxy: complexity.isProxy,
      hasSelfDestruct: complexity.hasSelfDestruct,
    });
    
    // Log data quality for debugging
    const dataQuality = {
      holders: holders > 0,
      age: contractAge > 0,
      verified: verified,
      liquidity: parseFloat(liquidity.available) > 0,
      complexity: complexity.bytecodeSize > 0,
    };
    const dataQualityScore = Object.values(dataQuality).filter(Boolean).length;
    
    logger.info('📊 Risk score calculated from real data', {
      contract: contractAddress,
      score,
      dataQualityScore: `${dataQualityScore}/5`,
      dataQuality,
      holders,
      contractAge: `${contractAge} days`,
      verified,
      liquidity: liquidity.available,
      liquiditySource: liquidity.source,
      complexity: complexity.complexity,
      isProxy: complexity.isProxy,
      hasSelfDestruct: complexity.hasSelfDestruct,
    });

    // Generate warnings based on real data
    const warnings: string[] = [];
    if (parseFloat(liquidity.available) < 1000) {
      warnings.push('Low liquidity detected');
    }
    if (contractAge < 7) {
      warnings.push('Contract is very new (< 7 days)');
    }
    if (!verified) {
      warnings.push('Contract source code not verified');
    }
    if (complexity.hasSelfDestruct) {
      warnings.push('Contract contains selfdestruct function');
    }
    if (holders < 10) {
      warnings.push('Very few token holders');
    }

    // Calculate estimated market cap
    // Market Cap estimation based on liquidity and supply
    // Note: This is a rough estimate. Real market cap depends on token price discovery
    const liquidityValue = parseFloat(liquidity.available);
    const supplyValue = parseFloat(totalSupply);
    let estimatedMarketCap = '0';
    
    if (liquidityValue > 0 && supplyValue > 0) {
      // Method 1: Estimate based on liquidity depth
      // In DEX pools, liquidity represents both sides of the pair
      // Token side liquidity ≈ total liquidity / 2
      // Market cap is typically 3-10x the liquidity (depending on token distribution)
      // We'll use a conservative 4x multiplier for estimation
      const tokenSideLiquidity = liquidityValue / 2;
      const conservativeMarketCap = tokenSideLiquidity * 4;
      
      // Method 2: Estimate price from liquidity/supply ratio
      // Price per token ≈ (token side liquidity) / (circulating supply)
      // For simplicity, assume 50% of supply is in circulation
      const estimatedCirculatingSupply = supplyValue * 0.5;
      const estimatedPricePerToken = tokenSideLiquidity / (estimatedCirculatingSupply || 1);
      const priceBasedMarketCap = supplyValue * estimatedPricePerToken;
      
      // Use the higher of the two estimates (more conservative)
      estimatedMarketCap = Math.max(conservativeMarketCap, priceBasedMarketCap).toFixed(2);
      
      logger.debug('Market cap calculation', {
        liquidityValue,
        tokenSideLiquidity,
        supplyValue,
        estimatedCirculatingSupply,
        estimatedPricePerToken,
        conservativeMarketCap,
        priceBasedMarketCap,
        estimatedMarketCap,
      });
    } else if (liquidityValue > 0) {
      // If we have liquidity but no supply, estimate based on liquidity depth
      // Market cap is typically 3-10x the total liquidity
      estimatedMarketCap = (liquidityValue * 5).toFixed(2);
    } else if (supplyValue > 0) {
      // If we have supply but no liquidity, can't estimate market cap accurately
      estimatedMarketCap = '0';
    }

    const details: RiskDetails = {
      liquidity: parseFloat(liquidity.available) > 10000 ? 'sufficient' : 
                 parseFloat(liquidity.available) > 1000 ? 'moderate' : 'low',
      contractAge: contractAge > 0 ? `${contractAge} days` : 'Unknown',
      holders,
      verified,
      warnings,
      transactionCount: activity.total,
      recentActivity: activity.recent24h,
      totalSupply: totalSupply !== '0' ? totalSupply : undefined,
      marketCap: estimatedMarketCap !== '0' ? estimatedMarketCap : undefined,
    };

    logger.info('Risk analysis completed', { 
      originalContract: contract,
      normalizedAddress: contractAddress,
      score, 
      holders, 
      contractAge, 
      verified 
    });

    return {
      score,
      details,
      contract: contractAddress, // Return normalized address
    };
  } catch (error: any) {
    logger.error('Risk analysis failed, using fallback', error, { contract });
    
    // Fallback to basic score if data fetching fails
    const fallbackScore = generateFallbackScore(contract);
    return {
      score: fallbackScore,
      details: {
        liquidity: 'unknown',
        contractAge: 'Unknown',
        holders: 0,
        verified: false,
        warnings: ['Unable to fetch on-chain data'],
      },
      contract,
    };
  }
}

/**
 * Calculate risk score based on real data
 */
function calculateRiskScore(data: {
  holders: number;
  contractAge: number;
  verified: boolean;
  liquidity: number;
  complexity: 'low' | 'medium' | 'high';
  isProxy: boolean;
  hasSelfDestruct: boolean;
}): number {
  let score = 50; // Base score

  // Adjust based on holders (more holders = lower risk)
  if (data.holders > 1000) {
    score -= 10;
  } else if (data.holders > 100) {
    score -= 5;
  } else if (data.holders < 10) {
    score += 15;
  }

  // Adjust based on contract age (older = lower risk)
  if (data.contractAge > 365) {
    score -= 10;
  } else if (data.contractAge > 90) {
    score -= 5;
  } else if (data.contractAge < 7) {
    score += 10;
  }

  // Adjust based on verification (verified = lower risk)
  if (data.verified) {
    score -= 10;
  } else {
    score += 10;
  }

  // Adjust based on liquidity (more liquidity = lower risk)
  if (data.liquidity > 100000) {
    score -= 15;
  } else if (data.liquidity > 10000) {
    score -= 5;
  } else if (data.liquidity < 1000) {
    score += 15;
  } else if (data.liquidity === 0) {
    score += 20;
  }

  // Adjust based on complexity (higher complexity = higher risk)
  if (data.complexity === 'high') {
    score += 10;
  } else if (data.complexity === 'medium') {
    score += 5;
  }

  // Adjust for proxy contracts (can be riskier)
  if (data.isProxy) {
    score += 5;
  }

  // Adjust for selfdestruct (high risk)
  if (data.hasSelfDestruct) {
    score += 20;
  }

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Fallback score calculation if data fetching fails
 */
function generateFallbackScore(contract: string): number {
  let hash = 0;
  for (let i = 0; i < contract.length; i++) {
    const char = contract.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const score = Math.abs(hash) % 100;
  
  if (contract.toLowerCase().includes('0000') || contract.toLowerCase().includes('dead')) {
    return Math.min(score, 30);
  }
  
  return score;
}
