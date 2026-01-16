import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { GlassCard } from '../cards/GlassCard'
import { formatDistanceToNow } from 'date-fns'

interface RecentAnalysisCardProps {
  address: string
  score: number
  timestamp: Date
}

export const RecentAnalysisCard = ({ address, score, timestamp }: RecentAnalysisCardProps) => {
  const getScoreColor = (score: number) => {
    if (score <= 30) return { color: 'text-green-400', bg: 'bg-green-500/10', Icon: CheckCircle }
    if (score <= 70) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', Icon: AlertTriangle }
    return { color: 'text-red-400', bg: 'bg-red-500/10', Icon: XCircle }
  }

  const { color, bg, Icon } = getScoreColor(score)
  const addressShort = `${address.slice(0, 6)}...${address.slice(-3)}`
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true })

  return (
    <GlassCard className="rounded-xl p-4 border border-slate-700/50 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-slate-400">{addressShort}</span>
        <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className={`text-2xl font-bold mb-1 ${color}`}>{score}</div>
      <div className="text-xs text-slate-500">{timeAgo}</div>
    </GlassCard>
  )
}
