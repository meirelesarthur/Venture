import { useState, useMemo } from 'react'
import { useDataStore } from '@/store/data'
import type { DadosManejoAnual, MrvStatus } from '@/store/data'
import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import LavouraForm from './mrv/LavouraForm'
import PecuariaForm from './mrv/PecuariaForm'
import FertilizacaoForm from './mrv/FertilizacaoForm'
import OperacionalForm from './mrv/OperacionalForm'
import DocumentosForm from './mrv/DocumentosForm'
import {
  Leaf, Users, Droplets, Tractor, FileText,
  Clock, AlertCircle, Lock, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ANOS = [2025, 2024, 2023]

function StatusBadge({ status }: { status: MrvStatus }) {
  const cfg = {
    rascunho:  { label: 'Rascunho',      cls: 'bg-muted/30 text-muted-foreground border-border/50' },
    pendente:  { label: 'Em Validação',  cls: 'bg-warning/10 text-warning border-warning/20' },
    aprovado:  { label: 'Aprovado',      cls: 'bg-success/10 text-success border-success/20' },
    correcao:  { label: 'Correção',      cls: 'bg-danger/10 text-danger border-danger/20' },
  }[status]
  const icons = { rascunho: null, pendente: <Clock size={11} />, aprovado: <Lock size={11} />, correcao: <AlertCircle size={11} /> }
  return (
    <Badge variant="outline" className={cn('flex items-center gap-1 text-xs shadow-none', cfg.cls)}>
      {icons[status]}
      {cfg.label}
    </Badge>
  )
}

const MRV_STEPS = [
  { id: 'lavoura',      name: 'Lavoura',      path: 'lavoura',      Icon: Leaf     },
  { id: 'pecuaria',     name: 'Pecuária',     path: 'pecuaria',     Icon: Users    },
  { id: 'fertilizacao', name: 'Fertilização', path: 'fertilizacao', Icon: Droplets },
  { id: 'operacional',  name: 'Máquinas',     path: 'operacional',  Icon: Tractor  },
  { id: 'documentos',   name: 'Evidências',   path: 'documentos',   Icon: FileText },
]

function MrvLayout({
  children,
  talhaoId,
  anoAgricola,
  onTalhaoChange,
  onAnoChange,
  manejoAtual,
}: {
  children: React.ReactNode
  talhaoId: string
  anoAgricola: number
  onTalhaoChange: (id: string) => void
  onAnoChange: (ano: number) => void
  manejoAtual?: DadosManejoAnual
}) {
  const talhoes = useDataStore(s => s.talhoes)
  const { submitManejo } = useDataStore()
  const projetoTalhoes = talhoes.filter(t => t.tipo === 'projeto')

  const handleSubmit = () => {
    if (!manejoAtual) { toast.error('Salve ao menos uma seção antes de submeter.'); return }
    if (manejoAtual.status === 'aprovado') { toast.error('Dados já aprovados — imutáveis.'); return }
    submitManejo(manejoAtual.id)
    toast.success('Dados submetidos para validação com sucesso!')
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">MRV Digital</h1>
          <p className="text-muted">Monitoramento, Relato e Verificação de práticas regenerativas.</p>
        </div>

        {/* Filtros talhão & ano */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={talhaoId} onValueChange={onTalhaoChange}>
            <SelectTrigger className="w-52 rounded-xl h-9 text-sm">
              <SelectValue placeholder="Selecionar talhão" />
            </SelectTrigger>
            <SelectContent>
              {projetoTalhoes.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nome} ({t.areaHa} ha)</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(anoAgricola)} onValueChange={v => onAnoChange(Number(v))}>
            <SelectTrigger className="w-36 rounded-xl h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANOS.map(a => <SelectItem key={a} value={String(a)}>Safra {a}/{a+1}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status geral */}
      <div className="flex flex-wrap items-center gap-3">
        {manejoAtual && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Status:</span>
            <StatusBadge status={manejoAtual.status} />
            {manejoAtual.status === 'correcao' && manejoAtual.comentarioCorrecao && (
              <span className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-1 max-w-sm truncate">
                {manejoAtual.comentarioCorrecao}
              </span>
            )}
          </div>
        )}
        {manejoAtual?.status === 'aprovado' && (
          <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/20 rounded-lg px-3 py-1.5">
            <Lock size={12} />
            Aprovado em {manejoAtual.aprovadoEm ? new Date(manejoAtual.aprovadoEm).toLocaleDateString('pt-BR') : '—'} — dados imutáveis
          </div>
        )}
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!manejoAtual || manejoAtual.status === 'aprovado' || manejoAtual.status === 'pendente'}
            className="gap-2 rounded-xl"
          >
            <Send size={14} />
            {manejoAtual?.status === 'pendente' ? 'Aguardando Validação' : 'Submeter para Validação'}
          </Button>
        </div>
      </div>

      {/* Tabs de categoria */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="flex w-max gap-1 p-3 min-w-full">
              {MRV_STEPS.map(step => (
                <NavLink
                  key={step.id}
                  to={`/dashboard/mrv/${step.path}`}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent/5 hover:text-foreground'
                  )}
                >
                  <step.Icon size={15} />
                  {step.name}
                </NavLink>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário ativo */}
      <Card className={cn(
        'border-border/50 shadow-sm min-h-[500px]',
        manejoAtual?.status === 'aprovado' && 'border-success/30 bg-success/5'
      )}>
        <CardContent className="p-6">
          {manejoAtual?.status === 'aprovado' && (
            <div className="flex items-center gap-2 text-sm text-success mb-4 pb-4 border-b border-success/20">
              <Lock size={14} />
              Dados aprovados em auditoria. Edição não permitida.
            </div>
          )}
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

export default function MrvPage() {
  const manejo = useDataStore(s => s.manejo)
  const talhoes = useDataStore(s => s.talhoes)
  const location = useLocation()

  const projetoTalhoes = talhoes.filter(t => t.tipo === 'projeto')

  // Suporte a talhão pré-selecionado via state de navegação (ex: clique no mapa do dashboard)
  const initialTalhaoId = (location.state as any)?.talhaoId ?? projetoTalhoes[0]?.id ?? ''
  const [talhaoId, setTalhaoId] = useState(initialTalhaoId)
  const [anoAgricola, setAnoAgricola] = useState(2025)

  const manejoAtual = useMemo(() =>
    manejo.find(m => m.talhaoId === talhaoId && m.anoAgricola === anoAgricola && m.cenario === 'projeto'),
    [manejo, talhaoId, anoAgricola]
  )

  const locked = manejoAtual?.status === 'aprovado'

  return (
    <MrvLayout
      talhaoId={talhaoId}
      anoAgricola={anoAgricola}
      onTalhaoChange={setTalhaoId}
      onAnoChange={setAnoAgricola}
      manejoAtual={manejoAtual}
    >
      <Routes>
        <Route path="lavoura"      element={<LavouraForm      talhaoId={talhaoId} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />} />
        <Route path="pecuaria"     element={<PecuariaForm     talhaoId={talhaoId} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />} />
        <Route path="fertilizacao" element={<FertilizacaoForm talhaoId={talhaoId} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />} />
        <Route path="operacional"  element={<OperacionalForm  talhaoId={talhaoId} anoAgricola={anoAgricola} locked={locked} manejoId={manejoAtual?.id} />} />
        <Route path="documentos"   element={<DocumentosForm   talhaoId={talhaoId} anoAgricola={anoAgricola} locked={locked} />} />
        <Route path="/"            element={<Navigate to="lavoura" replace />} />
      </Routes>
    </MrvLayout>
  )
}
