/**
 * Vault Service
 * 
 * Service for interacting with ShieldedVault smart contract
 */

import { ethers } from 'ethers';
import { RiskService } from '../risk/risk.service';
import { DecisionExplainer } from '../ai/explainer.service';
import { logTransactionBlocked, logTransactionAllowed } from '../../lib/utils/logger.util';
import type {
  VaultBalance,
  VaultInfo,
  DepositRequest,
  WithdrawRequest,
  ExecuteTransactionRequest,
  TransactionResult,
} from '../../types/vault.types';

const SHIELDED_VAULT_ABI = [
  'function deposit() payable',
  'function withdraw(uint256 amount)',
  'function balances(address) view returns (uint256)',
  'function maxRiskScore() view returns (uint256)',
  'function riskOracleAddress() view returns (address)',
  'function riskOracleUrl() view returns (string)',
  'function paused() view returns (bool)',
  'function owner() view returns (address)',
  'function executeWithRiskCheck(address target, bytes calldata, uint256 value, uint256 riskScore, bytes calldata proof) payable returns (bool)',
  'function checkRiskScore(uint256 riskScore) view returns (bool)',
  'event Deposited(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)',
  'event TransactionBlocked(address indexed user, address indexed target, uint256 riskScore, string reason)',
  'event TransactionAllowed(address indexed user, address indexed target, uint256 riskScore)',
];

export class VaultService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;
  private vaultContract: ethers.Contract | null = null;
  private riskService: RiskService;
  private explainer: DecisionExplainer;

  constructor(
    private vaultAddress: string,
    privateKey: string | undefined,
    rpcUrl: string,
    riskService: RiskService
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.riskService = riskService;
    this.explainer = new DecisionExplainer();

    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
    }

    if (vaultAddress) {
      this.vaultContract = new ethers.Contract(
        vaultAddress,
        SHIELDED_VAULT_ABI,
        this.signer || this.provider
      );
    }
  }

  /**
   * Get vault information
   */
  async getVaultInfo(): Promise<VaultInfo> {
    if (!this.vaultContract) {
      throw new Error('Vault contract not initialized');
    }

    const [maxRiskScore, riskOracleAddress, riskOracleUrl, isPaused, owner] = await Promise.all([
      this.vaultContract.maxRiskScore(),
      this.vaultContract.riskOracleAddress(),
      this.vaultContract.riskOracleUrl(),
      this.vaultContract.paused(),
      this.vaultContract.owner(),
    ]);

    return {
      contractAddress: this.vaultAddress,
      maxRiskScore: Number(maxRiskScore),
      riskOracleAddress,
      riskOracleUrl,
      isPaused,
      owner,
    };
  }

  /**
   * Get user balance in vault
   */
  async getBalance(userAddress: string): Promise<VaultBalance> {
    if (!this.vaultContract) {
      throw new Error('Vault contract not initialized');
    }

    const balance = await this.vaultContract.balances(userAddress);
    const balanceFormatted = ethers.formatEther(balance);

    return {
      address: userAddress,
      balance: balance.toString(),
      balanceFormatted,
    };
  }

  /**
   * Deposit native tokens (CRO) into vault
   * Note: This requires the user to sign the transaction, so it's better handled in the frontend
   */
  async deposit(userAddress: string, request: DepositRequest): Promise<TransactionResult> {
    if (!this.vaultContract || !this.signer) {
      throw new Error('Vault contract or signer not initialized');
    }

    // Convert CRO to Wei
    const amountWei = ethers.parseEther(request.amount);

    try {
      const tx = await this.vaultContract.deposit({ value: amountWei });
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      throw new Error(`Deposit failed: ${error.message}`);
    }
  }

  /**
   * Withdraw native tokens (CRO) from vault
   * Note: This requires the user to sign the transaction, so it's better handled in the frontend
   */
  async withdraw(userAddress: string, request: WithdrawRequest): Promise<TransactionResult> {
    if (!this.vaultContract || !this.signer) {
      throw new Error('Vault contract or signer not initialized');
    }

    // Convert CRO to Wei
    const amountWei = ethers.parseEther(request.amount);

    try {
      const tx = await this.vaultContract.withdraw(amountWei);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      throw new Error(`Withdraw failed: ${error.message}`);
    }
  }

  /**
   * Execute transaction with risk check
   */
  async executeTransaction(
    userAddress: string,
    request: ExecuteTransactionRequest
  ): Promise<TransactionResult> {
    if (!this.vaultContract || !this.signer) {
      throw new Error('Vault contract or signer not initialized');
    }

    // Get risk analysis for target contract (if provided) or use default
    let riskScore = 50; // Default risk score
    let proofBytes: Uint8Array = new Uint8Array(0);

    if (request.contractAddress || request.target) {
      const contractToAnalyze = request.contractAddress || request.target;
      try {
        // Query Risk Oracle for risk analysis
        const riskAnalysis = await this.riskService.analyzeRisk({
          contract: contractToAnalyze,
        });

        riskScore = riskAnalysis.score;
        // For POC, we'll use a simple proof (in production, this would be the actual Proof of Risk)
        // Convert proof string to bytes
        proofBytes = ethers.toUtf8Bytes(riskAnalysis.proof);
      } catch (error) {
        // Failed to get risk analysis, using default score
      }
    }

    // Convert CRO to Wei
    const valueWei = ethers.parseEther(request.value || '0');

    // Convert callData from hex string to bytes
    let callDataBytes: Uint8Array;
    try {
      callDataBytes = ethers.getBytes(request.callData || '0x');
    } catch {
      callDataBytes = new Uint8Array(0);
    }

    try {
      // Check if transaction would be blocked
      const wouldBeBlocked = await this.vaultContract.checkRiskScore(riskScore);
      
      if (!wouldBeBlocked) {
        // Transaction would be blocked
        const reason = `Risk score ${riskScore} exceeds maximum allowed threshold`;
        
        // Generate AI-powered explanation
        let explanation: string | undefined;
        try {
          explanation = await this.explainer.explainDecision({
            action: 'block',
            riskScore,
            contract: request.target,
            reason,
          });
        } catch (error) {
          console.warn('Failed to generate explanation:', error);
        }

        // Log transaction blocked (fire-and-forget)
        logTransactionBlocked('shielded-vault', {
          user: userAddress,
          target: request.target,
          score: riskScore,
          reason,
        });

        return {
          success: false,
          blocked: true,
          riskScore,
          reason,
          explanation,
        };
      }

      // Execute transaction
      const tx = await this.vaultContract.executeWithRiskCheck(
        request.target,
        callDataBytes,
        valueWei,
        riskScore,
        proofBytes,
        { value: valueWei }
      );
      const receipt = await tx.wait();

      await logTransactionAllowed('shielded-vault', {
        user: userAddress,
        target: request.target,
        score: riskScore,
      });

      return {
        success: true,
        txHash: receipt.hash,
        riskScore,
      };
    } catch (error: any) {
      // Check if transaction was blocked
      if (error.message?.includes('Risk score exceeds')) {
        // Generate AI-powered explanation
        let explanation: string | undefined;
        try {
          explanation = await this.explainer.explainDecision({
            action: 'block',
            riskScore,
            contract: request.target,
            reason: error.message,
          });
        } catch (explainError) {
          console.warn('Failed to generate explanation:', explainError);
        }

        // Log transaction blocked (fire-and-forget)
        logTransactionBlocked('shielded-vault', {
          user: userAddress,
          target: request.target,
          score: riskScore,
          reason: error.message,
        });

        return {
          success: false,
          blocked: true,
          riskScore,
          reason: error.message,
          explanation,
        };
      }

      throw new Error(`Transaction execution failed: ${error.message}`);
    }
  }
}
