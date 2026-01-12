/**
 * Payment Modal Component
 * 
 * Modal for x402 payment flow
 */

import { useEffect } from 'react';
import { useX402Payment } from '../../hooks/useX402Payment';
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
  const { isProcessing, error, txHash, processPayment, reset } = useX402Payment();

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen || !challenge || !walletAddress) {
    console.log('PaymentModal not rendering:', { isOpen, challenge: !!challenge, walletAddress: !!walletAddress, signer: !!signer });
    return null;
  }
  
  console.log('PaymentModal rendering with:', { 
    hasChallenge: !!challenge, 
    walletAddress, 
    hasSigner: !!signer,
    signerType: signer ? typeof signer : 'null'
  });

  const accept = challenge.accepts[0];
  const amount = accept
    ? (parseInt(accept.maxAmountRequired) / 1000000).toFixed(1)
    : '1.0';

  const handlePay = async () => {
    console.log('handlePay called', { walletAddress, signer: !!signer, challenge: !!challenge });
    
    if (!walletAddress || !signer || !challenge) {
      console.error('Missing required data:', { walletAddress: !!walletAddress, signer: !!signer, challenge: !!challenge });
      return;
    }
    
    try {
      console.log('Calling processPayment...');
      const result = await processPayment(challenge, signer);
      console.log('processPayment result:', result);
      
      if (result.success && result.paymentId) {
        onSuccess(result.paymentId);
      } else {
        console.error('Payment failed:', result.error);
      }
    } catch (error) {
      console.error('Error in handlePay:', error);
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

          <div className="flex gap-3">
            <button
              onClick={handlePay}
              disabled={isProcessing || !!txHash}
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
