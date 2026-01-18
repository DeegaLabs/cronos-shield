/**
 * Risk Service
 * 
 * Orchestrates risk analysis and payment settlement
 */

import { ethers } from 'ethers';
import { analyzeRisk } from './risk-analyzer';
import { FacilitatorService } from '../../lib/x402/facilitator.service';
import { recordPayment } from '../../lib/x402/require-x402.middleware';
import { logRiskAnalysis, logPayment } from '../../lib/utils/logger.util';
import { logger } from '../../lib/utils/logger';
import type { 
  RiskAnalysisRequest, 
  RiskAnalysisResponse, 
} from '../../types/risk.types';

const RISK_ORACLE_ABI = [
  "function storeResult(address contractAddress, uint256 score, bytes32 proofHash, uint256 timestamp) external",
  "function verifyProof(address contractAddress, uint256 timestamp, bytes32 proofHash) external view returns (bool)",
];

export interface PaymentSettlementRequest {
  paymentId: string;
  paymentHeader: string;
  paymentRequirements: any;
}

export interface PaymentSettlementResponse {
  ok: boolean;
  txHash?: string;
  error?: string;
}

export class RiskService {
  private facilitatorService: FacilitatorService;
  private signer: ethers.Wallet | null = null;
  private riskOracleContract: ethers.Contract | null = null;

  constructor(
    network: string,
    privateKey?: string,
    rpcUrl?: string,
    contractAddress?: string
  ) {
    this.facilitatorService = new FacilitatorService(network);

    if (privateKey && rpcUrl) {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      this.signer = new ethers.Wallet(privateKey, provider);

      if (contractAddress) {
        this.riskOracleContract = new ethers.Contract(
          contractAddress,
          RISK_ORACLE_ABI,
          this.signer
        );
      }
    }
  }

  async analyzeRisk(request: RiskAnalysisRequest): Promise<RiskAnalysisResponse> {
    logger.debug('RiskService.analyzeRisk called', { contract: request.contract });
    
    logger.debug('Calling analyzeRisk function');
    const analysis = await analyzeRisk(request);
    logger.info('Analysis result', { score: analysis.score, contract: analysis.contract });
    
    const timestamp = Math.floor(Date.now() / 1000);
    logger.debug('Generating proof of risk');

    const proof = await this.generateProofOfRisk({
      contract: request.contract,
      score: analysis.score,
      timestamp,
    });
    logger.debug('Proof generated', { proofPreview: proof.substring(0, 20) + '...' });

    if (this.riskOracleContract && this.signer) {
      try {
        const proofHash = ethers.id(proof);
        await this.riskOracleContract.storeResult(
          request.contract,
          analysis.score,
          proofHash,
          timestamp
        );
      } catch (error) {
        console.error('Failed to store result on-chain:', error);
      }
    }

    // Log risk analysis
      logger.debug('Logging risk analysis');
      try {
        logRiskAnalysis('risk-oracle', {
          contract: request.contract,
          score: analysis.score,
          proof,
          verified: analysis.details.verified || false,
        });
        logger.debug('Risk analysis logged');
    } catch (logError) {
      console.error('⚠️ Failed to log risk analysis (non-critical):', logError);
      // Don't fail the request if logging fails
    }

    console.log('✅ Returning analysis result');
    return {
      ...analysis,
      proof,
      timestamp: timestamp * 1000,
    };
  }

  async settlePayment(request: PaymentSettlementRequest): Promise<PaymentSettlementResponse> {
    const result = await this.facilitatorService.verifyAndSettle(request);

    if (result.ok && result.txHash) {
      recordPayment(request.paymentId, result.txHash);
      
      // Log payment
      logPayment('risk-oracle', {
        paymentId: request.paymentId,
        txHash: result.txHash,
        reason: 'risk_analysis',
      });
    }

    return result;
  }

  private async generateProofOfRisk(data: {
    contract: string;
    score: number;
    timestamp: number;
  }): Promise<string> {
    if (!this.signer) {
      return `0x${Buffer.from(JSON.stringify(data)).toString('hex').padEnd(130, '0')}`;
    }

    const message = JSON.stringify({
      contract: data.contract.toLowerCase(),
      score: data.score,
      timestamp: data.timestamp,
      oracle: await this.signer.getAddress(),
    });

    const signature = await this.signer.signMessage(message);
    return signature;
  }

  async verifyProofOnChain(
    contractAddress: string,
    timestamp: number,
    proof: string
  ): Promise<boolean> {
    if (!this.riskOracleContract) {
      return false;
    }

    try {
      const proofHash = ethers.id(proof);
      const isValid = await this.riskOracleContract.verifyProof(
        contractAddress,
        timestamp,
        proofHash
      );
      return isValid;
    } catch (error) {
      console.error('Failed to verify proof on-chain:', error);
      return false;
    }
  }
}
