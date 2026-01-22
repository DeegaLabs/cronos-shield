/**
 * Cronos Shield - Unified Backend
 * 
 * Main entry point for the consolidated backend API
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { runMigrations } from './lib/database/migrations';
import { printEnvironmentStatus } from './lib/utils/env-validator';
import { logger } from './lib/utils/logger';
import { apiRateLimiter } from './lib/middlewares/rate-limit.middleware';
import { CronosShieldWebSocketServer } from './lib/websocket/websocket.server';

// Services
import { RiskService } from './services/risk/risk.service';
import { CryptoComService } from './services/divergence/crypto-com.service';
import { DexService } from './services/divergence/dex.service';
import { DivergenceService } from './services/divergence/divergence.service';
import { LogService } from './services/observability/log.service';
import { MetricsService } from './services/observability/metrics.service';
import { VaultService } from './services/vault/vault.service';

// Controllers
import { RiskController } from './controllers/risk.controller';
import { DivergenceController } from './controllers/divergence.controller';
import { ObservabilityController } from './controllers/observability.controller';
import { VaultController } from './controllers/vault.controller';

// Routes
import { createRiskRoutes } from './routes/risk.routes';
import { createDivergenceRoutes } from './routes/divergence.routes';
import { createObservabilityRoutes } from './routes/observability.routes';
import { createVaultRoutes } from './routes/vault.routes';

// x402
import { FacilitatorService } from './lib/x402/facilitator.service';

const app = express();
const httpServer = createServer(app);

// Trust proxy for Railway/Heroku (only trust first proxy for security)
// This fixes rate limiting warnings while maintaining security
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
// CORS: Allow frontend URL or all origins in development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? FRONTEND_URL 
    : process.env.CORS_ORIGIN || FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Apply rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cronos Shield API',
      version: '1.0.0',
      description: 'Unified API for Cronos Shield - Risk Oracle, CEX-DEX Synergy, and Observability',
      contact: {
        name: 'Cronos Shield',
        url: 'https://docs.cronos.org',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? (process.env.PUBLIC_RESOURCE_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost'}`)
          : `http://localhost:${PORT}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Risk Oracle', description: 'Risk analysis endpoints with x402 payment' },
      { name: 'CEX-DEX Synergy', description: 'Price divergence analysis endpoints with x402 payment' },
      { name: 'Shielded Vault', description: 'Shielded Vault operations' },
      { name: 'Observability', description: 'Logging and metrics endpoints' },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        PaymentChallenge: {
          type: 'object',
          properties: {
            x402Version: { type: 'number' },
            error: { type: 'string', example: 'payment_required' },
            message: { type: 'string' },
            accepts: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/index.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

if (process.env.SWAGGER_ENABLED !== 'false') {
  // Serve Swagger JSON
  app.get('/api-doc/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  // Serve Swagger UI (interactive testing)
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Serve Redocly (visual documentation)
  app.get('/docs', (_req, res) => {
    const redocHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Cronos Shield API - Redoc</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <redoc spec-url='/api-doc/swagger.json'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>
    `;
    res.send(redocHtml);
  });
}

// Initialize Services
const network = process.env.NETWORK || 'cronos-testnet';
const facilitatorService = new FacilitatorService(network);

// Risk Oracle Services
const riskService = new RiskService(
  network,
  process.env.PRIVATE_KEY,
  process.env.RPC_URL,
  process.env.RISK_ORACLE_CONTRACT_ADDRESS
);

// CEX-DEX Services
const cexService = new CryptoComService(
  process.env.CRYPTO_COM_API_URL,
  process.env.CRYPTO_COM_API_KEY
);

const dexService = new DexService(
  process.env.RPC_URL || 'https://evm-t3.cronos.org',
  process.env.DEX_ROUTER_ADDRESS || '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae',
  process.env.VVS_FACTORY_ADDRESS
);

const divergenceService = new DivergenceService(cexService, dexService);

// Observability Services
const logService = new LogService();
const metricsService = new MetricsService();

// Vault Service
const vaultService = new VaultService(
  process.env.SHIELDED_VAULT_CONTRACT_ADDRESS || '',
  process.env.PRIVATE_KEY,
  process.env.RPC_URL || 'https://evm-t3.cronos.org',
  riskService
);

// Initialize Controllers
const riskController = new RiskController(riskService);
const divergenceController = new DivergenceController(divergenceService, facilitatorService);
const observabilityController = new ObservabilityController(logService, metricsService);
const vaultController = new VaultController(vaultService);

// Routes
app.use('/api/risk', createRiskRoutes(riskController));
app.use('/api/divergence', createDivergenceRoutes(divergenceController));
app.use('/api/vault', createVaultRoutes(vaultController));
app.use('/api/observability', createObservabilityRoutes(observabilityController));

import { performHealthCheck } from './lib/utils/health-check';

const startTime = Date.now();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 checks:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 */
app.get('/health', async (_req, res) => {
  try {
    const health = await performHealthCheck();
    const wsServer = (global as any).wsServer as CronosShieldWebSocketServer | null;
    
    const healthResponse = {
      ...health,
      services: {
        ...health.services,
        websocket: wsServer ? {
          enabled: true,
          path: '/ws',
          clients: wsServer.getClientCount(),
        } : {
          enabled: false,
          reason: 'WebSocket server not initialized',
        },
      },
    };
    
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(healthResponse);
  } catch (error: any) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      checks: {
        server: { status: 'error', message: 'Health check failed' },
      },
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
    });
  }
});

// WebSocket status endpoint
app.get('/ws/status', (_req, res) => {
  const wsServer = (global as any).wsServer as CronosShieldWebSocketServer | null;
  
  if (!wsServer) {
    return res.json({
      enabled: false,
      available: false,
      reason: 'WebSocket server not initialized',
    });
  }

  res.json({
    enabled: true,
    available: true,
    path: '/ws',
    clients: wsServer.getClientCount(),
    cryptoComConnected: wsServer.isCryptoComConnected(),
  });
});

// Error handling middleware (must be after all routes)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Request error', err, {
    method: req.method,
    path: req.path,
    url: req.url,
    status: err.status || err.statusCode || 500,
  });
  
  // Default error response
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler (must be after all routes and error handler)
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint not found',
  });
});

// Initialize database migrations before starting server
async function startServer() {
  // Validate environment variables
  printEnvironmentStatus();

  // Run migrations if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    try {
      await runMigrations();
      logger.info('Database migrations completed successfully');
    } catch (error: any) {
      logger.error('Database migration failed', error, { 
        message: 'Continuing with in-memory storage' 
      });
    }
  } else {
    logger.info('DATABASE_URL not set, using in-memory storage');
  }

  // Initialize WebSocket Server
  let wsServer: CronosShieldWebSocketServer | null = null;
  try {
    wsServer = new CronosShieldWebSocketServer(httpServer);
    logger.info('✅ WebSocket server initialized');
  } catch (error: any) {
    logger.error('Failed to initialize WebSocket server', error, {
      message: 'Continuing without WebSocket support'
    });
  }

  // Store wsServer reference for health check
  (global as any).wsServer = wsServer;

  // Start HTTP Server (which includes WebSocket)
  httpServer.listen(PORT, () => {
    logger.info('═══════════════════════════════════════');
    logger.info('🚀 Cronos Shield Backend');
    logger.info('═══════════════════════════════════════');
    logger.info(`📍 Server running on http://localhost:${PORT}`);
    logger.info(`📚 Swagger docs: http://localhost:${PORT}/api-doc`);
    logger.info(`📖 Redoc docs: http://localhost:${PORT}/docs`);
    if (wsServer) {
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    }
    logger.info(`🌐 Network: ${network}`);
    logger.info(`✅ Risk Oracle: ${process.env.RISK_ORACLE_CONTRACT_ADDRESS || 'Not configured'}`);
    logger.info(`💾 Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'In-Memory'}`);
    logger.info('═══════════════════════════════════════');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    if (wsServer) {
      wsServer.shutdown();
    }
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    if (wsServer) {
      wsServer.shutdown();
    }
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
