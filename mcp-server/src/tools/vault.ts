/**
 * Vault Tools
 */

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://cronos-shield-backend-production.up.railway.app';

export async function getVaultBalance(address: string): Promise<any> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/vault/balance`, {
      params: { address },
      timeout: 30000,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get vault balance',
    };
  }
}

export async function getVaultStats(): Promise<any> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/vault/stats`, {
      timeout: 30000,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get vault stats',
    };
  }
}
