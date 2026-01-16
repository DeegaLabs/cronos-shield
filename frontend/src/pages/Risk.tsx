import { useState } from 'react'
import { GlassCard } from '../components/cards/GlassCard'
import { RiskScoreBar } from '../components/risk/RiskScoreBar'
import { RecentAnalysisCard } from '../components/risk/RecentAnalysisCard'
import RiskAnalysis from '../components/risk/RiskAnalysis'

export default function RiskPage() {
  const [contractAddress, setContractAddress] = useState('')
  const [analysisResult, setAnalysisResult] = useState<{
    address: string
    score: number
    issues: Array<{ title: string; severity: 'critical' | 'high' | 'medium'; description: string }>
  } | null>(null)

  // Mock recent analyses
  const recentAnalyses = [
    { address: '0xABC123456789DEF', score: 45, timestamp: new Date(Date.now() - 2 * 60 * 1000) },
    { address: '0xDEF987654321GHI', score: 68, timestamp: new Date(Date.now() - 5 * 60 * 1000) },
    { address: '0xGHI456789012JKL', score: 92, timestamp: new Date(Date.now() - 8 * 60 * 1000) },
    { address: '0xJKL012345678MNO', score: 38, timestamp: new Date(Date.now() - 12 * 60 * 1000) },
  ]

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText()
    setContractAddress(text)
  }

  const handleAnalyze = () => {
    // This will be integrated with the actual RiskAnalysis component
    // For now, show mock result
    if (contractAddress) {
      setAnalysisResult({
        address: contractAddress,
        score: 85,
        issues: [
          {
            title: 'Liquidity Not Locked',
            severity: 'critical',
            description: 'No liquidity lock detected. High risk of rug pull.',
          },
          {
            title: 'Contract Not Verified',
            severity: 'high',
            description: 'Source code not verified on block explorer.',
          },
          {
            title: 'Low Holder Count',
            severity: 'medium',
            description: 'Only 47 holders detected. Low distribution.',
          },
        ],
      })
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Risk Oracle
        </h1>
        <p className="text-slate-400">Analyze smart contracts with AI-powered risk scoring</p>
      </div>

      {/* Main Analysis Section */}
      <GlassCard className="rounded-2xl p-8 mb-8">
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
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <button
                onClick={handlePaste}
                className="px-4 py-3 border border-slate-700 hover:border-slate-600 rounded-lg text-sm font-semibold transition-colors"
              >
                Paste
              </button>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            className="btn-analyze w-full py-4 bg-green-600 hover:bg-green-500 rounded-lg text-lg font-bold transition-all transform hover:scale-[1.02] relative overflow-hidden"
          >
            <span className="relative z-10">Analyze Contract →</span>
          </button>

          {/* Try Example */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Pro Tip: Try analyzing</span>
            <button
              onClick={() => setContractAddress('0x145...452A')}
              className="text-indigo-400 hover:text-indigo-300 font-mono text-xs"
            >
              0x145...452A
            </button>
            <span>(VVS Finance Router)</span>
          </div>
        </div>
      </GlassCard>

      {/* Recent Analyses */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Recent Analyses
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentAnalyses.map((analysis, index) => (
            <RecentAnalysisCard
              key={index}
              address={analysis.address}
              score={analysis.score}
              timestamp={analysis.timestamp}
            />
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <GlassCard className="rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              Analysis Results
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-semibold">
                {`${analysisResult.address.slice(0, 6)}...${analysisResult.address.slice(-4)}`}
              </span>
            </h3>
            <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              View on Explorer →
            </button>
          </div>

          {/* Risk Score */}
          <RiskScoreBar score={analysisResult.score} />

          {/* Issues Found */}
          <div className="mb-8">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              Issues Found
            </h4>

            <div className="space-y-3">
              {analysisResult.issues.map((issue, index) => {
                const severityColors = {
                  critical: { bg: 'bg-red-950/20', border: 'border-red-900/30', icon: 'bg-red-500', badge: 'bg-red-500/20 text-red-300' },
                  high: { bg: 'bg-orange-950/20', border: 'border-orange-900/30', icon: 'bg-orange-500', badge: 'bg-orange-500/20 text-orange-300' },
                  medium: { bg: 'bg-yellow-950/20', border: 'border-yellow-900/30', icon: 'bg-yellow-500', badge: 'bg-yellow-500/20 text-yellow-300' },
                }
                const colors = severityColors[issue.severity]

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-4 p-4 rounded-lg ${colors.bg} border ${colors.border}`}
                  >
                    <div className={`w-8 h-8 rounded-full ${colors.icon} flex items-center justify-center flex-shrink-0`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{issue.title}</span>
                        <span className={`px-2 py-0.5 ${colors.badge} rounded text-xs font-bold uppercase`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{issue.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* On-chain Proof */}
          <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <div>
                  <div className="font-semibold mb-1">✅ Proof of Risk Stored On-Chain</div>
                  <div className="text-sm text-slate-400">
                    Transaction: <span className="font-mono text-indigo-400">0xabc...def</span>
                  </div>
                </div>
              </div>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors">
                View Transaction
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => {
                setAnalysisResult(null)
                setContractAddress('')
              }}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-semibold transition-colors"
            >
              Analyze Another Contract
            </button>
            <button className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors">
              Share Analysis
            </button>
          </div>
        </GlassCard>
      )}

      {/* Keep existing RiskAnalysis component for actual functionality */}
      <div className="hidden">
        <RiskAnalysis />
      </div>
    </>
  )
}
