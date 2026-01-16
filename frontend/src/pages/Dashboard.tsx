import { useQuery } from '@tanstack/react-query'
import { BarChart3, CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react'
import apiClient from '../lib/api/client'
import { GlassCard } from '../components/cards/GlassCard'
import { SystemHealthBadge } from '../components/dashboard/SystemHealthBadge'
import { MetricCard } from '../components/dashboard/MetricCard'
import { LineChart } from '../components/charts/LineChart'
import DecisionLog from '../components/dashboard/DecisionLog'
import BlockedTransactions from '../components/dashboard/BlockedTransactions'
import type { Metrics as MetricsType } from '../types'

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery<MetricsType>({
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-400" />
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
          icon={DollarSign}
        />
        <MetricCard
          label="Risk Analyses"
          value={metrics?.totalAnalyses || '567'}
          change="-5.2%"
          changeColor="red"
          last24h="67"
          sparklineData={sparklineData2}
          sparklineColor="#ef4444"
          icon={CheckCircle}
        />
        <MetricCard
          label="Blocked Txns"
          value={metrics?.blockedTransactions || '89'}
          change="+8.7%"
          changeColor="green"
          last24h="12"
          sparklineData={sparklineData3}
          sparklineColor="#f59e0b"
          icon={XCircle}
          valueColor="text-red-400"
        />
        <MetricCard
          label="Divergence Checks"
          value="342"
          change="+15.3%"
          changeColor="green"
          last24h="45"
          sparklineData={sparklineData4}
          sparklineColor="#a855f7"
          icon={TrendingUp}
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
    </div>
  )
}
