/**
 * Environment Validator Tests
 */

import { validateEnvironment } from '../../lib/utils/env-validator';

describe('Environment Validator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should pass validation with all required variables', () => {
    process.env.NETWORK = 'cronos-testnet';
    process.env.RPC_URL = 'https://evm-t3.cronos.org';

    const result = validateEnvironment();

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should fail validation when required variables are missing', () => {
    delete process.env.NETWORK;
    delete process.env.RPC_URL;

    const result = validateEnvironment();

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('NETWORK'))).toBe(true);
    expect(result.errors.some(e => e.includes('RPC_URL'))).toBe(true);
  });

  it('should warn when recommended variables are missing', () => {
    process.env.NETWORK = 'cronos-testnet';
    process.env.RPC_URL = 'https://evm-t3.cronos.org';
    delete process.env.PRIVATE_KEY;
    delete process.env.RISK_ORACLE_CONTRACT_ADDRESS;

    const result = validateEnvironment();

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should validate RPC_URL format', () => {
    process.env.NETWORK = 'cronos-testnet';
    process.env.RPC_URL = 'invalid-url';

    const result = validateEnvironment();

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('RPC_URL'))).toBe(true);
  });

  it('should validate PRIVATE_KEY format', () => {
    process.env.NETWORK = 'cronos-testnet';
    process.env.RPC_URL = 'https://evm-t3.cronos.org';
    process.env.PRIVATE_KEY = 'invalid-key';

    const result = validateEnvironment();

    expect(result.valid).toBe(true);
    expect(result.errors.some(e => e.includes('PRIVATE_KEY'))).toBe(true);
  });

  it('should validate PORT range', () => {
    process.env.NETWORK = 'cronos-testnet';
    process.env.RPC_URL = 'https://evm-t3.cronos.org';
    process.env.PORT = '99999';

    const result = validateEnvironment();

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('PORT'))).toBe(true);
  });

  it('should warn when network and chain ID mismatch', () => {
    process.env.NETWORK = 'cronos-testnet';
    process.env.RPC_URL = 'https://evm-t3.cronos.org';
    process.env.CHAIN_ID = '25'; // Wrong for testnet

    const result = validateEnvironment();

    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('CHAIN_ID'))).toBe(true);
  });
});
