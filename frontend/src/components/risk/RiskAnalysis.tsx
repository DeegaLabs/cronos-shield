/**
 * Risk Analysis Component
 */

import { useState } from 'react';
import apiClient from '../../lib/api/client';
import PaymentModal from '../common/PaymentModal';
import { useWallet } from '../../contexts/WalletContext';
import type { RiskAnalysis } from '../../types';
import type { PaymentChallenge } from '../../types/x402.types';

export default function RiskAnalysis() {
  const { wallet } = useWallet();
  const [contract, setContract] = useState('');
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentChallenge, setPaymentChallenge] = useState<PaymentChallenge | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!contract.trim()) {
      setError('Please enter a contract address');
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

      const response = await apiClient.get('/api/risk/risk-analysis', {
        params: { contract: contract.trim() },
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
        setError(err.response?.data?.message || 'Failed to analyze contract');
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

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-400';
    if (score < 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 70) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h3 className="text-xl font-bold mb-4">Analyze Contract Risk</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={contract}
            onChange={(e) => setContract(e.target.value)}
            placeholder="0x..."
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
          <h3 className="text-xl font-bold mb-4">Analysis Results</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-slate-400 text-sm mb-2">Risk Score</div>
              <div className={`text-4xl font-bold ${getRiskColor(analysis.score)}`}>
                {analysis.score}/100
              </div>
              <div className="text-slate-500 text-sm mt-1">{getRiskLabel(analysis.score)}</div>
            </div>

            <div>
              <div className="text-slate-400 text-sm mb-2">Contract</div>
              <div className="text-slate-200 font-mono text-sm break-all">{analysis.contract}</div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="text-slate-400 text-sm mb-2">Details</div>
              <div className="bg-slate-700 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Liquidity:</span>
                  <span className="text-slate-200">{analysis.details.liquidity || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contract Age:</span>
                  <span className="text-slate-200">{analysis.details.contractAge || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Holders:</span>
                  <span className="text-slate-200">{analysis.details.holders || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verified:</span>
                  <span className={analysis.details.verified ? 'text-green-400' : 'text-red-400'}>
                    {analysis.details.verified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {analysis.details.warnings && analysis.details.warnings.length > 0 && (
              <div>
                <div className="text-slate-400 text-sm mb-2">Warnings</div>
                <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.details.warnings.map((warning, idx) => (
                      <li key={idx} className="text-red-400">{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div>
              <div className="text-slate-400 text-sm mb-2">Proof of Risk</div>
              <div className="bg-slate-700 p-4 rounded-lg">
                <code className="text-xs text-slate-300 break-all">{analysis.proof}</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
