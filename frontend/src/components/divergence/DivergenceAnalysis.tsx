/**
 * Divergence Analysis Component
 */

import { useState, useEffect } from 'react';
import apiClient from '../../lib/api/client';
import PaymentModal from '../common/PaymentModal';
import { useWallet } from '../../hooks/useWallet';
import type { DivergenceAnalysis } from '../../types';
import type { PaymentChallenge } from '../../types/x402.types';

export default function DivergenceAnalysis() {
  const { wallet } = useWallet();
  
  // Debug: log wallet state
  console.log('DivergenceAnalysis wallet state:', {
    address: wallet.address,
    hasProvider: !!wallet.provider,
    hasSigner: !!wallet.signer,
    isConnected: wallet.isConnected
  });
  const [token, setToken] = useState('CRO');
  const [analysis, setAnalysis] = useState<DivergenceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentChallenge, setPaymentChallenge] = useState<PaymentChallenge | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // Debug: log wallet state when it changes
  useEffect(() => {
    console.log('DivergenceAnalysis wallet state:', {
      address: wallet.address,
      hasProvider: !!wallet.provider,
      hasSigner: !!wallet.signer,
      isConnected: wallet.isConnected
    });
  }, [wallet]);

  // Debug: log what we're passing to PaymentModal
  useEffect(() => {
    if (paymentChallenge) {
      console.log('DivergenceAnalysis passing to PaymentModal:', {
        challenge: !!paymentChallenge,
        walletAddress: wallet.address,
        signer: !!wallet.signer,
        signerType: wallet.signer ? typeof wallet.signer : 'null'
      });
    }
  }, [paymentChallenge, wallet]);

  const handleAnalyze = async () => {
    if (!token.trim()) {
      setError('Please enter a token symbol');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setPaymentChallenge(null);

    try {
      const headers: Record<string, string> = {};
      if (paymentId) {
        headers['x-payment-id'] = paymentId;
      }

      const response = await apiClient.get('/api/divergence/analyze', {
        params: { token: token.trim() },
        headers,
      });
      setAnalysis(response.data);
      setPaymentId(null); // Reset after successful request
    } catch (err: any) {
      if (err.response?.status === 402) {
        const paymentData = err.response?.data as PaymentChallenge;
        setPaymentChallenge(paymentData);
        if (!wallet.isConnected || !wallet.address) {
          setError('Please connect your wallet first to make payments');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to analyze divergence');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePaymentSuccess = (newPaymentId: string) => {
    setPaymentId(newPaymentId);
    setPaymentChallenge(null);
    // Retry the request automatically
    setTimeout(() => {
      handleAnalyze();
    }, 500);
  };

  const getRecommendationColor = (rec: string) => {
    if (rec === 'buy_on_cex') return 'text-green-400';
    if (rec === 'buy_on_dex') return 'text-blue-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h3 className="text-xl font-bold mb-4">Analyze CEX-DEX Divergence</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            placeholder="CRO, USDC, etc."
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAnalyze}
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

      <PaymentModal
        challenge={paymentChallenge}
        walletAddress={wallet.address}
        signer={wallet.signer}
        isOpen={!!paymentChallenge}
        onClose={() => setPaymentChallenge(null)}
        onSuccess={handlePaymentSuccess}
      />

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
