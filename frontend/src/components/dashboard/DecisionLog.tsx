import { useQuery } from '@tanstack/react-query'
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
      return {
        svg: (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
          </svg>
        ),
        bg: 'bg-green-500/10'
      }
    }
    if (type.includes('blocked')) {
      return {
        svg: (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        ),
        bg: 'bg-red-500/10'
      }
    }
    if (type.includes('payment')) {
      return {
        svg: (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        ),
        bg: 'bg-blue-500/10'
      }
    }
    if (type.includes('divergence')) {
      return {
        svg: (
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
          </svg>
        ),
        bg: 'bg-purple-500/10'
      }
    }
    return {
      svg: (
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      ),
      bg: 'bg-slate-500/10'
    }
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Decision Log
          </h3>
          <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View All →</button>
        </div>
        <div className="text-center py-8 text-slate-400">Loading logs...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          Decision Log
        </h3>
        <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View All →</button>
      </div>

      <div className="space-y-3">
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No logs found</div>
        ) : (
          logs.map((log) => {
            const { svg, bg } = getLogIcon(log.type)
            const timeAgo = formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
            const logText = log.humanReadable || `${log.data?.contractAddress || log.data?.target || 'N/A'} - Score: ${log.data?.riskScore || 'N/A'}`

            return (
              <div
                key={log.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                  {svg}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">
                      {log.type === 'risk_analysis' ? 'Risk Analysis' : 
                       log.type === 'transaction_blocked' ? 'Transaction Blocked' :
                       log.type === 'x402_payment' ? 'x402 Payment' :
                       log.type === 'divergence_analysis' ? 'Divergence Check' :
                       log.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-slate-400">{timeAgo}</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">{logText}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
