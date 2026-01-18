/**
 * Risk Analysis Component
 */

import { useState, lazy, Suspense } from 'react';
import apiClient from '../../lib/api/client';
import { useAccount, useWalletClient } from 'wagmi';
import { GlassCard } from '../cards/GlassCard';
import type { RiskAnalysis as RiskAnalysisType } from '../../types';
import type { PaymentChallenge } from '../../types/x402.types';

// Lazy load PaymentModal ONLY when user clicks "Pay with x402"
// This prevents SDK from loading when 402 is received
const PaymentModalLazy = lazy(() => import('../common/PaymentModal'));

interface RiskAnalysisProps {
  contractAddress?: string;
  onAnalysisComplete?: (analysis: RiskAnalysisType) => void;
}

export default function RiskAnalysis({ contractAddress: initialContract = '', onAnalysisComplete }: RiskAnalysisProps = {}) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [contract, setContract] = useState(initialContract || '');
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentChallenge, setPaymentChallenge] = useState<PaymentChallenge | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleAnalyze = async (overridePaymentId?: string) => {
    if (!contract.trim()) {
      setError('Please enter a contract address');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setPaymentChallenge(null);
    setShowPaymentModal(false);

    try {
      // Use overridePaymentId if provided, otherwise use state paymentId
      const currentPaymentId = overridePaymentId || paymentId;
      logger.debug('handleAnalyze called', {
        overridePaymentId,
        statePaymentId: paymentId,
        currentPaymentId,
      });
      
      const headers: Record<string, string> = {};
      if (currentPaymentId) {
        headers['x-payment-id'] = currentPaymentId;
        logger.debug('Sending analysis request with paymentId', { paymentId: currentPaymentId });
      } else {
        logger.debug('Sending analysis request without paymentId (will receive 402)');
        logger.warn('No paymentId available', {
          overridePaymentId,
          statePaymentId: paymentId,
        });
      }

      const response = await apiClient.get('/api/risk/risk-analysis', {
        params: { contract: contract.trim() },
        headers,
      });
      const analysisData = response.data;
      setPaymentId(null); // Reset after successful request
      // Notify parent component
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisData);
      }
    } catch (err: any) {
      if (err.response?.status === 402) {
        const paymentData = err.response?.data as PaymentChallenge;
        setPaymentChallenge(paymentData);
        if (!isConnected || !address || !walletClient) {
          setError('Please connect your wallet first to make payments');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to analyze contract');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePaymentSuccess = (newPaymentId: string) => {
    console.log('✅ Payment successful, paymentId:', newPaymentId);
    setPaymentId(newPaymentId);
    setPaymentChallenge(null);
    // Retry the request automatically after a short delay to ensure backend processed the payment
    // Pass paymentId directly to avoid React state update timing issues
    setTimeout(() => {
      console.log('🔄 Retrying analysis request with paymentId:', newPaymentId);
      handleAnalyze(newPaymentId);
    }, 1000); // Increased delay to ensure backend processed the payment
  };

  return (
    <div className="space-y-6">
      {/* Input Form - Matching HTML design */}
      <GlassCard className="rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <h2 className="text-xl font-bold">Analyze Contract</h2>
          <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-semibold">
            x402 Enabled
          </span>
        </div>

        <div className="space-y-4">
          {/* Contract Address Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Contract Address</label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="0x..."
                value={contract}
                onChange={(e) => setContract(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText()
                    setContract(text)
                  } catch (err) {
                    console.error('Failed to read clipboard:', err)
                  }
                }}
                className="px-4 py-3 border border-slate-700 hover:border-slate-600 rounded-lg text-sm font-semibold transition-colors"
              >
                Paste
              </button>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing}
            className="btn-analyze w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 rounded-lg text-lg font-bold transition-all transform hover:scale-[1.02] relative overflow-hidden"
          >
            <span className="relative z-10">{isAnalyzing ? 'Analyzing...' : 'Analyze Contract →'}</span>
          </button>

          {/* Try Example */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Pro Tip: Try analyzing</span>
            <button
              onClick={() => setContract('0x145d82b09b0068b42113e83622E88D58d25d7772')}
              className="text-indigo-400 hover:text-indigo-300 font-mono text-xs"
            >
              0x145...452A
            </button>
            <span>(VVS Finance Router)</span>
          </div>

          {error && !paymentChallenge && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Show payment button when 402 is received */}
      {paymentChallenge && !showPaymentModal && (
        <div className="bg-slate-800 p-6 rounded-lg border border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">💰 Payment Required</h3>
              <p className="text-slate-300">{paymentChallenge.message}</p>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Pay with x402
            </button>
          </div>
        </div>
      )}

      {/* Lazy load PaymentModal ONLY when user clicks "Pay with x402" */}
      {showPaymentModal && paymentChallenge && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg">Loading payment modal...</div>
          </div>
        }>
          <PaymentModalLazy
            challenge={paymentChallenge}
            walletAddress={address || null}
            signer={walletClient as any}
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setPaymentChallenge(null);
            }}
            onSuccess={handlePaymentSuccess}
          />
        </Suspense>
      )}

      {/* Results are now handled by parent component (RiskPage) */}
    </div>
  );
}
