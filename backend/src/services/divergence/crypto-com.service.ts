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

      // Log full response structure for debugging
      console.debug(`🔍 Crypto.com API response structure:`, {
        hasResult: !!response.data?.result,
        hasData: !!response.data?.result?.data,
        dataType: typeof response.data?.result?.data,
        isArray: Array.isArray(response.data?.result?.data),
        dataLength: Array.isArray(response.data?.result?.data) ? response.data.result.data.length : 'N/A',
        firstItemKeys: Array.isArray(response.data?.result?.data) && response.data.result.data.length > 0
          ? Object.keys(response.data.result.data[0])
          : [],
        firstItem: Array.isArray(response.data?.result?.data) && response.data.result.data.length > 0
          ? response.data.result.data[0]
          : null,
      });
      
      // Response format: { result: { data: [{ instrument_name, last_price, ... }] } }
      // Or: { result: { data: { [instrument_name]: { last_price, ... } } } } (object format)
      if (response.data?.result?.data) {
        const data = response.data.result.data;
        
        // Handle array response (multiple tickers)
        if (Array.isArray(data)) {
          if (data.length === 0) {
            console.warn(`⚠️  Crypto.com API returned empty tickers array`);
            throw new Error('Empty tickers response');
          }
          
          // Convert pair to different formats to match instrument_name
          // Based on API response, instrument_name is in property 'i' (e.g., 'ACH_USD')
          const [base, quote] = pair.split('-');
          const searchFormats = [
            `${base}_${quote}`.toUpperCase(), // CRO_USDC
            `${base}_USD`.toUpperCase(), // CRO_USD (if quote is USDC/USDT, try USD)
            `${base}-${quote}`.toUpperCase(), // CRO-USDC
            `${base}${quote}`.toUpperCase(), // CROUSDC
            `${base}USD`.toUpperCase(), // CROUSD
          ];
          
          // Find matching ticker - API uses 'i' for instrument_name
          const ticker = data.find((t: any) => {
            const instrumentName = (t.i || t.instrument_name || t.symbol || t.name || '').toString().toUpperCase();
            return searchFormats.some(format => instrumentName === format);
          });
          
          if (ticker) {
            // API uses 'l' for last_price, 'a' for ask, 'b' for bid
            const price = ticker.l || ticker.last_price || ticker.a || ticker.b || ticker.mark_price || ticker.index_price || ticker.close;
            
            if (price) {
              return {
                price: price.toString(),
                timestamp: ticker.t || Date.now(), // API provides timestamp in 't'
                source: 'CEX',
                pair: pair,
              };
            }
          }
          
          // Log available instruments for debugging
          const instrumentNames = data.slice(0, 30).map((t: any) => 
            (t.i || t.instrument_name || t.symbol || t.name || 'unknown').toString()
          ).filter(Boolean);
          
          console.warn(`⚠️  Pair ${pair} not found. Available instruments (first 30):`, 
            instrumentNames.join(', ') || 'No instrument names found'
          );
        } else if (typeof data === 'object') {
          // Object format: { "CRO_USDC": { last_price: ... }, ... }
          const [base, quote] = pair.split('-');
          const searchFormats = [
            `${base}_${quote}`.toUpperCase(),
            `${base}-${quote}`.toUpperCase(),
            `${base}${quote}`.toUpperCase(),
            `${base}USD`.toUpperCase(),
          ];
          
          // Find matching key
          const matchingKey = Object.keys(data).find(key => 
            searchFormats.some(format => key.toUpperCase() === format)
          );
          
          if (matchingKey) {
            const ticker = data[matchingKey];
            const price = ticker?.last_price || ticker?.l || ticker?.a || ticker?.b || ticker?.mark_price || ticker?.index_price || ticker?.close;
            
            if (price) {
              return {
                price: price.toString(),
                timestamp: Date.now(),
                source: 'CEX',
                pair: pair,
              };
            }
          }
          
          console.warn(`⚠️  Pair ${pair} not found in object format. Available keys (first 20):`, 
            Object.keys(data).slice(0, 20).join(', ')
          );
        } else {
          // Single ticker response
          const ticker = data;
          const price = ticker?.last_price || ticker?.l || ticker?.a || ticker?.b || ticker?.mark_price || ticker?.index_price || ticker?.close;
          
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
