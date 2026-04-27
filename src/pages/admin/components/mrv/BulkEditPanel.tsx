import { useState } from 'react'
import { useDataStore } from '@/store/data'
import type { Talhao } from '@/store/data'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AlertTriangle, X, Save, Users } from 'lucide-react'
import { CULTURAS } from '@/constants/climaticos'

export interface BulkEditPanelProps {
  selectedIds: string[]
  talhoes: Talhao[]
  fazendaId: string
  anoAgricola: number
  onCancelAll: () => void
  onRemove: (id: string) => void
}

export function BulkEditPanel({ selectedIds, talhoes, fazendaId: _fazendaId, anoAgricola, onCancelAll, onRemove }: BulkEditPanelProps) {
  const { manejo, updateManejo } = useDataStore()

  const selectedTalhoes = talhoes.filter(t => selectedIds.includes(t.id))
  const manejoRecords = selectedIds.map(id =>
    manejo.find(m => m.talhaoId === id && m.anoAgricola === anoAgricola && m.cenario === 'projeto') ?? null
  )

  const culturas = manejoRecords.map(m => m?.cultura ?? '')
  const residuos = manejoRecords.map(m => m?.residuosCampo)
  const queima   = manejoRecords.map(m => m?.queimaResiduos)

  const culturaDivergent  = new Set(culturas).size > 1
  const residuosDivergent = new Set(residuos.map(String)).size > 1
  const queimaDivergent   = new Set(queima.map(String)).size > 1
  const hasDivergent = culturaDivergent || residuosDivergent || queimaDivergent

  const [bulk, setBulk] = useState({
    cultura:        culturaDivergent  ? '' : (culturas[0] ?? ''),
    residuosCampo:  residuosDivergent ? (undefined as boolean | undefined) : residuos[0],
    queimaResiduos: queimaDivergent   ? (undefined as boolean | undefined) : queima[0],
  })

  const handleSave = () => {
    selectedIds.forEach((_tId, i) => {
      const m = manejoRecords[i]
      if (!m) return
      const changes: Record<string, unknown> = {}
      if (bulk.cultura) changes.cultura = bulk.cultura
      if (bulk.residuosCampo !== undefined) changes.residuosCampo = bulk.residuosCampo
      if (bulk.queimaResiduos !== undefined) changes.queimaResiduos = bulk.queimaResiduos
      if (Object.keys(changes).length > 0) updateManejo(m.id, changes)
    })
    toast.success(`Alterações aplicadas a ${selectedIds.length} talhões.`)
    onCancelAll()
  }

  const ToggleBtns = ({ value, onChange }: { value: boolean | undefined; onChange: (v: boolean) => void }) => (
    <div className="flex gap-2">
      {([true, false] as const).map(v => (
        <button key={String(v)} onClick={() => onChange(v)}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-medium border transition-all',
            value === v
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-background text-muted-foreground border-border hover:border-teal-400'
          )}>
          {v ? 'Sim' : 'Não'}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 bg-surface/10 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} className="text-teal-600" />
          <span className="text-sm font-bold">Editando {selectedIds.length} talhões em lote</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {selectedTalhoes.map(t => (
            <span key={t.id}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
              {t.nome}
              <button onClick={() => onRemove(t.id)} className="hover:text-red-500 transition-colors ml-0.5">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <h4 className="text-sm font-bold mb-3 text-foreground">Campos Compartilhados</h4>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bulk-cultura">Cultura Principal</Label>
              <Select value={bulk.cultura} onValueChange={v => setBulk(p => ({ ...p, cultura: v }))}>
                <SelectTrigger id="bulk-cultura" className="rounded-xl">
                  <SelectValue placeholder={culturaDivergent ? 'Valores diferentes — selecione para substituir' : 'Selecionar'} />
                </SelectTrigger>
                <SelectContent>
                  {CULTURAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Resíduos mantidos no campo</Label>
                <ToggleBtns value={bulk.residuosCampo} onChange={v => setBulk(p => ({ ...p, residuosCampo: v }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Queima de resíduos</Label>
                <ToggleBtns value={bulk.queimaResiduos} onChange={v => setBulk(p => ({ ...p, queimaResiduos: v }))} />
              </div>
            </div>
          </div>
        </div>

        {hasDivergent && (
          <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Campos com Valores Divergentes</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Os talhões selecionados possuem valores diferentes nos campos abaixo.
                  Editar aqui substituirá os valores de todos.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {culturaDivergent && (
                <div className="text-xs bg-white/80 rounded-lg p-2.5 border border-amber-200 space-y-1">
                  <span className="font-mono text-amber-700 font-semibold">Cultura:</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {selectedTalhoes.map((t, i) => (
                      <span key={t.id} className="text-muted">
                        {t.nome} = <span className="font-semibold text-foreground">{culturas[i] || '—'}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {residuosDivergent && (
                <div className="text-xs bg-white/80 rounded-lg p-2.5 border border-amber-200 space-y-1">
                  <span className="font-mono text-amber-700 font-semibold">Resíduos no campo:</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {selectedTalhoes.map((t, i) => (
                      <span key={t.id} className="text-muted">
                        {t.nome} = <span className="font-semibold text-foreground">
                          {residuos[i] === true ? 'Sim' : residuos[i] === false ? 'Não' : '—'}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {queimaDivergent && (
                <div className="text-xs bg-white/80 rounded-lg p-2.5 border border-amber-200 space-y-1">
                  <span className="font-mono text-amber-700 font-semibold">Queima de resíduos:</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {selectedTalhoes.map((t, i) => (
                      <span key={t.id} className="text-muted">
                        {t.nome} = <span className="font-semibold text-foreground">
                          {queima[i] === true ? 'Sim' : queima[i] === false ? 'Não' : '—'}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-border/50 bg-surface/10 flex items-center justify-end gap-3 shrink-0">
        <Button variant="outline" size="sm" onClick={onCancelAll} className="rounded-xl">Cancelar</Button>
        <Button size="sm" onClick={handleSave} className="gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
          <Save size={13} /> Salvar Alterações
        </Button>
      </div>
    </div>
  )
}
