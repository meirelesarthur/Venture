import { useState } from 'react'
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
import {
  Leaf, Droplets, Tractor, FileText,
  Clock, AlertCircle, Lock, Send, MapPin, Thermometer,
  X, PlusCircle, Grid, Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MapDemarcationOverlay } from '@/components/MapDemarcationOverlay'

// Dynamic years: current year + 3 previous
const CURRENT_YEAR = new Date().getFullYear()
const ANOS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3]

function StatusBadge({ status }: { status: MrvStatus }) {
  if (status === 'rascunho') return null;
  const cfg = {
    pendente:  { label: 'Em Validação',  cls: 'bg-warning/10 text-warning border-warning/20' },
    aprovado:  { label: 'Aprovado',      cls: 'bg-success/10 text-success border-success/20' },
    correcao:  { label: 'Correção',      cls: 'bg-danger/10 text-danger border-danger/20' },
  }[status as Exclude<MrvStatus, 'rascunho'>]
  const icons = { pendente: <Clock size={11} />, aprovado: <Lock size={11} />, correcao: <AlertCircle size={11} /> }
  return (
    <Badge variant="outline" className={cn('flex items-center gap-1 text-xs shadow-none', cfg.cls)}>
      {icons[status as keyof typeof icons]}
      {cfg.label}
    </Badge>
  )
}

function TalhaoEditModal({
  talhaoId,
  onClose
}: {
  talhaoId: string
  onClose: () => void
}) {
  const { talhoes, updateTalhao } = useDataStore()
  const talhao = talhoes.find(t => t.id === talhaoId)
  
  const [nome, setNome] = useState(talhao?.nome || '')
  const [area, setArea] = useState(String(talhao?.areaHa || ''))
  const [soc, setSoc] = useState(String(talhao?.socPercent || ''))

  if (!talhao) return null

  const handleSave = () => {
    updateTalhao(talhaoId, {
      nome,
      areaHa: Number(area),
      socPercent: soc ? Number(soc) : undefined,
      socTimestamp: soc ? new Date().toISOString() : undefined
    })
    toast.success('Talhão atualizado!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border/50 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings2 size={18} className="text-primary" /> Editar Talhão
          </h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-nome">Nome do Talhão</Label>
            <Input id="t-nome" value={nome} onChange={e => setNome(e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="t-area">Área (ha)</Label>
              <Input id="t-area" type="number" value={area} onChange={e => setArea(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-soc">Teor de SOC (%)</Label>
              <Input id="t-soc" type="number" step="0.1" value={soc} onChange={e => setSoc(e.target.value)} className="rounded-xl" placeholder="Ex: 2.1" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
          <Button onClick={handleSave} className="flex-1 rounded-xl">Salvar Alterações</Button>
        </div>
      </div>
    </div>
  )
}

export default function MrvPage() {
  const { talhoes, fazendas, addTalhao, manejo, submitManejo } = useDataStore()
  const projetoTalhoes = talhoes.filter(t => t.tipo === 'projeto')
  const fazenda = projetoTalhoes.length ? fazendas.find(f => f.id === projetoTalhoes[0].fazendaId) : fazendas[0]

  const [anoAgricola, setAnoAgricola] = useState(CURRENT_YEAR)
  const isYearLocked = anoAgricola < CURRENT_YEAR

  const [activeTab, setActiveTab] = useState('lavoura')
  const [editingTalhao, setEditingTalhao] = useState<string | null>(null)
  
  const [isDemarcando, setIsDemarcando] = useState(false)
  const [showNovoTalhaoForm, setShowNovoTalhaoForm] = useState(false)
  const [novoTalhaoData, setNovoTalhaoData] = useState<{ hectares: number, points: [number, number][] } | null>(null)
  const [novoTalhaoNome, setNovoTalhaoNome] = useState('')

  const manejoAtual = manejo.find(m => m.fazendaId === fazenda?.id && m.anoAgricola === anoAgricola && m.cenario === 'projeto')
  const locked = manejoAtual?.status === 'aprovado' || isYearLocked

  const MRV_STEPS = [
    { id: 'lavoura', name: 'Lavoura', Icon: Leaf },
    { id: 'pecuaria', name: 'Pecuária', Icon: Tractor },
    { id: 'fertilizacao', name: 'Fertilização', Icon: Droplets },
    { id: 'operacional', name: 'Máquinas', Icon: Settings2 },
    { id: 'documentos', name: 'Evidências', Icon: FileText },
    { id: 'talhoes', name: 'Gestor de Talhões', Icon: Grid }
  ]

  const handleSubmit = () => {
    if (!manejoAtual) { toast.error('Salve ao menos uma seção antes de submeter.'); return }
    if (manejoAtual.status === 'aprovado') { toast.error('Dados já aprovados — imutáveis.'); return }
    if (isYearLocked) { toast.error('Dados de anos anteriores são somente leitura.'); return }
    submitManejo(manejoAtual.id)
    toast.success('Manejo da fazenda submetido para validação!')
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
      fazendaId: fazenda.id,
      nome: novoTalhaoNome,
      areaHa: novoTalhaoData.hectares,
      tipo: 'projeto',
      profundidadeCm: 30,
      dadosValidados: false,
      latCenter: novoTalhaoData.points[0][0],
      lngCenter: novoTalhaoData.points[0][1]
    })
    toast.success('Novo talhão adicionado!')
    setShowNovoTalhaoForm(false)
    setNovoTalhaoData(null)
  }

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
              <div className="flex items-center gap-4">
                <Select value={String(anoAgricola)} onValueChange={v => setAnoAgricola(Number(v))}>
                  <SelectTrigger className="w-36 rounded-xl h-9 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANOS.map(a => <SelectItem key={a} value={String(a)}>{a}/{a+1} {a < CURRENT_YEAR ? '🔒' : ''}</SelectItem>)}
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
          <div className="px-6 py-4 border-b border-border/50 bg-surface/30 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={manejoAtual?.status || 'rascunho'} />
              {manejoAtual?.status === 'correcao' && (
                <span className="text-xs text-danger bg-danger/5 px-2 py-1 rounded border border-danger/10 max-w-[200px] truncate">
                  {manejoAtual.comentarioCorrecao}
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={!manejoAtual || locked || manejoAtual.status === 'pendente' || activeTab === 'talhoes'} className="gap-2 rounded-xl h-9">
                  <Send size={14} /> {manejoAtual?.status === 'pendente' ? 'Em Validação' : 'Submeter Manejo'}
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row">
            <div className="w-full md:w-56 border-r border-border/50 bg-surface/10 p-4 space-y-1">
              {MRV_STEPS.map(step => (
                <button
                  key={step.id}
                  onClick={() => setActiveTab(step.id)}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                    activeTab === step.id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                  )}
                >
                  <step.Icon size={16} /> {step.name}
                </button>
              ))}
            </div>

            <div className="flex-1 p-6">
              {activeTab === 'lavoura' && <LavouraForm fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />}
              {activeTab === 'pecuaria' && <PecuariaForm fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />}
              {activeTab === 'fertilizacao' && <FertilizacaoForm fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />}
              {activeTab === 'operacional' && <OperacionalForm fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />}
              {activeTab === 'documentos' && <DocumentosForm fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />}
              
              {activeTab === 'talhoes' && (
                <div className="space-y-4">
                  {isYearLocked && (
                    <div className="flex items-center gap-2 text-xs text-warning bg-warning/5 border border-warning/10 rounded-lg px-4 py-2">
                      <Lock size={12} /> Apenas visualização. Anos anteriores não permitem edição de talhões.
                    </div>
                  )}
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {projetoTalhoes.map(t => (
                      <Card 
                        key={t.id} 
                        className="group cursor-pointer hover:border-primary/50 transition-all border-border/50"
                        onClick={() => !isYearLocked && setEditingTalhao(t.id)}
                      >
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{t.nome}</h3>
                              <p className="text-sm text-muted">{t.areaHa} hectares</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <Grid size={18} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-border/50 pt-3">
                            <span className="text-xs text-muted">A aporte SOC (Carbono)</span>
                            <span className="text-xs font-bold">{t.socPercent ? `${t.socPercent}%` : 'Pendente'}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {!isYearLocked && (
                      <Card 
                        className="border-dashed border-border/60 bg-surface/20 opacity-60 hover:opacity-100 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px] gap-2"
                        onClick={() => setIsDemarcando(true)}
                      >
                         <PlusCircle size={32} className="text-muted" />
                         <p className="text-sm font-medium text-muted">Adicionar Talhão</p>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingTalhao && <TalhaoEditModal talhaoId={editingTalhao} onClose={() => setEditingTalhao(null)} />}

      <MapDemarcationOverlay 
        isOpen={isDemarcando}
        onClose={() => setIsDemarcando(false)}
        onComplete={handleDemarcationComplete}
        title="Novo Talhão"
        description="Desenhe o polígono do novo talhão."
        initialCenter={fazenda ? [fazenda.kmlGeoJson?.features[0].geometry.coordinates[0][0][1] || -15, fazenda.kmlGeoJson?.features[0].geometry.coordinates[0][0][0] || -47] : [-15, -47]}
        initialZoom={14}
      />

      {showNovoTalhaoForm && novoTalhaoData && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-background border border-border/50 rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-6">
            <h3 className="text-lg font-bold">Salvar Novo Talhão ({novoTalhaoData.hectares} ha)</h3>
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



