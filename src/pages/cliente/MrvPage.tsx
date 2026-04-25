import { useState, useEffect } from 'react'
import { useDataStore } from '@/store/data'
import type { MrvStatus } from '@/store/data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import LavouraForm from './mrv/LavouraForm'
import PecuariaForm from './mrv/PecuariaForm'
import FertilizacaoForm from './mrv/FertilizacaoForm'
import OperacionalForm from './mrv/OperacionalForm'
import DocumentosForm from './mrv/DocumentosForm'
import KmlUploader from '@/components/maps/KmlUploader'
import FazendaMap from '@/components/maps/FazendaMap'
import { MapDemarcationOverlay } from '@/components/MapDemarcationOverlay'
import {
  Leaf, Droplets, Tractor, FileText,
  Clock, AlertCircle, Lock, Send, MapPin, Thermometer,
  X, PlusCircle, Grid, Settings2, Map, ChevronRight,
  CheckCircle2, Layers, Check, MoreVertical, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CURRENT_YEAR = new Date().getFullYear()
const ANOS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3]

function StatusBadge({ status }: { status: MrvStatus }) {
  if (status === 'rascunho') return null
  const cfg = {
    pendente: { label: 'Em Validação', cls: 'bg-warning/10 text-warning border-warning/20' },
    aprovado: { label: 'Aprovado', cls: 'bg-success/10 text-success border-success/20' },
    correcao: { label: 'Correção', cls: 'bg-danger/10 text-danger border-danger/20' },
  }[status as Exclude<MrvStatus, 'rascunho'>]
  const icons = { pendente: <Clock size={11} />, aprovado: <Lock size={11} />, correcao: <AlertCircle size={11} /> }
  return (
    <Badge variant="outline" className={cn('flex items-center gap-1 text-xs shadow-none', cfg.cls)}>
      {icons[status as keyof typeof icons]}
      {cfg.label}
    </Badge>
  )
}

function TalhaoEditModal({ talhaoId, onClose }: { talhaoId: string; onClose: () => void }) {
  const { talhoes, updateTalhao } = useDataStore()
  const talhao = talhoes.find(t => t.id === talhaoId)
  const [nome, setNome] = useState(talhao?.nome || '')
  const [area, setArea] = useState(String(talhao?.areaHa || ''))
  const [soc, setSoc] = useState(String(talhao?.socPercent || ''))
  if (!talhao) return null
  const handleSave = () => {
    updateTalhao(talhaoId, { nome, areaHa: Number(area), socPercent: soc ? Number(soc) : undefined })
    toast.success('Talhão atualizado!')
    onClose()
  }
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border/50 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2"><Settings2 size={18} className="text-primary" /> Editar Talhão</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome do Talhão</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Área (ha)</Label><Input type="number" value={area} onChange={e => setArea(e.target.value)} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>SOC (%)</Label><Input type="number" step="0.1" value={soc} onChange={e => setSoc(e.target.value)} className="rounded-xl" placeholder="Ex: 2.1" /></div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
          <Button onClick={handleSave} className="flex-1 rounded-xl">Salvar</Button>
        </div>
      </div>
    </div>
  )
}

function DeleteTalhaoModal({ talhaoId, onClose }: { talhaoId: string; onClose: () => void }) {
  const { talhoes, updateTalhao } = useDataStore()
  const talhao = talhoes.find(t => t.id === talhaoId)
  if (!talhao) return null
  const handleDelete = () => {
    updateTalhao(talhaoId, { tipo: 'excluido' })
    toast.success(`${talhao.nome} removido.`)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border/50 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-danger" />
          </div>
          <div>
            <h2 className="text-base font-bold">Remover talhão?</h2>
            <p className="text-sm text-muted mt-0.5">
              <strong className="text-foreground">{talhao.nome}</strong> será marcado como excluído. Esta ação pode ser revertida pelo administrador.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} className="flex-1 rounded-xl">Remover</Button>
        </div>
      </div>
    </div>
  )
}

function SubmitConfirmModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border/50 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Send size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold">Submeter manejo?</h2>
            <p className="text-sm text-muted mt-0.5">
              Os dados serão enviados para validação pelo time Venture Carbon. Após a submissão, não será possível editar.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
          <Button onClick={() => { onConfirm(); onClose() }} className="flex-1 rounded-xl gap-2">
            <Send size={14} /> Submeter
          </Button>
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ current, onGoTo }: { current: number; onGoTo: (n: number) => void }) {
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

function getManejoStatus(talhaoId: string, manejo: ReturnType<typeof useDataStore>['manejo'], anoAgricola: number) {
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

function getManejoProgress(talhaoId: string, manejo: ReturnType<typeof useDataStore>['manejo'], anoAgricola: number) {
  const m = manejo.find(x => x.talhaoId === talhaoId && x.anoAgricola === anoAgricola && x.cenario === 'projeto')
  if (!m) return 'empty' as const
  const lavouraOk = !!(m.cultura || (m.culturas && m.culturas.length > 0))
  const pecuariaOk = !!(m.pecuaria && m.pecuaria.length > 0)
  if (lavouraOk && pecuariaOk) return 'complete' as const
  if (lavouraOk || pecuariaOk) return 'partial' as const
  return 'empty' as const
}

const PROGRESS_DOT: Record<'complete' | 'partial' | 'empty', string> = {
  complete: 'bg-teal-500',
  partial: 'bg-amber-500',
  empty: 'bg-muted-foreground/40',
}
const PROGRESS_TOOLTIP: Record<'complete' | 'partial' | 'empty', string> = {
  complete: 'Lavoura e Pecuária preenchidos',
  partial: 'Preenchimento parcial',
  empty: 'Sem dados de manejo',
}

function ManejoStatusDots({ lavoura, pecuaria }: { lavoura: 'complete' | 'draft' | 'empty'; pecuaria: 'complete' | 'draft' | 'empty' }) {
  const color = (v: 'complete' | 'draft' | 'empty') =>
    v === 'complete' ? 'text-success' : v === 'draft' ? 'text-warning' : 'text-muted-foreground/40'
  const icon = (v: 'complete' | 'draft' | 'empty') =>
    v === 'complete' ? '✓' : v === 'draft' ? '●' : '○'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn('font-medium', color(lavoura))}>
        {icon(lavoura)} Lavoura
      </span>
      <span className={cn('font-medium', color(pecuaria))}>
        {icon(pecuaria)} Pecuária
      </span>
    </div>
  )
}

type YearStatus = 'aprovado' | 'pendente' | 'correcao' | 'rascunho' | 'empty'

function getYearMrvStatus(
  year: number,
  projetoTalhoes: { id: string }[],
  manejo: ReturnType<typeof useDataStore>['manejo']
): YearStatus {
  const records = projetoTalhoes
    .map(t => manejo.find(m => m.talhaoId === t.id && m.anoAgricola === year && m.cenario === 'projeto'))
    .filter(Boolean) as typeof manejo
  if (records.length === 0) return 'empty'
  if (records.some(m => m.status === 'correcao')) return 'correcao'
  if (records.some(m => m.status === 'pendente')) return 'pendente'
  if (records.every(m => m.status === 'aprovado')) return 'aprovado'
  return 'rascunho'
}

const YEAR_STATUS_DOT: Record<YearStatus, string> = {
  aprovado: 'bg-success',
  pendente: 'bg-warning',
  correcao: 'bg-danger',
  rascunho: 'bg-muted-foreground/60',
  empty:    'bg-muted-foreground/25',
}

const YEAR_STATUS_TITLE: Record<YearStatus, string> = {
  aprovado: 'Aprovado',
  pendente: 'Em validação',
  correcao: 'Correção solicitada',
  rascunho: 'Rascunho',
  empty:    'Sem dados',
}

export default function MrvPage() {
  const { talhoes, fazendas, addTalhao, manejo, submitManejo, updateFazenda } = useDataStore()
  const projetoTalhoes = talhoes.filter(t => t.tipo === 'projeto')
  const fazenda = projetoTalhoes.length ? fazendas.find(f => f.id === projetoTalhoes[0].fazendaId) : fazendas[0]

  const [etapa, setEtapa] = useState(1)
  const [anoAgricola, setAnoAgricola] = useState(CURRENT_YEAR)
  const isYearLocked = anoAgricola < CURRENT_YEAR

  const [areaTab, setAreaTab] = useState<'mapa' | 'fertilizacao' | 'operacional' | 'documentos'>('mapa')
  const [manejoTab, setManejoTab] = useState<'lavoura' | 'pecuaria'>('lavoura')

  const [editingTalhao, setEditingTalhao] = useState<string | null>(null)
  const [deletingTalhao, setDeletingTalhao] = useState<string | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isDemarcando, setIsDemarcando] = useState(false)
  const [showNovoTalhaoForm, setShowNovoTalhaoForm] = useState(false)
  const [novoTalhaoData, setNovoTalhaoData] = useState<{ hectares: number; points: [number, number][] } | null>(null)
  const [novoTalhaoNome, setNovoTalhaoNome] = useState('')

  const [selectedTalhoes, setSelectedTalhoes] = useState<string[]>([])
  useEffect(() => {
    if (selectedTalhoes.length === 0 && projetoTalhoes.length > 0) {
      setSelectedTalhoes([projetoTalhoes[0].id])
    }
  }, [projetoTalhoes.length])

  const primeiroManejo = manejo.find(m => m.talhaoId === selectedTalhoes[0] && m.anoAgricola === anoAgricola && m.cenario === 'projeto')
  const locked = primeiroManejo?.status === 'aprovado' || isYearLocked

  const handleSubmit = () => {
    if (!selectedTalhoes.length) { toast.error('Nenhum talhão selecionado.'); return }
    if (isYearLocked) { toast.error('Dados de anos anteriores são somente leitura.'); return }
    let count = 0
    selectedTalhoes.forEach(tId => {
      const m = manejo.find(x => x.talhaoId === tId && x.anoAgricola === anoAgricola && x.cenario === 'projeto')
      if (m && m.status !== 'aprovado' && m.status !== 'pendente') { submitManejo(m.id); count++ }
    })
    if (count > 0) toast.success(`Manejo de ${count} talhão(ões) submetido!`)
    else toast.error('Nenhum dado válido para submeter.')
  }

  const handleDemarcationComplete = (points: [number, number][], hectares: number) => {
    setNovoTalhaoData({ points, hectares })
    setNovoTalhaoNome(`Talhão ${projetoTalhoes.length + 1}`)
    setIsDemarcando(false)
    setShowNovoTalhaoForm(true)
  }

  const handleSaveNovoTalhao = () => {
    if (!fazenda || !novoTalhaoData) return
    if (!novoTalhaoNome.trim()) { toast.error('Informe um nome para o talhão.'); return }
    addTalhao({
      fazendaId: fazenda.id, nome: novoTalhaoNome, areaHa: novoTalhaoData.hectares,
      tipo: 'projeto', profundidadeCm: 30, dadosValidados: false,
      latCenter: novoTalhaoData.points[0][0], lngCenter: novoTalhaoData.points[0][1],
    })
    toast.success('Novo talhão adicionado!')
    setShowNovoTalhaoForm(false)
    setNovoTalhaoData(null)
  }

  const handleKmlLoad = (result: { areaHa: number; geojson: any; fileName: string }) => {
    if (fazenda) {
      updateFazenda(fazenda.id, { kmlGeoJson: result.geojson, areaTotalHa: result.areaHa })
      toast.success(`KML carregado: ${result.areaHa.toFixed(1)} ha`)
    }
  }

  const toggleTalhao = (id: string) => {
    setSelectedTalhoes(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) { toast.error('Selecione ao menos um talhão.'); return prev }
        return prev.filter(x => x !== id)
      }
      return [...prev, id]
    })
  }

  const areaTabItems = [
    { id: 'mapa', label: 'Mapa & KML', icon: Map },
    { id: 'fertilizacao', label: 'Fertilização', icon: Droplets },
    { id: 'operacional', label: 'Máquinas', icon: Settings2 },
    { id: 'documentos', label: 'Evidências', icon: FileText },
  ] as const

  const backLabel = etapa === 2 ? 'Área da Fazenda' : 'Talhões'
  const nextLabel = etapa === 1 ? 'Talhões' : 'Manejo'
  const isLastStep = etapa === 3

  const StickyFooter = () => (
    <div className="sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur-sm px-6 py-3.5 flex items-center gap-4 z-10">
      <Button
        variant="ghost"
        size="sm"
        className="rounded-xl text-muted-foreground h-9"
        onClick={() => toast.info('Rascunho salvo automaticamente.')}
      >
        Salvar Rascunho
      </Button>
      <div className="flex-1 flex justify-center">
        {etapa > 1 && (
          <button
            onClick={() => setEtapa(e => e - 1)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {backLabel}
          </button>
        )}
      </div>
      {isLastStep ? (
        <Button
          size="sm"
          onClick={() => setShowSubmitModal(true)}
          disabled={locked || primeiroManejo?.status === 'pendente'}
          className="gap-2 rounded-xl h-9 bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Send size={14} />
          {primeiroManejo?.status === 'pendente' ? 'Em Validação' : 'Submeter Manejo →'}
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => setEtapa(e => e + 1)}
          disabled={etapa === 2 && projetoTalhoes.length === 0}
          className="rounded-xl h-9 gap-1.5"
        >
          Ir para {nextLabel} <ChevronRight size={13} />
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header da Fazenda */}
      {fazenda && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{fazenda.nome}</h2>
                <p className="text-xs text-muted">{fazenda.municipio}/{fazenda.estado} · {fazenda.areaTotalHa.toLocaleString('pt-BR')} ha</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                {ANOS.map(a => {
                  const status = getYearMrvStatus(a, projetoTalhoes, manejo)
                  const isSelected = a === anoAgricola
                  return (
                    <button
                      key={a}
                      title={`${a}/${a + 1} · ${YEAR_STATUS_TITLE[status]}`}
                      onClick={() => setAnoAgricola(a)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-all border',
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full shrink-0', YEAR_STATUS_DOT[status])} />
                      {a}
                      {a < CURRENT_YEAR && <Lock size={9} className="opacity-60" />}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted uppercase font-bold tracking-tight bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                <Thermometer size={12} className="text-primary" /> INMET: {fazenda.municipio}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {fazenda && (
        <div className="bg-background border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {/* Indicador de etapas */}
          <StepIndicator current={etapa} onGoTo={setEtapa} />

          {/* Sub-header com status */}
          <div className="px-6 py-3 border-b border-border/50 bg-surface/30 flex flex-wrap items-center gap-3">
            <StatusBadge status={primeiroManejo?.status || 'rascunho'} />
            {primeiroManejo?.status === 'correcao' && (
              <span className="text-xs text-danger bg-danger/5 px-2 py-1 rounded border border-danger/10 max-w-[260px] truncate">
                {primeiroManejo.comentarioCorrecao}
              </span>
            )}
          </div>

          {/* ────────────────────────────────────────────
              ETAPA 1 — Área da Fazenda
          ──────────────────────────────────────────── */}
          {etapa === 1 && (
            <div className="flex-1 flex flex-col">
              {/* Horizontal underline tabs L2 */}
              <div className="flex border-b border-border/50 px-6 bg-surface/10" role="tablist">
                {areaTabItems.map(t => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={areaTab === t.id}
                    onClick={() => setAreaTab(t.id as any)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px',
                      areaTab === t.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    )}
                  >
                    <t.icon size={14} />
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {areaTab === 'mapa' && (
                  <div className="space-y-5 max-w-2xl">
                    <div>
                      <h3 className="text-base font-bold mb-1">Área da Propriedade</h3>
                      <p className="text-sm text-muted">Faça upload do KML ou visualize a área no mapa.</p>
                    </div>
                    <KmlUploader onLoad={handleKmlLoad} label="Carregar KML da fazenda" />
                    <div className="rounded-xl overflow-hidden border border-border/50">
                      <FazendaMap talhoes={projetoTalhoes} height="280px" />
                    </div>
                  </div>
                )}
                {areaTab === 'fertilizacao' && (
                  <FertilizacaoForm talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
                )}
                {areaTab === 'operacional' && (
                  <OperacionalForm talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
                )}
                {areaTab === 'documentos' && (
                  <DocumentosForm talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
                )}
              </div>

              <StickyFooter />
            </div>
          )}

          {/* ────────────────────────────────────────────
              ETAPA 2 — Talhões
          ──────────────────────────────────────────── */}
          {etapa === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div>
                  <h3 className="text-base font-bold">Talhões da Fazenda</h3>
                  <p className="text-sm text-muted">Crie e gerencie os talhões. Cada talhão terá seu próprio manejo.</p>
                </div>

                {isYearLocked && (
                  <div className="flex items-center gap-2 text-xs text-warning bg-warning/5 border border-warning/10 rounded-lg px-4 py-2">
                    <Lock size={12} /> Apenas visualização. Anos anteriores não permitem edição.
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {projetoTalhoes.map(t => {
                    const { lavoura, pecuaria } = getManejoStatus(t.id, manejo, anoAgricola)
                    return (
                      <Card key={t.id} className="group border-border/50 relative">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => !isYearLocked && setEditingTalhao(t.id)}
                            >
                              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{t.nome}</h3>
                              <p className="text-sm text-muted">{t.areaHa} ha</p>
                            </div>
                            {!isYearLocked && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <MoreVertical size={15} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={() => setEditingTalhao(t.id)}>
                                    <Settings2 size={13} className="mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-danger focus:text-danger"
                                    onClick={() => setDeletingTalhao(t.id)}
                                  >
                                    <Trash2 size={13} className="mr-2" /> Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <div className="flex items-center justify-between border-t border-border/50 pt-3">
                            <ManejoStatusDots lavoura={lavoura} pecuaria={pecuaria} />
                            <span className="text-xs font-bold text-muted">{t.socPercent ? `SOC ${t.socPercent}%` : 'SOC —'}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {!isYearLocked && (
                    <Card
                      className="border-dashed border-border/60 bg-surface/20 opacity-60 hover:opacity-100 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[130px] gap-2"
                      onClick={() => setIsDemarcando(true)}>
                      <PlusCircle size={28} className="text-muted" />
                      <p className="text-sm font-medium text-muted">Demarcar Talhão no Mapa</p>
                    </Card>
                  )}
                </div>
              </div>

              <StickyFooter />
            </div>
          )}

          {/* ────────────────────────────────────────────
              ETAPA 3 — Manejo por Talhão
          ──────────────────────────────────────────── */}
          {etapa === 3 && (
            <div className="flex-1 flex flex-col">
              {/* Seleção de talhões — checkbox chips */}
              <div className="px-6 py-4 border-b border-border/50 bg-surface/10 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {projetoTalhoes.map(t => {
                    const isSel = selectedTalhoes.includes(t.id)
                    const progress = getManejoProgress(t.id, manejo, anoAgricola)
                    return (
                      <button
                        key={t.id}
                        title={PROGRESS_TOOLTIP[progress]}
                        onClick={() => toggleTalhao(t.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all min-h-[44px]',
                          isSel
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                          isSel ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                        )}>
                          {isSel && <Check size={10} className="text-white" />}
                        </div>
                        <span className={cn('w-2 h-2 rounded-full shrink-0', PROGRESS_DOT[progress])} />
                        {t.nome}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{selectedTalhoes.length} selecionado(s)</span>
                  <span>·</span>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setSelectedTalhoes(projetoTalhoes.map(t => t.id))}
                  >
                    Selecionar todos
                  </button>
                  {selectedTalhoes.length > 1 && (
                    <>
                      <span>·</span>
                      <button
                        className="hover:underline hover:text-foreground"
                        onClick={() => setSelectedTalhoes([projetoTalhoes[0].id])}
                      >
                        Limpar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Horizontal underline tabs: Lavoura | Pecuária */}
              <div className="flex border-b border-border/50 px-6 bg-surface/10" role="tablist">
                {(() => {
                  const selectedManejo = manejo.filter(m =>
                    selectedTalhoes.includes(m.talhaoId ?? '') && m.anoAgricola === anoAgricola && m.cenario === 'projeto'
                  )
                  const lavouraHasData = selectedManejo.some(m => m.cultura || (m.culturas && m.culturas.length > 0) || m.dataPlantio)
                  const pecuariaHasData = selectedManejo.some(m => m.pecuaria && m.pecuaria.length > 0)
                  return [
                    { id: 'lavoura',  label: 'Lavoura',  icon: Leaf,    hasData: lavouraHasData  },
                    { id: 'pecuaria', label: 'Pecuária', icon: Tractor, hasData: pecuariaHasData },
                  ].map(item => (
                    <button
                      key={item.id}
                      role="tab"
                      aria-selected={manejoTab === item.id}
                      onClick={() => setManejoTab(item.id as any)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px',
                        manejoTab === item.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      )}
                    >
                      <item.icon size={14} />
                      {item.label}
                      <span className={cn('w-2 h-2 rounded-full shrink-0', item.hasData ? 'bg-success' : 'bg-muted-foreground/25')} />
                    </button>
                  ))
                })()}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {manejoTab === 'lavoura' && (
                  <LavouraForm talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
                )}
                {manejoTab === 'pecuaria' && (
                  <PecuariaForm talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
                )}
              </div>

              <StickyFooter />
            </div>
          )}
        </div>
      )}

      {editingTalhao && <TalhaoEditModal talhaoId={editingTalhao} onClose={() => setEditingTalhao(null)} />}
      {deletingTalhao && <DeleteTalhaoModal talhaoId={deletingTalhao} onClose={() => setDeletingTalhao(null)} />}
      {showSubmitModal && (
        <SubmitConfirmModal onConfirm={handleSubmit} onClose={() => setShowSubmitModal(false)} />
      )}

      <MapDemarcationOverlay
        isOpen={isDemarcando}
        onClose={() => setIsDemarcando(false)}
        onComplete={handleDemarcationComplete}
        title="Novo Talhão"
        description="Desenhe o polígono do novo talhão no mapa."
        initialCenter={fazenda ? [-15, -47] : [-15, -47]}
        initialZoom={14}
      />

      {showNovoTalhaoForm && novoTalhaoData && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-background border border-border/50 rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-5">
            <h3 className="text-lg font-bold">Salvar Novo Talhão ({novoTalhaoData.hectares.toFixed(1)} ha)</h3>
            <Input value={novoTalhaoNome} onChange={e => setNovoTalhaoNome(e.target.value)} placeholder="Nome do Talhão" className="rounded-xl" autoFocus />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowNovoTalhaoForm(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl" onClick={handleSaveNovoTalhao}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
