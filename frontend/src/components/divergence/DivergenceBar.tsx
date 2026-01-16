interface DivergenceBarProps {
  percentage: number
}

export const DivergenceBar = ({ percentage }: DivergenceBarProps) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="text-slate-400">Divergence Level</span>
        <span className="font-bold text-red-400">{percentage}%</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-green-500 via-yellow-500 to-red-500">
        <div
          className="absolute top-[-4px] w-1 h-5 bg-white shadow-lg transition-all duration-500"
          style={{ left: `${percentage}%` }}
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
