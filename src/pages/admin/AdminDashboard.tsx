import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/store/data'
import {
  Users, Map, CheckCircle2, Clock, ArrowRight,
  Cpu, Building2, Settings
} from 'lucide-react'

export default function AdminDashboard() {
  const { leads, clientes, parceiros, controlSites, manejo, fazendas } = useDataStore()

  const leadsNovos = leads.filter(l => l.status === 'novo' || l.status === 'em_analise').length
  const mrvPendente = manejo.filter(m => m.status === 'pendente').length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel Administrador</h1>
          <p className="text-muted">Visão global da plataforma e gestão de auditoria.</p>
        </div>
        <Button asChild variant="outline" className="gap-2 rounded-xl">
          <Link to="/admin/parametros"><Settings size={16} /> Parâmetros globais</Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Clientes Ativos', value: clientes.length, sub: 'Produtores com MRV em andamento', Icon: Users, color: 'text-primary', bg: '' },
          { label: 'Parceiros', value: parceiros.filter(p=>p.status==='ativo').length, sub: 'Consultores com leads convertidos', Icon: Users, color: 'text-success', bg: 'bg-success/5 border-success/20' },
          { label: 'Control Sites', value: controlSites.length, sub: `${controlSites.filter(s=>s.similaridade<9).length} em alerta de similaridade`, Icon: Map, color: 'text-warning', bg: 'bg-warning/5 border-warning/20' },
          { label: 'Validação Pendente', value: mrvPendente, sub: 'Lotes MRV aguardando revisão', Icon: Clock, color: 'text-danger', bg: 'bg-danger/5 border-danger/20' },
        ].map(kpi => (
          <Card key={kpi.label} className={`border-border/50 shadow-sm bg-surface ${kpi.bg}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-muted font-medium">{kpi.label}</CardTitle>
              <kpi.Icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leads em análise */}
        <Card className="border-border/50 shadow-sm bg-surface">
          <CardHeader className="border-b bg-surface/50 pb-4 flex-row items-center justify-between">
            <CardTitle className="text-lg">Leads para Análise ({leadsNovos})</CardTitle>
            <Button variant="ghost" size="sm" className="rounded-lg cursor-default hover:bg-transparent">Ver todos <ArrowRight size={14} /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {leads.filter(l => l.status === 'novo' || l.status === 'em_analise').slice(0, 4).map(l => (
                <div key={l.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{l.nome}</p>
                    <p className="text-xs text-muted">{l.fazenda} — {l.area.toLocaleString('pt-BR')} ha — {l.data}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs shadow-none ${l.status === 'novo' ? 'bg-muted/20 text-muted-foreground' : 'bg-warning/10 text-warning border-warning/20'}`}>
                    {l.status === 'novo' ? 'Novo' : 'Em Análise'}
                  </Badge>
                </div>
              ))}
              {leadsNovos === 0 && <div className="text-center py-8 text-muted text-sm">Nenhum lead pendente.</div>}
            </div>
          </CardContent>
        </Card>

        {/* Fila de Validação MRV */}
        <Card className="border-border/50 shadow-sm bg-surface">
          <CardHeader className="border-b bg-surface/50 pb-4 flex-row items-center justify-between">
            <CardTitle className="text-lg">Fila de Validação MRV</CardTitle>
            <Button variant="ghost" size="sm" className="rounded-lg cursor-default hover:bg-transparent">Ver fila <ArrowRight size={14} /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {manejo.filter(m => m.status === 'pendente' || m.status === 'correcao').slice(0, 4).map(m => {
                const talhao = useDataStore.getState().talhoes.find(t => t.id === m.talhaoId)
                const fazenda = fazendas.find(f => f.id === talhao?.fazendaId)
                return (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{fazenda?.nome ?? 'Fazenda'}</p>
                      <p className="text-xs text-muted">{talhao?.nome} | Safra {m.anoAgricola}/{m.anoAgricola+1} | {m.cultura ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs shadow-none ${m.status === 'pendente' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                        {m.status === 'pendente' ? 'Aguardando' : 'Correção'}
                      </Badge>
                      <Button size="sm" asChild className="h-7 text-xs rounded-lg">
                        <Link to="/admin/validacao">Revisar</Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
              {manejo.filter(m => m.status === 'pendente' || m.status === 'correcao').length === 0 && (
                <div className="text-center py-8 text-muted text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} className="text-success" /> Fila limpa!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos Admin */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Gestão de Fazendas', desc: 'Cadastrar e editar talhões, dados de solo', icon: Building2, href: '/admin/fazendas', color: 'text-primary' },
          { label: 'Motor de Cálculos', desc: 'Executar RothC e QA3 por propriedade', icon: Cpu, href: '/admin/motor/f1', color: 'text-warning' },
          { label: 'Parâmetros Globais', desc: 'PTAX, preço VCU, taxas e fatores globais', icon: Settings, href: '/admin/parametros', color: 'text-success' },
        ].map(card => (
          <Card key={card.label} className="border-border/50 shadow-sm hover:border-primary/30 transition-colors bg-surface">
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`h-10 w-10 rounded-xl bg-background flex items-center justify-center flex-shrink-0`}>
                <card.icon size={20} className={card.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{card.label}</p>
                <p className="text-xs text-muted mt-0.5">{card.desc}</p>
              </div>
              <Button size="sm" variant="ghost" asChild className="rounded-lg h-8 shrink-0">
                <Link to={card.href}><ArrowRight size={14} /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
