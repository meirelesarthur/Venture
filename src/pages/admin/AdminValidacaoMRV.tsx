import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useDataStore } from '@/store/data'
import type { MrvStatus } from '@/store/data'
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight, MessageCircle, Filter } from 'lucide-react'
import { toast } from 'sonner'

function StatusBadge({ status }: { status: MrvStatus }) {
  const cfg = {
    rascunho:  { label: 'Rascunho',   cls: 'bg-muted/20 text-muted-foreground border-border/50' },
    pendente:  { label: 'Em Análise', cls: 'bg-warning/10 text-warning border-warning/20' },
    aprovado:  { label: 'Aprovado',   cls: 'bg-success/10 text-success border-success/20' },
    correcao:  { label: 'Correção',   cls: 'bg-danger/10 text-danger border-danger/20' },
  }[status]
  return <Badge variant="outline" className={`shadow-none text-xs ${cfg.cls}`}>{cfg.label}</Badge>
}

export default function AdminValidacaoMRV() {
  const { manejo, talhoes, fazendas, clientes, approveManejo, requestCorrection } = useDataStore()

  const [filter, setFilter] = useState<MrvStatus | 'todos'>('pendente')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [correcaoTexto, setCorrecaoTexto] = useState<Record<string, string>>({})

  // Enrich manejo with talhão, fazenda, cliente info
  const enriched = manejo
    .filter(m => filter === 'todos' || m.status === filter)
    .map(m => {
      const talhao  = talhoes.find(t => t.id === m.talhaoId)
      const fazenda = fazendas.find(f => f.id === talhao?.fazendaId)
      const cliente = clientes.find(c => c.id === fazenda?.produtorId)
      return { ...m, talhao, fazenda, cliente }
    })
    .sort((a, b) => {
      const order: Record<MrvStatus, number> = { pendente: 0, correcao: 1, rascunho: 2, aprovado: 3 }
      return order[a.status] - order[b.status]
    })

  const handleAprovar = (id: string) => {
    approveManejo(id)
    toast.success('Dados aprovados com sucesso!')
  }

  const handleCorrecao = (id: string) => {
    const t = correcaoTexto[id]
    if (!t?.trim()) { toast.error('Informe o motivo da solicitação de correção.'); return }
    requestCorrection(id, t)
    toast.success('Solicitação de correção enviada ao produtor.')
    setCorrecaoTexto(prev => ({ ...prev, [id]: '' }))
  }

  const totais = {
    pendente: manejo.filter(m => m.status === 'pendente').length,
    aprovado: manejo.filter(m => m.status === 'aprovado').length,
    correcao: manejo.filter(m => m.status === 'correcao').length,
    rascunho: manejo.filter(m => m.status === 'rascunho').length,
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Fila de Validação MRV</h1>
        <p className="text-muted">Revisão e aprovação dos dados de manejo submetidos pelos produtores.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'pendente', label: 'Aguardando',    color: 'text-warning', bg: 'bg-warning/5 border-warning/20', Icon: Clock },
          { key: 'aprovado', label: 'Aprovados',     color: 'text-success', bg: 'bg-success/5 border-success/20', Icon: CheckCircle2 },
          { key: 'correcao', label: 'Correção',      color: 'text-danger',  bg: 'bg-danger/5 border-danger/20',   Icon: AlertCircle },
          { key: 'rascunho', label: 'Em Rascunho',   color: 'text-muted-foreground', bg: 'bg-surface border-border/50', Icon: Clock },
        ].map(({ key, label, color, bg, Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key as MrvStatus | 'todos')}
            className={`p-4 rounded-xl border ${bg} ${filter === key ? 'ring-2 ring-primary/30' : ''} text-left transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={color} />
              <span className="text-xs font-medium text-muted">{label}</span>
            </div>
            <p className={`text-3xl font-bold ${color}`}>{totais[key as MrvStatus]}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-muted" />
        {(['todos', 'pendente', 'aprovado', 'correcao', 'rascunho'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted hover:bg-accent/5'}`}
          >
            {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {enriched.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center text-muted">
              Nenhum dado MRV nesse filtro.
            </CardContent>
          </Card>
        )}

        {enriched.map(m => (
          <Card key={m.id} className={`border-border/50 shadow-sm transition-colors ${m.status === 'pendente' ? 'border-warning/30 bg-warning/5' : m.status === 'correcao' ? 'border-danger/30 bg-danger/5' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                    className="flex items-center gap-2"
                  >
                    {expanded === m.id ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{m.talhao?.nome ?? 'Talhão'}</p>
                        <span className="text-muted">•</span>
                        <p className="text-sm text-muted">{m.fazenda?.nome} ({m.cliente?.nome})</p>
                        <span className="text-muted">•</span>
                        <p className="text-xs text-muted">Safra {m.anoAgricola}/{m.anoAgricola + 1}</p>
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        Cultura: {m.cultura ?? '—'} | Prod.: {m.produtividade ?? '—'} {m.unidadeProd ?? ''}
                        {m.submetidoEm && ` | Submetido: ${new Date(m.submetidoEm).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  </button>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={m.status} />
                  {m.status === 'pendente' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="h-8 text-xs rounded-lg bg-success hover:bg-success/90 text-white"
                        onClick={() => handleAprovar(m.id)}
                      >
                        <CheckCircle2 size={13} className="mr-1" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs rounded-lg text-danger border-danger/30 hover:bg-danger/5"
                        onClick={() => setExpanded(m.id)}
                      >
                        <MessageCircle size={13} className="mr-1" /> Solicitar Correção
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            {expanded === m.id && (
              <CardContent className="pt-0 space-y-4">
                {/* Dados resumidos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm p-3 bg-background/60 rounded-xl">
                  <div><p className="text-xs text-muted">Plantio</p><p className="font-medium">{m.dataPlantio ? new Date(m.dataPlantio).toLocaleDateString('pt-BR') : '—'}</p></div>
                  <div><p className="text-xs text-muted">Colheita</p><p className="font-medium">{m.dataColheita ? new Date(m.dataColheita).toLocaleDateString('pt-BR') : '—'}</p></div>
                  <div><p className="text-xs text-muted">Resíduos</p><p className="font-medium">{m.residuosCampo ? 'Mantidos' : 'Removidos'} {m.queimaResiduos ? '(queima)' : ''}</p></div>
                  <div><p className="text-xs text-muted">Irrigação</p><p className="font-medium">{m.usaIrrigacao ? m.tipoIrrigacao : 'Não'}</p></div>
                </div>

                {m.fertilizantesSint && m.fertilizantesSint.length > 0 && (
                  <div className="text-sm">
                    <p className="text-xs font-medium text-muted mb-2">Fertilizantes Sintéticos</p>
                    <div className="flex flex-wrap gap-2">
                      {m.fertilizantesSint.map((f, i) => (
                        <span key={i} className="px-2 py-1 bg-accent/10 rounded-lg text-xs">
                          {f.tipo} — {f.qtdKgHa} kg/ha {f.usaInibidor ? '(inibidor)' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {m.operacoes && m.operacoes.length > 0 && (
                  <div className="text-sm">
                    <p className="text-xs font-medium text-muted mb-2">Operações Mecanizadas</p>
                    <div className="flex flex-wrap gap-2">
                      {m.operacoes.map((op, i) => (
                        <span key={i} className="px-2 py-1 bg-accent/10 rounded-lg text-xs">
                          {op.operacao} — {op.litros} L/ha {op.combustivel}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Correção existente */}
                {m.comentarioCorrecao && (
                  <div className="p-3 bg-danger/5 border border-danger/20 rounded-xl text-sm text-danger">
                    <p className="font-medium mb-1">Solicitação de correção enviada:</p>
                    <p>{m.comentarioCorrecao}</p>
                  </div>
                )}

                {/* Form de solicitação de correção */}
                {m.status === 'pendente' && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-medium text-foreground">Solicitar Correção ao Produtor</p>
                    <Textarea
                      placeholder="Descreva o que precisa ser corrigido ou complementado..."
                      value={correcaoTexto[m.id] ?? ''}
                      onChange={e => setCorrecaoTexto(prev => ({ ...prev, [m.id]: e.target.value }))}
                      rows={3}
                      className="rounded-xl resize-none text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 text-xs rounded-lg"
                        onClick={() => handleCorrecao(m.id)}
                      >
                        Enviar Solicitação
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
