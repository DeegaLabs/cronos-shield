/**
 * Risk Oracle Page
 * 
 * Risk analysis interface
 */

import RiskAnalysis from '../components/risk/RiskAnalysis';

export default function RiskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">🔍 Risk Oracle</h2>
        <p className="text-slate-400">Analyze smart contract risk with AI-powered scoring</p>
      </div>

      <RiskAnalysis />
    </div>
  );
}
