import { useQuery } from '@tanstack/react-query'
import { XCircle } from 'lucide-react'
import apiClient from '../../lib/api/client'
import type { BlockedTransaction } from '../../types'
import { formatDistanceToNow } from 'date-fns'

export default function BlockedTransactions() {
  const { data: blocks, isLoading } = useQuery<BlockedTransaction[]>({
    queryKey: ['blocked-transactions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/observability/blocked-transactions', {
        params: { limit: 3 },
      })
      return response.data || []
    },
    refetchInterval: 3000,
  })

  const blocksCount = Array.isArray(blocks) ? blocks.length : 0

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            Blocked Transactions
          </h3>
          <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm font-semibold">
            {blocksCount} Total
          </span>
        </div>
        <div className="text-center py-8 text-slate-400">Loading blocked transactions...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400" />
          Blocked Transactions
        </h3>
        <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm font-semibold">
          {blocksCount} Total
        </span>
      </div>

      <div className="space-y-3">
        {!blocks || blocks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No blocked transactions</div>
        ) : (
          blocks.map((block) => {
            const timeAgo = formatDistanceToNow(new Date(block.timestamp), { addSuffix: true })
            const addressShort = `${block.target.slice(0, 6)}...${block.target.slice(-4)}`

            return (
              <div
                key={block.id}
                className="p-4 rounded-lg bg-red-950/20 border border-red-900/30 hover:border-red-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm mb-1">
                      {block.reason || 'High Risk Contract'}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{addressShort}</div>
                  </div>
                  <span className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold">
                    {block.riskScore}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{timeAgo}</span>
                  <span>•</span>
                  <span>{block.service || 'Risk Oracle'}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <button className="w-full mt-4 py-2 border border-slate-700 hover:border-slate-600 rounded-lg text-sm font-semibold transition-colors">
        View All Blocked Transactions
      </button>
    </div>
  )
}
