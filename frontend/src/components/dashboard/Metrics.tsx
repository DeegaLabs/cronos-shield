/**
 * Metrics Component
 */

import { CardSkeleton } from '../common/Skeleton';
import type { Metrics } from '../../types';

interface MetricsProps {
  metrics: Metrics;
}

export default function Metrics({ metrics }: MetricsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">📈 System Metrics</h3>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm">Total Payments</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">{metrics.totalPayments}</div>
          <div className="text-xs text-slate-500 mt-1">Last 24h: {metrics.last24Hours.payments}</div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm">Risk Analyses</div>
          <div className="text-3xl font-bold text-green-400 mt-2">{metrics.totalAnalyses}</div>
          <div className="text-xs text-slate-500 mt-1">Last 24h: {metrics.last24Hours.analyses}</div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm">Blocked Transactions</div>
          <div className="text-3xl font-bold text-red-400 mt-2">{metrics.totalBlocks}</div>
          <div className="text-xs text-slate-500 mt-1">Last 24h: {metrics.last24Hours.blocks}</div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm">Divergence Checks</div>
          <div className="text-3xl font-bold text-purple-400 mt-2">{metrics.totalDivergences}</div>
          <div className="text-xs text-slate-500 mt-1">Last 24h: {metrics.last24Hours.divergences}</div>
        </div>
      </div>

      {/* Averages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm">Average Risk Score</div>
          <div className="text-2xl font-bold text-yellow-400 mt-2">{metrics.averageRiskScore.toFixed(2)}/100</div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm">Total Revenue</div>
          <div className="text-2xl font-bold text-green-400 mt-2">{metrics.totalRevenue} devUSDC.e</div>
        </div>
      </div>
    </div>
  );
}
