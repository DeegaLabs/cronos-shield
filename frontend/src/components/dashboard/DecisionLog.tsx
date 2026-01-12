/**
 * Decision Log Component
 */

import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api/client';
import { ListItemSkeleton } from '../common/Skeleton';
import type { LogEntry } from '../../types';

export default function DecisionLog() {
  const { data: logs, isLoading } = useQuery<LogEntry[]>({
    queryKey: ['logs'],
    queryFn: async () => {
      const response = await apiClient.get('/api/observability/logs', {
        params: { limit: 50 },
      });
      return response.data;
    },
    refetchInterval: 3000,
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'x402_payment': '💰',
      'risk_analysis': '🔍',
      'transaction_blocked': '🚫',
      'transaction_allowed': '✅',
      'divergence_analysis': '📊',
    };
    return icons[type] || '📝';
  };

  const getTypeColor = (type: string) => {
    if (type === 'transaction_blocked') return 'text-red-400';
    if (type === 'transaction_allowed') return 'text-green-400';
    if (type === 'x402_payment') return 'text-blue-400';
    return 'text-slate-300';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading logs...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold">📝 Decision Log</h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No logs found</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{getTypeIcon(log.type)}</span>
                    <span className={`font-semibold ${getTypeColor(log.type)}`}>
                      {log.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">({log.service})</span>
                  </div>
                  <p className="text-slate-200">{log.humanReadable}</p>
                </div>
                <div className="text-xs text-slate-500 ml-4">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
