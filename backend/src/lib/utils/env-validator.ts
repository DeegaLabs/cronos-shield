/**
 * Environment Variables Validator
 * 
 * Validates required environment variables on startup
 */

interface EnvConfig {
  required: string[];
  optional: string[];
  defaults?: Record<string, string>;
}

const envConfig: EnvConfig = {
  required: [
    'NETWORK',
    'RPC_URL',
  ],
  optional: [
    'PORT',
    'FRONTEND_URL',
    'MERCHANT_ADDRESS',
    'PRIVATE_KEY',
    'RISK_ORACLE_CONTRACT_ADDRESS',
    'SHIELDED_VAULT_CONTRACT_ADDRESS',
    'CRYPTO_COM_API_KEY',
    'CRYPTO_COM_API_URL',
    'DEX_ROUTER_ADDRESS',
    'DATABASE_URL',
    'SWAGGER_ENABLED',
    'CRONOSCAN_API_KEY',
  ],
  defaults: {
    PORT: '3000',
    FRONTEND_URL: 'http://localhost:5173',
    NETWORK: 'cronos-testnet',
    RPC_URL: 'https://evm-t3.cronos.org',
    CHAIN_ID: '338',
    DEX_ROUTER_ADDRESS: '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae',
    SWAGGER_ENABLED: 'true',
  },
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of envConfig.required) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Check optional but recommended variables
  const recommended = [
    'PRIVATE_KEY',
    'RISK_ORACLE_CONTRACT_ADDRESS',
    'SHIELDED_VAULT_CONTRACT_ADDRESS',
  ];

  for (const key of recommended) {
    if (!process.env[key]) {
      warnings.push(`Recommended environment variable not set: ${key} (some features may not work)`);
    }
  }

  // Validate format of specific variables
  if (process.env.RPC_URL && !process.env.RPC_URL.startsWith('http')) {
    errors.push(`RPC_URL must be a valid HTTP/HTTPS URL: ${process.env.RPC_URL}`);
  }

  if (process.env.PRIVATE_KEY && !process.env.PRIVATE_KEY.startsWith('0x')) {
    errors.push(`PRIVATE_KEY must start with 0x: ${process.env.PRIVATE_KEY.substring(0, 10)}...`);
  }

  if (process.env.MERCHANT_ADDRESS && !process.env.MERCHANT_ADDRESS.startsWith('0x')) {
    errors.push(`MERCHANT_ADDRESS must be a valid Ethereum address`);
  }

  if (process.env.PORT) {
    const port = parseInt(process.env.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(`PORT must be a valid number between 1 and 65535: ${process.env.PORT}`);
    }
  }

  // Validate network and chain ID match
  const network = process.env.NETWORK || envConfig.defaults?.NETWORK;
  const chainId = process.env.CHAIN_ID || envConfig.defaults?.CHAIN_ID;
  
  if (network === 'cronos-testnet' && chainId !== '338') {
    warnings.push(`Network is cronos-testnet but CHAIN_ID is ${chainId} (expected 338)`);
  }
  
  if (network === 'cronos-mainnet' && chainId !== '25') {
    warnings.push(`Network is cronos-mainnet but CHAIN_ID is ${chainId} (expected 25)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function printEnvironmentStatus(): void {
  const result = validateEnvironment();

  console.log('\n═══════════════════════════════════════');
  console.log('🔍 Environment Variables Validation');
  console.log('═══════════════════════════════════════\n');

  if (result.errors.length > 0) {
    console.error('❌ ERRORS (must be fixed):');
    result.errors.forEach((error) => {
      console.error(`   • ${error}`);
    });
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  WARNINGS (recommended to fix):');
    result.warnings.forEach((warning) => {
      console.warn(`   • ${warning}`);
    });
    console.log('');
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ All environment variables are valid\n');
  } else if (result.valid) {
    console.log('✅ Environment variables are valid (with warnings)\n');
  } else {
    console.error('❌ Environment validation failed. Please fix the errors above.\n');
    process.exit(1);
  }

  // Print current configuration (without sensitive data)
  console.log('📋 Current Configuration:');
  console.log(`   Network: ${process.env.NETWORK || envConfig.defaults?.NETWORK}`);
  console.log(`   RPC URL: ${process.env.RPC_URL || envConfig.defaults?.RPC_URL}`);
  console.log(`   Port: ${process.env.PORT || envConfig.defaults?.PORT}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || envConfig.defaults?.FRONTEND_URL}`);
  console.log(`   Risk Oracle: ${process.env.RISK_ORACLE_CONTRACT_ADDRESS || 'Not configured'}`);
  console.log(`   Shielded Vault: ${process.env.SHIELDED_VAULT_CONTRACT_ADDRESS || 'Not configured'}`);
  console.log(`   Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'In-Memory'}`);
  console.log(`   Crypto.com API: ${process.env.CRYPTO_COM_API_KEY ? 'Configured' : 'Not configured (using mock data)'}`);
  console.log(`   Cronoscan API: ${process.env.CRONOSCAN_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log('═══════════════════════════════════════\n');
}
