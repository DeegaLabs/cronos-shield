/**
 * Blocked Transactions Component
 */

import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api/client';
import type { BlockedTransaction } from '../../types';

export default function BlockedTransactions() {
  const { data: blocks, isLoading } = useQuery<BlockedTransaction[]>({
    queryKey: ['blocked-transactions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/observability/blocked-transactions', {
        params: { limit: 50 },
      });
      return response.data;
    },
    refetchInterval: 3000,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading blocked transactions...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold">🚫 Blocked Transactions</h3>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-4">
        <div className="text-slate-300">
          Total blocked: <span className="font-bold text-red-400">{blocks?.length || 0}</span>
        </div>
        <div className="text-sm text-slate-500 mt-1">
          Transactions blocked by the Shield to protect capital
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {!blocks || blocks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No blocked transactions</div>
        ) : (
          blocks.map((block) => (
            <div
              key={block.id}
              className="bg-slate-800 p-4 rounded-lg border border-red-500/50 hover:border-red-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🚫</span>
                    <span className="font-semibold text-red-400">BLOCKED</span>
                    <span className="text-xs text-slate-500">({block.service})</span>
                  </div>
                  <p className="text-slate-200 mb-2">{block.reason}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-slate-400">
                      Target: <span className="text-slate-300 font-mono">{block.target.slice(0, 10)}...</span>
                    </span>
                    <span className="text-slate-400">
                      Risk Score: <span className="text-red-400">{block.riskScore}/100</span>
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 ml-4">
                  {new Date(block.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
