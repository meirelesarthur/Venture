import { useDataStore } from '@/store/data'
import type { DadosManejoAnual } from '@/store/data'
import { cn } from '@/lib/utils'
import { CheckCircle2, ChevronRight, Map, Layers, Leaf } from 'lucide-react'

// ── getManejoStatus ───────────────────────────────────────────────────────────

export function getManejoStatus(talhaoId: string, manejo: DadosManejoAnual[], anoAgricola: number) {
  const m = manejo.find(x => x.talhaoId === talhaoId && x.anoAgricola === anoAgricola && x.cenario === 'projeto')
  if (!m) return { lavoura: 'empty' as const, pecuaria: 'empty' as const }
  const lavouraOk = !!(m.cultura || (m.culturas && m.culturas.length > 0))
  const pecuariaOk = !!(m.pecuaria && m.pecuaria.length > 0)
  const isDraft = m.status === 'rascunho'
  return {
    lavoura: lavouraOk ? (isDraft ? 'draft' : 'complete') : 'empty',
    pecuaria: pecuariaOk ? (isDraft ? 'draft' : 'complete') : 'empty',
  } as const
}

// ── getManejoProgress ─────────────────────────────────────────────────────────

export function getManejoProgress(talhaoId: string, manejo: DadosManejoAnual[], anoAgricola: number) {
  const m = manejo.find(x => x.talhaoId === talhaoId && x.anoAgricola === anoAgricola && x.cenario === 'projeto')
  if (!m) return 'empty' as const
  const lavouraOk = !!(m.cultura || (m.culturas && m.culturas.length > 0))
  const pecuariaOk = !!(m.pecuaria && m.pecuaria.length > 0)
  if (lavouraOk || pecuariaOk) return 'complete' as const
  return 'partial' as const
}

export const PROGRESS_DOT: Record<'complete' | 'partial' | 'empty', string> = {
  complete: 'bg-teal-500',
  partial: 'bg-amber-500',
  empty: 'bg-muted-foreground/40',
}

export const PROGRESS_TOOLTIP: Record<'complete' | 'partial' | 'empty', string> = {
  complete: 'Manejo preenchido (lavoura e/ou pecuária)',
  partial: 'Rascunho sem dados de cultura ou pecuária',
  empty: 'Sem dados de manejo',
}

// ── ManejoStatusDots ──────────────────────────────────────────────────────────

export function ManejoStatusDots({ lavoura, pecuaria }: { lavoura: 'complete' | 'draft' | 'empty'; pecuaria: 'complete' | 'draft' | 'empty' }) {
  const color = (v: 'complete' | 'draft' | 'empty') =>
    v === 'complete' ? 'text-success' : v === 'draft' ? 'text-warning' : 'text-muted-foreground/40'
  const icon = (v: 'complete' | 'draft' | 'empty') =>
    v === 'complete' ? '✓' : v === 'draft' ? '●' : '○'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn('font-medium', color(lavoura))}>{icon(lavoura)} Lavoura</span>
      <span className={cn('font-medium', color(pecuaria))}>{icon(pecuaria)} Pecuária</span>
    </div>
  )
}

// ── YearStatus helpers ────────────────────────────────────────────────────────

export type YearStatus = 'aprovado' | 'pendente' | 'correcao' | 'rascunho' | 'empty'

export function getYearMrvStatus(
  year: number,
  projetoTalhoes: { id: string }[],
  manejo: DadosManejoAnual[]
): YearStatus {
  const records = projetoTalhoes
    .map(t => manejo.find(m => m.talhaoId === t.id && m.anoAgricola === year && m.cenario === 'projeto'))
    .filter(Boolean) as DadosManejoAnual[]
  if (records.length === 0) return 'empty'
  if (records.some(m => m.status === 'correcao')) return 'correcao'
  if (records.some(m => m.status === 'pendente')) return 'pendente'
  if (records.every(m => m.status === 'aprovado')) return 'aprovado'
  return 'rascunho'
}

export const YEAR_STATUS_DOT: Record<YearStatus, string> = {
  aprovado: 'bg-success',
  pendente: 'bg-warning',
  correcao: 'bg-danger',
  rascunho: 'bg-muted-foreground/60',
  empty:    'bg-muted-foreground/25',
}

export const YEAR_STATUS_TITLE: Record<YearStatus, string> = {
  aprovado: 'Aprovado',
  pendente: 'Em validação',
  correcao: 'Correção solicitada',
  rascunho: 'Rascunho',
  empty:    'Sem dados',
}

// ── StepIndicator ─────────────────────────────────────────────────────────────

export function StepIndicator({ current, onGoTo }: { current: number; onGoTo: (n: number) => void }) {
  const steps = [
    { n: 1, label: 'Área da Fazenda', icon: Map },
    { n: 2, label: 'Talhões', icon: Layers },
    { n: 3, label: 'Manejo', icon: Leaf },
  ]
  return (
    <div className="flex items-center gap-0 px-6 py-4 border-b border-border/50 bg-surface/20">
      {steps.map((s, i) => {
        const done = current > s.n
        const active = current === s.n
        const clickable = done || active
        return (
          <div key={s.n} className="flex items-center gap-0 flex-1">
            <div
              className={cn('flex items-center gap-2 flex-1', active ? 'opacity-100' : done ? 'opacity-70' : 'opacity-40', clickable && 'cursor-pointer group')}
              onClick={() => clickable && onGoTo(s.n)}
            >
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                active ? 'bg-primary text-primary-foreground' : done ? 'bg-success text-white' : 'bg-border text-muted-foreground')}>
                {done ? <CheckCircle2 size={14} /> : s.n}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block transition-colors', active ? 'text-foreground' : 'text-muted', done && 'group-hover:underline group-hover:text-foreground')}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight size={14} className="text-muted mx-1 shrink-0" />}
          </div>
        )
      })}
    </div>
  )
}
