/**
 * Risk Routes
 * @swagger
 * tags:
 *   - name: Risk Oracle
 *     description: Risk analysis endpoints with x402 payment
 */

import express from 'express';
import { RiskController } from '../controllers/risk.controller';
import { requirePaidAccess } from '../lib/x402/require.util';
import { analysisRateLimiter, paymentRateLimiter } from '../lib/middlewares/rate-limit.middleware';

const router = express.Router();

export function createRiskRoutes(riskController: RiskController) {
  /**
   * @swagger
   * /api/risk/risk-analysis:
   *   get:
   *     summary: Analyze risk for a smart contract
   *     description: Returns risk analysis with score, details, and Proof of Risk. Requires x402 payment.
   *     tags: [Risk Oracle]
   *     parameters:
   *       - in: query
   *         name: contract
   *         required: true
   *         schema:
   *           type: string
   *         description: Contract address to analyze
   *       - in: query
   *         name: amount
   *         schema:
   *           type: string
   *         description: Optional transaction amount
   *       - in: query
   *         name: tokenAddress
   *         schema:
   *           type: string
   *         description: Optional token address
   *       - in: query
   *         name: verify
   *         schema:
   *           type: boolean
   *         description: Verify proof on-chain
   *     responses:
   *       200:
   *         description: Risk analysis result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 score:
   *                   type: number
   *                   description: Risk score (0-100)
   *                 proof:
   *                   type: string
   *                   description: Cryptographic proof of risk
   *                 details:
   *                   type: object
   *                 timestamp:
   *                   type: number
   *                 contract:
   *                   type: string
   *       402:
   *         description: Payment required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaymentChallenge'
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get(
    '/risk-analysis',
    analysisRateLimiter,
    requirePaidAccess({ 
      description: 'Risk analysis for smart contract',
      serviceMetadata: {
        name: 'Cronos Shield Risk Oracle',
        version: '1.0.0',
        description: 'AI-powered on-chain risk analysis service',
        features: ['Real-time risk scoring', 'Proof of Risk', 'On-chain verification'],
      },
    }),
    riskController.analyzeRisk.bind(riskController)
  );

  /**
   * @swagger
   * /api/risk/pay:
   *   post:
   *     summary: Settle x402 payment for risk analysis
   *     description: Verifies and settles x402 payment for accessing risk analysis
   *     tags: [Risk Oracle]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - paymentId
   *               - paymentHeader
   *               - paymentRequirements
   *             properties:
   *               paymentId:
   *                 type: string
   *               paymentHeader:
   *                 type: string
   *               paymentRequirements:
   *                 type: object
   *     responses:
   *       200:
   *         description: Payment settled successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                 txHash:
   *                   type: string
   *       400:
   *         description: Payment settlement failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/pay', paymentRateLimiter, riskController.pay.bind(riskController));

  return router;
}
