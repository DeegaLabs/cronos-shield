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
      // Prepare headers with API key if available
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['X-API-KEY'] = this.apiKey;
      }
      
      // First, try to get all tickers and filter by pair
      // The API might not accept instrument_name parameter, so we fetch all and filter
      const response = await retry(
        async () => {
          // Try without instrument_name first (get all tickers)
          return await axios.get(`${this.apiUrl}/public/get-tickers`, {
            headers,
            timeout: 10000,
          });
        },
        {
          maxRetries: 2,
          delay: 1000,
          retryCondition: (error) => isRetryableError(error),
        }
      );

      // Response format: { result: { data: [{ instrument_name, last_price, ... }] } }
      if (response.data?.result?.data) {
        const data = response.data.result.data;
        
        // Handle array response (multiple tickers)
        if (Array.isArray(data)) {
          // Convert pair to different formats to match instrument_name
          const [base, quote] = pair.split('-');
          const searchFormats = [
            `${base}_${quote}`.toUpperCase(), // CRO_USDC
            `${base}-${quote}`.toUpperCase(), // CRO-USDC
            `${base}${quote}`.toUpperCase(), // CROUSDC
            `${base}USD`.toUpperCase(), // CROUSD (if quote is USDC/USDT)
          ];
          
          // Find matching ticker
          const ticker = data.find((t: any) => {
            const instrumentName = t.instrument_name?.toUpperCase();
            return searchFormats.some(format => instrumentName === format);
          });
          
          if (ticker) {
            const price = ticker.last_price || ticker.a || ticker.b || ticker.mark_price || ticker.index_price;
            
            if (price) {
              return {
                price: price.toString(),
                timestamp: Date.now(),
                source: 'CEX',
                pair: pair,
              };
            }
          }
          
          // Log available instruments for debugging
          console.debug(`⚠️  Pair ${pair} not found. Available instruments (first 10):`, 
            data.slice(0, 10).map((t: any) => t.instrument_name).join(', ')
          );
        } else {
          // Single ticker response
          const ticker = data;
          const price = ticker?.last_price || ticker?.a || ticker?.b || ticker?.mark_price || ticker?.index_price;
          
          if (price) {
            return {
              price: price.toString(),
              timestamp: Date.now(),
              source: 'CEX',
              pair: pair,
            };
          }
        }
      }
      
      throw new Error('Pair not found in tickers response');
    } catch (error: any) {
      // Log error but don't expose sensitive details
      const errorMessage = error.response?.data 
        ? `API returned unexpected format for pair ${pair}`
        : error.message || 'Unknown error';
      
      // Log response status and structure for debugging
      if (error.response) {
        const errorData = error.response.data;
        console.warn(`⚠️  Crypto.com API error (${error.response.status}):`, {
          url: `${this.apiUrl}/public/get-tickers`,
          pair: pair,
          code: errorData?.code,
          message: errorData?.message,
          fullResponse: errorData,
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
