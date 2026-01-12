/**
 * Observability Integration Tests
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { LogService } from '../../services/observability/log.service';
import { MetricsService } from '../../services/observability/metrics.service';
import { ObservabilityController } from '../../controllers/observability.controller';
import { createObservabilityRoutes } from '../../routes/observability.routes';

const app = express();
app.use(cors());
app.use(express.json());

const logService = new LogService();
const metricsService = new MetricsService();
const observabilityController = new ObservabilityController(logService, metricsService);
app.use('/api/observability', createObservabilityRoutes(observabilityController));

describe('Observability Integration', () => {
  describe('POST /api/observability/logs', () => {
    it('should create a log entry', async () => {
      const response = await request(app)
        .post('/api/observability/logs')
        .send({
          type: 'risk_analysis',
          service: 'risk-oracle',
          data: {
            contract: '0x1234567890123456789012345678901234567890',
            score: 50,
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.type).toBe('risk_analysis');
      expect(response.body.service).toBe('risk-oracle');
      expect(response.body).toHaveProperty('humanReadable');
    });

    it('should return 400 for missing fields', async () => {
      await request(app)
        .post('/api/observability/logs')
        .send({
          type: 'risk_analysis',
          // Missing service and data
        })
        .expect(400);
    });
  });

  describe('GET /api/observability/logs', () => {
    it('should return list of logs', async () => {
      // Create a log first
      await request(app)
        .post('/api/observability/logs')
        .send({
          type: 'x402_payment',
          service: 'risk-oracle',
          data: { paymentId: 'test-123' },
        });

      const response = await request(app)
        .get('/api/observability/logs')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter logs by type', async () => {
      const response = await request(app)
        .get('/api/observability/logs?type=x402_payment')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((log: any) => {
        expect(log.type).toBe('x402_payment');
      });
    });
  });

  describe('GET /api/observability/metrics', () => {
    it('should return metrics', async () => {
      const response = await request(app)
        .get('/api/observability/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('totalPayments');
      expect(response.body).toHaveProperty('totalAnalyses');
      expect(response.body).toHaveProperty('totalBlocks');
      expect(response.body).toHaveProperty('totalDivergences');
      expect(response.body).toHaveProperty('averageRiskScore');
      expect(response.body).toHaveProperty('last24Hours');
    });
  });

  describe('GET /api/observability/blocked-transactions', () => {
    it('should return blocked transactions', async () => {
      // Create a blocked transaction log
      await request(app)
        .post('/api/observability/logs')
        .send({
          type: 'transaction_blocked',
          service: 'shielded-vault',
          data: {
            user: '0x1234567890123456789012345678901234567890',
            target: '0x0987654321098765432109876543210987654321',
            score: 85,
            reason: 'High risk score',
          },
        });

      const response = await request(app)
        .get('/api/observability/blocked-transactions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
