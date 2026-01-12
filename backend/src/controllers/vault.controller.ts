/**
 * Vault Controller
 * 
 * Handles HTTP requests for Shielded Vault operations
 */

import { Request, Response } from 'express';
import { VaultService } from '../services/vault/vault.service';
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
      if (!address) {
        res.status(400).json({
          error: 'Missing address parameter',
        });
        return;
      }

      const balance = await this.vaultService.getBalance(address);
      res.json(balance);
    } catch (error: any) {
      res.status(500).json({
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
      if (!userAddress) {
        res.status(400).json({
          error: 'Missing user address',
        });
        return;
      }

      const request: DepositRequest = req.body;
      if (!request.amount) {
        res.status(400).json({
          error: 'Missing amount',
        });
        return;
      }

      const result = await this.vaultService.deposit(userAddress, request);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
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
      if (!userAddress) {
        res.status(400).json({
          error: 'Missing user address',
        });
        return;
      }

      const request: WithdrawRequest = req.body;
      if (!request.amount) {
        res.status(400).json({
          error: 'Missing amount',
        });
        return;
      }

      const result = await this.vaultService.withdraw(userAddress, request);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
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
      if (!userAddress) {
        res.status(400).json({
          error: 'Missing user address',
        });
        return;
      }

      const request: ExecuteTransactionRequest = req.body;
      if (!request.target) {
        res.status(400).json({
          error: 'Missing target address',
        });
        return;
      }

      const result = await this.vaultService.executeTransaction(userAddress, request);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: 'Transaction execution failed',
        message: error.message,
      });
    }
  }
}
