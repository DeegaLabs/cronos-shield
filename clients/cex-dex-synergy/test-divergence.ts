/**
 * Test Divergence Client
 * 
 * Cliente para testar a API de divergência CEX-DEX
 * Simula um agente IA consultando preços e verificando arbitragem
 */

import { ethers } from 'ethers';
import { Facilitator, CronosNetwork, type Contract } from '@crypto.com/facilitator-client';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://evm-t3.cronos.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BACKEND_URL = process.env.CEX_DEX_BACKEND_URL || 'http://localhost:3001';

if (!PRIVATE_KEY) {
  throw new Error('❌ PRIVATE_KEY not set in .env file');
}

interface PaymentChallenge {
  x402Version: number;
  error: string;
  message?: string;
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

interface DivergenceResponse {
  pair: string;
  cexPrice: {
    price: string;
    timestamp: number;
    source: 'CEX';
    pair: string;
  };
  dexPrice: {
    price: string;
    timestamp: number;
    source: 'DEX';
    pair: string;
  };
  divergence: {
    percentage: number;
    absolute: string;
    direction: 'CEX_HIGHER' | 'DEX_HIGHER' | 'EQUAL';
  };
  recommendation: {
    action: 'ALLOW' | 'BLOCK' | 'WARN';
    reason: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  timestamp: number;
  liquidity?: {
    dex: {
      available: string;
      depth: string;
    };
  };
}

class DivergenceAgent {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private facilitator: Facilitator;
  private address: string;
  private paymentCache: Map<string, string> = new Map();

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.signer = new ethers.Wallet(PRIVATE_KEY!, this.provider);
    this.facilitator = new Facilitator({ network: CronosNetwork.CronosTestnet });
    this.address = this.signer.address;
  }

  async initialize(): Promise<void> {
    console.log('🏦 CEX-DEX Synergy Test Agent\n');
    console.log('═'.repeat(60));
    
    const balance = await this.provider.getBalance(this.address);
    console.log(`👤 Wallet: ${this.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} TCRO`);
    
    if (balance === 0n) {
      throw new Error('\n❌ Saldo insuficiente! Obtenha TCRO em: https://cronos.org/faucet');
    }

    console.log(`📡 Backend: ${BACKEND_URL}`);
    console.log(`🌐 Network: Cronos Testnet\n`);
    console.log('═'.repeat(60) + '\n');
  }

  async queryDivergence(pair: string, amount?: string): Promise<DivergenceResponse | null> {
    try {
      const url = `${BACKEND_URL}/api/divergence?pair=${pair}${amount ? `&amount=${amount}` : ''}`;
      
      // Step 1: Request divergence analysis
      const response = await fetch(url);

      // Step 2: Handle 402 or direct response
      if (response.status === 402) {
        const challenge = await response.json() as PaymentChallenge;
        const paymentId = challenge.accepts[0].extra?.paymentId;
        
        if (!paymentId) {
          throw new Error('Payment ID not found');
        }

        // Check cache
        if (this.paymentCache.has(paymentId)) {
          return await this.retryWithPaymentId(pair, paymentId, amount);
        }

        // Generate and settle payment
        const settled = await this.settlePayment(challenge.accepts[0], paymentId);
        if (!settled) {
          return null;
        }

        // Cache payment
        this.paymentCache.set(paymentId, 'settled');

        // Step 3: Retry with payment-id
        return await this.retryWithPaymentId(pair, paymentId, amount);

      } else if (response.status === 200) {
        return await response.json() as DivergenceResponse;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }

    } catch (error) {
      console.error(`\n❌ Erro ao consultar divergência:`, error);
      return null;
    }
  }

  private async settlePayment(accepts: PaymentChallenge['accepts'][0], paymentId: string): Promise<boolean> {
    try {
      const validBefore = Math.floor(Date.now() / 1000) + accepts.maxTimeoutSeconds;
      const decimals = accepts.asset === '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' ? 6 : 18;
      const formattedValue = ethers.formatUnits(accepts.maxAmountRequired, decimals);
      
      console.log(`💸 Pagando ${formattedValue} ${decimals === 6 ? 'devUSDC.e' : 'CRO'} para análise CEX-DEX...`);
      
      const paymentHeader = await this.facilitator.generatePaymentHeader({
        to: accepts.payTo,
        value: accepts.maxAmountRequired,
        asset: accepts.asset as Contract,
        signer: this.signer as any,
        validBefore,
        validAfter: 0,
      });

      const settleResponse = await fetch(`${BACKEND_URL}/api/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const settleResult = await settleResponse.json() as { txHash?: string };
      console.log(`✅ Payment settled! TX: ${settleResult.txHash || 'N/A'}\n`);
      return true;

    } catch (error) {
      console.error('❌ Erro no settlement:', error);
      return false;
    }
  }

  private async retryWithPaymentId(pair: string, paymentId: string, amount?: string): Promise<DivergenceResponse> {
    const url = `${BACKEND_URL}/api/divergence?pair=${pair}${amount ? `&amount=${amount}` : ''}`;
    const response = await fetch(url, {
      headers: { 'x-payment-id': paymentId },
    });

    if (response.status !== 200) {
      throw new Error(`Retry failed: ${response.status}`);
    }

    return await response.json() as DivergenceResponse;
  }

  displayDivergence(result: DivergenceResponse): void {
    console.log('\n📊 ANÁLISE DE DIVERGÊNCIA CEX-DEX');
    console.log('─'.repeat(60));
    console.log(`📈 Par: ${result.pair}`);
    console.log(`\n💱 Preços:`);
    console.log(`   CEX: $${result.cexPrice.price}`);
    console.log(`   DEX: $${result.dexPrice.price}`);
    console.log(`\n📉 Divergência:`);
    console.log(`   Percentual: ${result.divergence.percentage > 0 ? '+' : ''}${result.divergence.percentage.toFixed(4)}%`);
    console.log(`   Absoluta: $${result.divergence.absolute}`);
    console.log(`   Direção: ${result.divergence.direction === 'DEX_HIGHER' ? 'DEX > CEX' : result.divergence.direction === 'CEX_HIGHER' ? 'CEX > DEX' : 'IGUAL'}`);
    
    if (result.liquidity) {
      console.log(`\n💧 Liquidez DEX:`);
      console.log(`   Disponível: ${result.liquidity.dex.available}`);
      console.log(`   Profundidade: ${result.liquidity.dex.depth}`);
    }

    console.log(`\n🎯 Recomendação:`);
    const actionEmoji = result.recommendation.action === 'ALLOW' ? '✅' : 
                        result.recommendation.action === 'WARN' ? '⚠️' : '🚫';
    console.log(`   ${actionEmoji} ${result.recommendation.action}`);
    console.log(`   Risco: ${result.recommendation.riskLevel}`);
    console.log(`   Motivo: ${result.recommendation.reason}`);
    console.log('─'.repeat(60) + '\n');
  }

  async runDemo(): Promise<void> {
    await this.initialize();

    // Test 1: CRO-USDC (common pair)
    console.log('🧪 TESTE 1: Análise CRO-USDC');
    const result1 = await this.queryDivergence('CRO-USDC');
    if (result1) {
      this.displayDivergence(result1);
    }

    // Test 2: Different pair
    console.log('🧪 TESTE 2: Análise CRO-USDT');
    const result2 = await this.queryDivergence('CRO-USDT');
    if (result2) {
      this.displayDivergence(result2);
    }

    console.log('═'.repeat(60));
    console.log('✅ Demo concluído!');
    console.log('═'.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  const agent = new DivergenceAgent();
  await agent.runDemo();
}

main().catch(console.error);
