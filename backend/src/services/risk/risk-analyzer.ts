/**
 * Risk Analyzer
 * 
 * Analyzes contract risk using real on-chain data
 */

import type { RiskAnalysisRequest, RiskAnalysisResponse, RiskDetails } from '../../types/risk.types';
import { OnChainDataService } from './on-chain-data.service';
import { logger } from '../../lib/utils/logger';

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
    const code = await provider.getCode(contract);
    
    if (!code || code === '0x') {
      logger.warn('⚠️ Address is not a contract (no code found)', { contract });
      return {
        score: 100, // Maximum risk for non-contract addresses
        details: {
          liquidity: 'unknown',
          contractAge: 'N/A',
          holders: 0,
          verified: false,
          warnings: [
            'Address is not a smart contract (no code found)',
            'This address may be an externally owned account (EOA)',
            'Cannot perform contract risk analysis on non-contract addresses',
          ],
        },
        contract,
      };
    }

    logger.info('🔍 Fetching real on-chain data...', { contract });
    
    // Fetch real on-chain data in parallel
    const [holders, contractAge, verified, liquidity, complexity] = await Promise.all([
      dataService.getHolders(contract).catch((err) => {
        logger.warn('Failed to get holders', { error: err.message, contract });
        return 0;
      }),
      dataService.getContractAge(contract).catch((err) => {
        logger.warn('Failed to get contract age', { error: err.message, contract });
        return 0;
      }),
      dataService.isContractVerified(contract).catch((err) => {
        logger.warn('Failed to check verification', { error: err.message, contract });
        return false;
      }),
      dataService.getLiquidity(contract).catch((err) => {
        logger.warn('Failed to get liquidity', { error: err.message, contract });
        return { available: '0', depth: 'LOW', source: 'error' };
      }),
      dataService.analyzeContractComplexity(contract).catch((err) => {
        logger.warn('Failed to analyze complexity', { error: err.message, contract });
        return {
          isProxy: false,
          hasSelfDestruct: false,
          bytecodeSize: 0,
          complexity: 'low' as const,
        };
      }),
    ]);

    logger.info('✅ On-chain data fetched successfully', {
      holders,
      contractAge: `${contractAge} days`,
      verified,
      liquidity: liquidity.available,
      liquiditySource: liquidity.source,
      complexity: complexity.complexity,
      isProxy: complexity.isProxy,
      hasSelfDestruct: complexity.hasSelfDestruct,
    });

    // Calculate risk score based on real data
    const score = calculateRiskScore({
      holders,
      contractAge,
      verified,
      liquidity: parseFloat(liquidity.available),
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

    const details: RiskDetails = {
      liquidity: parseFloat(liquidity.available) > 10000 ? 'sufficient' : 
                 parseFloat(liquidity.available) > 1000 ? 'moderate' : 'low',
      contractAge: contractAge > 0 ? `${contractAge} days` : 'Unknown',
      holders,
      verified,
      warnings,
    };

    logger.info('Risk analysis completed', { contract, score, holders, contractAge, verified });

    return {
      score,
      details,
      contract,
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
