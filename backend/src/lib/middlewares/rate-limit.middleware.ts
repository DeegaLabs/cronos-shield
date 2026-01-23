/**
 * Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse
 */

import rateLimit from 'express-rate-limit';
import express from 'express';
import { logger } from '../utils/logger';

export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skip?: (req: express.Request) => boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    message: options.message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skip: options.skip,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      res.status(429).json({
        error: 'Too Many Requests',
        message: options.message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / 1000),
      });
    },
  });
};

// General API rate limiter (skips observability routes which have their own limiter)
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many API requests, please try again later.',
  skip: (req) => {
    // Skip rate limiting for observability routes (they have their own limiter)
    return req.path.startsWith('/api/observability');
  },
});

// Strict rate limiter for payment endpoints
export const paymentRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many payment requests, please try again later.',
});

// Strict rate limiter for analysis endpoints
export const analysisRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many analysis requests, please try again later.',
});

// More permissive rate limiter for observability endpoints (public, no x402)
export const observabilityRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute (allows for dashboard polling)
  message: 'Too many observability requests, please try again later.',
});
