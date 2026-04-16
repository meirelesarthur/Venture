import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDataStore } from '@/store/data'
import { History, Filter, ChevronDown, ChevronRight } from 'lucide-react'

// ─── Formatação ───────────────────────────────────────────────────────────────

function fmtTs(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC'
}

function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não'
  if (typeof v === 'number') return String(v)
  return String(v)
}

// ─── Card de evento individual ────────────────────────────────────────────────

function EventoCard({ evento }: { evento: ReturnType<typeof useDataStore.getState>['historicoFazendas'][0] }) {
  const [open, setOpen] = useState(false)

  const badgeCls = evento.tipoAtor === 'venture_carbon'
    ? 'bg-primary/10 text-primary border-primary/20'
    : 'bg-success/10 text-success border-success/20'

  const badgeLabel = evento.tipoAtor === 'venture_carbon' ? 'Venture Carbon' : 'Cliente'

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden">
      <button
        className="flex items-center justify-between w-full px-4 py-3 bg-surface/30 hover:bg-accent/5 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] shrink-0 shadow-none ${badgeCls}`}>
                {badgeLabel}
              </Badge>
              <span className="text-sm font-semibold text-foreground truncate">{evento.usuarioNome}</span>
              <span className="text-xs text-muted">
                {evento.camposAlterados.length} campo{evento.camposAlterados.length !== 1 ? 's' : ''} alterado{evento.camposAlterados.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5 font-mono">{fmtTs(evento.timestampUtc)}</p>
          </div>
        </div>
        {evento.observacao && (
          <span className="text-[11px] text-muted italic max-w-[200px] truncate shrink-0 ml-2">
            "{evento.observacao}"
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-border/30 animate-in fade-in duration-150">
          {/* Tabela de campos alterados */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-accent/5">
                  <th className="text-left p-2.5 font-medium text-muted">Campo</th>
                  <th className="text-left p-2.5 font-medium text-muted">Valor Anterior</th>
                  <th className="text-left p-2.5 font-medium text-muted">Valor Novo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {evento.camposAlterados.map((c, i) => (
                  <tr key={i} className="hover:bg-accent/5">
                    <td className="p-2.5 font-mono text-primary/80">{c.campo}</td>
                    <td className="p-2.5 text-danger/80 line-through">{fmtVal(c.valorAnterior)}</td>
                    <td className="p-2.5 text-success font-semibold">{fmtVal(c.valorNovo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Metadados */}
          <div className="px-4 py-2.5 bg-background/40 border-t border-border/20 flex flex-wrap gap-4 text-[11px] text-muted">
            <span>ID usuário: <span className="font-mono text-foreground">{evento.usuarioId}</span></span>
            <span>Evento ID: <span className="font-mono text-foreground">{evento.id}</span></span>
            {evento.observacao && (
              <span>Observação: <span className="text-foreground italic">"{evento.observacao}"</span></span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AdminHistoricoTab({ fazendaId }: { fazendaId: string }) {
  const { historicoFazendas, talhoes } = useDataStore()

  // Todos os eventos desta fazenda (já vêm em ordem inversa do store)
  const todoEventos = historicoFazendas.filter(e => e.fazendaId === fazendaId)

  // Lista de campos únicos alterados (para o filtro)
  const camposDisponiveis = useMemo(() => {
    const set = new Set<string>()
    todoEventos.forEach(e => e.camposAlterados.forEach(c => set.add(c.campo)))
    return Array.from(set).sort()
  }, [todoEventos])

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [filtroAtor, setFiltroAtor] = useState<'todos' | 'venture_carbon' | 'cliente'>('todos')
  const [filtroCampo, setFiltroCampo] = useState('todos')
  const [filtroFrom, setFiltroFrom] = useState('')
  const [filtroTo, setFiltroTo] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)

  const eventosFiltrados = useMemo(() => {
    return todoEventos.filter(e => {
      if (filtroAtor !== 'todos' && e.tipoAtor !== filtroAtor) return false
      if (filtroCampo !== 'todos' && !e.camposAlterados.some(c => c.campo === filtroCampo)) return false
      if (filtroFrom) {
        const from = new Date(filtroFrom).getTime()
        if (new Date(e.timestampUtc).getTime() < from) return false
      }
      if (filtroTo) {
        const to = new Date(filtroTo).getTime() + 86400000 // inclui o dia inteiro
        if (new Date(e.timestampUtc).getTime() > to) return false
      }
      return true
    })
  }, [todoEventos, filtroAtor, filtroCampo, filtroFrom, filtroTo])

  const limparFiltros = () => {
    setFiltroAtor('todos')
    setFiltroCampo('todos')
    setFiltroFrom('')
    setFiltroTo('')
  }

  const temFiltroAtivo = filtroAtor !== 'todos' || filtroCampo !== 'todos' || filtroFrom || filtroTo

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History size={20} className="text-primary" />
            Histórico de Alterações
          </h2>
          <p className="text-muted text-sm mt-0.5">
            Registro append-only de todas as alterações da fazenda. Nenhum evento pode ser editado ou excluído.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {temFiltroAtivo && (
            <Button variant="ghost" size="sm" onClick={limparFiltros} className="text-xs text-muted">
              Limpar filtros
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 rounded-xl ${showFiltros ? 'border-primary text-primary' : ''}`}
            onClick={() => setShowFiltros(!showFiltros)}
          >
            <Filter size={14} />
            Filtros
            {temFiltroAtivo && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 shadow-none ml-1">
                {[filtroAtor !== 'todos', filtroCampo !== 'todos', !!filtroFrom, !!filtroTo].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Painel de filtros */}
      {showFiltros && (
        <Card className="border-primary/20 bg-primary/3">
          <CardContent className="pt-4">
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Ator</Label>
                <Select value={filtroAtor} onValueChange={(v: any) => setFiltroAtor(v)}>
                  <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="venture_carbon">Venture Carbon</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Campo Alterado</Label>
                <Select value={filtroCampo} onValueChange={setFiltroCampo}>
                  <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os campos</SelectItem>
                    {camposDisponiveis.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">De (data)</Label>
                <Input
                  type="date"
                  value={filtroFrom}
                  onChange={e => setFiltroFrom(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Até (data)</Label>
                <Input
                  type="date"
                  value={filtroTo}
                  onChange={e => setFiltroTo(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contagem de resultados */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="font-semibold text-foreground">{eventosFiltrados.length}</span>
        {eventosFiltrados.length !== todoEventos.length && (
          <span>de {todoEventos.length} eventos</span>
        )}
        {eventosFiltrados.length === todoEventos.length && (
          <span>eventos registrados</span>
        )}
        <span>· ordem cronológica inversa</span>
      </div>

      {/* Lista de eventos */}
      <div className="space-y-2">
        {eventosFiltrados.length === 0 ? (
          <Card className="border-border/40">
            <CardContent className="py-12 text-center">
              <History size={32} className="mx-auto mb-3 text-muted opacity-30" />
              <p className="text-muted text-sm">
                {todoEventos.length === 0
                  ? 'Nenhuma alteração registrada para esta fazenda.'
                  : 'Nenhum evento corresponde aos filtros aplicados.'}
              </p>
              {temFiltroAtivo && (
                <Button variant="ghost" size="sm" onClick={limparFiltros} className="mt-3 text-xs">
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          eventosFiltrados.map(evento => (
            <EventoCard key={evento.id} evento={evento} />
          ))
        )}
      </div>

      {/* Nota sobre endpoint REST */}
      <Card className="border-border/30 bg-accent/3">
        <CardContent className="py-3 px-4">
          <p className="text-[11px] text-muted font-mono">
            <span className="text-primary font-semibold">GET</span>{' '}
            /api/farms/{fazendaId}/history
            {filtroFrom && `?from=${filtroFrom}`}
            {filtroTo && `&to=${filtroTo}`}
            {filtroAtor !== 'todos' && `&actor_type=${filtroAtor}`}
            {filtroCampo !== 'todos' && `&field=${encodeURIComponent(filtroCampo)}`}
            {' '}· paginado · append-only · imutável
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
