import { useQuery } from '@tanstack/react-query'
import { Clipboard, CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react'
import apiClient from '../../lib/api/client'
import type { LogEntry } from '../../types'
import { formatDistanceToNow } from 'date-fns'

export default function DecisionLog() {
  const { data: logs, isLoading } = useQuery<LogEntry[]>({
    queryKey: ['logs'],
    queryFn: async () => {
      const response = await apiClient.get('/api/observability/logs', {
        params: { limit: 5 },
      })
      return response.data
    },
    refetchInterval: 3000,
  })

  const getLogIcon = (type: string) => {
    if (type.includes('risk_analysis') || type.includes('allowed')) {
      return { Icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' }
    }
    if (type.includes('blocked')) {
      return { Icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' }
    }
    if (type.includes('payment')) {
      return { Icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10' }
    }
    if (type.includes('divergence')) {
      return { Icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' }
    }
    return { Icon: Clipboard, color: 'text-slate-400', bg: 'bg-slate-500/10' }
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-indigo-400" />
            Decision Log
          </h3>
          <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            View All →
          </button>
        </div>
        <div className="text-center py-8 text-slate-400">Loading logs...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Clipboard className="w-5 h-5 text-indigo-400" />
          Decision Log
        </h3>
        <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          View All →
        </button>
      </div>

      <div className="space-y-3">
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No logs found</div>
        ) : (
          logs.map((log) => {
            const { Icon, color, bg } = getLogIcon(log.type)
            const timeAgo = formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })

            return (
              <div
                key={log.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">
                      {log.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-slate-400">{timeAgo}</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">{log.humanReadable}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
