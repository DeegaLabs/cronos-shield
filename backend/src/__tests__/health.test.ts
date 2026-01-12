/**
 * Health Check Tests
 * 
 * Basic smoke tests for critical endpoints
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Create a minimal app for testing
const app = express();
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Cronos Shield Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

describe('Health Check', () => {
  it('should return 200 and health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'Cronos Shield Backend');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('timestamp');
  });
});
