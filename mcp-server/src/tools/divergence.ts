/**
 * Divergence Analysis Tool
 */

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://cronos-shield-backend-production.up.railway.app';

export async function analyzeDivergence(pair: string): Promise<any> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/divergence/analyze`, {
      params: { token: pair },
      timeout: 30000,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    if (error.response?.status === 402) {
      return {
        success: false,
        error: 'Payment required (x402)',
        challenge: error.response.data,
        message: 'This tool requires x402 payment. Please handle the payment challenge.',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to analyze divergence',
    };
  }
}

export async function getAvailablePairs(): Promise<any> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/divergence/pairs`, {
      timeout: 30000,
    });

    return {
      success: true,
      data: response.data.pairs || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get available pairs',
    };
  }
}
