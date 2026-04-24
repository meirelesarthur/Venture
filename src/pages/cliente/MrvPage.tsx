import { useState, useEffect } from 'react'
import { useDataStore } from '@/store/data'
import type { MrvStatus } from '@/store/data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  CheckCircle2, Layers
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

// Etapa visual no topo
function StepIndicator({ current }: { current: number }) {
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
        return (
          <div key={s.n} className="flex items-center gap-0 flex-1">
            <div className={cn('flex items-center gap-2 flex-1', active ? 'opacity-100' : done ? 'opacity-70' : 'opacity-40')}>
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                active ? 'bg-primary text-primary-foreground' : done ? 'bg-success text-white' : 'bg-border text-muted-foreground')}>
                {done ? <CheckCircle2 size={14} /> : s.n}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block', active ? 'text-foreground' : 'text-muted')}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight size={14} className="text-muted mx-1 shrink-0" />}
          </div>
        )
      })}
    </div>
  )
}

export default function MrvPage() {
  const { talhoes, fazendas, addTalhao, manejo, submitManejo, updateFazenda } = useDataStore()
  const projetoTalhoes = talhoes.filter(t => t.tipo === 'projeto')
  const fazenda = projetoTalhoes.length ? fazendas.find(f => f.id === projetoTalhoes[0].fazendaId) : fazendas[0]

  const [etapa, setEtapa] = useState(1) // 1=Área, 2=Talhões, 3=Manejo
  const [anoAgricola, setAnoAgricola] = useState(CURRENT_YEAR)
  const isYearLocked = anoAgricola < CURRENT_YEAR

  // Sub-aba dentro da Etapa 1 (Área)
  const [areaTab, setAreaTab] = useState<'mapa' | 'fertilizacao' | 'operacional' | 'documentos'>('mapa')
  // Sub-aba dentro da Etapa 3 (Manejo por talhão)
  const [manejoTab, setManejoTab] = useState<'lavoura' | 'pecuaria'>('lavoura')

  const [editingTalhao, setEditingTalhao] = useState<string | null>(null)
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

  const areaTabItems = [
    { id: 'mapa', label: 'Mapa & KML', icon: Map },
    { id: 'fertilizacao', label: 'Fertilização', icon: Droplets },
    { id: 'operacional', label: 'Máquinas', icon: Settings2 },
    { id: 'documentos', label: 'Evidências', icon: FileText },
  ] as const

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
            <div className="flex items-center gap-4">
              <Select value={String(anoAgricola)} onValueChange={v => setAnoAgricola(Number(v))}>
                <SelectTrigger className="w-36 rounded-xl h-9 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANOS.map(a => <SelectItem key={a} value={String(a)}>{a} {a < CURRENT_YEAR ? '🔒' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
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
          <StepIndicator current={etapa} />

          {/* Sub-header com status e ações */}
          <div className="px-6 py-3 border-b border-border/50 bg-surface/30 flex flex-wrap items-center gap-3">
            <StatusBadge status={primeiroManejo?.status || 'rascunho'} />
            {primeiroManejo?.status === 'correcao' && (
              <span className="text-xs text-danger bg-danger/5 px-2 py-1 rounded border border-danger/10 max-w-[200px] truncate">
                {primeiroManejo.comentarioCorrecao}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {etapa === 3 && (
                <Button size="sm" onClick={handleSubmit}
                  disabled={locked || primeiroManejo?.status === 'pendente'}
                  className="gap-2 rounded-xl h-9">
                  <Send size={14} /> {primeiroManejo?.status === 'pendente' ? 'Em Validação' : 'Submeter Manejo'}
                </Button>
              )}
            </div>
          </div>

          {/* ────────────────────────────────────────────
              ETAPA 1 — Área da Fazenda
          ──────────────────────────────────────────── */}
          {etapa === 1 && (
            <div className="flex-1 flex flex-col md:flex-row">
              {/* Sub-menu lateral */}
              <div className="w-full md:w-48 border-r border-border/50 bg-surface/10 p-3 space-y-1">
                {areaTabItems.map(item => (
                  <button key={item.id} onClick={() => setAreaTab(item.id as any)}
                    className={cn('flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      areaTab === item.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground')}>
                    <item.icon size={15} /> {item.label}
                  </button>
                ))}
                <div className="pt-3 mt-3 border-t border-border/50">
                  <Button className="w-full rounded-xl gap-1.5 text-xs h-9" onClick={() => setEtapa(2)}>
                    Ir para Talhões <ChevronRight size={13} />
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-6">
                {areaTab === 'mapa' && (
                  <div className="space-y-5">
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
            </div>
          )}

          {/* ────────────────────────────────────────────
              ETAPA 2 — Talhões
          ──────────────────────────────────────────── */}
          {etapa === 2 && (
            <div className="flex-1 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Talhões da Fazenda</h3>
                  <p className="text-sm text-muted">Crie e gerencie os talhões. Cada talhão terá seu próprio manejo.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl text-xs h-9 gap-1.5" onClick={() => setEtapa(1)}>
                    ← Área
                  </Button>
                  <Button className="rounded-xl text-xs h-9 gap-1.5" onClick={() => setEtapa(3)}
                    disabled={projetoTalhoes.length === 0}>
                    Ir para Manejo <ChevronRight size={13} />
                  </Button>
                </div>
              </div>

              {isYearLocked && (
                <div className="flex items-center gap-2 text-xs text-warning bg-warning/5 border border-warning/10 rounded-lg px-4 py-2">
                  <Lock size={12} /> Apenas visualização. Anos anteriores não permitem edição.
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                {projetoTalhoes.map(t => (
                  <Card key={t.id}
                    className="group cursor-pointer hover:border-primary/50 transition-all border-border/50"
                    onClick={() => !isYearLocked && setEditingTalhao(t.id)}>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{t.nome}</h3>
                          <p className="text-sm text-muted">{t.areaHa} ha</p>
                        </div>
                        <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Grid size={16} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/50 pt-3">
                        <span className="text-xs text-muted">SOC</span>
                        <span className="text-xs font-bold">{t.socPercent ? `${t.socPercent}%` : 'Pendente'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

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
          )}

          {/* ────────────────────────────────────────────
              ETAPA 3 — Manejo por Talhão
          ──────────────────────────────────────────── */}
          {etapa === 3 && (
            <div className="flex-1 flex flex-col">
              {/* Seleção de talhões (edição em lote) */}
              <div className="px-6 py-3 border-b border-border/50 bg-surface/10 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Grid size={14} className="text-primary" /> Talhão(ões):
                </span>
                <div className="flex flex-wrap gap-2">
                  {projetoTalhoes.map(t => {
                    const isSel = selectedTalhoes.includes(t.id)
                    return (
                      <Badge key={t.id} variant={isSel ? 'default' : 'outline'}
                        className={cn('cursor-pointer select-none transition-colors', !isSel && 'text-muted-foreground bg-background hover:bg-surface')}
                        onClick={() => {
                          if (isSel && selectedTalhoes.length === 1) { toast.error('Selecione ao menos um talhão.'); return }
                          setSelectedTalhoes(prev => isSel ? prev.filter(id => id !== t.id) : [...prev, t.id])
                        }}>
                        {t.nome}
                      </Badge>
                    )
                  })}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-muted hidden md:block">{selectedTalhoes.length} talhão(ões) em edição</span>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs h-8 gap-1" onClick={() => setEtapa(2)}>
                    ← Talhões
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex flex-col md:flex-row">
                {/* Sub-menu: Lavoura | Pecuária */}
                <div className="w-full md:w-44 border-r border-border/50 bg-surface/10 p-3 space-y-1">
                  {[
                    { id: 'lavoura', label: 'Lavoura', icon: Leaf },
                    { id: 'pecuaria', label: 'Pecuária', icon: Tractor },
                  ].map(item => (
                    <button key={item.id} onClick={() => setManejoTab(item.id as any)}
                      className={cn('flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        manejoTab === item.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground')}>
                      <item.icon size={15} /> {item.label}
                    </button>
                  ))}
                  <div className="pt-3 mt-2 border-t border-border/50 text-xs text-muted px-1 leading-relaxed">
                    Lavoura e Pecuária são registradas por talhão. Selecione acima quais talhões recebem os mesmos dados.
                  </div>
                </div>

                <div className="flex-1 p-6">
                  {manejoTab === 'lavoura' && (
                    <LavouraForm talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
                  )}
                  {manejoTab === 'pecuaria' && (
                    <PecuariaForm talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {editingTalhao && <TalhaoEditModal talhaoId={editingTalhao} onClose={() => setEditingTalhao(null)} />}

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
