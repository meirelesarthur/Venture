interface ScoreBarProps {
  score: number
  size?: 'sm' | 'md'
}

export function ScoreBar({ score, size = 'sm' }: ScoreBarProps) {
  const h = size === 'md' ? 'h-2' : 'h-1.5'
  const weight = size === 'md' ? 'font-bold' : 'font-semibold'
  const color = score === 100 ? 'bg-success' : score >= 78 ? 'bg-warning' : 'bg-danger'
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} bg-secondary rounded-full overflow-hidden`}>
        <div className={`${h} rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-mono ${weight}`}>{score}%</span>
    </div>
  )
}
