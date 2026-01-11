/**
 * CEX-DEX Synergy Page
 * 
 * Price divergence analysis interface
 */

import DivergenceAnalysis from '../components/divergence/DivergenceAnalysis';

export default function DivergencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">📈 CEX-DEX Synergy</h2>
        <p className="text-slate-400">Real-time price divergence detection between CEX and DEX</p>
      </div>

      <DivergenceAnalysis />
    </div>
  );
}
