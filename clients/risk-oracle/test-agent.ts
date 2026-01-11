/**
 * Test Agent - Cliente completo para testar Risk Oracle
 * 
 * Simula um agente IA completo que:
 * - Descobre recursos protegidos
 * - Lida com pagamentos x402 automaticamente
 * - Analisa múltiplos contratos
 * - Mostra resultados formatados
 * 
 * Usage:
 *   npm run test
 *   npm run test 0x123... (com endereço específico)
 */

import { ethers } from 'ethers';
import { Facilitator, CronosNetwork } from '@crypto.com/facilitator-client';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const RPC_URL = process.env.RPC_URL || 'https://evm-t3.cronos.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error('❌ PRIVATE_KEY not set in .env file');
}

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
  details: {
    liquidity?: string;
    contractAge?: string;
    holders?: number;
    verified?: boolean;
    warnings?: string[];
  };
  timestamp: number;
  contract: string;
  verified?: boolean;
}

class TestAgent {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private facilitator: Facilitator;
  private address: string;
  private paymentCache: Map<string, string> = new Map(); // paymentId cache

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.signer = new ethers.Wallet(PRIVATE_KEY!, this.provider);
    this.facilitator = new Facilitator({ network: CronosNetwork.CronosTestnet });
    this.address = this.signer.address;
  }

  async initialize(): Promise<void> {
    console.log('🤖 Test Agent - Cronos Risk Oracle\n');
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

  async analyzeContract(contractAddress: string): Promise<RiskAnalysisResponse | null> {
    console.log(`\n📊 Analisando contrato: ${contractAddress}`);
    console.log('─'.repeat(60));

    try {
      // Step 1: Request analysis
      console.log('📡 [1/4] Fazendo requisição...');
      const response = await fetch(
        `${BACKEND_URL}/api/risk-analysis?contract=${contractAddress}&verify=true`
      );

      // Step 2: Handle 402 or direct response
      if (response.status === 402) {
        console.log('💳 [2/4] Pagamento necessário (402)');
        const challenge = await response.json() as PaymentChallenge;
        const paymentId = challenge.accepts[0].extra?.paymentId;
        
        if (!paymentId) {
          throw new Error('Payment ID not found');
        }

        // Check cache
        if (this.paymentCache.has(paymentId)) {
          console.log('✅ Usando payment-id do cache');
          return await this.retryWithPaymentId(contractAddress, paymentId);
        }

        // Generate and settle payment
        const settled = await this.settlePayment(challenge.accepts[0], paymentId);
        if (!settled) {
          return null;
        }

        // Cache payment
        this.paymentCache.set(paymentId, 'settled');

        // Step 3: Retry with payment-id
        console.log('🔄 [3/4] Retry com payment-id...');
        return await this.retryWithPaymentId(contractAddress, paymentId);

      } else if (response.status === 200) {
        console.log('✅ [1/4] Análise recebida (já pago)');
        const result = await response.json() as RiskAnalysisResponse;
        this.displayResult(result);
        return result;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }

    } catch (error) {
      console.error(`\n❌ Erro ao analisar contrato:`, error);
      return null;
    }
  }

  private async settlePayment(accepts: PaymentChallenge['accepts'][0], paymentId: string): Promise<boolean> {
    try {
      console.log('💸 [2/4] Gerando payment header...');
      
      const validBefore = Math.floor(Date.now() / 1000) + accepts.maxTimeoutSeconds;
      
      // devUSDC.e tem 6 decimais, não 18 - formatar ANTES de mostrar
      const decimals = accepts.asset === '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' ? 6 : 18;
      const formattedValue = ethers.formatUnits(accepts.maxAmountRequired, decimals);
      console.log(`💰 Valor: ${formattedValue} ${decimals === 6 ? 'devUSDC.e' : 'CRO'}`);
      
      const paymentHeader = await this.facilitator.generatePaymentHeader({
        to: accepts.payTo,
        value: accepts.maxAmountRequired,
        asset: accepts.asset as any, // devUSDC.e address (string) as Contract
        signer: this.signer as any,
        validBefore,
        validAfter: 0,
      });
      console.log('📝 Fazendo settlement...');

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
      console.log(`✅ Payment settled! TX: ${settleResult.txHash || 'N/A'}`);
      return true;

    } catch (error) {
      console.error('❌ Erro no settlement:', error);
      return false;
    }
  }

  private async retryWithPaymentId(contractAddress: string, paymentId: string): Promise<RiskAnalysisResponse> {
    const response = await fetch(
      `${BACKEND_URL}/api/risk-analysis?contract=${contractAddress}&verify=true`,
      {
        headers: { 'x-payment-id': paymentId },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Retry failed: ${response.status}`);
    }

    const result = await response.json() as RiskAnalysisResponse;
    console.log('✅ [4/4] Análise recebida!');
    this.displayResult(result);
    return result;
  }

  private displayResult(result: RiskAnalysisResponse): void {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESULTADO DA ANÁLISE');
    console.log('═'.repeat(60));
    
    // Risk Score with visual indicator
    const riskLevel = this.getRiskLevel(result.score);
    console.log(`\n🎯 Risk Score: ${result.score}/100 ${riskLevel.icon} ${riskLevel.label}`);
    
    // Score bar
    const barLength = 40;
    const filled = Math.round((result.score / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    console.log(`   [${bar}]`);
    
    // Details
    console.log('\n📋 Detalhes:');
    if (result.details.liquidity) {
      console.log(`   💧 Liquidez: ${result.details.liquidity}`);
    }
    if (result.details.contractAge) {
      console.log(`   📅 Idade do contrato: ${result.details.contractAge}`);
    }
    if (result.details.holders !== undefined) {
      console.log(`   👥 Holders: ${result.details.holders.toLocaleString()}`);
    }
    if (result.details.verified !== undefined) {
      console.log(`   ✅ Verificado: ${result.details.verified ? 'Sim' : 'Não'}`);
    }
    
    // Warnings
    if (result.details.warnings && result.details.warnings.length > 0) {
      console.log('\n⚠️  Avisos:');
      result.details.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }
    
    // Proof
    console.log(`\n🔐 Proof of Risk:`);
    console.log(`   ${result.proof.substring(0, 20)}...${result.proof.substring(result.proof.length - 20)}`);
    
    // Verification
    if (result.verified !== undefined) {
      console.log(`\n✅ Verificação On-chain: ${result.verified ? '✓ Válido' : '✗ Inválido'}`);
    }
    
    // Timestamp
    console.log(`\n🕐 Timestamp: ${new Date(result.timestamp).toLocaleString()}`);
    console.log(`📍 Contract: ${result.contract}`);
    
    console.log('\n' + '═'.repeat(60) + '\n');
  }

  private getRiskLevel(score: number): { icon: string; label: string } {
    if (score < 30) return { icon: '🟢', label: 'BAIXO RISCO' };
    if (score < 70) return { icon: '🟡', label: 'RISCO MÉDIO' };
    return { icon: '🔴', label: 'ALTO RISCO' };
  }

  async testMultipleContracts(contracts: string[]): Promise<void> {
    console.log(`\n🧪 Testando ${contracts.length} contratos...\n`);
    
    const results: Array<{ contract: string; score: number; success: boolean }> = [];
    
    for (const contract of contracts) {
      const result = await this.analyzeContract(contract);
      if (result) {
        results.push({
          contract,
          score: result.score,
          success: true,
        });
      } else {
        results.push({
          contract,
          score: -1,
          success: false,
        });
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('═'.repeat(60));
    console.log(`Total: ${results.length} contratos`);
    console.log(`Sucesso: ${results.filter(r => r.success).length}`);
    console.log(`Falhas: ${results.filter(r => !r.success).length}`);
    console.log(`Score médio: ${results.filter(r => r.success).reduce((acc, r) => acc + r.score, 0) / results.filter(r => r.success).length || 0}`);
    console.log('═'.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  const agent = new TestAgent();
  
  try {
    await agent.initialize();
    
    // Get contract address from args or use default
    const contractAddress = process.argv[2] || '0x0000000000000000000000000000000000000000';
    
    if (process.argv[2] && process.argv[2].includes(',')) {
      // Multiple contracts
      const contracts = process.argv[2].split(',').map(c => c.trim());
      await agent.testMultipleContracts(contracts);
    } else {
      // Single contract
      await agent.analyzeContract(contractAddress);
    }
    
    console.log('✅ Teste concluído!\n');
    
  } catch (error) {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  }
}

main();
