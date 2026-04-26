import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

// ─── SubEquacao ───────────────────────────────────────────────────────────────

export interface ValorIntermediario {
  label: string
  val: string
  destaque?: boolean
}

export interface SubEquacaoProps {
  ref?: string
  titulo: string
  formula: string
  valores: ValorIntermediario[]
  resultado: string
  calculo?: string
  corResultado?: string
}

export function SubEquacao({ ref: refMetod, titulo, formula, valores, resultado, calculo, corResultado = 'text-primary' }: SubEquacaoProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border/30 rounded-lg overflow-hidden bg-background/40">
      <button
        className="flex items-center justify-between w-full px-3 py-2 hover:bg-accent/5 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={12} className="text-muted shrink-0" /> : <ChevronRight size={12} className="text-muted shrink-0" />}
          <span className="text-xs font-medium text-foreground/90">{titulo}</span>
          {refMetod && (
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono">{refMetod}</span>
          )}
        </div>
        <span className={`text-xs font-bold ${corResultado} shrink-0 ml-2`}>{resultado}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/20 pt-2 animate-in fade-in duration-150">
          <div className="bg-primary/5 border border-primary/10 rounded px-2 py-1.5">
            <p className="text-[10px] text-primary/60 mb-0.5">Equação</p>
            <p className="font-mono text-xs font-semibold text-primary">{formula}</p>
          </div>
          {valores.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {valores.map((v) => (
                <div key={v.label} className={`rounded p-2 border ${v.destaque ? 'border-primary/30 bg-primary/5' : 'border-border/20 bg-surface/50'}`}>
                  <p className="text-[10px] text-muted leading-tight">{v.label}</p>
                  <p className={`text-xs font-semibold ${v.destaque ? 'text-primary' : 'text-foreground'}`}>{v.val}</p>
                </div>
              ))}
            </div>
          )}
          {calculo && (
            <div className="bg-secondary/30 rounded px-2 py-1.5">
              <p className="text-[10px] text-muted mb-0.5">Cálculo numérico</p>
              <p className="font-mono text-[11px] text-foreground/80 break-all">{calculo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ModuloCard ───────────────────────────────────────────────────────────────

export interface ModuloCardProps {
  titulo: string
  subtitulo?: string
  resultado: string
  corResultado?: string
  filhos: React.ReactNode
  defaultOpen?: boolean
  forceOpen?: boolean
}

export function ModuloCard({ titulo, subtitulo, resultado, corResultado = 'text-success', filhos, defaultOpen = false, forceOpen }: ModuloCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => { if (forceOpen !== undefined) setOpen(forceOpen) }, [forceOpen])
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        className="flex items-center justify-between w-full px-4 py-3 bg-surface/40 hover:bg-accent/5 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <div>
            <p className="text-sm font-semibold text-foreground">{titulo}</p>
            {subtitulo && <p className="text-[10px] text-muted">{subtitulo}</p>}
          </div>
        </div>
        <span className={`text-sm font-bold ${corResultado}`}>{resultado}</span>
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-border/30 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 bg-background/30">
          {filhos}
        </div>
      )}
    </div>
  )
}
