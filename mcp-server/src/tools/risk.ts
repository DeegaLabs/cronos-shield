/**
 * Risk Analysis Tool
 */

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://cronos-shield-backend-production.up.railway.app';

export async function analyzeRisk(contract: string): Promise<any> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/risk/analyze`, {
      params: { contract },
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
      error: error.message || 'Failed to analyze risk',
    };
  }
}
