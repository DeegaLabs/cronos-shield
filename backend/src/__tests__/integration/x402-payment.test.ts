/**
 * x402 Payment Integration Tests
 * 
 * Tests the complete x402 payment flow
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { FacilitatorService } from '../../lib/x402/facilitator.service';
import { requirePaidAccess } from '../../lib/x402/require.util';

// Mock FacilitatorService
jest.mock('../../lib/x402/facilitator.service');

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint with x402 protection
app.get(
  '/test-protected',
  requirePaidAccess({
    description: 'Test protected endpoint',
  }),
  (_req, res) => {
    res.json({ success: true, message: 'Access granted' });
  }
);

describe('x402 Payment Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 402 Payment Required when no payment ID provided', async () => {
    const response = await request(app)
      .get('/test-protected')
      .expect(402);

    expect(response.body).toHaveProperty('error', 'payment_required');
    expect(response.body).toHaveProperty('x402Version');
    expect(response.body).toHaveProperty('accepts');
  });

  it('should return 402 with payment challenge structure', async () => {
    const response = await request(app)
      .get('/test-protected')
      .expect(402);

    expect(response.body).toHaveProperty('x402Version', 1);
    expect(response.body).toHaveProperty('error', 'payment_required');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('accepts');
    expect(Array.isArray(response.body.accepts)).toBe(true);
  });

  it('should accept request with valid payment ID header', async () => {
    // Mock the payment verification
    const mockFacilitatorService = FacilitatorService as jest.MockedClass<typeof FacilitatorService>;
    const mockInstance = {
      verifyPayment: jest.fn().mockResolvedValue(true),
    } as any;
    mockFacilitatorService.mockImplementation(() => mockInstance);

    // Note: This test would need actual payment ID verification
    // For now, we test the structure
    const response = await request(app)
      .get('/test-protected')
      .set('x-payment-id', 'test-payment-id')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
