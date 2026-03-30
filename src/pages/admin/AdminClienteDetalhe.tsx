import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/store/data'
import { ArrowLeft, Map, CheckCircle2, Clock, AlarmClock, Factory, ExternalLink } from 'lucide-react'
import type { MrvStatus } from '@/store/data'

function MrvStatusBadge({ status }: { status: MrvStatus }) {
  const cfg = {
    rascunho:  { label: 'Rascunho',      cls: 'bg-muted/20 text-muted-foreground' },
    pendente:  { label: 'Em Validação',  cls: 'bg-warning/10 text-warning' },
    aprovado:  { label: 'Aprovado',      cls: 'bg-success/10 text-success' },
    correcao:  { label: 'Correção',      cls: 'bg-danger/10 text-danger' },
  }[status]
  return <Badge variant="outline" className={`shadow-none text-xs ${cfg.cls}`}>{cfg.label}</Badge>
}

export default function AdminClienteDetalhe() {
  const { id } = useParams()
  const { clientes, fazendas, talhoes, manejo } = useDataStore()

  const cliente = clientes.find(c => c.id === id) ?? clientes[0]
  const fazenda = fazendas.find(f => f.produtorId === cliente?.id)
  const meusTalhoes = fazenda ? talhoes.filter(t => t.fazendaId === fazenda.id) : []

  if (!cliente) return <div className="text-center py-20 text-muted">Cliente não encontrado.</div>

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/admin/clientes"><ArrowLeft size={20} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{cliente.nome}</h1>
          <p className="text-sm text-muted">{cliente.email}</p>
        </div>
      </div>

      {/* Resumo fazenda */}
      {fazenda && (
        <Card className="border-border/50 shadow-sm bg-surface">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><Map size={18} className="text-primary" /> Propriedade: {fazenda.nome}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted mb-1">Município</p>
                <p className="font-medium">{fazenda.municipio}/{fazenda.estado}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Área Total</p>
                <p className="font-medium">{fazenda.areaTotalHa.toLocaleString('pt-BR')} ha</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Zona Climática</p>
                <p className="font-medium capitalize">{fazenda.zonaClimatica.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Status MRV</p>
                <p className="font-medium">{cliente.statusMRV}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Talhões */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4 flex-row items-center justify-between">
          <CardTitle className="text-lg">Talhões</CardTitle>
          <Button size="sm" variant="outline" asChild className="rounded-xl gap-2 h-8 text-xs">
            <Link to={`/admin/fazendas/${fazenda?.id}`}><ExternalLink size={12} /> Ver Fazenda Completa</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {meusTalhoes.map(t => {
              const ultimoManejo = manejo.filter(m => m.talhaoId === t.id).sort((a,b) => b.anoAgricola - a.anoAgricola)[0]
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{t.nome}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${t.tipo === 'projeto' ? 'bg-success/10 text-success border-success/20' : t.tipo === 'control_site' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/20 text-muted-foreground border-border/50'}`}>
                        {t.tipo === 'projeto' ? 'Projeto' : t.tipo === 'control_site' ? 'Controle' : 'Excluído'}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {t.areaHa} ha
                      {t.socPercent ? ` | SOC: ${t.socPercent}%` : ' | Solo: não cadastrado'}
                      {t.bdGCm3 ? ` | BD: ${t.bdGCm3} g/cm³` : ''}
                      {t.argilaPercent ? ` | Argila: ${t.argilaPercent}%` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {t.dadosValidados && <CheckCircle2 size={14} className="text-success" />}
                    {ultimoManejo && <MrvStatusBadge status={ultimoManejo.status} />}
                    {ultimoManejo?.status === 'pendente' && (
                      <Button size="sm" className="h-7 text-xs rounded-lg" asChild>
                        <Link to="/admin/validacao">Revisar</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
            {meusTalhoes.length === 0 && (
              <div className="text-center py-10 text-muted text-sm">Nenhum talhão cadastrado.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline MRV */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <CardTitle className="text-lg flex items-center gap-2"><AlarmClock size={18} className="text-primary" /> Histórico MRV</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {manejo
              .filter(m => meusTalhoes.some(t => t.id === m.talhaoId))
              .sort((a, b) => b.anoAgricola - a.anoAgricola)
              .map(m => {
                const talhao = meusTalhoes.find(t => t.id === m.talhaoId)
                return (
                  <div key={m.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/50 bg-surface/30">
                    <div>
                      <p className="text-sm font-medium">{talhao?.nome} | Safra {m.anoAgricola}/{m.anoAgricola+1}</p>
                      <p className="text-xs text-muted">
                        {m.cultura ? `Cultura: ${m.cultura}` : '—'}
                        {m.submetidoEm && ` | Submetido: ${new Date(m.submetidoEm).toLocaleDateString('pt-BR')}`}
                        {m.aprovadoEm  && ` | Aprovado: ${new Date(m.aprovadoEm).toLocaleDateString('pt-BR')}`}
                      </p>
                      {m.comentarioCorrecao && (
                        <p className="text-xs text-danger mt-1">{m.comentarioCorrecao}</p>
                      )}
                    </div>
                    <div className="ml-auto flex-shrink-0">
                      <MrvStatusBadge status={m.status} />
                    </div>
                  </div>
                )
              })}
            {manejo.filter(m => meusTalhoes.some(t => t.id === m.talhaoId)).length === 0 && (
              <p className="text-sm text-muted text-center py-6">Nenhum dado MRV registrado.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Motor */}
      {fazenda && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><Factory size={18} className="text-primary" /> Motor de Cálculos</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Status do Motor</p>
              <p className="font-semibold text-foreground">{cliente.motor}</p>
            </div>
            <Button asChild variant="outline" className="rounded-xl gap-2">
              <Link to={`/admin/motor/${fazenda.id}`}>Abrir Motor <ExternalLink size={14} /></Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
