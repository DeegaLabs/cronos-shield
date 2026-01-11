/**
 * Facilitator Service
 * 
 * Unified x402 Facilitator service for all endpoints
 * Wraps the @crypto.com/facilitator-client SDK
 */

import { Facilitator, CronosNetwork, type VerifyRequest, type X402VerifyResponse, type X402SettleResponse } from '@crypto.com/facilitator-client';

export interface PaymentSettlementRequest {
  paymentId: string;
  paymentHeader: string;
  paymentRequirements: any;
}

export class FacilitatorService {
  private facilitator: Facilitator;

  constructor(network: string = 'cronos-testnet') {
    const cronosNetwork = network === 'cronos-mainnet' 
      ? CronosNetwork.CronosMainnet 
      : CronosNetwork.CronosTestnet;
    this.facilitator = new Facilitator({ network: cronosNetwork });
  }

  /**
   * Verifies a payment using the Facilitator SDK
   */
  async verifyPayment(request: PaymentSettlementRequest): Promise<X402VerifyResponse> {
    const verifyRequest: VerifyRequest = {
      x402Version: 1,
      paymentHeader: request.paymentHeader,
      paymentRequirements: request.paymentRequirements as any,
    };

    return await this.facilitator.verifyPayment(verifyRequest) as X402VerifyResponse;
  }

  /**
   * Settles a payment using the Facilitator SDK
   */
  async settlePayment(request: PaymentSettlementRequest): Promise<X402SettleResponse> {
    const settleRequest: VerifyRequest = {
      x402Version: 1,
      paymentHeader: request.paymentHeader,
      paymentRequirements: request.paymentRequirements as any,
    };

    return await this.facilitator.settlePayment(settleRequest) as X402SettleResponse;
  }

  /**
   * Verifies and settles a payment in one operation
   */
  async verifyAndSettle(request: PaymentSettlementRequest): Promise<{ ok: boolean; txHash?: string; error?: string }> {
    try {
      const verifyResult = await this.verifyPayment(request);
      
      if (!verifyResult.isValid) {
        return {
          ok: false,
          error: 'verify_failed',
        };
      }

      const settleResult = await this.settlePayment(request);
      
      if (settleResult.event !== 'payment.settled') {
        return {
          ok: false,
          error: 'settle_failed',
        };
      }

      return {
        ok: true,
        txHash: settleResult.txHash,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
