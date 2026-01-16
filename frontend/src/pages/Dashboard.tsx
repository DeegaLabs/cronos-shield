import { useQuery } from '@tanstack/react-query'
import apiClient from '../lib/api/client'
import { GlassCard } from '../components/cards/GlassCard'
import { SystemHealthBadge } from '../components/dashboard/SystemHealthBadge'
import { MetricCard } from '../components/dashboard/MetricCard'
import { LineChart } from '../components/charts/LineChart'
import DecisionLog from '../components/dashboard/DecisionLog'
import BlockedTransactions from '../components/dashboard/BlockedTransactions'
import { ActivityTable } from '../components/dashboard/ActivityTable'
import type { Metrics as MetricsType } from '../types'

export default function DashboardPage() {
  const { data: metrics } = useQuery<MetricsType>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await apiClient.get('/api/observability/metrics')
      return response.data
    },
    refetchInterval: 5000,
  })

  // Mock data for sparklines (will be replaced with real data)
  const sparklineData1 = [100, 110, 105, 120, 115, 130, 125, 140, 135, 150, 145, 156]
  const sparklineData2 = [70, 68, 72, 69, 71, 67, 70, 66, 69, 65, 68, 67]
  const sparklineData3 = [10, 12, 8, 15, 11, 13, 9, 14, 10, 12, 11, 12]
  const sparklineData4 = [30, 32, 35, 33, 36, 38, 37, 40, 39, 42, 41, 45]

  // Mock chart data
  const revenueData = [0.2, 0.3, 0.25, 0.4, 0.35, 0.5, 0.45]
  const riskData = [48, 45, 47, 44, 43, 42, 42.8]
  const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          Observability Dashboard
        </h1>
        <p className="text-slate-400">Real-time monitoring of AI decisions and system metrics</p>
      </div>

      {/* System Health */}
      <SystemHealthBadge />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          label="Total Payments"
          value={metrics?.totalPayments || '1,234'}
          change="+12.5%"
          changeColor="green"
          last24h="156"
          sparklineData={sparklineData1}
          sparklineColor="#10b981"
          iconSvg={
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
        <MetricCard
          label="Risk Analyses"
          value={metrics?.totalAnalyses || '567'}
          change="-5.2%"
          changeColor="red"
          last24h="67"
          sparklineData={sparklineData2}
          sparklineColor="#ef4444"
          iconSvg={
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
        <MetricCard
          label="Blocked Txns"
          value={metrics?.totalBlocks || '89'}
          change="+8.7%"
          changeColor="green"
          last24h="12"
          sparklineData={sparklineData3}
          sparklineColor="#f59e0b"
          valueColor="text-red-400"
          iconSvg={
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
          }
        />
        <MetricCard
          label="Divergence Checks"
          value="342"
          change="+15.3%"
          changeColor="green"
          last24h="45"
          sparklineData={sparklineData4}
          sparklineColor="#a855f7"
          iconSvg={
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
            </svg>
          }
        />
      </div>

      {/* Revenue and Risk Score Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <GlassCard className="rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold mb-1">Total Revenue (x402)</h3>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-green-400">2.5678 devUSDC.e</span>
                <span className="text-sm text-green-400">+23.4%</span>
              </div>
            </div>
            <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
              <option>7 Days</option>
              <option>30 Days</option>
              <option>90 Days</option>
            </select>
          </div>
          <LineChart
            labels={chartLabels}
            data={revenueData}
            color="#10b981"
            title="Revenue"
          />
        </GlassCard>

        {/* Average Risk Score */}
        <GlassCard className="rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold mb-1">Average Risk Score</h3>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-yellow-400">42.8/100</span>
                <span className="text-sm text-green-400">-5.2% (safer)</span>
              </div>
            </div>
            <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
              <option>7 Days</option>
              <option>30 Days</option>
              <option>90 Days</option>
            </select>
          </div>
          <LineChart
            labels={chartLabels}
            data={riskData}
            color="#f59e0b"
            title="Risk Score"
            max={100}
          />
        </GlassCard>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <GlassCard className="rounded-2xl p-6">
          <DecisionLog />
        </GlassCard>
        <GlassCard className="rounded-2xl p-6">
          <BlockedTransactions />
        </GlassCard>
      </div>

      {/* Full Width Activity Table */}
      <ActivityTable />
    </>
  )
}
