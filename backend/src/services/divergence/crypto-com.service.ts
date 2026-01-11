/**
 * Crypto.com Exchange Service
 */

import axios from 'axios';

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
    this.apiUrl = apiUrl || 'https://api.crypto.com/v2';
    this.apiKey = apiKey;
  }

  async getPrice(pair: string): Promise<PriceData> {
    try {
      const normalizedPair = pair.replace('-', '_').toUpperCase();
      const response = await axios.get(`${this.apiUrl}/public/get-ticker`, {
        params: { instrument_name: normalizedPair },
        timeout: 5000,
      });

      if (response.data?.result?.data) {
        const ticker = response.data.result.data;
        const price = ticker.a || ticker.last_price || ticker.b;

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

      throw new Error('Invalid response format');
    } catch (error: any) {
      console.warn(`⚠️  Crypto.com API error: ${error.message}. Using mock data.`);
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
