#!/usr/bin/env node

/**
 * Cronos Shield MCP Server
 * 
 * Model Context Protocol server for AI assistants
 * Provides tools for Risk Oracle, Shielded Vaults, CEX-DEX Synergy, and Observability
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { analyzeRisk } from './tools/risk.js';
import { getVaultBalance, getVaultStats } from './tools/vault.js';
import { analyzeDivergence, getAvailablePairs } from './tools/divergence.js';
import { getMetrics, getLogs, getBlockedTransactions } from './tools/observability.js';

const BACKEND_URL = process.env.BACKEND_URL || 'https://cronos-shield-backend-production.up.railway.app';

// Define available tools
const TOOLS = [
  {
    name: 'analyze_risk',
    description: 'Analyze smart contract risk score using the Risk Oracle. Returns risk score (0-100), proof, and detailed analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        contract: {
          type: 'string',
          description: 'Smart contract address to analyze (e.g., 0x...)',
        },
      },
      required: ['contract'],
    },
  },
  {
    name: 'get_vault_balance',
    description: 'Get vault balance for a specific address. Returns balance in CRO and formatted value.',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Wallet address to check balance for (e.g., 0x...)',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_vault_stats',
    description: 'Get overall vault statistics including total deposits, withdrawals, and transaction counts.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'analyze_divergence',
    description: 'Analyze CEX-DEX price divergence for a trading pair. Returns prices, divergence percentage, and arbitrage recommendation.',
    inputSchema: {
      type: 'object',
      properties: {
        pair: {
          type: 'string',
          description: 'Trading pair to analyze (e.g., ETH-USDT, CRO-USDC)',
        },
      },
      required: ['pair'],
    },
  },
  {
    name: 'get_available_pairs',
    description: 'Get list of available trading pairs from Crypto.com Exchange.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_metrics',
    description: 'Get system metrics including total analyses, blocked transactions, and performance stats.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_logs',
    description: 'Get system logs with optional filtering by type and limit.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Filter logs by type (e.g., risk_analysis, transaction_blocked)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of logs to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'get_blocked_transactions',
    description: 'Get list of recently blocked transactions with risk scores and reasons.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

class CronosShieldMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'cronos-shield-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: TOOLS.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;

        switch (name) {
          case 'analyze_risk':
            if (!args || typeof args !== 'object' || !('contract' in args)) {
              throw new Error('Contract address is required');
            }
            const contract = String(args.contract);
            result = await analyzeRisk(contract);
            break;

          case 'get_vault_balance':
            if (!args || typeof args !== 'object' || !('address' in args)) {
              throw new Error('Address is required');
            }
            const address = String(args.address);
            result = await getVaultBalance(address);
            break;

          case 'get_vault_stats':
            result = await getVaultStats();
            break;

          case 'analyze_divergence':
            if (!args || typeof args !== 'object' || !('pair' in args)) {
              throw new Error('Trading pair is required (e.g., ETH-USDT)');
            }
            const pair = String(args.pair);
            result = await analyzeDivergence(pair);
            break;

          case 'get_available_pairs':
            result = await getAvailablePairs();
            break;

          case 'get_metrics':
            result = await getMetrics();
            break;

          case 'get_logs':
            const type = args && typeof args === 'object' && 'type' in args ? String(args.type) : undefined;
            const limit = args && typeof args === 'object' && 'limit' in args ? Number(args.limit) : undefined;
            result = await getLogs({ type, limit });
            break;

          case 'get_blocked_transactions':
            result = await getBlockedTransactions();
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: error.message || 'Unknown error',
                  tool: name,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('✅ Cronos Shield MCP Server started');
    console.error(`📡 Backend URL: ${BACKEND_URL}`);
    console.error(`🛠️  Available tools: ${TOOLS.length}`);
  }
}

// Start server
const server = new CronosShieldMCPServer();
server.start().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
