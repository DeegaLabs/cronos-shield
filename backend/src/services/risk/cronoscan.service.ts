/**
 * Cronoscan API Service
 * 
 * Fetches on-chain data from Cronoscan API
 */

import axios from 'axios';
import { logger } from '../../lib/utils/logger';

interface CronoscanResponse<T> {
  status: string;
  message: string;
  result: T;
}

interface TokenHolderInfo {
  address: string;
  value: string;
}

interface ContractInfo {
  contractAddress: string;
  contractCreator: string;
  contractCreationCode: string;
  contractName: string;
  compilerVersion: string;
  optimizationUsed: string;
  runs: string;
  constructorArguments: string;
  evmVersion: string;
  library: string;
  licenseType: string;
  proxy: string;
  implementation: string;
  swarmSource: string;
}

interface TransactionInfo {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

export class CronoscanService {
  private apiKey: string | undefined;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.CRONOSCAN_API_KEY;
    // Use testnet API for testnet, mainnet API for mainnet
    const network = process.env.NETWORK || 'cronos-testnet';
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (network.includes('testnet')) {
      this.baseUrl = 'https://api-testnet.cronoscan.com/api';
    } else {
      this.baseUrl = 'https://api.cronoscan.com/api';
    }
    logger.info('CronoscanService initialized', { 
      baseUrl: this.baseUrl, 
      hasApiKey: !!this.apiKey,
      network 
    });
  }

  private getCacheKey(method: string, params: Record<string, string>): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async request<T>(module: string, action: string, params: Record<string, string> = {}): Promise<T> {
    const cacheKey = this.getCacheKey(`${module}.${action}`, params);
    const cached = this.getCached<T>(cacheKey);
    if (cached) {
      logger.debug('Cronoscan cache hit', { module, action, params });
      return cached;
    }

    const hasApiKey = !!this.apiKey;
    logger.info(`🌐 Calling Cronoscan API: ${module}.${action}`, { 
      hasApiKey, 
      params,
      baseUrl: this.baseUrl 
    });

    const queryParams = new URLSearchParams({
      module,
      action,
      ...params,
      ...(this.apiKey && { apikey: this.apiKey }),
    });

    try {
      const url = `${this.baseUrl}?${queryParams.toString()}`;
      logger.debug('Cronoscan request URL', { url: url.replace(this.apiKey || '', '***') });
      
      const response = await axios.get<CronoscanResponse<T>>(url);
      
      if (response.data.status === '1' && response.data.message === 'OK') {
        logger.info(`✅ Cronoscan API success: ${module}.${action}`, { 
          resultType: Array.isArray(response.data.result) ? 'array' : typeof response.data.result,
          resultLength: Array.isArray(response.data.result) ? response.data.result.length : 'N/A'
        });
        this.setCache(cacheKey, response.data.result);
        return response.data.result;
      } else {
        logger.error('Cronoscan API returned error', { 
          status: response.data.status, 
          message: response.data.message,
          module,
          action 
        });
        throw new Error(`Cronoscan API error: ${response.data.message}`);
      }
    } catch (error: any) {
      logger.error('❌ Cronoscan API request failed', { 
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        module, 
        action, 
        params 
      });
      throw error;
    }
  }

  /**
   * Get number of token holders
   * Note: Cronoscan API doesn't provide total count directly
   * We use tokeninfo endpoint which provides holder count
   */
  async getTokenHolders(contractAddress: string): Promise<number> {
    try {
      // Try tokeninfo first (more reliable for ERC20 tokens)
      try {
        const tokenInfo = await this.request<any>(
          'token',
          'tokeninfo',
          {
            contractaddress: contractAddress,
          }
        );
        
        if (tokenInfo && typeof tokenInfo === 'object' && 'holderCount' in tokenInfo) {
          const count = parseInt(tokenInfo.holderCount || '0', 10);
          if (count > 0) {
            logger.info(`✅ Token holders from tokeninfo: ${count}`, { contractAddress });
            return count;
          }
        }
      } catch (tokenInfoError: any) {
        logger.debug('tokeninfo endpoint failed, trying tokenholderlist', { error: tokenInfoError.message });
      }

      // Fallback: try to get from tokenholderlist (may be limited)
      const result = await this.request<TokenHolderInfo[]>(
        'token',
        'tokenholderlist',
        {
          contractaddress: contractAddress,
          page: '1',
          offset: '100', // Get first 100 to estimate
        }
      );

      // If we got results, it means there are at least that many holders
      // For a better estimate, we could check if there are more pages
      const count = Array.isArray(result) ? result.length : 0;
      logger.info(`✅ Token holders from tokenholderlist: ${count} (may be partial)`, { contractAddress });
      return count;
    } catch (error: any) {
      logger.warn('Failed to get token holders from Cronoscan', { error: error.message, contractAddress });
      return 0;
    }
  }

  /**
   * Get contract creation timestamp (to calculate age)
   */
  async getContractCreationTimestamp(contractAddress: string): Promise<number | null> {
    try {
      // Get contract creation transaction
      const result = await this.request<TransactionInfo[]>(
        'contract',
        'getcontractcreation',
        {
          contractaddresses: contractAddress,
        }
      );

      if (Array.isArray(result) && result.length > 0) {
        const creationTx = result[0];
        return parseInt(creationTx.timeStamp) * 1000; // Convert to milliseconds
      }

      return null;
    } catch (error: any) {
      logger.warn('Failed to get contract creation timestamp', { error: error.message, contractAddress });
      return null;
    }
  }

  /**
   * Get contract age in days
   */
  async getContractAge(contractAddress: string): Promise<number> {
    const timestamp = await this.getContractCreationTimestamp(contractAddress);
    if (!timestamp) {
      return 0;
    }

    const ageMs = Date.now() - timestamp;
    return Math.floor(ageMs / (1000 * 60 * 60 * 24)); // Convert to days
  }

  /**
   * Check if contract is verified on Cronoscan
   */
  async isContractVerified(contractAddress: string): Promise<boolean> {
    try {
      const result = await this.request<ContractInfo>(
        'contract',
        'getsourcecode',
        {
          address: contractAddress,
        }
      );

      // If result is an array, check first element
      if (Array.isArray(result)) {
        return result.length > 0 && result[0].contractName !== '';
      }

      // If result is an object, check if it has contractName
      if (typeof result === 'object' && result !== null) {
        return 'contractName' in result && (result as any).contractName !== '';
      }

      return false;
    } catch (error: any) {
      logger.warn('Failed to check contract verification', { error: error.message, contractAddress });
      return false;
    }
  }

  /**
   * Get contract transaction count (activity indicator)
   */
  async getTransactionCount(contractAddress: string): Promise<number> {
    try {
      const result = await this.request<string>(
        'proxy',
        'eth_getTransactionCount',
        {
          address: contractAddress,
          tag: 'latest',
        }
      );

      // Convert hex to number
      return parseInt(result, 16);
    } catch (error: any) {
      logger.warn('Failed to get transaction count', { error: error.message, contractAddress });
      return 0;
    }
  }

  /**
   * Get contract balance (native CRO)
   */
  async getContractBalance(contractAddress: string): Promise<string> {
    try {
      const result = await this.request<string>(
        'account',
        'balance',
        {
          address: contractAddress,
          tag: 'latest',
        }
      );

      return result;
    } catch (error: any) {
      logger.warn('Failed to get contract balance', { error: error.message, contractAddress });
      return '0';
    }
  }
}
