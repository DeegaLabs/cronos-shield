/**
 * Divergence Routes
 * @swagger
 * tags:
 *   - name: CEX-DEX Synergy
 *     description: Price divergence analysis endpoints with x402 payment
 */

import express from 'express';
import { DivergenceController } from '../controllers/divergence.controller';
import { requirePaidAccess } from '../lib/x402/require.util';
import { analysisRateLimiter, paymentRateLimiter } from '../lib/middlewares/rate-limit.middleware';

const router = express.Router();

export function createDivergenceRoutes(divergenceController: DivergenceController) {
  /**
   * @swagger
   * /api/divergence/analyze:
   *   get:
   *     summary: Analyze CEX-DEX price divergence
   *     description: Returns price divergence between centralized and decentralized exchanges. Requires x402 payment.
   *     tags: [CEX-DEX Synergy]
   *     parameters:
   *       - in: query
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *         description: Token symbol (e.g., CRO, USDC)
   *       - in: query
   *         name: amount
   *         schema:
   *           type: string
   *         description: Optional amount for price calculation
   *     responses:
   *       200:
   *         description: Divergence analysis result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                 cexPrice:
   *                   type: string
   *                 dexPrice:
   *                   type: string
   *                 divergence:
   *                   type: string
   *                 divergenceAmount:
   *                   type: string
   *                 recommendation:
   *                   type: string
   *                   enum: [buy_on_cex, buy_on_dex, no_arbitrage]
   *                 timestamp:
   *                   type: number
   *                 details:
   *                   type: object
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
    '/analyze',
    analysisRateLimiter,
    requirePaidAccess({
      description: 'CEX-DEX price divergence analysis',
      serviceMetadata: {
        name: 'CEX-DEX Synergy',
        version: '1.0.0',
        description: 'Real-time price divergence detection between centralized and decentralized exchanges',
        features: ['CEX price fetching', 'DEX price fetching', 'Arbitrage detection'],
      },
    }),
    divergenceController.analyzeDivergence.bind(divergenceController)
  );

  /**
   * @swagger
   * /api/divergence/pay:
   *   post:
   *     summary: Settle x402 payment for divergence analysis
   *     description: Verifies and settles x402 payment for accessing divergence analysis
   *     tags: [CEX-DEX Synergy]
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
   *                 success:
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
  router.post('/pay', paymentRateLimiter, divergenceController.settlePayment.bind(divergenceController));

  /**
   * @swagger
   * /api/divergence/history:
   *   get:
   *     summary: Get divergence history chart data
   *     description: Returns historical divergence data for chart visualization
   *     tags: [CEX-DEX Synergy]
   *     parameters:
   *       - in: query
   *         name: token
   *         schema:
   *           type: string
   *         description: Token symbol to filter (optional)
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 7
   *         description: Number of days to retrieve (1-90)
   *     responses:
   *       200:
   *         description: Historical divergence data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: number
   */
  router.get('/history', divergenceController.getHistory.bind(divergenceController));

  /**
   * @swagger
   * /api/divergence/alerts:
   *   get:
   *     summary: Get recent divergence alerts
   *     description: Returns recent alerts for high divergence events
   *     tags: [CEX-DEX Synergy]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Maximum number of alerts to return (1-50)
   *     responses:
   *       200:
   *         description: Recent alerts
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 alerts:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       pair:
   *                         type: string
   *                       divergence:
   *                         type: number
   *                       severity:
   *                         type: string
   *                         enum: [high, medium, low]
   *                       time:
   *                         type: string
   *                       description:
   *                         type: string
   */
  router.get('/alerts', divergenceController.getRecentAlerts.bind(divergenceController));

  return router;
}
