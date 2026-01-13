/**
 * Divergence Analysis Component
 */

import { useState, useCallback, useRef, lazy, Suspense } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../lib/api/client';
import { useWallet } from '../../contexts/WalletContext';
import { InfoTooltip } from '../common/Tooltip';
import type { DivergenceAnalysis } from '../../types';
import type { PaymentChallenge } from '../../types/x402.types';

// Lazy load PaymentModal to prevent Facilitator SDK from loading on page load
const PaymentModal = lazy(() => import('../common/PaymentModal'));

export default function DivergenceAnalysis() {
  const { wallet } = useWallet();
  const [token, setToken] = useState('CRO');
  const [analysis, setAnalysis] = useState<DivergenceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentChallenge, setPaymentChallenge] = useState<PaymentChallenge | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const isRetryingRef = useRef(false);

  const handleAnalyze = useCallback(async (retryPaymentId?: string | null) => {
    if (!token.trim()) {
      setError('Please enter a token symbol');
      return;
    }

    // Prevent multiple simultaneous requests
    if (isAnalyzing && !retryPaymentId) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setPaymentChallenge(null);

    try {
      const headers: Record<string, string> = {};
      const currentPaymentId = retryPaymentId !== undefined ? retryPaymentId : paymentId;
      if (currentPaymentId) {
        headers['x-payment-id'] = currentPaymentId;
      }

      const response = await apiClient.get('/api/divergence/analyze', {
        params: { token: token.trim() },
        headers,
      });
      setAnalysis(response.data);
      setPaymentId(null);
      isRetryingRef.current = false;
      toast.success('Divergence analysis completed!');
    } catch (err: any) {
      if (err.response?.status === 402) {
        const paymentData = err.response?.data as PaymentChallenge;
        setPaymentChallenge(paymentData);
        if (!wallet.isConnected || !wallet.address || !wallet.signer) {
          toast.error('Please connect your wallet first to make payments');
          setError('Please connect your wallet first to make payments');
        }
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to analyze divergence';
        toast.error(errorMsg);
        setError(errorMsg);
      }
      isRetryingRef.current = false;
    } finally {
      setIsAnalyzing(false);
    }
  }, [token, paymentId, wallet.isConnected, wallet.address, wallet.signer, isAnalyzing]);

  const handlePaymentSuccess = useCallback((newPaymentId: string) => {
    setPaymentId(newPaymentId);
    setPaymentChallenge(null);
    isRetryingRef.current = true;
    // Retry the request automatically after a short delay
    setTimeout(() => {
      handleAnalyze(newPaymentId);
    }, 500);
  }, [handleAnalyze]);

  const getRecommendationColor = (rec: string) => {
    if (rec === 'buy_on_cex') return 'text-green-400';
    if (rec === 'buy_on_dex') return 'text-blue-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-bold">Analyze CEX-DEX Divergence</h3>
          <InfoTooltip content="Compare prices between centralized exchanges (CEX) and decentralized exchanges (DEX). This service uses x402 payment protocol." />
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            placeholder="CRO, USDC, etc."
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {error && !paymentChallenge && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}
      </div>

      {paymentChallenge && (
        <Suspense fallback={null}>
          <PaymentModal
            challenge={paymentChallenge}
            walletAddress={wallet.address}
            signer={wallet.signer}
            isOpen={!!paymentChallenge}
            onClose={() => setPaymentChallenge(null)}
            onSuccess={handlePaymentSuccess}
          />
        </Suspense>
      )}

      {/* Results */}
      {analysis && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold mb-4">Divergence Analysis</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="text-slate-400 text-sm mb-2">CEX Price</div>
              <div className="text-2xl font-bold text-blue-400">{analysis.cexPrice}</div>
              <div className="text-xs text-slate-500 mt-1">{analysis.details.cexExchange}</div>
            </div>

            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="text-slate-400 text-sm mb-2">DEX Price</div>
              <div className="text-2xl font-bold text-purple-400">{analysis.dexPrice}</div>
              <div className="text-xs text-slate-500 mt-1">{analysis.details.dexExchange}</div>
            </div>

            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="text-slate-400 text-sm mb-2">Divergence</div>
              <div className={`text-2xl font-bold ${parseFloat(analysis.divergence) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {analysis.divergence}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Absolute: {analysis.divergenceAmount}</div>
            </div>
          </div>

          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="text-slate-400 text-sm mb-2">Recommendation</div>
            <div className={`text-xl font-bold ${getRecommendationColor(analysis.recommendation)}`}>
              {analysis.recommendation.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
