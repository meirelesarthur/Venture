import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { useDataStore } from '@/store/data'
import { Leaf, MapPin, ArrowRight, AlertCircle, TrendingUp, ClipboardList, FlaskConical, CheckCircle2, BadgeDollarSign, Beaker } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import FazendaMap from '@/components/maps/FazendaMap'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

// Fases do projeto
const PROJECT_PHASES = [
  { id: 'baseline',       label: 'Baseline / Coleta de Solo', Icon: Beaker },
  { id: 'monitoramento',  label: 'Monitoramento do Manejo',   Icon: ClipboardList },
  { id: 'validacao',      label: 'Validação',                 Icon: FlaskConical },
  { id: 'emissao',        label: 'Emissão dos Créditos',      Icon: CheckCircle2 },
  { id: 'venda',          label: 'Venda',                     Icon: BadgeDollarSign },
]

function getProjectPhase(statusMRV: string): number {
  switch (statusMRV) {
    case 'Aberto': return 0
    case 'Em submissão': return 1
    case 'Em Validação': return 2
    case 'Auditoria Aprovada': return 3
    default: return 0
  }
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { clientes, talhoes, manejo, fazendas } = useDataStore()
  const navigate = useNavigate()

  const userClient = clientes.find(c => c.userId === user?.id) ?? clientes[0]
  const fazenda = fazendas.find(f => f.produtorId === userClient?.id) ?? fazendas[0]
  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazenda?.id)

  // Check for empty state: no farm data or no talhões
  const isEmpty = !fazenda || meusTalhoes.length === 0

  // Alertas dinâmicos
  const alertas = useMemo(() => {
    if (isEmpty) return []
    const list: { text: string; tipo: 'warning' | 'danger' | 'info' }[] = []
    const talhoeSemSolo = meusTalhoes.find(t => !t.socPercent && t.tipo === 'projeto')
    if (talhoeSemSolo) list.push({ text: `Dados de solo do ${talhoeSemSolo.nome} não cadastrados.`, tipo: 'warning' })
    const semManejo = meusTalhoes.filter(t => t.tipo === 'projeto' && !manejo.some(m => m.talhaoId === t.id))
    if (semManejo.length) list.push({ text: `${semManejo.length} talhão(ões) sem dados MRV da safra atual.`, tipo: 'danger' })
    const correcao = manejo.find(m => m.status === 'correcao')
    if (correcao) list.push({ text: 'Correção solicitada pelo admin. Acesse o MRV para revisar.', tipo: 'danger' })
    return list
  }, [meusTalhoes, manejo, isEmpty])

  // Dados gráfico de projeção
  const chartData = useMemo(() => {
    const area = fazenda?.areaTotalHa ?? 1200
    const results = []
    for (let ano = 2026; ano <= 2035; ano++) {
      const vcus = Math.round(area * 1.05 * (ano === 2026 ? 0 : 1))
      results.push({ ano: String(ano), vcus, receita: vcus > 0 ? vcus * 20 * 5.65 : 0 })
    }
    return results
  }, [fazenda])

  const totalVcus  = chartData.reduce((a, c) => a + c.vcus, 0)
  const totalBRL   = chartData.reduce((a, c) => a + c.receita, 0)

  const statusLabel: Record<string,{ label: string; cls: string }> = {
    'Aberto':           { label: 'Em Configuração',  cls: 'bg-muted/20 text-muted-foreground' },
    'Em submissão':     { label: 'Em Submissão MRV', cls: 'bg-warning/10 text-warning' },
    'Em Validação':     { label: 'Em Validação',     cls: 'bg-primary/10 text-primary' },
    'Auditoria Aprovada': { label: 'Auditoria OK ✓', cls: 'bg-success/10 text-success' },
  }
  const st = statusLabel[userClient?.statusMRV ?? 'Aberto']

  const currentPhase = getProjectPhase(userClient?.statusMRV ?? 'Aberto')

  // ─── Empty State ────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Olá, {user?.name ?? 'Produtor'}</h1>
          <p className="text-muted">Bem-vindo à plataforma Venture Carbon.</p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <ClipboardList size={36} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Configure seu Projeto</h2>
            <p className="text-muted max-w-md mb-2">
              Para iniciarmos seu projeto de créditos de carbono, precisamos dos dados da sua propriedade.
              Preencha as informações abaixo e nossa equipe irá analisar e aprovar o cadastro.
            </p>
            <p className="text-xs text-muted-foreground mb-8">
              Após o preenchimento, você receberá uma notificação assim que o projeto for aprovado.
            </p>
            <Button className="gap-2 h-12 px-8 rounded-xl text-base" onClick={() => navigate('/dashboard/perfil')}>
              <Leaf size={18} />
              Preencher Dados do Projeto
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Dashboard Normal ────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Olá, {user?.name ?? userClient?.nome}</h1>
          <p className="text-muted">Fazenda: {fazenda?.nome} — {fazenda?.areaTotalHa?.toLocaleString('pt-BR')} ha | {fazenda?.municipio}/{fazenda?.estado}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={st.cls}>{st.label}</Badge>
          <Button asChild className="gap-2">
            <Link to="/dashboard/mrv">Abrir MRV <ArrowRight size={16} /></Link>
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${a.tipo === 'danger' ? 'bg-danger/5 border-danger/20 text-danger' : 'bg-warning/5 border-warning/20 text-warning'}`}>
              <AlertCircle size={16} className="flex-shrink-0" />
              {a.text}
            </div>
          ))}
        </div>
      )}

      {/* Nova Barra de Progresso do Projeto (fases) */}
      <Card className="border-border/50 shadow-sm bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Progresso do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-0">
            {PROJECT_PHASES.map((phase, i) => {
              const isDone = i < currentPhase
              const isCurrent = i === currentPhase
              const isLast = i === PROJECT_PHASES.length - 1
              return (
                <div key={phase.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                      isDone ? 'bg-success text-white shadow-sm' :
                      isCurrent ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      <phase.Icon size={18} />
                    </div>
                    <p className={`text-[11px] text-center leading-tight max-w-[90px] ${
                      isDone ? 'text-success font-medium' :
                      isCurrent ? 'text-primary font-semibold' :
                      'text-muted-foreground'
                    }`}>
                      {phase.label}
                    </p>
                  </div>
                  {/* Connector line */}
                  {!isLast && (
                    <div className={`h-0.5 w-full mx-1 rounded-full mt-[-18px] ${
                      isDone ? 'bg-success' : 'bg-border'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mapa da fazenda */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <FazendaMap
            talhoes={meusTalhoes}
            height="360px"
            onTalhaoClick={(talhaoId) => navigate('/dashboard/mrv', { state: { talhaoId } })}
          />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Talhões */}
        <Card className="md:col-span-2 border-border/50 shadow-sm bg-surface">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><Leaf className="text-primary" /> Talhões do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {meusTalhoes.map(t => {
                const m = manejo.find(mx => mx.talhaoId === t.id)
                const tipoColor = t.tipo === 'projeto' ? 'bg-success/10 text-success border-success/20' : t.tipo === 'control_site' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/20 text-muted-foreground border-border/50'
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.nome}</p>
                      <p className="text-xs text-muted">{t.areaHa} ha {t.socPercent ? `| SOC ${t.socPercent}%` : '| Solo: sem dados'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs shadow-none ${tipoColor}`}>
                        {t.tipo === 'projeto' ? 'Projeto' : t.tipo === 'control_site' ? 'Controle' : 'Excluído'}
                      </Badge>
                      {m && m.status !== 'rascunho' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${m.status === 'aprovado' ? 'bg-success/10 text-success border-success/20' : m.status === 'pendente' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                          {m.status === 'aprovado' ? '✓ Aprovado' : m.status === 'pendente' ? '⏳ Revisão' : '⚠ Correção'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="p-4 border-t">
              <Button size="sm" variant="outline" asChild className="rounded-xl gap-2">
                <Link to="/dashboard/mrv"><MapPin size={14} /> Gerenciar MRV</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projeção financeira */}
        <Card className="border-success/20 shadow-sm bg-success/5">
          <CardHeader>
            <CardTitle className="text-base text-success flex items-center gap-2"><TrendingUp size={18} /> Projeção Financeira</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs text-success/80 mb-1">VCUs Projetados (10 anos)</p>
              <p className="text-3xl font-bold text-success">{totalVcus.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-success/70">tCO₂e elegíveis</p>
            </div>
            <div className="border-t border-success/20 pt-4">
              <p className="text-xs text-success/80 mb-1">Receita Bruta Estimada</p>
              <p className="text-xl font-bold text-success">{brl(totalBRL)}</p>
              <p className="text-xs text-success/60 mt-1">@ US$ 20,00 / VCU | PTAX R$ 5,65</p>
            </div>
            <Button className="w-full bg-success hover:bg-success/90 text-white rounded-xl" asChild>
              <Link to="/dashboard/resultados">Ver Detalhes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de projeção */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <CardTitle className="text-lg">Projeção de Créditos (VCUs/ano)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorVcus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="ano" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={v => `${v.toLocaleString('pt-BR')}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
                  formatter={(v: any) => [`${v.toLocaleString('pt-BR')} VCUs`, 'Créditos']}
                />
                <Area type="monotone" dataKey="vcus" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#colorVcus)" dot={{ r: 4, fill: 'var(--color-primary)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted text-center mt-2">* Projeção estimada. Sujeito a aprovação do Motor de Cálculos (RothC + IPCC).</p>
        </CardContent>
      </Card>
    </div>
  )
}
