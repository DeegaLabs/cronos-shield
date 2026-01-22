/**
 * CEX-DEX Divergence Client
 */

import axios, { AxiosError } from 'axios';
import { DivergenceResponse, DivergenceAlert } from '../types';
import { PaymentRequiredError, NetworkError } from '../utils/errors';
import { validateTokenPair } from '../utils/validation';

export class DivergenceClient {
  constructor(private baseUrl: string) {}

  /**
   * Analyze price divergence between CEX and DEX
   */
  async analyze(
    pair: string,
    options?: { amount?: string; paymentId?: string }
  ): Promise<DivergenceResponse> {
    validateTokenPair(pair);

    try {
      const headers: Record<string, string> = {};
      if (options?.paymentId) {
        headers['x-payment-id'] = options.paymentId;
      }

      const response = await axios.get(`${this.baseUrl}/api/divergence/analyze`, {
        params: {
          token: pair,
          ...(options?.amount && { amount: options.amount }),
        },
        headers,
      });

      return response.data;
    } catch (error: any) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 402) {
          throw new PaymentRequiredError(
            'Payment required',
            error.response.data
          );
        }
        if (!error.response) {
          throw new NetworkError('Network error. Please check your connection.');
        }
      }
      throw error;
    }
  }

  /**
   * Get available trading pairs
   */
  async getAvailablePairs(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/divergence/pairs`);
      return response.data.pairs || [];
    } catch (error: any) {
      if (error instanceof AxiosError && !error.response) {
        throw new NetworkError('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get divergence history
   */
  async getHistory(pair: string, days: number = 7): Promise<number[]> {
    validateTokenPair(pair);

    try {
      const response = await axios.get(`${this.baseUrl}/api/divergence/history`, {
        params: { token: pair, days },
      });

      return response.data.data || [];
    } catch (error: any) {
      if (error instanceof AxiosError && !error.response) {
        throw new NetworkError('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get recent divergence alerts
   */
  async getAlerts(limit: number = 10): Promise<DivergenceAlert[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/divergence/alerts`, {
        params: { limit },
      });

      return response.data.alerts || [];
    } catch (error: any) {
      if (error instanceof AxiosError && !error.response) {
        throw new NetworkError('Network error. Please check your connection.');
      }
      throw error;
    }
  }
}
