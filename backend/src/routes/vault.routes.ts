/**
 * Vault Routes
 * @swagger
 * tags:
 *   - name: Shielded Vault
 *     description: Shielded Vault operations
 */

import express from 'express';
import { VaultController } from '../controllers/vault.controller';

const router = express.Router();

export function createVaultRoutes(vaultController: VaultController) {
  /**
   * @swagger
   * /api/vault/info:
   *   get:
   *     summary: Get vault information
   *     description: Returns vault configuration and status
   *     tags: [Shielded Vault]
   *     responses:
   *       200:
   *         description: Vault information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 contractAddress:
   *                   type: string
   *                 maxRiskScore:
   *                   type: number
   *                 riskOracleAddress:
   *                   type: string
   *                 riskOracleUrl:
   *                   type: string
   *                 isPaused:
   *                   type: boolean
   *                 owner:
   *                   type: string
   */
  router.get('/info', vaultController.getVaultInfo.bind(vaultController));

  /**
   * @swagger
   * /api/vault/balance:
   *   get:
   *     summary: Get user balance in vault
   *     description: Returns the balance of a user in the vault
   *     tags: [Shielded Vault]
   *     parameters:
   *       - in: query
   *         name: address
   *         required: true
   *         schema:
   *           type: string
   *         description: User wallet address
   *     responses:
   *       200:
   *         description: User balance
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 address:
   *                   type: string
   *                 balance:
   *                   type: string
   *                 balanceFormatted:
   *                   type: string
   */
  router.get('/balance', vaultController.getBalance.bind(vaultController));

  /**
   * @swagger
   * /api/vault/deposit:
   *   post:
   *     summary: Deposit tokens into vault
   *     description: Deposits native tokens (CRO) into the vault
   *     tags: [Shielded Vault]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userAddress
   *               - amount
   *             properties:
   *               userAddress:
   *                 type: string
   *               amount:
   *                 type: string
   *                 example: "1.0"
   *     responses:
   *       200:
   *         description: Deposit successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 txHash:
   *                   type: string
   */
  router.post('/deposit', vaultController.deposit.bind(vaultController));

  /**
   * @swagger
   * /api/vault/withdraw:
   *   post:
   *     summary: Withdraw tokens from vault
   *     description: Withdraws native tokens (CRO) from the vault
   *     tags: [Shielded Vault]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userAddress
   *               - amount
   *             properties:
   *               userAddress:
   *                 type: string
   *               amount:
   *                 type: string
   *                 example: "1.0"
   *     responses:
   *       200:
   *         description: Withdraw successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 txHash:
   *                   type: string
   */
  router.post('/withdraw', vaultController.withdraw.bind(vaultController));

  /**
   * @swagger
   * /api/vault/execute:
   *   post:
   *     summary: Execute transaction with risk check
   *     description: Executes a transaction only if risk score is acceptable
   *     tags: [Shielded Vault]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userAddress
   *               - target
   *             properties:
   *               userAddress:
   *                 type: string
   *               target:
   *                 type: string
   *                 description: Target contract address
   *               callData:
   *                 type: string
   *                 description: Hex-encoded calldata
   *               value:
   *                 type: string
   *                 description: Amount in CRO
   *                 example: "0.1"
   *               contractAddress:
   *                 type: string
   *                 description: Optional contract to analyze for risk
   *     responses:
   *       200:
   *         description: Transaction result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 txHash:
   *                   type: string
   *                 blocked:
   *                   type: boolean
   *                 riskScore:
   *                   type: number
   *                 reason:
   *                   type: string
   */
  router.post('/execute', vaultController.executeTransaction.bind(vaultController));

  return router;
}
