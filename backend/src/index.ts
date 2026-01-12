/**
 * Cronos Shield - Unified Backend
 * 
 * Main entry point for the consolidated backend API
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

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
  app.get('/api-docs/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  // Serve Swagger UI (interactive testing)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Serve Redocly (visual documentation)
  app.get('/api-docs/redoc', (_req, res) => {
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
    <redoc spec-url='/api-docs/swagger.json'></redoc>
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
  process.env.DEX_ROUTER_ADDRESS || '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae'
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

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: Cronos Shield Backend
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Cronos Shield Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 Cronos Shield Backend');
  console.log('═══════════════════════════════════════');
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
  console.log(`🌐 Network: ${network}`);
  console.log(`✅ Risk Oracle: ${process.env.RISK_ORACLE_CONTRACT_ADDRESS || 'Not configured'}`);
  console.log('═══════════════════════════════════════');
});
