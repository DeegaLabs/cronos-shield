import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/api/client'
import type { BlockedTransaction, Metrics } from '../../types'
import { formatDistanceToNow } from 'date-fns'

export default function BlockedTransactions() {
  const { data: blocks, isLoading, error } = useQuery<BlockedTransaction[]>({
    queryKey: ['blocked-transactions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/observability/blocked-transactions', {
        params: { limit: 3 },
      })
      // Ensure we return an array
      const data = response.data
      if (Array.isArray(data)) {
        return data
      }
      // Handle case where API might return { blockedTransactions: [...] }
      if (data && typeof data === 'object' && 'blockedTransactions' in data && Array.isArray(data.blockedTransactions)) {
        return data.blockedTransactions
      }
      return []
    },
    refetchInterval: 30000, // Refetch every 30 seconds (reduced from 3s)
  })

  // Get total count from metrics
  const { data: metrics } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await apiClient.get('/api/observability/metrics')
      return response.data
    },
    refetchInterval: 30000,
  })

  const blocksCount = metrics?.totalBlocks || (Array.isArray(blocks) ? blocks.length : 0)

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
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
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>
          Blocked Transactions
        </h3>
        <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm font-semibold">
          {blocksCount} Total
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          Error loading blocked transactions: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}
      <div className="space-y-3">
        {!blocks || blocks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            {isLoading ? 'Loading blocked transactions...' : 'No blocked transactions'}
          </div>
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
                    <div className="text-xs text-slate-400 font-mono">
                      {block.target ? `${block.target.slice(0, 6)}...${block.target.slice(-4)}` : addressShort}
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold">
                    {block.riskScore}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{timeAgo}</span>
                  <span>•</span>
                  <span>{block.reason || 'Unverified contract'}</span>
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
