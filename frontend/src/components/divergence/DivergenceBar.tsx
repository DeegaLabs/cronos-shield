interface DivergenceBarProps {
  percentage: number
}

export const DivergenceBar = ({ percentage }: DivergenceBarProps) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="text-slate-400">Divergence Level</span>
        <span className="font-bold text-red-400">{percentage.toFixed(1)}%</span>
      </div>
      <div className="divergence-bar">
        <div
          className="divergence-indicator"
          style={{ left: `${Math.min(percentage * 10, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>0% - Safe</span>
        <span>5% - Caution</span>
        <span>10% - Critical</span>
      </div>
    </div>
  )
}
