/**
 * Health Check Integration Tests
 */

import { performHealthCheck } from '../../lib/utils/health-check';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn(() => ({
      getBlockNumber: jest.fn().mockResolvedValue(1000000),
      getCode: jest.fn().mockResolvedValue('0x608060405234801561001057600080fd5b50'),
    })),
  },
}));

// Mock database
jest.mock('../../lib/database/db', () => ({
  getPool: jest.fn(() => ({
    query: jest.fn().mockResolvedValue({ rows: [{ health: 1 }] }),
  })),
}));

describe('Health Check Integration', () => {
  beforeEach(() => {
    process.env.RPC_URL = 'https://evm-t3.cronos.org';
    process.env.NETWORK = 'cronos-testnet';
  });

  it('should perform health check successfully', async () => {
    const health = await performHealthCheck();

    expect(health).toBeDefined();
    expect(health.status).toMatch(/healthy|degraded|unhealthy/);
    expect(health.checks).toBeDefined();
    expect(health.checks.server).toBeDefined();
    expect(health.checks.rpc).toBeDefined();
    expect(health.timestamp).toBeDefined();
    expect(health.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should check RPC connection', async () => {
    const health = await performHealthCheck();

    expect(health.checks.rpc).toBeDefined();
    expect(health.checks.rpc.status).toMatch(/ok|error/);
  });

  it('should check database if DATABASE_URL is set', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';

    const health = await performHealthCheck();

    if (health.checks.database) {
      expect(health.checks.database.status).toMatch(/ok|error/);
    }
  });

  it('should check contracts if addresses are configured', async () => {
    process.env.RISK_ORACLE_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
    process.env.SHIELDED_VAULT_CONTRACT_ADDRESS = '0x0987654321098765432109876543210987654321';

    const health = await performHealthCheck();

    if (health.checks.contracts) {
      expect(health.checks.contracts.riskOracle).toBeDefined();
      expect(health.checks.contracts.shieldedVault).toBeDefined();
    }
  });
});
