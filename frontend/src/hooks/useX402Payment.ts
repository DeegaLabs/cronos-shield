/**
 * x402 Payment Hook
 * 
 * Manages x402 payment flow using Facilitator SDK
 */

import { useState, useCallback } from 'react';
import { Facilitator, CronosNetwork } from '@crypto.com/facilitator-client';
import { ethers } from 'ethers';
import type { PaymentChallenge, PaymentState } from '../types/x402.types';

const NETWORK = import.meta.env.VITE_NETWORK || 'cronos-testnet';

export function useX402Payment() {
  const [state, setState] = useState<PaymentState>({
    isProcessing: false,
    error: null,
    paymentId: null,
    txHash: null,
  });

  const processPayment = useCallback(async (
    challenge: PaymentChallenge
  ): Promise<{ success: boolean; paymentId?: string; txHash?: string; error?: string }> => {
    setState({
      isProcessing: true,
      error: null,
      paymentId: null,
      txHash: null,
    });

    try {
      // Get wallet provider
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const ethereum = (window as any).ethereum;
      
      // Ensure we're on the correct network
      try {
        const chainId = await ethereum.request({ method: 'eth_chainId' });
        const expectedChainId = NETWORK === 'cronos-mainnet' ? '0x19' : '0x152';
        if (chainId !== expectedChainId) {
          throw new Error(`Please switch to Cronos ${NETWORK === 'cronos-mainnet' ? 'Mainnet' : 'Testnet'}`);
        }
      } catch (networkError) {
        throw new Error('Failed to verify network. Please ensure you are on Cronos Testnet.');
      }

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      // Verify signer address
      const signerAddress = await signer.getAddress();
      if (!signerAddress) {
        throw new Error('Failed to get wallet address');
      }

      // Initialize Facilitator with explicit network
      const cronosNetwork = NETWORK === 'cronos-mainnet'
        ? CronosNetwork.CronosMainnet
        : CronosNetwork.CronosTestnet;
      
      const facilitator = new Facilitator({ network: cronosNetwork });

      // Get payment requirements from challenge
      const accept = challenge.accepts[0];
      if (!accept) {
        throw new Error('No payment method available');
      }

      // Get payment ID from challenge
      const paymentId = accept.extra?.paymentId;
      if (!paymentId) {
        throw new Error('Payment ID not found in challenge');
      }

      // Generate payment header
      const validBefore = Math.floor(Date.now() / 1000) + accept.maxTimeoutSeconds;
      
      let paymentHeader: string;
      try {
        paymentHeader = await facilitator.generatePaymentHeader({
          to: accept.payTo,
          value: accept.maxAmountRequired,
          asset: accept.asset as any,
          signer: signer as any,
          validBefore,
          validAfter: 0,
        });
      } catch (headerError) {
        const errorMsg = headerError instanceof Error ? headerError.message : String(headerError);
        throw new Error(`Failed to generate payment header: ${errorMsg}. Please ensure MetaMask is unlocked and you have sufficient balance.`);
      }

      // Determine endpoint based on service name or resource URL
      const serviceName = challenge.service?.name?.toLowerCase() || '';
      const resourceUrl = accept.resource || '';
      let endpoint = 'risk'; // default
      
      if (serviceName.includes('divergence') || serviceName.includes('cex-dex') || resourceUrl.includes('divergence')) {
        endpoint = 'divergence';
      } else if (serviceName.includes('risk') || resourceUrl.includes('risk')) {
        endpoint = 'risk';
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const settleResponse = await fetch(`${backendUrl}/api/${endpoint}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          paymentHeader,
          paymentRequirements: accept,
        }),
      });

      if (!settleResponse.ok) {
        const error = await settleResponse.json();
        throw new Error(`Settlement failed: ${JSON.stringify(error)}`);
      }

      const settleResult = await settleResponse.json();

      setState({
        isProcessing: false,
        error: null,
        paymentId,
        txHash: settleResult.txHash || undefined,
      });

      // Store payment ID for retry
      localStorage.setItem('x-payment-id', paymentId);

      return {
        success: true,
        paymentId,
        txHash: settleResult.txHash,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setState({
        isProcessing: false,
        error: errorMessage,
        paymentId: null,
        txHash: null,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      paymentId: null,
      txHash: null,
    });
  }, []);

  return {
    ...state,
    processPayment,
    reset,
  };
}
