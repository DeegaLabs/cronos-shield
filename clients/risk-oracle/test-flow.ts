/**
 * Test Flow Script
 * 
 * Simula o fluxo completo de um agente IA usando o Risk Oracle:
 * 1. Faz requisição para análise de risco
 * 2. Recebe 402 Payment Required
 * 3. Gera payment header (EIP-3009)
 * 4. Faz settlement
 * 5. Retry com payment-id
 * 6. Recebe resultado
 * 
 * Usage:
 *   npm run test
 *   ou
 *   ts-node test-flow.ts
 */

import { ethers } from 'ethers';
import { Facilitator } from '@crypto.com/facilitator-client';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const RPC_URL = process.env.RPC_URL || 'https://evm-t3.cronos.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error('❌ PRIVATE_KEY not set in .env file');
}

// Test contract address (pode ser qualquer endereço válido)
const TEST_CONTRACT = process.argv[2] || '0x0000000000000000000000000000000000000000';

interface PaymentChallenge {
  x402Version: number;
  error: string;
  accepts: Array<{
    scheme: string;
    network: string;
    payTo: string;
    asset: string;
    maxAmountRequired: string;
    maxTimeoutSeconds: number;
    description: string;
    resource: string;
    extra?: {
      paymentId: string;
    };
  }>;
}

interface RiskAnalysisResponse {
  score: number;
  proof: string;
  details: any;
  timestamp: number;
  contract: string;
  verified?: boolean;
}

async function main() {
  console.log('🧪 Testando fluxo completo do Risk Oracle\n');
  console.log('📋 Configuração:');
  console.log(`   Backend: ${BACKEND_URL}`);
  console.log(`   RPC: ${RPC_URL}`);
  console.log(`   Test Contract: ${TEST_CONTRACT}\n`);

  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const address = await signer.getAddress();
  
  console.log(`👤 Wallet: ${address}`);
  
  // Check balance
  const balance = await provider.getBalance(address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} CRO\n`);

  if (balance === 0n) {
    console.error('❌ Saldo insuficiente! Obtenha TCRO em: https://cronos.org/faucet\n');
    process.exit(1);
  }

  try {
    // Step 1: Request risk analysis (should get 402)
    console.log('📡 Step 1: Fazendo requisição para análise de risco...');
    const response1 = await fetch(
      `${BACKEND_URL}/api/risk-analysis?contract=${TEST_CONTRACT}`
    );

    if (response1.status === 200) {
      const data = await response1.json();
      console.log('✅ Já tem entitlement! Resultado:', data);
      return;
    }

    if (response1.status !== 402) {
      throw new Error(`Unexpected status: ${response1.status}`);
    }

    const challenge: PaymentChallenge = await response1.json();
    console.log('✅ Recebeu 402 Payment Required');
    console.log(`   Payment ID: ${challenge.accepts[0].extra?.paymentId}`);
    console.log(`   Amount: ${challenge.accepts[0].maxAmountRequired} (${ethers.formatEther(challenge.accepts[0].maxAmountRequired)} CRO)`);
    console.log(`   Pay To: ${challenge.accepts[0].payTo}\n`);

    // Step 2: Generate payment header
    console.log('💳 Step 2: Gerando payment header (EIP-3009)...');
    const accepts = challenge.accepts[0];
    
    // Initialize Facilitator
    const facilitator = new Facilitator({ 
      network: accepts.network as any 
    });

    const validBefore = Math.floor(Date.now() / 1000) + accepts.maxTimeoutSeconds;
    const paymentHeader = await facilitator.generatePaymentHeader({
      to: accepts.payTo,
      value: accepts.maxAmountRequired,
      asset: accepts.asset,
      signer: signer as any,
      validBefore,
      validAfter: 0,
    });

    console.log('✅ Payment header gerado\n');

    // Step 3: Settle payment
    console.log('💸 Step 3: Fazendo settlement...');
    const paymentId = accepts.extra?.paymentId;
    if (!paymentId) {
      throw new Error('Payment ID not found in challenge');
    }

    const settleResponse = await fetch(`${BACKEND_URL}/api/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId,
        paymentHeader,
        paymentRequirements: accepts,
      }),
    });

    if (!settleResponse.ok) {
      const error = await settleResponse.json();
      throw new Error(`Settlement failed: ${JSON.stringify(error)}`);
    }

    const settleResult = await settleResponse.json();
    console.log('✅ Payment settled!');
    console.log(`   TX Hash: ${settleResult.txHash || 'N/A'}\n`);

    // Step 4: Retry with payment-id
    console.log('🔄 Step 4: Retry com payment-id...');
    const response2 = await fetch(
      `${BACKEND_URL}/api/risk-analysis?contract=${TEST_CONTRACT}`,
      {
        headers: {
          'x-payment-id': paymentId,
        },
      }
    );

    if (response2.status !== 200) {
      throw new Error(`Unexpected status on retry: ${response2.status}`);
    }

    const result: RiskAnalysisResponse = await response2.json();
    console.log('✅ Análise de risco recebida!\n');
    console.log('📊 Resultado:');
    console.log(`   Score: ${result.score}/100`);
    console.log(`   Proof: ${result.proof.substring(0, 20)}...`);
    console.log(`   Contract: ${result.contract}`);
    console.log(`   Timestamp: ${new Date(result.timestamp).toISOString()}`);
    if (result.verified !== undefined) {
      console.log(`   Verified: ${result.verified ? '✅' : '❌'}`);
    }
    console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    console.log('\n🎉 Fluxo completo testado com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro durante teste:');
    console.error(error);
    process.exit(1);
  }
}

main();
