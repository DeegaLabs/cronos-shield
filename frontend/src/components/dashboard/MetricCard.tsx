import type { LucideIcon } from 'lucide-react'
import { GlassCard } from '../cards/GlassCard'
import { SparklineChart } from '../charts/SparklineChart'

interface MetricCardProps {
  label: string
  value: string | number
  change: string
  changeColor?: 'green' | 'red'
  last24h: string
  sparklineData: number[]
  sparklineColor: string
  icon: LucideIcon
  valueColor?: string
}

export const MetricCard = ({
  label,
  value,
  change,
  changeColor = 'green',
  last24h,
  sparklineData,
  sparklineColor,
  icon: Icon,
  valueColor = 'text-white',
}: MetricCardProps) => {
  return (
    <GlassCard className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm font-semibold uppercase tracking-wide">
          {label}
        </span>
        <Icon className="w-5 h-5 text-slate-500" />
      </div>
      <div className="mb-3">
        <div className={`text-3xl font-bold mb-1 ${valueColor}`}>{value}</div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${changeColor === 'green' ? 'text-green-400' : 'text-red-400'}`}>
            {change}
          </span>
          <span className="text-xs text-slate-500">Last 24h: {last24h}</span>
        </div>
      </div>
      <SparklineChart data={sparklineData} color={sparklineColor} />
    </GlassCard>
  )
}
