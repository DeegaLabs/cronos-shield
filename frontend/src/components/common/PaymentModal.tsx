/**
 * Payment Modal Component
 * 
 * Modal for x402 payment flow
 */

import { useEffect, useState } from 'react';
import { Facilitator } from '@crypto.com/facilitator-client';
import type { PaymentChallenge } from '../../types/x402.types';

interface PaymentModalProps {
  challenge: PaymentChallenge | null;
  walletAddress: string | null;
  signer: any; // ethers.JsonRpcSigner | null
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
}

export default function PaymentModal({
  challenge,
  walletAddress,
  signer,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  // Only initialize state when modal is open to avoid importing Facilitator SDK unnecessarily
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Early return BEFORE any hooks or SDK imports are used
  if (!isOpen || !challenge) {
    return null;
  }
  
  // Check if wallet is ready
  const isWalletReady = !!(walletAddress && signer);
  
  // Show modal even if wallet not connected, but show warning
  if (!walletAddress || !signer) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg border border-yellow-500 max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Wallet Not Connected</h3>
          <p className="text-slate-300 mb-4">
            Please connect your wallet first to make payments. Click "Connect Wallet" in the header.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const accept = challenge.accepts[0];
  const amount = accept
    ? (parseInt(accept.maxAmountRequired) / 1000000).toFixed(1)
    : '1.0';

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);

  const handlePay = async () => {
    if (!walletAddress || !signer || !challenge) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setTxHash(null);

    try {
      // Get payment requirements first to know which network we need
      const accept = challenge.accepts[0];
      if (!accept) {
        throw new Error('No payment method available');
      }

      // Use the signer passed from useWallet hook (already connected)
      if (!signer || !signer.provider) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      // Verify we're on the correct network using eth_chainId directly
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error('MetaMask not found');
      }

      let chainId: string;
      try {
        chainId = await ethereum.request({ method: 'eth_chainId' });
      } catch (error: any) {
        throw new Error('Failed to get chain ID. Please check MetaMask.');
      }

      const chainIdNum = parseInt(chainId, 16);
      const currentChainId = BigInt(chainIdNum);
      const expectedChainId = accept.network === 'cronos-mainnet' ? 25n : 338n;
      
      if (currentChainId !== expectedChainId) {
        const chainIdHex = accept.network === 'cronos-mainnet' ? '0x19' : '0x152';
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e: any) {
          if (e?.code === 4902 && accept.network === 'cronos-testnet') {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x152',
                chainName: 'Cronos Testnet',
                nativeCurrency: { name: 'tCRO', symbol: 'tCRO', decimals: 18 },
                rpcUrls: ['https://evm-t3.cronos.org'],
                blockExplorerUrls: ['https://testnet.cronoscan.com'],
              }],
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw new Error(`Please switch to Cronos ${accept.network === 'cronos-mainnet' ? 'Mainnet' : 'Testnet'}`);
          }
        }
      }

      // Wait a bit to ensure network switch is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Initialize Facilitator only when needed (when modal is open and user clicks pay)
      const facilitator = new Facilitator({ network: accept.network });

      // Get payment ID from challenge
      const paymentId = accept.extra?.paymentId;
      if (!paymentId) {
        throw new Error('Payment ID not found in challenge');
      }

      // Generate payment header
      const validBefore = Math.floor(Date.now() / 1000) + accept.maxTimeoutSeconds;
      
      let paymentHeader: string;
      try {
        if (!signer || !signer.provider) {
          throw new Error('Signer is no longer valid. Please reconnect your wallet.');
        }

        paymentHeader = await facilitator.generatePaymentHeader({
          to: accept.payTo,
          value: accept.maxAmountRequired,
          asset: accept.asset,
          signer,
          validBefore,
          validAfter: 0,
        });
      } catch (headerError: any) {
        const errorMsg = headerError?.message || String(headerError);
        const isUnexpectedError = errorMsg.includes('Unexpected error') || 
                                  errorMsg.includes('evmAsk') ||
                                  errorMsg.includes('selectExtension') ||
                                  errorMsg.includes('_detectNetwork');
        
        if (isUnexpectedError) {
          throw new Error(
            'MetaMask connection error. Please: 1) Refresh the page, 2) Reconnect your wallet, 3) Ensure MetaMask is unlocked, 4) Try again'
          );
        }
        
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

      setIsProcessing(false);
      setError(null);
      setTxHash(settleResult.txHash || null);

      // Store payment ID for retry
      localStorage.setItem('x-payment-id', paymentId);

      if (paymentId) {
        onSuccess(paymentId);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setIsProcessing(false);
      setError(errorMessage);
      setTxHash(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">💰 x402 Payment</h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-200 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-slate-300 mb-2">{challenge.message}</p>
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Amount:</span>
                <span className="text-xl font-bold text-blue-400">{amount} devUSDC.e</span>
              </div>
              {accept && (
                <>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-400">Network:</span>
                    <span className="text-slate-300">{accept.network}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-400">Valid for:</span>
                    <span className="text-slate-300">{accept.maxTimeoutSeconds}s</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 p-3 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {txHash && (
            <div className="bg-green-900/50 border border-green-500 p-3 rounded-lg">
              <p className="text-green-400 text-sm mb-1">✅ Payment successful!</p>
              <p className="text-green-300 text-xs break-all">Tx: {txHash}</p>
            </div>
          )}

          {!isWalletReady && (
            <div className="bg-yellow-900/50 border border-yellow-500 p-3 rounded-lg mb-4">
              <p className="text-yellow-400 text-sm">
                ⚠️ Please connect your wallet first to make payments. Click "Connect Wallet" in the header.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handlePay}
              disabled={isProcessing || !!txHash || !isWalletReady}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isProcessing ? 'Processing...' : txHash ? 'Paid' : 'Pay with x402'}
            </button>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg transition-colors"
            >
              {txHash ? 'Close' : 'Cancel'}
            </button>
          </div>

          {challenge.service && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400">
                Service: {challenge.service.name} v{challenge.service.version}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
