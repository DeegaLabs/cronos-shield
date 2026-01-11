/**
 * Dashboard Page
 * 
 * Main observability dashboard
 */

import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api/client';
import Metrics from '../components/dashboard/Metrics';
import DecisionLog from '../components/dashboard/DecisionLog';
import BlockedTransactions from '../components/dashboard/BlockedTransactions';
import type { Metrics as MetricsType } from '../types';

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery<MetricsType>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await apiClient.get('/api/observability/metrics');
      return response.data;
    },
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">📊 Observability Dashboard</h2>
        <p className="text-slate-400">Real-time monitoring of AI decisions and system metrics</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading metrics...</div>
      ) : metrics ? (
        <>
          <Metrics metrics={metrics} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DecisionLog />
            <BlockedTransactions />
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-red-400">Error loading metrics</div>
      )}
    </div>
  );
}
