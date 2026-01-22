/**
 * Risk Oracle Client
 */

import axios, { AxiosError } from 'axios';
import { RiskAnalysis } from '../types';
import { PaymentRequiredError, NetworkError } from '../utils/errors';
import { validateAddress } from '../utils/validation';

export class RiskOracleClient {
  constructor(private baseUrl: string) {}

  /**
   * Analyze contract risk
   */
  async analyze(contract: string, options?: { paymentId?: string }): Promise<RiskAnalysis> {
    validateAddress(contract);

    try {
      const headers: Record<string, string> = {};
      if (options?.paymentId) {
        headers['x-payment-id'] = options.paymentId;
      }

      const response = await axios.get(`${this.baseUrl}/api/risk/analyze`, {
        params: { contract },
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
   * Verify proof on-chain
   */
  async verifyProof(proof: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/risk/verify`, {
        proof,
      });

      return response.data.valid === true;
    } catch (error: any) {
      if (error instanceof AxiosError && !error.response) {
        throw new NetworkError('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get recent analyses
   */
  async getRecentAnalyses(limit: number = 10): Promise<RiskAnalysis[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/risk/recent`, {
        params: { limit },
      });

      return response.data.analyses || [];
    } catch (error: any) {
      if (error instanceof AxiosError && !error.response) {
        throw new NetworkError('Network error. Please check your connection.');
      }
      throw error;
    }
  }
}
