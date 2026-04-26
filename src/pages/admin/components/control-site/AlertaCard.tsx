interface AlertaCardProps {
  nivel: '🔴' | '🟡' | '🔵'
  texto: string
  ctaLabel?: string
  onCta?: () => void
}

export function AlertaCard({ nivel, texto, ctaLabel, onCta }: AlertaCardProps) {
  const cls =
    nivel === '🔴' ? 'border-danger/30 bg-danger/5 text-danger' :
    nivel === '🟡' ? 'border-warning/30 bg-warning/5 text-warning' :
    'border-primary/30 bg-primary/5 text-primary'
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs ${cls}`}>
      <span className="text-base leading-none shrink-0">{nivel}</span>
      <span className="flex-1">{texto}</span>
      {ctaLabel && onCta && (
        <button onClick={onCta} className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap">
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
