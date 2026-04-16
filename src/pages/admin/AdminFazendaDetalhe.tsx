import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDataStore } from '@/store/data'
import type { MrvStatus } from '@/store/data'
import { toast } from 'sonner'
import { ArrowLeft, Leaf, Droplets, Tractor, FileText, Settings2, Send, Thermometer, Cpu, Layers, Clock, AlertCircle, Lock, History } from 'lucide-react'
import { cn } from '@/lib/utils'

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

import LavouraForm from '@/pages/cliente/mrv/LavouraForm'
import PecuariaForm from '@/pages/cliente/mrv/PecuariaForm'
import FertilizacaoForm from '@/pages/cliente/mrv/FertilizacaoForm'
import OperacionalForm from '@/pages/cliente/mrv/OperacionalForm'
import DocumentosForm from '@/pages/cliente/mrv/DocumentosForm'

import { AdminTalhoesTab } from './components/AdminTalhoesTab'
import { AdminMotorTab } from './components/AdminMotorTab'
import { AdminHistoricoTab } from './components/AdminHistoricoTab'

const CURRENT_YEAR = new Date().getFullYear()
const ANOS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3]

export default function AdminFazendaDetalhe() {
  const { fazendaId } = useParams()
  const { fazendas, clientes, manejo, submitManejo } = useDataStore()

  const fazenda = fazendas.find(f => f.id === fazendaId) ?? fazendas[0]
  const cliente = clientes.find(c => c.id === fazenda?.produtorId)

  const [anoAgricola, setAnoAgricola] = useState(CURRENT_YEAR)
  const [activeTab, setActiveTab] = useState('lavoura')

  const manejoAtual = manejo.find(m => m.fazendaId === fazenda?.id && m.anoAgricola === anoAgricola && m.cenario === 'projeto')
  const locked = false // For admin, do we lock? Maybe not, or maybe just follow normal flow. We'll allow override.

  const MRV_STEPS = [
    { id: 'lavoura', name: 'Lavoura', Icon: Leaf },
    { id: 'pecuaria', name: 'Pecuária', Icon: Tractor },
    { id: 'fertilizacao', name: 'Fertilização', Icon: Droplets },
    { id: 'operacional', name: 'Máquinas', Icon: Settings2 },
    { id: 'documentos', name: 'Evidências', Icon: FileText },
    { id: 'talhoes', name: 'Gestor de Talhões (Admin)', Icon: Layers },
    { id: 'motor', name: 'Motor de Cálculos', Icon: Cpu },
    { id: 'historico', name: 'Histórico', Icon: History },
  ]

  const handleSubmit = () => {
    if (!manejoAtual) { toast.error('Salve ao menos uma seção antes de submeter.'); return }
    if (manejoAtual.status === 'aprovado') { toast.error('Dados já aprovados — imutáveis.'); return }
    submitManejo(manejoAtual.id)
    toast.success('Manejo submetido / validado com sucesso!')
  }

  if (!fazenda) return <div>Fazenda não encontrada.</div>

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full flex-shrink-0">
            <Link to="/admin/fazendas"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerenciar MRV: {fazenda.nome}</h1>
            <p className="text-sm text-muted">Produtor: {cliente?.nome} — {fazenda.municipio}/{fazenda.estado}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={String(anoAgricola)} onValueChange={v => setAnoAgricola(Number(v))}>
            <SelectTrigger className="w-40 rounded-xl font-bold bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANOS.map(a => <SelectItem key={a} value={String(a)}>{a}/{a+1}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-[10px] text-muted uppercase font-bold tracking-tight bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
            <Thermometer size={12} className="text-primary" /> INMET: {fazenda.municipio}
          </div>
        </div>
      </div>

      {/* Main MRV Interface */}
      <div className="bg-background border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Sub-Header */}
        <div className="px-6 py-4 border-b border-border/50 bg-surface/30 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={manejoAtual?.status || 'rascunho'} />
            {manejoAtual?.status === 'aprovado' && <span className="text-xs text-primary font-bold">Modo Administrador (Edição Livre)</span>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={!manejoAtual} className="gap-2 rounded-xl h-9">
                <Send size={14} /> Forçar Validação
            </Button>
          </div>
        </div>

        {/* Layout with Sidebar */}
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Menu Lateral */}
          <div className="w-full md:w-56 border-r border-border/50 bg-surface/10 p-4 space-y-1">
            {MRV_STEPS.map(step => (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.id)}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                  activeTab === step.id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
                  (step.id === 'talhoes' || step.id === 'motor') && activeTab !== step.id && 'text-primary/70 bg-primary/5 border border-primary/10'
                )}
              >
                <step.Icon size={16} /> {step.name}
              </button>
            ))}
          </div>

          {/* Conteúdo Central */}
          <div className="flex-1 p-6 overflow-x-hidden">
            {activeTab === 'lavoura' && <LavouraForm fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />}
            {activeTab === 'pecuaria' && <PecuariaForm fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />}
            {activeTab === 'fertilizacao' && <FertilizacaoForm fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />}
            {activeTab === 'operacional' && <OperacionalForm fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />}
            {activeTab === 'documentos' && <DocumentosForm fazendaId={fazenda.id} anoAgricola={anoAgricola} locked={locked} />}
            
            {activeTab === 'talhoes' && <AdminTalhoesTab fazendaId={fazenda.id} />}
            {activeTab === 'motor' && <AdminMotorTab fazendaId={fazenda.id} anoAgricola={anoAgricola} />}
            {activeTab === 'historico' && <AdminHistoricoTab fazendaId={fazenda.id} />}
          </div>
        </div>

      </div>
    </div>
  )
}
