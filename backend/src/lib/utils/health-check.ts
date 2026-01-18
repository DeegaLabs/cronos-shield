/**
 * Health Check Utilities
 * 
 * Comprehensive health checks for dependencies
 */

import { ethers } from 'ethers';
import { getPool } from '../database/db';
import { logger } from './logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    server: { status: 'ok' | 'error'; message?: string };
    rpc: { status: 'ok' | 'error'; message?: string; latency?: number };
    database?: { status: 'ok' | 'error'; message?: string };
    contracts?: {
      riskOracle?: { status: 'ok' | 'error'; message?: string };
      shieldedVault?: { status: 'ok' | 'error'; message?: string };
    };
  };
  timestamp: string;
  uptime: number;
}

const startTime = Date.now();

export async function performHealthCheck(): Promise<HealthStatus> {
  const checks: HealthStatus['checks'] = {
    server: { status: 'ok' },
    rpc: { status: 'error' },
  };

  // Check RPC connection
  try {
    const rpcUrl = process.env.RPC_URL || 'https://evm-t3.cronos.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const startTime = Date.now();
    const blockNumber = await Promise.race([
      provider.getBlockNumber(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('RPC timeout')), 5000)
      ),
    ]);
    const latency = Date.now() - startTime;
    
    checks.rpc = {
      status: 'ok',
      message: `Connected (block: ${blockNumber})`,
      latency,
    };
  } catch (error: any) {
    checks.rpc = {
      status: 'error',
      message: error.message || 'RPC connection failed',
    };
    logger.warn('RPC health check failed', { error: error.message });
  }

  // Check database if configured
  if (process.env.DATABASE_URL) {
    try {
      const pool = getPool();
      const result = await Promise.race([
        pool.query('SELECT 1 as health'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), 3000)
        ),
      ]);
      
      checks.database = {
        status: 'ok',
        message: 'Connected',
      };
    } catch (error: any) {
      checks.database = {
        status: 'error',
        message: error.message || 'Database connection failed',
      };
      logger.warn('Database health check failed', { error: error.message });
    }
  }

  // Check contracts if addresses are configured
  if (process.env.RISK_ORACLE_CONTRACT_ADDRESS || process.env.SHIELDED_VAULT_CONTRACT_ADDRESS) {
    checks.contracts = {};
    const rpcUrl = process.env.RPC_URL || 'https://evm-t3.cronos.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Check Risk Oracle
    if (process.env.RISK_ORACLE_CONTRACT_ADDRESS) {
      try {
        const code = await provider.getCode(process.env.RISK_ORACLE_CONTRACT_ADDRESS);
        checks.contracts.riskOracle = {
          status: code && code !== '0x' ? 'ok' : 'error',
          message: code && code !== '0x' ? 'Contract deployed' : 'Contract not found',
        };
      } catch (error: any) {
        checks.contracts.riskOracle = {
          status: 'error',
          message: error.message || 'Failed to check contract',
        };
      }
    }

    // Check Shielded Vault
    if (process.env.SHIELDED_VAULT_CONTRACT_ADDRESS) {
      try {
        const code = await provider.getCode(process.env.SHIELDED_VAULT_CONTRACT_ADDRESS);
        checks.contracts.shieldedVault = {
          status: code && code !== '0x' ? 'ok' : 'error',
          message: code && code !== '0x' ? 'Contract deployed' : 'Contract not found',
        };
      } catch (error: any) {
        checks.contracts.shieldedVault = {
          status: 'error',
          message: error.message || 'Failed to check contract',
        };
      }
    }
  }

  // Determine overall status
  const hasErrors = Object.values(checks).some(check => {
    if (check.status === 'error') return true;
    if ('contracts' in check && check.contracts) {
      return Object.values(check.contracts).some((c: any) => c.status === 'error');
    }
    return false;
  });
  
  const hasWarnings = checks.rpc.status === 'error';

  const status: HealthStatus['status'] = hasErrors 
    ? 'unhealthy' 
    : hasWarnings 
    ? 'degraded' 
    : 'healthy';

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };
}
