interface RiskScoreBarProps {
  score: number
}

export const RiskScoreBar = ({ score }: RiskScoreBarProps) => {
  const getScoreColor = (score: number) => {
    if (score <= 30) return 'text-green-400'
    if (score <= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score: number) => {
    if (score <= 30) return '🟢 SAFE'
    if (score <= 70) return '🟡 MEDIUM RISK'
    return '🔴 HIGH RISK'
  }

  const getScoreBg = (score: number) => {
    if (score <= 30) return 'bg-green-500'
    if (score <= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Risk Score</span>
        <div className="flex items-center gap-3">
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}/100</span>
          <span className={`px-3 py-1 ${getScoreBg(score)} text-white rounded-lg text-sm font-bold`}>
            {getScoreLabel(score)}
          </span>
        </div>
      </div>
      
      <div className="risk-bar relative">
        <div 
          className="absolute top-0 w-1 h-full bg-white shadow-lg"
          style={{ left: `${score}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>0 - Safe</span>
        <span>50 - Medium</span>
        <span>100 - High Risk</span>
      </div>
    </div>
  )
}
