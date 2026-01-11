/**
 * Risk Controller
 */

import type { Request, Response, NextFunction } from 'express';
import { RiskService } from '../services/risk/risk.service';
import type { RiskAnalysisRequest } from '../types/risk.types';

export class RiskController {
  constructor(private riskService: RiskService) {}

  async analyzeRisk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { contract, amount, tokenAddress, verify } = req.query;

      if (!contract || typeof contract !== 'string') {
        res.status(400).json({ 
          error: 'missing_contract',
          message: 'Contract address is required' 
        });
        return;
      }

      const request: RiskAnalysisRequest = {
        contract: contract as string,
        amount: amount as string | undefined,
        tokenAddress: tokenAddress as string | undefined,
      };

      const analysis = await this.riskService.analyzeRisk(request);

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

      if (!paymentId || !paymentHeader || !paymentRequirements) {
        res.status(400).json({ 
          error: 'missing_fields',
          message: 'paymentId, paymentHeader, and paymentRequirements are required' 
        });
        return;
      }

      const result = await this.riskService.settlePayment({
        paymentId,
        paymentHeader,
        paymentRequirements,
      });

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
