/**
 * Activity Table Component
 * 
 * Full-width table showing all system activities
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/api/client'
import { GlassCard } from '../cards/GlassCard'
import { formatDistanceToNow } from 'date-fns'
import type { LogEntry, BlockedTransaction } from '../../types'

interface Activity {
  id: string
  time: string
  type: 'risk_check' | 'block' | 'payment' | 'divergence'
  status: 'passed' | 'blocked' | 'paid' | 'warning'
  details: string
  score?: number
  txHash?: string
}

export const ActivityTable = () => {
  const [filter, setFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 5

  // Fetch activities from API
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['activities', filter, page],
    queryFn: async () => {
      // Combine logs and blocked transactions
      const [logsResponse, blocksResponse] = await Promise.all([
        apiClient.get('/api/observability/logs', { params: { limit: 50 } }),
        apiClient.get('/api/observability/blocked-transactions', { params: { limit: 50 } }),
      ])

      const logs: LogEntry[] = logsResponse.data || []
      const blocks: BlockedTransaction[] = blocksResponse.data || []

      // Transform to Activity format
      const activities: Activity[] = [
        ...logs.map((log) => {
          const isBlocked = log.type === 'transaction_blocked'
          const isPayment = log.type === 'x402_payment'
          const isDivergence = log.type === 'divergence_analysis'
          
          let type: Activity['type'] = 'risk_check'
          if (isBlocked) type = 'block'
          else if (isPayment) type = 'payment'
          else if (isDivergence) type = 'divergence'
          
          let status: Activity['status'] = 'passed'
          if (isBlocked) status = 'blocked'
          else if (isPayment) status = 'paid'
          else if (log.type === 'transaction_allowed') status = 'passed'
          else if (isDivergence && log.data?.divergence && parseFloat(log.data.divergence) > 5) status = 'warning'
          
          const details = log.data?.contractAddress || log.data?.target || log.data?.transactionHash || log.data?.token || log.humanReadable || 'N/A'
          const score = log.data?.riskScore || log.data?.score
          
          return {
            id: log.id,
            time: new Date(log.timestamp).toISOString(),
            type,
            status,
            details: typeof details === 'string' ? details : JSON.stringify(details),
            score,
            txHash: log.data?.transactionHash,
          }
        }),
        ...blocks.map((block) => ({
          id: block.id,
          time: new Date(block.timestamp).toISOString(),
          type: 'block' as const,
          status: 'blocked' as const,
          details: block.target || block.user || 'N/A',
          score: block.riskScore,
          txHash: block.target?.startsWith('0x') ? block.target : undefined,
        })),
      ]

      // Sort by time (newest first)
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

      // Apply filter
      let filtered = activities
      if (filter !== 'all') {
        filtered = activities.filter((a) => {
          if (filter === 'risk_analysis') return a.type === 'risk_check'
          if (filter === 'blocked') return a.type === 'block'
          if (filter === 'payments') return a.type === 'payment'
          return true
        })
      }

      // Paginate
      const start = (page - 1) * pageSize
      return filtered.slice(start, start + pageSize)
    },
    refetchInterval: 30000, // Refetch every 30 seconds (reduced from 10s)
  })

  const getTypeBadge = (type: Activity['type']) => {
    const badges = {
      risk_check: { label: 'Risk Check', className: 'bg-green-500/10 text-green-400' },
      block: { label: 'Block', className: 'bg-red-500/10 text-red-400' },
      payment: { label: 'Payment', className: 'bg-blue-500/10 text-blue-400' },
      divergence: { label: 'Divergence', className: 'bg-purple-500/10 text-purple-400' },
    }
    const badge = badges[type]
    return (
      <span className={`px-2 py-1 rounded text-xs ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const getStatusDisplay = (status: Activity['status']) => {
    const displays = {
      passed: { icon: '✅', text: 'Passed', className: 'text-green-400' },
      blocked: { icon: '❌', text: 'Blocked', className: 'text-red-400' },
      paid: { icon: '💰', text: 'Paid', className: 'text-blue-400' },
      warning: { icon: '⚠️', text: 'Warning', className: 'text-yellow-400' },
    }
    const display = displays[status]
    return (
      <span className={display.className}>
        {display.icon} {display.text}
      </span>
    )
  }

  const getScoreBadge = (score?: number) => {
    if (!score) return <span>-</span>
    const color = score < 30 ? 'bg-green-500/20 text-green-300' : score < 70 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
    return (
      <span className={`px-2 py-1 rounded font-bold ${color}`}>
        {score}
      </span>
    )
  }

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <GlassCard className="rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">All Activity</h3>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setPage(1)
            }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="risk_analysis">Risk Analysis</option>
            <option value="blocked">Blocked</option>
            <option value="payments">Payments</option>
          </select>
          <button className="px-4 py-2 border border-slate-700 rounded-lg text-sm hover:bg-slate-800 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800">
            <tr className="text-left">
              <th className="pb-3 font-semibold text-slate-400">Time</th>
              <th className="pb-3 font-semibold text-slate-400">Type</th>
              <th className="pb-3 font-semibold text-slate-400">Status</th>
              <th className="pb-3 font-semibold text-slate-400">Details</th>
              <th className="pb-3 font-semibold text-slate-400">Score</th>
              <th className="pb-3 font-semibold text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Loading activities...
                </td>
              </tr>
            ) : activities && activities.length > 0 ? (
              activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-4 text-slate-400">
                    {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                  </td>
                  <td className="py-4">{getTypeBadge(activity.type)}</td>
                  <td className="py-4">{getStatusDisplay(activity.status)}</td>
                  <td className="py-4 font-mono text-xs">
                    {activity.details.startsWith('0x') ? formatAddress(activity.details) : activity.details}
                  </td>
                  <td className="py-4">{getScoreBadge(activity.score)}</td>
                  <td className="py-4">
                    <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
                      {activity.txHash ? 'Tx' : 'View'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No activities found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-800">
        <div className="text-sm text-slate-400">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, activities?.length || 0)} of {activities?.length || 0} activities
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-slate-700 rounded-lg text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(1)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              page === 1
                ? 'bg-indigo-600'
                : 'border border-slate-700 hover:bg-slate-800'
            }`}
          >
            1
          </button>
          <button
            onClick={() => setPage(2)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              page === 2
                ? 'bg-indigo-600'
                : 'border border-slate-700 hover:bg-slate-800'
            }`}
          >
            2
          </button>
          <button
            onClick={() => setPage(3)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              page === 3
                ? 'bg-indigo-600'
                : 'border border-slate-700 hover:bg-slate-800'
            }`}
          >
            3
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!activities || activities.length < pageSize}
            className="px-4 py-2 border border-slate-700 rounded-lg text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </GlassCard>
  )
}
