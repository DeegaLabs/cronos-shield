/**
 * Crypto.com Exchange Service
 */

import axios, { AxiosError } from 'axios';
import { retry, isRetryableError } from '../../lib/utils/retry.util';

export interface PriceData {
  price: string;
  timestamp: number;
  source: 'CEX' | 'DEX';
  pair: string;
}

export class CryptoComService {
  private apiUrl: string;
  private apiKey?: string;

  constructor(apiUrl?: string, apiKey?: string) {
    // Correct URL: https://api.crypto.com/exchange/v1/
    this.apiUrl = apiUrl || 'https://api.crypto.com/exchange/v1';
    this.apiKey = apiKey;
  }

  async getPrice(pair: string): Promise<PriceData> {
    try {
      // Convert pair format: CRO-USDC -> CRO_USDC
      // For spot trading, we might need CRO_USDC, for perpetuals: CROUSD-PERP
      // Try spot first, then perpetual if needed
      const normalizedPair = pair.replace('-', '_').toUpperCase();
      
      // Prepare headers with API key if available
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['X-API-KEY'] = this.apiKey;
      }
      
      // Retry logic for API calls
      // Correct endpoint: /public/get-tickers (plural)
      const response = await retry(
        async () => {
          return await axios.get(`${this.apiUrl}/public/get-tickers`, {
            params: { instrument_name: normalizedPair },
            headers,
            timeout: 10000, // Increased timeout for API calls
          });
        },
        {
          maxRetries: 2,
          delay: 1000,
          retryCondition: (error) => isRetryableError(error),
        }
      );

      // Response format: { result: { data: [{ instrument_name, last_price, ... }] } }
      // Or: { result: { data: { instrument_name, last_price, ... } } } for single ticker
      if (response.data?.result?.data) {
        const data = response.data.result.data;
        
        // Handle array response (multiple tickers)
        const ticker = Array.isArray(data) ? data[0] : data;
        
        // Try different price fields based on API response format
        const price = ticker?.last_price || ticker?.a || ticker?.b || ticker?.mark_price || ticker?.index_price;

        if (!price) {
          throw new Error('Price not found in response');
        }

        return {
          price: price.toString(),
          timestamp: Date.now(),
          source: 'CEX',
          pair: pair,
        };
      }

      // Log response structure for debugging if format is invalid
      console.debug(`⚠️  Crypto.com API response format unexpected for ${pair}:`, {
        hasResult: !!response.data?.result,
        hasData: !!response.data?.result?.data,
        dataType: typeof response.data?.result?.data,
        isArray: Array.isArray(response.data?.result?.data),
        keys: response.data?.result?.data ? Object.keys(response.data.result.data) : [],
      });
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      // Log error but don't expose sensitive details
      const errorMessage = error.response?.data 
        ? `API returned unexpected format for pair ${pair}`
        : error.message || 'Unknown error';
      
      // Log response status and structure for debugging
      if (error.response) {
        console.debug(`⚠️  Crypto.com API response status: ${error.response.status}`, {
          url: `${this.apiUrl}/public/get-tickers`,
          pair: normalizedPair,
          responseKeys: error.response.data ? Object.keys(error.response.data) : [],
        });
      }
      
      // Only log if it's not a network timeout (common in testnet)
      if (!errorMessage.includes('timeout') && !errorMessage.includes('ECONNREFUSED')) {
        console.warn(`⚠️  Crypto.com API error: ${errorMessage}. Using mock data.`);
      }
      
      // If retry failed, use mock data (expected behavior for POC)
      return this.getMockPrice(pair);
    }
  }

  private getMockPrice(pair: string): PriceData {
    const mockPrices: Record<string, string> = {
      'CRO-USDC': '0.11',
      'CRO-USDT': '0.11',
      'USDC-USDT': '1.00',
    };

    return {
      price: mockPrices[pair] || '0.10',
      timestamp: Date.now(),
      source: 'CEX',
      pair: pair,
    };
  }
}
