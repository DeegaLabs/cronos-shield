/**
 * Observability Routes
 * @swagger
 * tags:
 *   - name: Observability
 *     description: Logging and metrics endpoints
 */

import express from 'express';
import { ObservabilityController } from '../controllers/observability.controller';
import { observabilityRateLimiter } from '../lib/middlewares/rate-limit.middleware';

const router = express.Router();

// Apply rate limiting to all observability routes
router.use(observabilityRateLimiter);

export function createObservabilityRoutes(observabilityController: ObservabilityController) {
  /**
   * @swagger
   * /api/observability/logs:
   *   post:
   *     summary: Add a log entry
   *     description: Creates a new log entry with human-readable translation
   *     tags: [Observability]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *               - service
   *               - data
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [x402_payment, risk_analysis, transaction_blocked, transaction_allowed, divergence_analysis, error]
   *               service:
   *                 type: string
   *                 enum: [risk-oracle, shielded-vault, cex-dex-synergy, observability]
   *               data:
   *                 type: object
   *     responses:
   *       201:
   *         description: Log entry created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 timestamp:
   *                   type: number
   *                 type:
   *                   type: string
   *                 service:
   *                   type: string
   *                 data:
   *                   type: object
   *                 humanReadable:
   *                   type: string
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/logs', observabilityController.addLog.bind(observabilityController));

  /**
   * @swagger
   * /api/observability/logs:
   *   get:
   *     summary: Get log entries
   *     description: Returns list of log entries with optional filters
   *     tags: [Observability]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Maximum number of logs to return
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Filter by log type
   *       - in: query
   *         name: service
   *         schema:
   *           type: string
   *         description: Filter by service name
   *     responses:
   *       200:
   *         description: List of log entries
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   */
  router.get('/logs', observabilityController.getLogs.bind(observabilityController));

  /**
   * @swagger
   * /api/observability/metrics:
   *   get:
   *     summary: Get aggregated metrics
   *     description: Returns system-wide metrics and KPIs
   *     tags: [Observability]
   *     responses:
   *       200:
   *         description: Metrics data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalPayments:
   *                   type: number
   *                 totalAnalyses:
   *                   type: number
   *                 totalBlocks:
   *                   type: number
   *                 totalDivergences:
   *                   type: number
   *                 averageRiskScore:
   *                   type: number
   *                 totalRevenue:
   *                   type: string
   *                 last24Hours:
   *                   type: object
   */
  router.get('/metrics', observabilityController.getMetrics.bind(observabilityController));

  /**
   * @swagger
   * /api/observability/blocked-transactions:
   *   get:
   *     summary: Get blocked transactions
   *     description: Returns list of transactions that were blocked by the system
   *     tags: [Observability]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Maximum number of transactions to return
   *     responses:
   *       200:
   *         description: List of blocked transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   timestamp:
   *                     type: number
   *                   user:
   *                     type: string
   *                   target:
   *                     type: string
   *                   riskScore:
   *                     type: number
   *                   reason:
   *                     type: string
   *                   service:
   *                     type: string
   */
  router.get('/blocked-transactions', observabilityController.getBlockedTransactions.bind(observabilityController));

  return router;
}
