/**
 * Observability Client
 */

import axios, { AxiosError } from 'axios';
import { Metrics, Log, BlockedTransaction, NetworkError } from '../types';

export interface LogFilters {
  type?: string;
  limit?: number;
  offset?: number;
}

export class ObservabilityClient {
  constructor(private baseUrl: string) {}

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<Metrics> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/observability/metrics`);
      return response.data;
    } catch (error: any) {
      if (error instanceof AxiosError && !error.response) {
        throw new NetworkError('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get logs
   */
  async getLogs(filters?: LogFilters): Promise<Log[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/observability/logs`, {
        params: filters,
      });

      return response.data.logs || [];
    } catch (error: any) {
      if (error instanceof AxiosError && !error.response) {
        throw new NetworkError('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get blocked transactions
   */
  async getBlockedTransactions(): Promise<BlockedTransaction[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/observability/blocked-transactions`);
      return response.data.transactions || [];
    } catch (error: any) {
      if (error instanceof AxiosError && !error.response) {
        throw new NetworkError('Network error. Please check your connection.');
      }
      throw error;
    }
  }
}
