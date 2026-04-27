import { useState } from 'react'
import { useDataStore } from '@/store/data'
import type { Talhao } from '@/store/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Plus, X } from 'lucide-react'

// ── TalhaoTypeBadge ───────────────────────────────────────────────────────────

export function TalhaoTypeBadge({ tipo }: { tipo: Talhao['tipo'] }) {
  const cfg: Record<Talhao['tipo'], string> = {
    projeto:      'bg-teal-50 text-teal-700 border-teal-200',
    control_site: 'bg-blue-50 text-blue-700 border-blue-200',
    excluido:     'bg-gray-100 text-gray-500 border-gray-200',
  }
  const label: Record<Talhao['tipo'], string> = {
    projeto: 'Projeto', control_site: 'Control Site', excluido: 'Excluído',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border', cfg[tipo])}>
      {label[tipo]}
    </span>
  )
}

// ── AddTalhaoForm ─────────────────────────────────────────────────────────────

export function AddTalhaoForm({ fazendaId, onClose }: { fazendaId: string; onClose: () => void }) {
  const { addTalhao } = useDataStore()
  const [nt, setNt] = useState({
    nome: '', areaHa: 0, tipo: 'projeto' as Talhao['tipo'],
    socPercent: 0, bdGCm3: 0, argilaPercent: 0, profundidadeCm: 30,
    pontosColetados: 0, grupoSoloFao: '', texturaFao: '', topografia: 'plano',
  })

  const handleAdd = () => {
    if (!nt.nome || !nt.areaHa) { toast.error('Preencha nome e área.'); return }
    addTalhao({ ...nt, fazendaId, dadosValidados: false })
    toast.success('Talhão adicionado!')
    onClose()
  }

  return (
    <div className="px-4 py-3 border-b border-border/50 bg-teal-50/60 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-teal-700">Novo Talhão</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs" htmlFor="add-nome">Nome *</Label>
          <Input id="add-nome" value={nt.nome} onChange={e => setNt(p => ({ ...p, nome: e.target.value }))} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs" htmlFor="add-area">Área (ha) *</Label>
          <Input id="add-area" type="number" value={nt.areaHa || ''} onChange={e => setNt(p => ({ ...p, areaHa: Number(e.target.value) }))} className="h-8 text-xs" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs" htmlFor="add-tipo">Tipo</Label>
          <Select value={nt.tipo} onValueChange={v => setNt(p => ({ ...p, tipo: v as Talhao['tipo'] }))}>
            <SelectTrigger id="add-tipo" className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="projeto">Projeto</SelectItem>
              <SelectItem value="control_site">Control Site</SelectItem>
              <SelectItem value="excluido">Excluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onClose} className="text-xs h-7 rounded-lg">Cancelar</Button>
        <Button size="sm" onClick={handleAdd} className="text-xs h-7 rounded-lg bg-teal-600 hover:bg-teal-700 text-white">
          Adicionar
        </Button>
      </div>
    </div>
  )
}

// ── TalhaoList ────────────────────────────────────────────────────────────────

export interface TalhaoListProps {
  talhoes: Talhao[]
  selectedIds: string[]
  onToggleCheck: (id: string) => void
  onRowClick: (id: string) => void
  onSelectAll: () => void
  onAddClick: () => void
}

export function TalhaoList({ talhoes, selectedIds, onToggleCheck, onRowClick, onSelectAll, onAddClick }: TalhaoListProps) {
  const allSelected = talhoes.length > 0 && talhoes.every(t => selectedIds.includes(t.id))
  const someSelected = talhoes.some(t => selectedIds.includes(t.id)) && !allSelected

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 bg-surface/20 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold truncate">Talhões ({talhoes.length})</h3>
          <Button size="sm" variant="outline" onClick={onAddClick} className="gap-1 h-7 text-xs rounded-lg shrink-0">
            <Plus size={12} /> Novo
          </Button>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => { if (el) el.indeterminate = someSelected }}
            onChange={onSelectAll}
            className="w-3.5 h-3.5 rounded accent-teal-600"
          />
          Selecionar todos
        </label>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {talhoes.map(t => {
          const isSelected = selectedIds.includes(t.id)
          const isSingleFocus = selectedIds.length === 1 && isSelected
          return (
            <div
              key={t.id}
              onClick={() => onRowClick(t.id)}
              className={cn(
                'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                isSingleFocus
                  ? 'bg-teal-50 border-l-2 border-l-teal-600'
                  : isSelected
                  ? 'bg-blue-50/50 border-l-2 border-l-blue-400'
                  : 'hover:bg-accent/5 border-l-2 border-l-transparent'
              )}
            >
              <div
                className="mt-0.5 shrink-0"
                onClick={e => { e.stopPropagation(); onToggleCheck(t.id) }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 rounded accent-teal-600 cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{t.nome}</span>
                  {t.dadosValidados
                    ? <CheckCircle2 size={12} className="text-green-600 shrink-0" />
                    : <XCircle size={12} className="text-gray-300 shrink-0" />
                  }
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-muted truncate">{t.areaHa} ha</span>
                  <span className="text-muted text-[11px] shrink-0">·</span>
                  <span className="truncate"><TalhaoTypeBadge tipo={t.tipo} /></span>
                </div>
              </div>
            </div>
          )
        })}
        {talhoes.length === 0 && (
          <div className="p-6 text-center text-muted text-sm">Nenhum talhão cadastrado.</div>
        )}
      </div>
    </div>
  )
}
