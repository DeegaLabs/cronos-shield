import { useState, useEffect, lazy, Suspense } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { GlassCard } from '../components/cards/GlassCard'
import { DivergenceBar } from '../components/divergence/DivergenceBar'
import { LineChart } from '../components/charts/LineChart'
import { useDivergence, useDivergenceHistory, useDivergenceAlerts, useAvailablePairs } from '../hooks/useDivergence'
import { useWebSocket } from '../hooks/useWebSocket'
import type { DivergenceResponse } from '../types/divergence.types'
import type { PaymentChallenge } from '../types/x402.types'

// Lazy load PaymentModal
const PaymentModalLazy = lazy(() => import('../components/common/PaymentModal'))

export default function DivergencePage() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const queryClient = useQueryClient()
  
  // Fetch available pairs from API
  const { data: availablePairs, isLoading: isLoadingPairs } = useAvailablePairs()
  
  // Use available pairs if loaded, otherwise fallback to default list
  const pairsList = availablePairs && availablePairs.length > 0 
    ? availablePairs 
    : ['ETH-USDT', 'BTC-USDT', 'CRO-USDT', 'ATOM-USDT'] // Fallback
  
  // Set initial selected pair
  const [selectedPair, setSelectedPair] = useState('ETH-USDT')
  
  // Update selected pair when pairs are loaded (only if current selection is not in the list)
  useEffect(() => {
    if (availablePairs && availablePairs.length > 0) {
      // If current selection is not in available pairs, select first available
      if (!availablePairs.includes(selectedPair)) {
        setSelectedPair(availablePairs[0])
      }
    }
  }, [availablePairs]) // Only depend on availablePairs, not selectedPair
  
  const [divergenceData, setDivergenceData] = useState<DivergenceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [paymentChallenge, setPaymentChallenge] = useState<PaymentChallenge | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  const { analyzeDivergence, isAnalyzing } = useDivergence()
  
  // WebSocket for real-time price updates
  const [wsCexPrice, setWsCexPrice] = useState<number | null>(null)
  const { isConnected: isWsConnected, isConnecting: isWsConnecting, getPrice: getWsPrice } = useWebSocket({
    enabled: true,
    onPriceUpdate: (pair, price) => {
      // Update CEX price if it matches the selected pair
      if (pair === selectedPair && price.source === 'CEX') {
        setWsCexPrice(parseFloat(price.price))
      }
    },
  })
  
  // Use the full pair for history (backend saves with full pair)
  // Fetch history and alerts
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = useDivergenceHistory(selectedPair, 7)
  const { data: alertsData, isLoading: isLoadingAlerts, refetch: refetchAlerts } = useDivergenceAlerts(10)
  
  // Update WebSocket price when selected pair changes
  useEffect(() => {
    const wsPrice = getWsPrice(selectedPair)
    if (wsPrice && wsPrice.source === 'CEX') {
      setWsCexPrice(parseFloat(wsPrice.price))
    } else {
      setWsCexPrice(null)
    }
  }, [selectedPair, getWsPrice])

  // Calculate divergence percentage from data
  const divergencePercentage = divergenceData
    ? parseFloat(divergenceData.divergence)
    : 0

  // Use WebSocket price if available, otherwise use divergence data, otherwise defaults
  const cexPrice = wsCexPrice !== null 
    ? wsCexPrice 
    : (divergenceData ? parseFloat(divergenceData.cexPrice) : 0.0850)
  const dexPrice = divergenceData ? parseFloat(divergenceData.dexPrice) : 0.0920

  // Chart data - use real data if available, otherwise use empty array
  const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const divergenceChartData = historyData || Array(7).fill(0)

  // Recent alerts - use real data if available, otherwise use empty array
  const recentAlerts = alertsData || []

  const handleAnalyze = async (overridePaymentId?: string) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    if (!selectedPair) {
      setError('Please select a token pair')
      return
    }

    setError(null)
    setSuccess(null)
    setDivergenceData(null)
    setPaymentChallenge(null)
    setShowPaymentModal(false)

    try {
      // Send the full pair (e.g., "ETH-USDT") - backend will handle it
      const currentPaymentId = overridePaymentId || paymentId

      const result = await analyzeDivergence({
        token: selectedPair, // Send full pair, backend will parse it
        paymentId: currentPaymentId || undefined,
      })

      setDivergenceData(result)
      setPaymentId(null) // Reset after successful request
      setSuccess(`Divergence analysis complete. ${result.divergence}% difference detected.`)
      
      // Invalidate and refetch history and alerts after successful analysis
      queryClient.invalidateQueries({ queryKey: ['divergence-history'] })
      queryClient.invalidateQueries({ queryKey: ['divergence-alerts'] })
      refetchHistory()
      refetchAlerts()
    } catch (err: any) {
      if (err.response?.status === 402) {
        const paymentData = err.response?.data as PaymentChallenge
        setPaymentChallenge(paymentData)
        if (!isConnected || !address || !walletClient) {
          setError('Please connect your wallet first to make payments')
        } else {
          setShowPaymentModal(true)
        }
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to analyze divergence')
      }
    }
  }

  const handlePaymentSuccess = (newPaymentId: string) => {
    setPaymentId(newPaymentId)
    setPaymentChallenge(null)
    setShowPaymentModal(false)
    setTimeout(() => {
      handleAnalyze(newPaymentId)
    }, 1000)
  }


  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'buy_on_cex':
        return 'Buy on CEX (CEX price is lower)'
      case 'buy_on_dex':
        return 'Buy on DEX (DEX price is lower)'
      case 'no_arbitrage':
        return 'No significant arbitrage opportunity'
      default:
        return 'Analyze to get recommendation'
    }
  }

  const getSeverityColors = (severity: string) => {
    if (severity === 'high') {
      return {
        bg: 'bg-red-950/20',
        border: 'border-red-900/30',
        icon: 'bg-red-500/10',
        iconColor: 'text-red-400',
        badge: 'bg-red-500 text-white',
      }
    }
    if (severity === 'medium') {
      return {
        bg: 'bg-orange-950/20',
        border: 'border-orange-900/30',
        icon: 'bg-orange-500/10',
        iconColor: 'text-orange-400',
        badge: 'bg-orange-500 text-white',
      }
    }
    return {
      bg: 'bg-green-950/20',
      border: 'border-green-900/30',
      icon: 'bg-green-500/10',
      iconColor: 'text-green-400',
      badge: 'bg-green-500/20 text-green-300',
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
          </svg>
          CEX-DEX Synergy
        </h1>
        <p className="text-slate-400">Real-time price divergence detection between Crypto.com and DEXs</p>
      </div>

      {/* Analysis Section */}
      <GlassCard className="rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
          <h2 className="text-xl font-bold">Analyze Divergence</h2>
          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-semibold">
            x402 Enabled
          </span>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Trading Pair</label>
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              disabled={isAnalyzing || isLoadingPairs}
            >
              {isLoadingPairs ? (
                <option value="">Loading pairs...</option>
              ) : pairsList.length > 0 ? (
                pairsList.map((pair) => (
                  <option key={pair} value={pair}>
                    {pair}
                  </option>
                ))
              ) : (
                <option value="">No pairs available</option>
              )}
            </select>
            {isLoadingPairs && (
              <p className="text-xs text-slate-500 mt-1">Loading available pairs from Crypto.com...</p>
            )}
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !isConnected}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-all transform hover:scale-105 self-end"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Divergence →'}
          </button>
        </div>
      </GlassCard>

      {/* Live Prices */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Crypto.com Price */}
        <GlassCard className="rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div>
                <div className="text-sm text-slate-400">🏢 Crypto.com</div>
                <div className="font-bold">CEX Price</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* WebSocket connection indicator */}
              <div className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-green-500 animate-pulse' : isWsConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} title={isWsConnected ? 'WebSocket connected' : isWsConnecting ? 'Connecting...' : 'WebSocket disconnected'}></div>
              {wsCexPrice !== null && (
                <span className="text-xs text-green-400 font-semibold">LIVE</span>
              )}
            </div>
          </div>

          <div className="mb-6">
            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mb-2"></div>
                <div className="text-sm text-slate-400">Loading price...</div>
              </div>
            ) : (
              <>
                <div className="text-5xl font-bold mb-2 price-flash">
                  {wsCexPrice !== null || divergenceData ? `$${cexPrice.toFixed(4)}` : '$0.0000'}
                </div>
                {wsCexPrice !== null && (
                  <div className="text-xs text-green-400 mb-1">🟢 Real-time price via WebSocket</div>
                )}
                {!divergenceData && wsCexPrice === null && (
                  <div className="text-sm text-slate-500">
                    {isConnected 
                      ? 'Click "Analyze Divergence" to see live prices' 
                      : 'Connect wallet and analyze to see live prices'}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Exchange</span>
              <span className="font-semibold">
                {divergenceData?.details.cexExchange || 'Crypto.com'}
              </span>
            </div>
            {divergenceData && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Liquidity</span>
                <span className="font-semibold">
                  {divergenceData.details.liquidity.cex || 'N/A'}
                </span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* VVS DEX Price */}
        <GlassCard className="rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
              </div>
              <div>
                <div className="text-sm text-slate-400">🔄 VVS Finance</div>
                <div className="font-bold">DEX Price</div>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>

          <div className="mb-6">
            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-2"></div>
                <div className="text-sm text-slate-400">Loading price...</div>
              </div>
            ) : (
              <>
                <div className="text-5xl font-bold mb-2 price-flash">
                  {divergenceData ? `$${dexPrice.toFixed(4)}` : '$0.0000'}
                </div>
                {!divergenceData && (
                  <div className="text-sm text-slate-500">Connect wallet and analyze to see live prices</div>
                )}
              </>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Exchange</span>
              <span className="font-semibold">
                {divergenceData?.details.dexExchange || 'VVS Finance'}
              </span>
            </div>
            {divergenceData && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Liquidity</span>
                <span className="font-semibold">
                  {divergenceData.details.liquidity.dex || 'N/A'}
                </span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Error Message */}
      {error && (
        <GlassCard className="rounded-2xl p-4 mb-8 border-2 border-red-500/30">
          <div className="flex items-center gap-3 text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{error}</span>
          </div>
        </GlassCard>
      )}

      {/* Success Message */}
      {success && (
        <GlassCard className="rounded-2xl p-4 mb-8 border-2 border-green-500/30">
          <div className="flex items-center gap-3 text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{success}</span>
          </div>
        </GlassCard>
      )}

      {/* Divergence Alert - Only show if we have data */}
      {divergenceData && (
        <GlassCard className={`rounded-2xl p-8 mb-8 border-2 ${
          Math.abs(divergencePercentage) >= 5.0
            ? 'border-red-500/30 alert-pulse'
            : Math.abs(divergencePercentage) >= 2.0
            ? 'border-orange-500/30'
            : 'border-green-500/30'
        }`}>
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-12 h-12 rounded-full ${
              Math.abs(divergencePercentage) >= 5.0
                ? 'bg-red-500'
                : Math.abs(divergencePercentage) >= 2.0
                ? 'bg-orange-500'
                : 'bg-green-500'
            } flex items-center justify-center flex-shrink-0`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold">
                  {Math.abs(divergencePercentage).toFixed(2)}% Price Divergence Detected
                </h3>
                <span className={`px-3 py-1 ${
                  Math.abs(divergencePercentage) >= 5.0
                    ? 'bg-red-500 text-white'
                    : Math.abs(divergencePercentage) >= 2.0
                    ? 'bg-orange-500 text-white'
                    : 'bg-green-500/20 text-green-300'
                } rounded-lg text-sm font-bold`}>
                  {Math.abs(divergencePercentage) >= 5.0
                    ? '🔴 HIGH RISK'
                    : Math.abs(divergencePercentage) >= 2.0
                    ? '🟠 MEDIUM RISK'
                    : '🟢 LOW RISK'}
                </span>
              </div>
              <p className="text-slate-400 mb-4">
                {divergencePercentage > 0
                  ? `DEX price is ${Math.abs(divergencePercentage).toFixed(2)}% higher than CEX price.`
                  : `CEX price is ${Math.abs(divergencePercentage).toFixed(2)}% higher than DEX price.`}
                {' '}
                {getRecommendationText(divergenceData.recommendation)}
              </p>
              
              {/* Divergence Bar */}
              <DivergenceBar percentage={divergencePercentage} />

              {/* Details */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-lg mb-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">CEX Price ({divergenceData.details.cexExchange})</div>
                  <div className="font-bold">${cexPrice.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">DEX Price ({divergenceData.details.dexExchange})</div>
                  <div className="font-bold">${dexPrice.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Difference</div>
                  <div className={`font-bold ${divergencePercentage > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {divergencePercentage > 0 ? '+' : ''}${(dexPrice - cexPrice).toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Recommendation</div>
                <div className="font-semibold text-indigo-400">
                  {getRecommendationText(divergenceData.recommendation)}
                </div>
                {divergenceData.details.liquidity.dex && (
                  <div className="text-xs text-slate-500 mt-2">
                    DEX Liquidity: {divergenceData.details.liquidity.dex}
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Divergence Chart */}
      <GlassCard className="rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Price Divergence History (7 Days)</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-indigo-600 rounded text-sm font-semibold">7D</button>
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-sm">30D</button>
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-sm">90D</button>
          </div>
        </div>
        <div className="chart-container-large">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">Loading chart data...</div>
            </div>
          ) : divergenceChartData.length > 0 && divergenceChartData.some((v: number) => v > 0) ? (
            <LineChart
              labels={chartLabels}
              data={divergenceChartData}
              color="#a855f7"
              title="Divergence"
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">No historical data available. Analyze a token to see divergence history.</div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Recent Alerts */}
      <GlassCard className="rounded-2xl p-8">
        <h3 className="text-lg font-bold mb-6">Recent Divergence Alerts</h3>
        
        {isLoadingAlerts ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-slate-400">Loading alerts...</div>
          </div>
        ) : recentAlerts.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-slate-400">No recent alerts. Analyze tokens to see divergence alerts.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => {
            const colors = getSeverityColors(alert.severity)
            return (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-lg ${colors.bg} border ${colors.border} cursor-pointer hover:${colors.border.replace('/30', '/50')} transition-colors`}
              >
                <div className={`w-10 h-10 rounded-full ${colors.icon} flex items-center justify-center flex-shrink-0`}>
                  <svg className={`w-5 h-5 ${colors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{alert.pair}</span>
                    <span className={`px-2 py-0.5 ${colors.badge} rounded text-xs font-bold`}>
                      {alert.divergence}%
                    </span>
                    <span className="text-xs text-slate-400">{alert.time}</span>
                  </div>
                  <div className="text-sm text-slate-400">{alert.description}</div>
                </div>
              </div>
            )
          })}
          </div>
        )}

        {recentAlerts.length > 0 && (
          <button className="w-full mt-6 py-3 border border-slate-700 hover:border-slate-600 rounded-lg font-semibold transition-colors">
            View All Alerts
          </button>
        )}
      </GlassCard>

      {/* Payment Modal */}
      {showPaymentModal && paymentChallenge && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg">Loading payment modal...</div>
          </div>
        }>
          <PaymentModalLazy
            challenge={paymentChallenge}
            walletAddress={address || null}
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false)
              setPaymentChallenge(null)
            }}
            onSuccess={handlePaymentSuccess}
          />
        </Suspense>
      )}
    </>
  )
}
