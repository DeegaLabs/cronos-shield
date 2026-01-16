/**
 * Risk Analysis Component
 */

import { useState, lazy, Suspense } from 'react';
import apiClient from '../../lib/api/client';
import { useAccount, useWalletClient } from 'wagmi';
import { InfoTooltip } from '../common/Tooltip';
import type { RiskAnalysis } from '../../types';
import type { PaymentChallenge } from '../../types/x402.types';

// Lazy load PaymentModal ONLY when user clicks "Pay with x402"
// This prevents SDK from loading when 402 is received
const PaymentModalLazy = lazy(() => import('../common/PaymentModal'));

export default function RiskAnalysis() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [contract, setContract] = useState('');
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentChallenge, setPaymentChallenge] = useState<PaymentChallenge | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleAnalyze = async () => {
    if (!contract.trim()) {
      setError('Please enter a contract address');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setPaymentChallenge(null);
    setShowPaymentModal(false);

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
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-bold">Analyze Contract Risk</h3>
          <InfoTooltip content="Analyze the risk score of a smart contract. This service uses x402 payment protocol - you'll need to pay a small fee to access the analysis." />
        </div>
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
