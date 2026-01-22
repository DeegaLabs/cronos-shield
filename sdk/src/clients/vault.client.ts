/**
 * Shielded Vault Client
 */

import axios, { AxiosError } from 'axios';
import { ethers } from 'ethers';
import { VaultBalance, VaultTransaction } from '../types';
import { PaymentRequiredError, NetworkError } from '../utils/errors';
import { validateAddress } from '../utils/validation';

export class VaultClient {
  constructor(private baseUrl: string) {}

  /**
   * Get vault balance for an address
   */
  async getBalance(address: string): Promise<VaultBalance> {
    validateAddress(address);

    try {
      const response = await axios.get(`${this.baseUrl}/api/vault/balance`, {
        params: { address },
      });

      return response.data;
    } catch (error: any) {
      if (error instanceof AxiosError && !error.response) {
        throw new NetworkError('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get vault statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/vault/stats`);
      return response.data;
    } catch (error: any) {
      if (error instanceof AxiosError && !error.response) {
        throw new NetworkError('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(address: string, limit: number = 10): Promise<VaultTransaction[]> {
    validateAddress(address);

    try {
      const response = await axios.get(`${this.baseUrl}/api/vault/transactions`, {
        params: { address, limit },
      });

      return response.data.transactions || [];
    } catch (error: any) {
      if (error instanceof AxiosError && !error.response) {
        throw new NetworkError('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Deposit to vault
   * Note: This requires a wallet client to sign transactions
   */
  async deposit(
    amount: bigint,
    options?: { walletClient?: any; paymentId?: string }
  ): Promise<{ hash: string }> {
    if (!options?.walletClient) {
      throw new Error('Wallet client is required for deposit');
    }

    try {
      const headers: Record<string, string> = {};
      if (options.paymentId) {
        headers['x-payment-id'] = options.paymentId;
      }

      const response = await axios.post(
        `${this.baseUrl}/api/vault/deposit`,
        { amount: amount.toString() },
        { headers }
      );

      return { hash: response.data.hash };
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
   * Withdraw from vault
   * Note: This requires a wallet client to sign transactions
   */
  async withdraw(
    amount: bigint,
    options?: { walletClient?: any; paymentId?: string }
  ): Promise<{ hash: string }> {
    if (!options?.walletClient) {
      throw new Error('Wallet client is required for withdraw');
    }

    try {
      const headers: Record<string, string> = {};
      if (options.paymentId) {
        headers['x-payment-id'] = options.paymentId;
      }

      const response = await axios.post(
        `${this.baseUrl}/api/vault/withdraw`,
        { amount: amount.toString() },
        { headers }
      );

      return { hash: response.data.hash };
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
   * Execute protected transaction
   * Note: This requires a wallet client to sign transactions
   */
  async executeProtectedTransaction(
    params: {
      target: string;
      value?: bigint;
      callData?: string;
    },
    options?: { walletClient?: any; paymentId?: string }
  ): Promise<{ hash: string }> {
    if (!options?.walletClient) {
      throw new Error('Wallet client is required for protected transaction');
    }

    validateAddress(params.target);

    try {
      const headers: Record<string, string> = {};
      if (options.paymentId) {
        headers['x-payment-id'] = options.paymentId;
      }

      const response = await axios.post(
        `${this.baseUrl}/api/vault/execute`,
        {
          target: params.target,
          value: params.value?.toString(),
          callData: params.callData,
        },
        { headers }
      );

      return { hash: response.data.hash };
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
}
