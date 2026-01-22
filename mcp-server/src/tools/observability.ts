/**
 * Observability Tools
 */

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://cronos-shield-backend-production.up.railway.app';

export async function getMetrics(): Promise<any> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/observability/metrics`, {
      timeout: 30000,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get metrics',
    };
  }
}

export async function getLogs(filters?: { type?: string; limit?: number }): Promise<any> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/observability/logs`, {
      params: filters,
      timeout: 30000,
    });

    return {
      success: true,
      data: response.data.logs || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get logs',
    };
  }
}

export async function getBlockedTransactions(): Promise<any> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/observability/blocked-transactions`, {
      timeout: 30000,
    });

    return {
      success: true,
      data: response.data.transactions || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get blocked transactions',
    };
  }
}
