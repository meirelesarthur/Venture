import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDataStore } from '@/store/data'
import type { Talhao } from '@/store/data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  CheckCircle2, XCircle, Plus, Leaf, Tractor, FlaskConical,
  AlertTriangle, X, Save, Trash2, Info, CloudRain,
  ChevronDown, ChevronRight, Users,
} from 'lucide-react'
import LavouraForm from '@/pages/cliente/mrv/LavouraForm'
import PecuariaForm from '@/pages/cliente/mrv/PecuariaForm'
import FazendaMap from '@/components/maps/FazendaMap'

// ── Constants ─────────────────────────────────────────────────────────────────

const TEXTURAS = ['arenosa', 'franco-arenosa', 'franca', 'franco-argilosa', 'argilo-arenosa', 'argilosa', 'muito-argilosa']
const TOPOGRAFIAS = ['plano', 'suave_ondulado', 'ondulado', 'forte_ondulado', 'montanhoso']
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const CULTURAS = ['Soja', 'Milho', 'Algodão', 'Sorgo', 'Arroz', 'Cana-de-açúcar', 'Café', 'Pastagem', 'Outro']
const SAFRA_ATUAL = new Date().getFullYear()

const PRESETS: Record<string, { tempMensal: number[]; precipMensal: number[]; evapMensal: number[] }> = {
  preset_cerrado: {
    tempMensal:   [27.2, 27.0, 26.8, 26.5, 25.2, 24.1, 23.8, 25.0, 27.0, 27.5, 27.3, 27.1],
    precipMensal: [230, 210, 200, 100, 30, 10, 5, 20, 80, 160, 210, 240],
    evapMensal:   [100, 90, 95, 105, 95, 85, 90, 100, 110, 115, 105, 100],
  },
  preset_amazonia: {
    tempMensal:   [26.5, 26.4, 26.2, 26.5, 27.0, 26.8, 26.5, 27.1, 27.5, 27.8, 27.6, 27.0],
    precipMensal: [280, 280, 320, 300, 250, 100, 70, 60, 90, 150, 200, 280],
    evapMensal:   [90, 80, 85, 90, 95, 90, 95, 100, 110, 115, 100, 95],
  },
  preset_pampa: {
    tempMensal:   [24.0, 23.5, 21.0, 17.0, 13.0, 10.0, 9.5, 11.5, 14.5, 18.0, 21.0, 23.0],
    precipMensal: [130, 110, 120, 100, 90, 90, 110, 100, 120, 110, 120, 130],
    evapMensal:   [140, 120, 95, 70, 45, 30, 30, 40, 60, 90, 115, 135],
  },
}

// ── TalhaoTypeBadge ───────────────────────────────────────────────────────────

function TalhaoTypeBadge({ tipo }: { tipo: Talhao['tipo'] }) {
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

function AddTalhaoForm({ fazendaId, onClose }: { fazendaId: string; onClose: () => void }) {
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

interface TalhaoListProps {
  talhoes: Talhao[]
  selectedIds: string[]
  onToggleCheck: (id: string) => void
  onRowClick: (id: string) => void
  onSelectAll: () => void
  onAddClick: () => void
}

function TalhaoList({ talhoes, selectedIds, onToggleCheck, onRowClick, onSelectAll, onAddClick }: TalhaoListProps) {
  const allSelected = talhoes.length > 0 && talhoes.every(t => selectedIds.includes(t.id))
  const someSelected = talhoes.some(t => selectedIds.includes(t.id)) && !allSelected

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-surface/20 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold">Talhões ({talhoes.length})</h3>
          <Button size="sm" variant="outline" onClick={onAddClick} className="gap-1 h-7 text-xs rounded-lg">
            <Plus size={12} /> Novo Talhão
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

      {/* List */}
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
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium truncate">{t.nome}</span>
                  {t.dadosValidados
                    ? <CheckCircle2 size={12} className="text-green-600 shrink-0" />
                    : <XCircle size={12} className="text-gray-300 shrink-0" />
                  }
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-muted">{t.areaHa} ha</span>
                  <span className="text-muted text-[11px]">·</span>
                  <TalhaoTypeBadge tipo={t.tipo} />
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

// ── DadosGeraisPanel ──────────────────────────────────────────────────────────

interface DadosGeraisProps {
  talhao: Talhao
  fazendaId: string
}

function DadosGeraisPanel({ talhao, fazendaId }: DadosGeraisProps) {
  const { updateTalhao, dadosClimaticos, saveDadoClimatico, talhoes } = useDataStore()
  const todosTalhoes = talhoes.filter(t => t.fazendaId === fazendaId)

  const [form, setForm] = useState({
    nome: talhao.nome,
    areaHa: talhao.areaHa,
    tipo: talhao.tipo,
    socPercent: String(talhao.socPercent ?? ''),
    bdGCm3: String(talhao.bdGCm3 ?? ''),
    argilaPercent: String(talhao.argilaPercent ?? ''),
    profundidadeCm: talhao.profundidadeCm,
    dadosValidados: talhao.dadosValidados,
    texturaFao: talhao.texturaFao ?? '',
    topografia: talhao.topografia ?? 'plano',
  })

  useEffect(() => {
    setForm({
      nome: talhao.nome,
      areaHa: talhao.areaHa,
      tipo: talhao.tipo,
      socPercent: String(talhao.socPercent ?? ''),
      bdGCm3: String(talhao.bdGCm3 ?? ''),
      argilaPercent: String(talhao.argilaPercent ?? ''),
      profundidadeCm: talhao.profundidadeCm,
      dadosValidados: talhao.dadosValidados,
      texturaFao: talhao.texturaFao ?? '',
      topografia: talhao.topografia ?? 'plano',
    })
  }, [talhao.id])

  const handleSave = () => {
    updateTalhao(talhao.id, {
      nome: form.nome,
      areaHa: Number(form.areaHa),
      tipo: form.tipo,
      socPercent: form.socPercent !== '' ? Number(form.socPercent) : undefined,
      bdGCm3: form.bdGCm3 !== '' ? Number(form.bdGCm3) : undefined,
      argilaPercent: form.argilaPercent !== '' ? Number(form.argilaPercent) : undefined,
      profundidadeCm: Number(form.profundidadeCm),
      dadosValidados: form.dadosValidados,
      texturaFao: form.texturaFao || undefined,
      topografia: form.topografia || undefined,
    }, 'Dados gerais atualizados pelo admin')
    toast.success('Salvo com sucesso')
  }

  // Clima
  const [climaOpen, setClimaOpen] = useState(false)
  const climaExistente = dadosClimaticos.find(d => d.talhaoId === talhao.id)
  const [climaEdit, setClimaEdit] = useState(
    climaExistente
      ? { tempMensal: [...climaExistente.tempMensal], precipMensal: [...climaExistente.precipMensal], evapMensal: [...climaExistente.evapMensal] }
      : { tempMensal: Array(12).fill(25), precipMensal: Array(12).fill(100), evapMensal: Array(12).fill(90) }
  )

  useEffect(() => {
    const c = dadosClimaticos.find(d => d.talhaoId === talhao.id)
    if (c) setClimaEdit({ tempMensal: [...c.tempMensal], precipMensal: [...c.precipMensal], evapMensal: [...c.evapMensal] })
    else setClimaEdit({ tempMensal: Array(12).fill(25), precipMensal: Array(12).fill(100), evapMensal: Array(12).fill(90) })
  }, [talhao.id])

  const salvarClima = () => {
    saveDadoClimatico({ talhaoId: talhao.id, ...climaEdit, fonte: 'manual' })
    toast.success('Dados climáticos salvos!')
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dg-nome">Nome</Label>
          <Input id="dg-nome" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-area">Área (ha)</Label>
          <Input id="dg-area" type="number" step="0.1" value={form.areaHa} onChange={e => setForm(p => ({ ...p, areaHa: Number(e.target.value) }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-tipo">Tipo</Label>
          <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as Talhao['tipo'] }))}>
            <SelectTrigger id="dg-tipo" className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="projeto">Projeto</SelectItem>
              <SelectItem value="control_site">Control Site</SelectItem>
              <SelectItem value="excluido">Excluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-topografia">Topografia</Label>
          <Select value={form.topografia} onValueChange={v => setForm(p => ({ ...p, topografia: v }))}>
            <SelectTrigger id="dg-topografia" className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TOPOGRAFIAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-soc">SOC (%)</Label>
          <Input id="dg-soc" type="number" step="0.1" value={form.socPercent} onChange={e => setForm(p => ({ ...p, socPercent: e.target.value }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-bd">BD (g/cm³)</Label>
          <Input id="dg-bd" type="number" step="0.01" value={form.bdGCm3} onChange={e => setForm(p => ({ ...p, bdGCm3: e.target.value }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-argila">Argila (%)</Label>
          <Input id="dg-argila" type="number" step="0.1" value={form.argilaPercent} onChange={e => setForm(p => ({ ...p, argilaPercent: e.target.value }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-prof">Profundidade (cm)</Label>
          <Input id="dg-prof" type="number" value={form.profundidadeCm} onChange={e => setForm(p => ({ ...p, profundidadeCm: Number(e.target.value) }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-textura">Textura FAO</Label>
          <Select value={form.texturaFao} onValueChange={v => setForm(p => ({ ...p, texturaFao: v }))}>
            <SelectTrigger id="dg-textura" className="rounded-xl"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {TEXTURAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex flex-col justify-end">
          <Label>Dados Validados</Label>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, dadosValidados: !p.dadosValidados }))}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all w-fit',
              form.dadosValidados
                ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100'
            )}
          >
            {form.dadosValidados ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {form.dadosValidados ? 'Validado' : 'Não validado'}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
          <Save size={14} /> Salvar Dados Gerais
        </Button>
      </div>

      {/* Clima — colapsável */}
      <div className="border border-border/50 rounded-xl overflow-hidden">
        <button
          onClick={() => setClimaOpen(o => !o)}
          className="w-full flex items-center gap-2 px-4 py-3 bg-surface/20 hover:bg-accent/5 text-left transition-colors"
        >
          {climaOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <CloudRain size={14} className="text-primary" />
          <span className="text-sm font-semibold">Dados Climáticos</span>
          {climaExistente && (
            <Badge variant="outline" className="text-[10px] ml-auto shadow-none">Configurado</Badge>
          )}
        </button>
        {climaOpen && (
          <div className="p-4 space-y-3 border-t border-border/30">
            <div className="flex gap-2 flex-wrap">
              {['preset_cerrado', 'preset_amazonia', 'preset_pampa'].map(k => (
                <Button key={k} variant="outline" size="sm" className="text-xs h-7 rounded-lg"
                  onClick={() => setClimaEdit({ ...PRESETS[k] })}>
                  {k.replace('preset_', '')}
                </Button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-accent/5">
                    <th className="text-left p-2 font-medium">Variável</th>
                    {MESES.map(m => <th key={m} className="p-1.5 text-center font-medium">{m}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    { label: 'Temp (°C)', key: 'tempMensal', step: '0.1' },
                    { label: 'Precip (mm)', key: 'precipMensal', step: '1' },
                    { label: 'Evap (mm)', key: 'evapMensal', step: '1' },
                  ].map(row => (
                    <tr key={row.key}>
                      <td className="p-2 font-medium whitespace-nowrap">{row.label}</td>
                      {(climaEdit[row.key as keyof typeof climaEdit] as number[]).map((val, i) => (
                        <td key={i} className="p-0.5">
                          <Input type="number" step={row.step} value={val}
                            onChange={e => {
                              const arr = [...(climaEdit[row.key as keyof typeof climaEdit] as number[])]
                              arr[i] = parseFloat(e.target.value) || 0
                              setClimaEdit(prev => ({ ...prev, [row.key]: arr }))
                            }}
                            className="w-12 h-7 text-xs" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={salvarClima} className="gap-1.5 text-xs h-8 rounded-xl">
                <Save size={12} /> Salvar Clima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="border border-border/50 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-surface/20 text-sm font-semibold border-b border-border/30">
          Visualização
        </div>
        <FazendaMap talhoes={todosTalhoes} height="200px" />
      </div>
    </div>
  )
}

// ── ManejoPanel ───────────────────────────────────────────────────────────────

type ManejoSubType = 'lavoura' | 'pecuaria'

function ManejoPanel({ talhaoId, fazendaId, anoAgricola }: { talhaoId: string; fazendaId: string; anoAgricola: number }) {
  const [sub, setSub] = useState<ManejoSubType>('lavoura')

  const MANEJO_TABS = [
    { id: 'lavoura' as const, label: 'Lavoura', Icon: Leaf },
    { id: 'pecuaria' as const, label: 'Pecuária', Icon: Tractor },
  ]

  return (
    <div className="space-y-4">
      <div className="flex border-b border-border/50" role="tablist">
        {MANEJO_TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={sub === t.id} onClick={() => setSub(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
              sub === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}>
            <t.Icon size={13} />{t.label}
          </button>
        ))}
      </div>
      {sub === 'lavoura' && (
        <LavouraForm talhaoIds={[talhaoId]} fazendaId={fazendaId} anoAgricola={anoAgricola} locked={false} />
      )}
      {sub === 'pecuaria' && (
        <PecuariaForm talhaoIds={[talhaoId]} fazendaId={fazendaId} anoAgricola={anoAgricola} locked={false} />
      )}
    </div>
  )
}

// ── ColetaSoloPanel ───────────────────────────────────────────────────────────

function ColetaSoloPanel({ talhao, fazendaId }: { talhao: Talhao; fazendaId: string }) {
  const { coletasSolo, addColetaSolo, deleteColetaSolo, updateTalhao, usuarios } = useDataStore()
  const adminNome = usuarios.find(u => u.role === 'Super Admin')?.nome ?? 'Admin'
  const minhasColetas = coletasSolo.filter(c => c.talhaoId === talhao.id)

  type LinhaLocal = {
    _id: string; fazendaId: string; talhaoId: string; talhaoNome: string
    safra: number; pontosColetados: number; profundidadeColeta: string
    socPercent: number; bdGCm3: number
  }

  const novaLinha = (): LinhaLocal => ({
    _id: crypto.randomUUID(), fazendaId, talhaoId: talhao.id, talhaoNome: talhao.nome,
    safra: SAFRA_ATUAL, pontosColetados: 1, profundidadeColeta: '0-30 cm', socPercent: 0, bdGCm3: 0,
  })

  const [linhasLocais, setLinhasLocais] = useState<LinhaLocal[]>([])

  const atualizarLinhaLocal = (sid: string, field: string, value: string | number) =>
    setLinhasLocais(prev => prev.map(l => l._id !== sid ? l : { ...l, [field]: value }))

  const salvarLinhaLocal = (sid: string) => {
    const linha = linhasLocais.find(l => l._id === sid)
    if (!linha) return
    if (!linha.pontosColetados || !linha.socPercent || !linha.bdGCm3) {
      toast.error('Preencha todos os campos antes de salvar.')
      return
    }
    addColetaSolo({
      fazendaId: linha.fazendaId, talhaoId: linha.talhaoId, talhaoNome: linha.talhaoNome,
      safra: linha.safra, pontosColetados: Number(linha.pontosColetados),
      profundidadeColeta: linha.profundidadeColeta, socPercent: Number(linha.socPercent),
      bdGCm3: Number(linha.bdGCm3), registradoEm: new Date().toISOString(), registradoPor: adminNome,
    })
    updateTalhao(linha.talhaoId, {
      socPercent: Number(linha.socPercent), bdGCm3: Number(linha.bdGCm3),
      pontosColetados: Number(linha.pontosColetados), dadosValidados: true,
    }, `Coleta laboratorial — ${linha.profundidadeColeta}`)
    setLinhasLocais(prev => prev.filter(l => l._id !== sid))
    toast.success('Coleta registrada e propagada ao talhão!')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Dados laboratoriais para o motor RothC (critério 8 VM0042).</p>
        <Button size="sm" className="gap-1.5 text-xs rounded-xl h-8" onClick={() => setLinhasLocais(p => [...p, novaLinha()])}>
          <Plus size={12} /> Adicionar Linha
        </Button>
      </div>

      <div className="border border-border/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-accent/5">
              <tr>
                <th className="text-left p-2.5 font-medium">Safra</th>
                <th className="text-left p-2.5 font-medium">Pts. Coletados</th>
                <th className="text-left p-2.5 font-medium">Profundidade</th>
                <th className="text-left p-2.5 font-medium">SOC (%)</th>
                <th className="text-left p-2.5 font-medium">BD (g/cm³)</th>
                <th className="text-left p-2.5 font-medium">Registrado por</th>
                <th className="p-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {minhasColetas.map(c => (
                <tr key={c.id} className="hover:bg-accent/5">
                  <td className="p-2.5">{c.safra}/{c.safra + 1}</td>
                  <td className="p-2.5">
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shadow-none">
                      {c.pontosColetados} pts
                    </Badge>
                  </td>
                  <td className="p-2.5 font-mono">{c.profundidadeColeta}</td>
                  <td className="p-2.5 font-semibold">{c.socPercent.toFixed(2)}</td>
                  <td className="p-2.5 font-semibold">{c.bdGCm3.toFixed(3)}</td>
                  <td className="p-2.5 text-muted">
                    {c.registradoPor}
                    <br />
                    <span className="text-[10px]">{new Date(c.registradoEm).toLocaleDateString('pt-BR')}</span>
                  </td>
                  <td className="p-2.5">
                    <Button size="sm" variant="ghost" className="text-danger hover:text-danger h-6 px-1.5"
                      onClick={() => deleteColetaSolo(c.id)}>
                      <Trash2 size={11} />
                    </Button>
                  </td>
                </tr>
              ))}

              {linhasLocais.map(l => (
                <tr key={l._id} className="bg-warning/5 border-l-2 border-warning/40">
                  <td className="p-1">
                    <Input type="number" value={l.safra} min={2020} max={2035}
                      onChange={e => atualizarLinhaLocal(l._id, 'safra', Number(e.target.value))}
                      className="w-16 h-7 text-xs" />
                  </td>
                  <td className="p-1">
                    <Input type="number" min={1} value={l.pontosColetados}
                      onChange={e => atualizarLinhaLocal(l._id, 'pontosColetados', Number(e.target.value))}
                      className="w-14 h-7 text-xs" />
                  </td>
                  <td className="p-1">
                    <Input value={l.profundidadeColeta}
                      onChange={e => atualizarLinhaLocal(l._id, 'profundidadeColeta', e.target.value)}
                      className="w-20 h-7 text-xs" placeholder="0-30 cm" />
                  </td>
                  <td className="p-1">
                    <Input type="number" step="0.01" value={l.socPercent || ''}
                      onChange={e => atualizarLinhaLocal(l._id, 'socPercent', Number(e.target.value))}
                      className="w-16 h-7 text-xs" />
                  </td>
                  <td className="p-1">
                    <Input type="number" step="0.001" value={l.bdGCm3 || ''}
                      onChange={e => atualizarLinhaLocal(l._id, 'bdGCm3', Number(e.target.value))}
                      className="w-16 h-7 text-xs" />
                  </td>
                  <td className="p-1 text-muted text-[11px]">{adminNome}</td>
                  <td className="p-1">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-danger h-7 px-1.5"
                        onClick={() => setLinhasLocais(p => p.filter(x => x._id !== l._id))}>
                        <Trash2 size={11} />
                      </Button>
                      <Button size="sm" className="h-7 text-xs gap-1"
                        onClick={() => salvarLinhaLocal(l._id)}>
                        <Save size={10} /> Salvar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {minhasColetas.length === 0 && linhasLocais.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted">
                    <FlaskConical size={22} className="mx-auto mb-2 opacity-30" />
                    Nenhum dado laboratorial registrado. Clique em "+ Adicionar Linha".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-border/30 bg-primary/3 flex items-start gap-2">
          <Info size={12} className="text-primary mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted leading-relaxed">
            Valores propagados automaticamente para o talhão e disponibilizados para o motor RothC-26.3 (VT0014 Eq.6–7).
          </p>
        </div>
      </div>
    </div>
  )
}

// ── TalhaoDetail ──────────────────────────────────────────────────────────────

type DetailTab = 'dados' | 'manejo' | 'solo'

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: 'dados', label: 'Dados Gerais' },
  { id: 'manejo', label: 'Manejo' },
  { id: 'solo', label: 'Coleta de Solo' },
]

function TalhaoDetail({ talhao, fazendaId, anoAgricola }: { talhao: Talhao; fazendaId: string; anoAgricola: number }) {
  const [sub, setSub] = useState<DetailTab>('dados')

  useEffect(() => { setSub('dados') }, [talhao.id])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-tab bar */}
      <div className="flex border-b border-border/50 px-4 bg-surface/10 shrink-0" role="tablist">
        {DETAIL_TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={sub === t.id} onClick={() => setSub(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
              sub === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {sub === 'dados' && <DadosGeraisPanel talhao={talhao} fazendaId={fazendaId} />}
        {sub === 'manejo' && <ManejoPanel talhaoId={talhao.id} fazendaId={fazendaId} anoAgricola={anoAgricola} />}
        {sub === 'solo' && <ColetaSoloPanel talhao={talhao} fazendaId={fazendaId} />}
      </div>
    </div>
  )
}

// ── BulkEditPanel ─────────────────────────────────────────────────────────────

interface BulkEditPanelProps {
  selectedIds: string[]
  talhoes: Talhao[]
  fazendaId: string
  anoAgricola: number
  onCancelAll: () => void
  onRemove: (id: string) => void
}

function BulkEditPanel({ selectedIds, talhoes, fazendaId, anoAgricola, onCancelAll, onRemove }: BulkEditPanelProps) {
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
    cultura:       culturaDivergent  ? '' : (culturas[0] ?? ''),
    residuosCampo: residuosDivergent ? (undefined as boolean | undefined) : residuos[0],
    queimaResiduos: queimaDivergent  ? (undefined as boolean | undefined) : queima[0],
  })

  const handleSave = () => {
    let saved = 0
    selectedIds.forEach((tId, i) => {
      const m = manejoRecords[i]
      if (!m) return
      const changes: Record<string, unknown> = {}
      if (bulk.cultura) changes.cultura = bulk.cultura
      if (bulk.residuosCampo !== undefined) changes.residuosCampo = bulk.residuosCampo
      if (bulk.queimaResiduos !== undefined) changes.queimaResiduos = bulk.queimaResiduos
      if (Object.keys(changes).length > 0) { updateManejo(m.id, changes); saved++ }
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
      {/* Header */}
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Shared fields */}
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

        {/* Divergent fields warning */}
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

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/50 bg-surface/10 flex items-center justify-end gap-3 shrink-0">
        <Button variant="outline" size="sm" onClick={onCancelAll} className="rounded-xl">Cancelar</Button>
        <Button size="sm" onClick={handleSave} className="gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
          <Save size={13} /> Salvar Alterações
        </Button>
      </div>
    </div>
  )
}

// ── TalhoesTab (export principal) ─────────────────────────────────────────────

interface TalhoesTabProps {
  fazendaId: string
  anoAgricola: number
}

export function TalhoesTab({ fazendaId, anoAgricola }: TalhoesTabProps) {
  const { talhoes } = useDataStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazendaId)

  const talhaoParam = searchParams.get('talhao')
  const [selectedIds, setSelectedIds] = useState<string[]>(
    talhaoParam && meusTalhoes.some(t => t.id === talhaoParam) ? [talhaoParam] : []
  )
  const [showAdd, setShowAdd] = useState(false)

  const syncUrl = (ids: string[]) => {
    setSearchParams(prev => {
      if (ids.length === 1) prev.set('talhao', ids[0])
      else prev.delete('talhao')
      return prev
    }, { replace: true })
  }

  const handleRowClick = (id: string) => {
    const next = [id]
    setSelectedIds(next)
    syncUrl(next)
  }

  const handleToggleCheck = (id: string) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      syncUrl(next)
      return next
    })
  }

  const handleSelectAll = () => {
    const next = meusTalhoes.every(t => selectedIds.includes(t.id))
      ? []
      : meusTalhoes.map(t => t.id)
    setSelectedIds(next)
    syncUrl(next)
  }

  const handleRemoveFromBulk = (id: string) => {
    setSelectedIds(prev => {
      const next = prev.filter(x => x !== id)
      syncUrl(next)
      return next
    })
  }

  const selectedTalhao = selectedIds.length === 1
    ? meusTalhoes.find(t => t.id === selectedIds[0])
    : null

  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">

      {/* ── Left column ── */}
      <div className="w-full lg:w-[35%] max-h-72 lg:max-h-none border-b lg:border-b-0 lg:border-r border-border/50 flex flex-col overflow-hidden flex-shrink-0">
        {showAdd && (
          <AddTalhaoForm fazendaId={fazendaId} onClose={() => setShowAdd(false)} />
        )}
        <TalhaoList
          talhoes={meusTalhoes}
          selectedIds={selectedIds}
          onToggleCheck={handleToggleCheck}
          onRowClick={handleRowClick}
          onSelectAll={handleSelectAll}
          onAddClick={() => setShowAdd(true)}
        />
      </div>

      {/* ── Right column ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* State A — nothing selected */}
        {selectedIds.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-xs space-y-2 px-6">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
                <Leaf size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">Nenhum talhão selecionado</p>
              <p className="text-xs text-muted leading-relaxed">
                Selecione um talhão para ver os detalhes ou marque múltiplos para edição em lote.
              </p>
            </div>
          </div>
        )}

        {/* State B — single talhão selected */}
        {selectedIds.length === 1 && selectedTalhao && (
          <TalhaoDetail
            talhao={selectedTalhao}
            fazendaId={fazendaId}
            anoAgricola={anoAgricola}
          />
        )}

        {/* State C — multiple selected */}
        {selectedIds.length >= 2 && (
          <BulkEditPanel
            selectedIds={selectedIds}
            talhoes={meusTalhoes}
            fazendaId={fazendaId}
            anoAgricola={anoAgricola}
            onCancelAll={() => { setSelectedIds([]); syncUrl([]) }}
            onRemove={handleRemoveFromBulk}
          />
        )}
      </div>
    </div>
  )
}
