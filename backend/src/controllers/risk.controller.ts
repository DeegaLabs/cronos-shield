/**
 * Risk Controller
 */

import type { Request, Response, NextFunction } from 'express';
import { RiskService } from '../services/risk/risk.service';
import { validateAddress } from '../lib/utils/validation.util';
import type { RiskAnalysisRequest } from '../types/risk.types';

export class RiskController {
  constructor(private riskService: RiskService) {}

  async analyzeRisk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('🔍 analyzeRisk called:', {
        contract: req.query.contract,
        paymentId: req.header('x-payment-id'),
        query: req.query,
      });

      const { contract, amount, tokenAddress, verify } = req.query;

      console.log('✅ Validating contract address...');
      // Normalize address to lowercase before validation
      const normalizedContract = (contract as string).toLowerCase();
      validateAddress(normalizedContract, 'contract');
      
      if (tokenAddress) {
        validateAddress(tokenAddress as string, 'tokenAddress');
      }

      const request: RiskAnalysisRequest = {
        contract: normalizedContract, // Use normalized address
        amount: amount as string | undefined,
        tokenAddress: tokenAddress ? (tokenAddress as string).toLowerCase() : undefined,
      };

      console.log('⏳ Calling riskService.analyzeRisk...');
      const analysis = await this.riskService.analyzeRisk(request);
      console.log('✅ Risk analysis completed:', {
        score: analysis.score,
        contract: analysis.contract,
        hasProof: !!analysis.proof,
      });

      if (verify === 'true' && analysis.timestamp) {
        const timestamp = Math.floor(analysis.timestamp / 1000);
        const verified = await this.riskService.verifyProofOnChain(
          contract as string,
          timestamp,
          analysis.proof
        );
        (analysis as any).verified = verified;
      }

      res.status(200).json(analysis);
    } catch (error) {
      next(error);
    }
  }

  async pay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentId, paymentHeader, paymentRequirements } = req.body;

      console.log('💰 Payment settlement request received:', {
        paymentId,
        paymentHeaderLength: paymentHeader?.length,
        hasPaymentRequirements: !!paymentRequirements,
      });

      if (!paymentId || !paymentHeader || !paymentRequirements) {
        console.error('❌ Missing required fields:', {
          hasPaymentId: !!paymentId,
          hasPaymentHeader: !!paymentHeader,
          hasPaymentRequirements: !!paymentRequirements,
        });
        res.status(400).json({ 
          error: 'missing_fields',
          message: 'paymentId, paymentHeader, and paymentRequirements are required' 
        });
        return;
      }

      console.log('⏳ Processing payment settlement...');
      const result = await this.riskService.settlePayment({
        paymentId,
        paymentHeader,
        paymentRequirements,
      });

      console.log('✅ Payment settlement result:', {
        ok: result.ok,
        txHash: result.txHash,
        error: result.error,
      });

      if (!result.ok) {
        console.error('❌ Payment settlement failed:', result.error);
        res.status(400).json(result);
        return;
      }

      console.log('✅ Payment settled successfully, txHash:', result.txHash);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Payment settlement error:', error);
      next(error);
    }
  }
}
