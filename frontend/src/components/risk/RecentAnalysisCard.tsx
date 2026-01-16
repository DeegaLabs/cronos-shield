import { formatDistanceToNow } from 'date-fns'

interface RecentAnalysisCardProps {
  address: string
  score: number
  timestamp: Date
}

export const RecentAnalysisCard = ({ address, score, timestamp }: RecentAnalysisCardProps) => {
  const getScoreColor = (score: number) => {
    if (score <= 30) {
      return {
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        svg: (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
          </svg>
        )
      }
    }
    if (score <= 70) {
      return {
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        svg: (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        )
      }
    }
    return {
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      svg: (
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      )
    }
  }

  const { color, bg, svg } = getScoreColor(score)
  const addressShort = `${address.slice(0, 6)}...${address.slice(-3)}`
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true })

  return (
    <div className="recent-card glass-card rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-slate-400">{addressShort}</span>
        <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center`}>
          {svg}
        </div>
      </div>
      <div className={`text-2xl font-bold mb-1 ${color}`}>{score}</div>
      <div className="text-xs text-slate-500">{timeAgo}</div>
    </div>
  )
}
