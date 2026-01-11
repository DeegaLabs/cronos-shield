/**
 * Test Vault Agent - Cliente completo para testar Shielded Vault
 * 
 * Simula um agente IA que:
 * - Deposita fundos no vault
 * - Tenta executar transações
 * - Consulta Risk Oracle (POC 1) via x402
 * - Verifica se transações são bloqueadas/permitidas
 * 
 * Usage:
 *   npm run test
 */

import { ethers } from 'ethers';
import { Facilitator, CronosNetwork } from '@crypto.com/facilitator-client';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const RPC_URL = process.env.RPC_URL || 'https://evm-t3.cronos.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RISK_ORACLE_URL = process.env.RISK_ORACLE_URL || 'http://localhost:3000';
const SHIELDED_VAULT_ADDRESS = process.env.SHIELDED_VAULT_ADDRESS;

if (!PRIVATE_KEY) {
  throw new Error('❌ PRIVATE_KEY not set in .env file');
}

if (!SHIELDED_VAULT_ADDRESS) {
  throw new Error('❌ SHIELDED_VAULT_ADDRESS not set in .env file');
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
}

class VaultAgent {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private facilitator: Facilitator;
  private address: string;
  private vault: ethers.Contract;
  private paymentCache: Map<string, string> = new Map();

  // ABI simplificado do ShieldedVault
  private vaultABI = [
    "function deposit() payable",
    "function withdraw(uint256 amount)",
    "function balances(address) view returns (uint256)",
    "function executeWithRiskCheck(address target, bytes calldata, uint256 value, uint256 riskScore, bytes calldata proof) payable returns (bool)",
    "function checkRiskScore(uint256 riskScore) view returns (bool)",
    "function maxRiskScore() view returns (uint256)",
    "function riskOracleUrl() view returns (string)",
    "event Deposited(address indexed user, uint256 amount)",
    "event TransactionBlocked(address indexed user, address indexed target, uint256 riskScore, string reason)",
    "event TransactionAllowed(address indexed user, address indexed target, uint256 riskScore)"
  ];

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.signer = new ethers.Wallet(PRIVATE_KEY!, this.provider);
    this.facilitator = new Facilitator({ network: CronosNetwork.CronosTestnet });
    this.address = this.signer.address;
    this.vault = new ethers.Contract(SHIELDED_VAULT_ADDRESS!, this.vaultABI, this.signer);
  }

  async initialize(): Promise<void> {
    console.log('🛡️  Vault Agent - Shielded Vault Test\n');
    console.log('═'.repeat(60));
    
    const balance = await this.provider.getBalance(this.address);
    console.log(`👤 Wallet: ${this.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} TCRO`);
    
    if (balance === 0n) {
      throw new Error('\n❌ Saldo insuficiente! Obtenha TCRO em: https://cronos.org/faucet');
    }

    const vaultBalance = await this.vault.balances(this.address);
    const maxRisk = await this.vault.maxRiskScore();
    
    console.log(`🛡️  Vault: ${SHIELDED_VAULT_ADDRESS}`);
    console.log(`💵 Vault Balance: ${ethers.formatEther(vaultBalance)} CRO`);
    console.log(`🎯 Max Risk Score: ${maxRisk}`);
    console.log(`📡 Risk Oracle: ${RISK_ORACLE_URL}`);
    console.log(`🌐 Network: Cronos Testnet\n`);
    console.log('═'.repeat(60) + '\n');
  }

  async deposit(amount: string): Promise<void> {
    const amountWei = ethers.parseEther(amount);
    console.log(`💳 Depositando ${amount} CRO no vault...`);
    
    const tx = await this.vault.deposit({ value: amountWei });
    await tx.wait();
    
    console.log(`✅ Depositado! TX: ${tx.hash}`);
    const newBalance = await this.vault.balances(this.address);
    console.log(`💰 Novo saldo no vault: ${ethers.formatEther(newBalance)} CRO\n`);
  }

  async queryRiskOracle(contractAddress: string): Promise<RiskAnalysisResponse | null> {
    try {
      // Step 1: Request analysis
      const response = await fetch(
        `${RISK_ORACLE_URL}/api/risk-analysis?contract=${contractAddress}`
      );

      // Step 2: Handle 402 or direct response
      if (response.status === 402) {
        const challenge = await response.json() as PaymentChallenge;
        const paymentId = challenge.accepts[0].extra?.paymentId;
        
        if (!paymentId) {
          throw new Error('Payment ID not found');
        }

        // Check cache
        if (this.paymentCache.has(paymentId)) {
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
        return await this.retryWithPaymentId(contractAddress, paymentId);

      } else if (response.status === 200) {
        return await response.json() as RiskAnalysisResponse;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }

    } catch (error) {
      console.error(`\n❌ Erro ao consultar Risk Oracle:`, error);
      return null;
    }
  }

  private async settlePayment(accepts: PaymentChallenge['accepts'][0], paymentId: string): Promise<boolean> {
    try {
      const validBefore = Math.floor(Date.now() / 1000) + accepts.maxTimeoutSeconds;
      const decimals = accepts.asset === '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' ? 6 : 18;
      const formattedValue = ethers.formatUnits(accepts.maxAmountRequired, decimals);
      
      console.log(`💸 Pagando ${formattedValue} ${decimals === 6 ? 'devUSDC.e' : 'CRO'} ao Risk Oracle...`);
      
      const paymentHeader = await this.facilitator.generatePaymentHeader({
        to: accepts.payTo,
        value: accepts.maxAmountRequired,
        asset: accepts.asset as any,
        signer: this.signer as any,
        validBefore,
        validAfter: 0,
      });

      const settleResponse = await fetch(`${RISK_ORACLE_URL}/api/pay`, {
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

  private async retryWithPaymentId(contractAddress: string, paymentId: string): Promise<RiskAnalysisResponse> {
    const response = await fetch(
      `${RISK_ORACLE_URL}/api/risk-analysis?contract=${contractAddress}`,
      {
        headers: { 'x-payment-id': paymentId },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Retry failed: ${response.status}`);
    }

    return await response.json() as RiskAnalysisResponse;
  }

  async attemptTransaction(targetContract: string, value: string = "0.1"): Promise<void> {
    console.log(`\n🔄 Tentando executar transação:`);
    console.log(`   Target: ${targetContract}`);
    console.log(`   Value: ${value} CRO`);
    console.log('─'.repeat(60));

    // Step 1: Query Risk Oracle
    console.log('📡 [1/3] Consultando Risk Oracle...');
    const analysis = await this.queryRiskOracle(targetContract);
    
    if (!analysis) {
      console.log('❌ Falha ao obter análise de risco');
      return;
    }

    console.log(`✅ Risk Score: ${analysis.score}/100`);
    
    // Step 2: Check if transaction would be allowed
    const allowed = await this.vault.checkRiskScore(analysis.score);
    console.log(`🔍 [2/3] Verificando se transação seria permitida...`);
    console.log(`   Score: ${analysis.score} | Threshold: ${await this.vault.maxRiskScore()}`);
    
    if (!allowed) {
      console.log(`\n🚫 TRANSAÇÃO BLOQUEADA!`);
      console.log(`   Motivo: Risk score (${analysis.score}) excede o threshold`);
      console.log(`   Seu saldo está protegido! 🛡️\n`);
      return;
    }

    // Step 3: Execute transaction (simplified - just call the function)
    console.log(`✅ [3/3] Transação permitida!`);
    console.log(`   Executando transação...`);
    
    const valueWei = ethers.parseEther(value);
    const callData = "0x"; // Empty call data for testing
    const proofBytes = ethers.toUtf8Bytes(analysis.proof || "0x"); // Convert proof to bytes
    
    try {
      const tx = await this.vault.executeWithRiskCheck(
        targetContract,
        callData,
        valueWei,
        analysis.score,
        proofBytes,
        { value: valueWei }
      );
      
      const receipt = await tx.wait();
      console.log(`✅ Transação executada! TX: ${tx.hash}\n`);
      
      // Check events
      const allowedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.vault.interface.parseLog(log);
          return parsed?.name === 'TransactionAllowed';
        } catch {
          return false;
        }
      });
      
      if (allowedEvent) {
        console.log('✅ Evento TransactionAllowed emitido!');
      }
      
    } catch (error: any) {
      console.error(`❌ Erro ao executar transação:`, error.message);
    }
  }

  async runDemo(): Promise<void> {
    await this.initialize();

    // Deposit some funds
    await this.deposit("1.0");

    // Test 1: Safe contract (low risk)
    console.log('\n🧪 TESTE 1: Contrato Seguro (Score Baixo)');
    await this.attemptTransaction("0x1234567890123456789012345678901234567890", "0.1");

    // Test 2: Risky contract (high risk)
    console.log('\n🧪 TESTE 2: Contrato Arriscado (Score Alto)');
    await this.attemptTransaction("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", "0.1");

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Demo concluído!');
    console.log('═'.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  const agent = new VaultAgent();
  await agent.runDemo();
}

main().catch(console.error);
