import { useState } from 'react'
import { GlassCard } from '../components/cards/GlassCard'
import { DivergenceBar } from '../components/divergence/DivergenceBar'
import { LineChart } from '../components/charts/LineChart'

export default function DivergencePage() {
  const [selectedPair, setSelectedPair] = useState('CRO/USDC')

  // Mock data
  const cexPrice = 0.0850
  const dexPrice = 0.0920
  const divergencePercentage = ((dexPrice - cexPrice) / cexPrice) * 100

  const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const divergenceData = [1.2, 2.3, 1.8, 4.5, 3.2, 6.7, 8.2]

  const recentAlerts = [
    {
      pair: 'CRO/USDC',
      divergence: 8.2,
      severity: 'high',
      time: '2 minutes ago',
      description: 'DEX price significantly higher than CEX',
    },
    {
      pair: 'WETH/USDC',
      divergence: 4.1,
      severity: 'medium',
      time: '1 hour ago',
      description: 'Moderate price discrepancy detected',
    },
    {
      pair: 'ATOM/USDC',
      divergence: 1.2,
      severity: 'low',
      time: '3 hours ago',
      description: 'Price divergence within normal range',
    },
  ]

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
            <label className="block text-sm font-semibold text-slate-300 mb-2">Token Pair</label>
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
            >
              <option>CRO/USDC</option>
              <option>WETH/USDC</option>
              <option>WBTC/USDC</option>
              <option>ATOM/USDC</option>
            </select>
          </div>

          <button className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-all transform hover:scale-105 self-end">
            Analyze Divergence →
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
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>

          <div className="mb-6">
            <div className="text-5xl font-bold mb-2 price-flash">${cexPrice.toFixed(4)}</div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-sm font-semibold">
                ↗ +2.5%
              </span>
              <span className="text-sm text-slate-400">24h Change</span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">24h High</span>
              <span className="font-semibold">$0.0872</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">24h Low</span>
              <span className="font-semibold">$0.0821</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Volume</span>
              <span className="font-semibold">$12.4M</span>
            </div>
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
            <div className="text-5xl font-bold mb-2 price-flash">${dexPrice.toFixed(4)}</div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-sm font-semibold">
                ↗ +3.2%
              </span>
              <span className="text-sm text-slate-400">24h Change</span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Liquidity</span>
              <span className="font-semibold">$3.2M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">24h Volume</span>
              <span className="font-semibold">$856K</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Fee Tier</span>
              <span className="font-semibold">0.3%</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Divergence Alert */}
      <GlassCard className="rounded-2xl p-8 mb-8 border-2 border-red-500/30 alert-pulse">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold">8.2% Price Divergence Detected</h3>
              <span className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm font-bold">🔴 HIGH RISK</span>
            </div>
            <p className="text-slate-400 mb-4">DEX price is 8.2% higher than CEX price. High risk of arbitrage opportunities and potential market manipulation.</p>
            
            {/* Divergence Bar */}
            <DivergenceBar percentage={divergencePercentage} />

            {/* Details */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-xs text-slate-400 mb-1">CEX Price</div>
                <div className="font-bold">${cexPrice.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">DEX Price</div>
                <div className="font-bold">${dexPrice.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Difference</div>
                <div className="font-bold text-red-400">+${(dexPrice - cexPrice).toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-semibold transition-colors">
            View Details
          </button>
          <button className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors">
            Set Alert
          </button>
        </div>
      </GlassCard>

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
          <LineChart
            labels={chartLabels}
            data={divergenceData}
            color="#a855f7"
            title="Divergence"
          />
        </div>
      </GlassCard>

      {/* Recent Alerts */}
      <GlassCard className="rounded-2xl p-8">
        <h3 className="text-lg font-bold mb-6">Recent Divergence Alerts</h3>
        
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

        <button className="w-full mt-6 py-3 border border-slate-700 hover:border-slate-600 rounded-lg font-semibold transition-colors">
          View All Alerts
        </button>
      </GlassCard>
    </>
  )
}
