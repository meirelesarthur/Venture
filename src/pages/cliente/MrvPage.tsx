import { useState, useEffect } from 'react'
import { useDataStore } from '@/store/data'
import type { FeatureCollection } from 'geojson'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MrvStatusBadge } from '@/components/ui/mrv-status-badge'
import { Input } from '@/components/ui/input'
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
  Lock, Send, MapPin, Thermometer,
  PlusCircle, Settings2, Map, ChevronRight,
  Check, MoreVertical, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TalhaoEditModal, DeleteTalhaoModal, SubmitConfirmModal } from './mrv/MrvModals'
import {
  StepIndicator, getManejoStatus, getManejoProgress,
  PROGRESS_DOT, PROGRESS_TOOLTIP, ManejoStatusDots,
  getYearMrvStatus, YEAR_STATUS_DOT, YEAR_STATUS_TITLE,
} from './mrv/MrvIndicators'

const CURRENT_YEAR = new Date().getFullYear()
const ANOS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3]

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

  const handleKmlLoad = (result: { areaHa: number; geojson: FeatureCollection; fileName: string }) => {
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
          <StepIndicator current={etapa} onGoTo={setEtapa} />

          <div className="px-6 py-3 border-b border-border/50 bg-surface/30 flex flex-wrap items-center gap-3">
            <MrvStatusBadge status={primeiroManejo?.status || 'rascunho'} />
            {primeiroManejo?.status === 'correcao' && (
              <span className="text-xs text-danger bg-danger/5 px-2 py-1 rounded border border-danger/10 max-w-[260px] truncate">
                {primeiroManejo.comentarioCorrecao}
              </span>
            )}
          </div>

          {/* ETAPA 1 — Área da Fazenda */}
          {etapa === 1 && (
            <div className="flex-1 flex flex-col">
              <div className="flex border-b border-border/50 px-6 bg-surface/10" role="tablist">
                {areaTabItems.map(t => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={areaTab === t.id}
                    onClick={() => setAreaTab(t.id)}
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
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold mb-1">Área da Propriedade</h3>
                      <p className="text-sm text-muted">Faça upload do KML ou visualize a área no mapa.</p>
                    </div>
                    {/* Side-by-side em telas grandes: 30% KML · 70% mapa */}
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                      <div className="lg:w-[30%] h-full">
                        <KmlUploader onLoad={handleKmlLoad} label="Carregar KML da fazenda" className="h-full" />
                      </div>
                      <div className="lg:w-[70%] rounded-xl overflow-hidden border border-border/50 min-h-[280px]">
                        <FazendaMap talhoes={projetoTalhoes} height="100%" />
                      </div>
                    </div>
                  </div>
                )}
                {areaTab === 'fertilizacao' && (
                  <FertilizacaoForm key={selectedTalhoes.join(',') + '-' + anoAgricola} talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
                )}
                {areaTab === 'operacional' && (
                  <OperacionalForm key={selectedTalhoes.join(',') + '-' + anoAgricola} talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
                )}
                {areaTab === 'documentos' && (
                  <DocumentosForm talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
                )}
              </div>

              <StickyFooter />
            </div>
          )}

          {/* ETAPA 2 — Talhões */}
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

          {/* ETAPA 3 — Manejo por Talhão */}
          {etapa === 3 && (
            <div className="flex-1 flex flex-col">
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
                      onClick={() => setManejoTab(item.id as typeof manejoTab)}
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
                  <LavouraForm key={selectedTalhoes.join(',') + '-' + anoAgricola} talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
                )}
                {manejoTab === 'pecuaria' && (
                  <PecuariaForm key={selectedTalhoes.join(',') + '-' + anoAgricola} talhaoIds={selectedTalhoes} fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />
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
