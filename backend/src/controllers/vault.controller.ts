/**
 * Vault Controller
 * 
 * Handles HTTP requests for Shielded Vault operations
 */

import { Request, Response } from 'express';
import { VaultService } from '../services/vault/vault.service';
import { store } from '../lib/storage/in-memory.store';
import { validateAddress, validateAmount, validateHexString, validatePagination } from '../lib/utils/validation.util';
import type {
  DepositRequest,
  WithdrawRequest,
  ExecuteTransactionRequest,
} from '../types/vault.types';

export class VaultController {
  constructor(private vaultService: VaultService) {}

  /**
   * Get vault information
   * GET /api/vault/info
   */
  async getVaultInfo(_req: Request, res: Response): Promise<void> {
    try {
      const info = await this.vaultService.getVaultInfo();
      res.json(info);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to get vault info',
        message: error.message,
      });
    }
  }

  /**
   * Get user balance
   * GET /api/vault/balance?address=0x...
   */
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const address = req.query.address as string;
      validateAddress(address, 'address');

      const balance = await this.vaultService.getBalance(address);
      res.json(balance);
    } catch (error: any) {
      const statusCode = error.message?.includes('required') || error.message?.includes('valid') ? 400 : 500;
      res.status(statusCode).json({
        error: 'Failed to get balance',
        message: error.message,
      });
    }
  }

  /**
   * Deposit tokens into vault
   * POST /api/vault/deposit
   * Body: { amount: string }
   */
  async deposit(req: Request, res: Response): Promise<void> {
    try {
      const userAddress = req.body.userAddress || req.headers['x-user-address'] as string;
      validateAddress(userAddress, 'userAddress');

      const request: DepositRequest = req.body;
      validateAmount(request.amount, 'amount');

      const result = await this.vaultService.deposit(userAddress, request);
      res.json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('required') || error.message?.includes('valid') || error.message?.includes('positive') ? 400 : 500;
      res.status(statusCode).json({
        error: 'Deposit failed',
        message: error.message,
      });
    }
  }

  /**
   * Withdraw tokens from vault
   * POST /api/vault/withdraw
   * Body: { amount: string }
   */
  async withdraw(req: Request, res: Response): Promise<void> {
    try {
      const userAddress = req.body.userAddress || req.headers['x-user-address'] as string;
      validateAddress(userAddress, 'userAddress');

      const request: WithdrawRequest = req.body;
      validateAmount(request.amount, 'amount');

      const result = await this.vaultService.withdraw(userAddress, request);
      res.json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('required') || error.message?.includes('valid') || error.message?.includes('positive') ? 400 : 500;
      res.status(statusCode).json({
        error: 'Withdraw failed',
        message: error.message,
      });
    }
  }

  /**
   * Execute transaction with risk check
   * POST /api/vault/execute
   * Body: { target: string, callData: string, value: string, contractAddress?: string }
   */
  async executeTransaction(req: Request, res: Response): Promise<void> {
    try {
      const userAddress = req.body.userAddress || req.headers['x-user-address'] as string;
      validateAddress(userAddress, 'userAddress');

      const request: ExecuteTransactionRequest = req.body;
      validateAddress(request.target, 'target');
      
      if (request.callData) {
        validateHexString(request.callData, 'callData');
      }
      
      if (request.value) {
        validateAmount(request.value, 'value');
      }

      const result = await this.vaultService.executeTransaction(userAddress, request);
      res.json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('required') || error.message?.includes('valid') ? 400 : 500;
      res.status(statusCode).json({
        error: 'Transaction execution failed',
        message: error.message,
      });
    }
  }

  /**
   * Get blocked transactions for vault
   * GET /api/vault/blocked-transactions?limit=10
   */
  async getBlockedTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { limit: validatedLimit } = validatePagination(
        req.query.limit ? parseInt(req.query.limit as string) : undefined
      );
      
      const userAddress = req.query.userAddress as string | undefined;
      if (userAddress) {
        validateAddress(userAddress, 'userAddress');
      }
      
      // Get all blocked transactions
      let transactions = store.getBlockedTransactions(validatedLimit);
      
      // Filter by service (shielded-vault)
      transactions = transactions.filter(tx => tx.service === 'shielded-vault');
      
      // Filter by user if provided
      if (userAddress) {
        transactions = transactions.filter(tx => 
          tx.user.toLowerCase() === userAddress.toLowerCase()
        );
      }
      
      res.json(transactions);
    } catch (error: any) {
      const statusCode = error.message?.includes('required') || error.message?.includes('valid') ? 400 : 500;
      res.status(statusCode).json({
        error: 'Failed to get blocked transactions',
        message: error.message,
      });
    }
  }
}
