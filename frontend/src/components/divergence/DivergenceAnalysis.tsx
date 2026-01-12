/**
 * Divergence Analysis Component
 */

import { useState } from 'react';
import apiClient from '../../lib/api/client';
import type { DivergenceAnalysis } from '../../types';

export default function DivergenceAnalysis() {
  const [token, setToken] = useState('CRO');
  const [analysis, setAnalysis] = useState<DivergenceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!token.trim()) {
      setError('Please enter a token symbol');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await apiClient.get('/api/divergence/analyze', {
        params: { token: token.trim() },
      });
      setAnalysis(response.data);
    } catch (err: any) {
      if (err.response?.status === 402) {
        const paymentData = err.response?.data;
        const message = paymentData?.message || 'Payment required to access CEX-DEX Synergy';
        // Extract amount from description or calculate from maxAmountRequired
        let amount = '1.0 devUSDC.e';
        if (paymentData?.accepts?.[0]) {
          const accept = paymentData.accepts[0];
          // Try to extract from description first (more reliable)
          const descMatch = accept.description?.match(/💰 Payment: ([\d.]+ [\w.]+)/);
          if (descMatch) {
            amount = descMatch[1];
          } else if (accept.maxAmountRequired) {
            // Fallback: calculate from maxAmountRequired (1000000 = 1.0 with 6 decimals)
            const amountValue = parseInt(accept.maxAmountRequired) / 1000000;
            amount = `${amountValue.toFixed(1)} devUSDC.e`;
          }
        }
        setError(`${message}\n\n💰 Payment Required: ${amount}\n\nThis service uses x402 protocol for micropayments. Please complete the payment to access the analysis.`);
      } else {
        setError(err.response?.data?.message || 'Failed to analyze divergence');
      }
    } finally {
      setIsAnalyzing(false);
    }
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
        {error && (
          <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
            <div className="text-yellow-400 font-semibold mb-2">⚠️ Payment Required (x402)</div>
            <div className="text-yellow-300 whitespace-pre-line text-sm">{error}</div>
            <div className="mt-3 text-xs text-yellow-400/80">
              💡 This is expected behavior. The x402 protocol requires payment before accessing the service.
            </div>
          </div>
        )}
      </div>

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
