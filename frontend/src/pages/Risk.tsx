import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GlassCard } from '../components/cards/GlassCard'
import { RiskScoreBar } from '../components/risk/RiskScoreBar'
import { RecentAnalysisCard } from '../components/risk/RecentAnalysisCard'
import RiskAnalysis from '../components/risk/RiskAnalysis'
import { InfoTooltip } from '../components/common/Tooltip'
import apiClient from '../lib/api/client'
import type { RiskAnalysis as RiskAnalysisType } from '../types'
import type { LogEntry } from '../types'

export default function RiskPage() {
  const [contractAddress, setContractAddress] = useState('')
  const [analysisResult, setAnalysisResult] = useState<RiskAnalysisType | null>(null)

  // Fetch recent analyses from API
  const { data: recentLogs, isLoading: isLoadingRecent } = useQuery<LogEntry[]>({
    queryKey: ['recent-risk-analyses'],
    queryFn: async () => {
      const response = await apiClient.get('/api/observability/logs', {
        params: {
          type: 'risk_analysis',
          limit: 4,
        },
      })
      return response.data
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  })

  // Transform logs to recent analyses format
  const recentAnalyses = recentLogs
    ?.filter(log => log.type === 'risk_analysis' && log.data?.contract && log.data?.score !== undefined)
    .map(log => ({
      address: log.data.contract as string,
      score: log.data.score as number,
      timestamp: new Date(log.timestamp),
    }))
    .slice(0, 4) || []

  // Handle analysis result from RiskAnalysis component
  const handleAnalysisComplete = (result: RiskAnalysisType) => {
    setAnalysisResult(result)
  }

  // Convert analysis result to issues format for display
  const getIssuesFromAnalysis = (analysis: RiskAnalysisType) => {
    const issues: Array<{ title: string; severity: 'critical' | 'high' | 'medium'; description: string }> = []
    
    if (analysis.details.warnings && analysis.details.warnings.length > 0) {
      analysis.details.warnings.forEach((warning) => {
        let severity: 'critical' | 'high' | 'medium' = 'medium'
        if (analysis.score >= 80) severity = 'critical'
        else if (analysis.score >= 50) severity = 'high'
        
        issues.push({
          title: warning,
          severity,
          description: warning,
        })
      })
    }
    
    if (!analysis.details.verified) {
      issues.push({
        title: 'Contract Not Verified',
        severity: analysis.score >= 70 ? 'high' : 'medium',
        description: 'Source code not verified on block explorer.',
      })
    }
    
    if (analysis.details.liquidity === 'low') {
      issues.push({
        title: 'Low Liquidity',
        severity: 'critical',
        description: 'Low liquidity detected. High risk of price manipulation.',
      })
    }
    
    if (analysis.details.holders && analysis.details.holders < 50) {
      issues.push({
        title: 'Low Holder Count',
        severity: 'medium',
        description: `Only ${analysis.details.holders} holders detected. Low distribution.`,
      })
    }
    
    return issues
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

      {/* Main Analysis Section - Using RiskAnalysis component */}
      <div className="mb-8">
        <RiskAnalysis 
          contractAddress={contractAddress}
          onAnalysisComplete={handleAnalysisComplete}
        />
      </div>

      {/* Recent Analyses */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Recent Analyses
        </h3>
        
        {isLoadingRecent ? (
          <div className="text-center py-8 text-slate-400">Loading recent analyses...</div>
        ) : recentAnalyses.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No recent analyses yet</div>
        ) : (
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
        )}
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <GlassCard className="rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              Analysis Results
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-semibold">
                {`${analysisResult.contract.slice(0, 6)}...${analysisResult.contract.slice(-4)}`}
              </span>
            </h3>
            <a
              href={`https://cronoscan.com/address/${analysisResult.contract}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View on Explorer →
            </a>
          </div>

          {/* Risk Score */}
          <RiskScoreBar score={analysisResult.score} />

          {/* AI Explanation */}
          {analysisResult.explanation && (
            <div className="mb-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                <span className="text-sm font-semibold text-indigo-400">AI Explanation</span>
              </div>
              <p className="text-slate-200 leading-relaxed">{analysisResult.explanation}</p>
            </div>
          )}

          {/* Issues Found */}
          {getIssuesFromAnalysis(analysisResult).length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                Issues Found
              </h4>

              <div className="space-y-3">
                {getIssuesFromAnalysis(analysisResult).map((issue, index) => {
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
          )}

          {/* Contract Details */}
          <div className="mb-8">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Contract Details
            </h4>
            
            {/* Basic Info Grid */}
            <div className="bg-slate-900/50 p-4 rounded-lg space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Liquidity:</span>
                <span className="text-slate-200 capitalize">{analysisResult.details.liquidity || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contract Age:</span>
                <span className="text-slate-200">{analysisResult.details.contractAge || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Holders:</span>
                <span className="text-slate-200">{analysisResult.details.holders !== undefined ? analysisResult.details.holders.toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verified:</span>
                <span className={analysisResult.details.verified ? 'text-green-400' : 'text-red-400'}>
                  {analysisResult.details.verified ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Additional Metrics Grid */}
            {(analysisResult.details.transactionCount !== undefined || 
              analysisResult.details.recentActivity !== undefined || 
              analysisResult.details.totalSupply || 
              analysisResult.details.marketCap) && (
              <div className="grid grid-cols-2 gap-4">
                {analysisResult.details.transactionCount !== undefined && (
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                      <span className="text-xs text-slate-400">Total Transactions</span>
                      <InfoTooltip content="Total number of Transfer events found in the last 10,000 blocks. Higher transaction count indicates more active token usage." />
                    </div>
                    <div className="text-2xl font-bold text-slate-200">
                      {analysisResult.details.transactionCount.toLocaleString()}
                    </div>
                  </div>
                )}

                {analysisResult.details.recentActivity !== undefined && (
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                      </svg>
                      <span className="text-xs text-slate-400">Activity (24h)</span>
                      <InfoTooltip content="Number of Transfer events in the last 24 hours. High recent activity indicates active trading and healthy token ecosystem." />
                    </div>
                    <div className="text-2xl font-bold text-slate-200">
                      {analysisResult.details.recentActivity.toLocaleString()}
                    </div>
                  </div>
                )}

                {analysisResult.details.totalSupply && (
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                      <span className="text-xs text-slate-400">Total Supply</span>
                      <InfoTooltip content="Total token supply from the ERC20 contract. This is the maximum number of tokens that can exist for this contract." />
                    </div>
                    <div className="text-2xl font-bold text-slate-200">
                      {parseFloat(analysisResult.details.totalSupply).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                        notation: 'compact',
                        compactDisplay: 'short'
                      })}
                    </div>
                  </div>
                )}

                {analysisResult.details.marketCap && (
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span className="text-xs text-slate-400">Market Cap (Est.)</span>
                      <InfoTooltip content="Estimated market capitalization calculated from liquidity and total supply. This is an approximation and may not reflect the actual market value." />
                    </div>
                    <div className="text-2xl font-bold text-slate-200">
                      ${parseFloat(analysisResult.details.marketCap).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                        notation: 'compact',
                        compactDisplay: 'short'
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* On-chain Proof */}
          <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-900/30 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <div>
                  <div className="font-semibold mb-1">
                    {analysisResult.verified ? '✅ Proof of Risk Verified On-Chain' : '⏳ Proof of Risk Stored On-Chain'}
                  </div>
                  <div className="text-sm text-slate-400">
                    Proof: <span className="font-mono text-indigo-400 text-xs break-all">{analysisResult.proof.slice(0, 20)}...</span>
                  </div>
                </div>
              </div>
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
            <button 
              onClick={() => {
                const url = window.location.href
                navigator.clipboard.writeText(url)
              }}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors"
            >
              Share Analysis
            </button>
          </div>
        </GlassCard>
      )}
    </>
  )
}
