import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { useDataStore } from '@/store/data'
import { Leaf, MapPin, ArrowRight, AlertCircle, TrendingUp, ClipboardList, FlaskConical, CheckCircle2, BadgeDollarSign, Beaker, Layers, PartyPopper, ChevronRight, Zap } from 'lucide-react'
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
  const [hoveredTalhaoId, setHoveredTalhaoId] = useState<string | null>(null)

  const userClient = clientes.find(c => c.userId === user?.id) ?? clientes[0]
  const fazenda = fazendas.find(f => f.produtorId === userClient?.id) ?? fazendas[0]
  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazenda?.id)

  // Check for empty state: no farm data or no talhões
  const isEmpty = !fazenda || meusTalhoes.length === 0

  type Alerta = {
    tipo: 'warning' | 'danger' | 'info'
    title: string
    items: string[]
    moreCount?: number
    link?: string
  }

  // Alertas dinâmicos
  const alertas = useMemo<Alerta[]>(() => {
    if (isEmpty) return []
    const list: Alerta[] = []

    const talhoeSemSolo = meusTalhoes.filter(t => !t.socPercent && t.tipo === 'projeto')
    if (talhoeSemSolo.length) {
      list.push({
        tipo: 'warning',
        title: 'Dados de solo pendentes',
        items: talhoeSemSolo.slice(0, 3).map(t => `${t.nome}: SOC não informado`),
        moreCount: Math.max(0, talhoeSemSolo.length - 3),
      })
    }

    const semManejo = meusTalhoes.filter(t => t.tipo === 'projeto' && !manejo.some(m => m.talhaoId === t.id))
    if (semManejo.length) {
      list.push({
        tipo: 'danger',
        title: `${semManejo.length} talhão(ões) sem dados MRV`,
        items: semManejo.slice(0, 3).map(t => `${t.nome}: nenhum dado de manejo registrado`),
        moreCount: Math.max(0, semManejo.length - 3),
        link: '/dashboard/mrv',
      })
    }

    const correcoes = manejo.filter(m => m.status === 'correcao' && meusTalhoes.some(t => t.id === m.talhaoId))
    if (correcoes.length) {
      const items = correcoes.map(m => {
        const t = meusTalhoes.find(x => x.id === m.talhaoId)
        return m.comentarioCorrecao
          ? `${t?.nome ?? 'Talhão'}: ${m.comentarioCorrecao}`
          : `${t?.nome ?? 'Talhão'}: revisar dados de manejo`
      })
      list.push({
        tipo: 'danger',
        title: `${correcoes.length} talhão(ões) com correção solicitada`,
        items: items.slice(0, 3),
        moreCount: Math.max(0, items.length - 3),
        link: '/dashboard/mrv',
      })
    }

    return list
  }, [meusTalhoes, manejo, isEmpty])

  const nextAction = useMemo(() => {
    if (isEmpty) return null
    const projetoTalhoes = meusTalhoes.filter(t => t.tipo === 'projeto')
    const meuManejo = manejo.filter(m => projetoTalhoes.some(t => t.id === m.talhaoId))

    const comCorrecao = meuManejo.filter(m => m.status === 'correcao')
    if (comCorrecao.length > 0) return {
      icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/5 border-danger/20',
      label: `${comCorrecao.length} talhão(ões) precisam de correção`,
      desc: 'O time solicitou ajustes nos dados de manejo.',
      link: '/dashboard/mrv', cta: 'Corrigir agora →',
    }

    const semManejo = projetoTalhoes.filter(t => !meuManejo.some(m => m.talhaoId === t.id))
    if (semManejo.length > 0) return {
      icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/5 border-primary/20',
      label: `Preencher manejo de ${semManejo.length} talhão(ões)`,
      desc: `${semManejo.map(t => t.nome).slice(0, 2).join(', ')}${semManejo.length > 2 ? ` e mais ${semManejo.length - 2}` : ''} sem dados registrados.`,
      link: '/dashboard/mrv', cta: 'Ir para MRV →',
    }

    const emRascunho = meuManejo.filter(m => m.status === 'rascunho')
    if (emRascunho.length > 0) return {
      icon: ArrowRight, color: 'text-warning', bg: 'bg-warning/5 border-warning/20',
      label: `${emRascunho.length} talhão(ões) com rascunho pendente`,
      desc: 'Revise e submeta para validação.',
      link: '/dashboard/mrv', cta: 'Submeter manejo →',
    }

    const emPendente = meuManejo.filter(m => m.status === 'pendente')
    if (emPendente.length > 0) return {
      icon: FlaskConical, color: 'text-muted-foreground', bg: 'bg-muted/5 border-border',
      label: 'Manejo em validação',
      desc: 'O time Venture Carbon está revisando seus dados.',
      link: '/dashboard/mrv', cta: 'Acompanhar →',
    }

    const todosAprovados = projetoTalhoes.length > 0 && projetoTalhoes.every(t => meuManejo.some(m => m.talhaoId === t.id && m.status === 'aprovado'))
    if (todosAprovados) return {
      icon: CheckCircle2, color: 'text-success', bg: 'bg-success/5 border-success/20',
      label: 'Tudo aprovado! Veja seus resultados',
      desc: 'Créditos calculados e disponíveis para visualização.',
      link: '/dashboard/resultados', cta: 'Ver resultados →',
    }

    return null
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

  // ─── Empty State (aprovado mas sem talhões) ──────────────────
  if (isEmpty) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Olá, {user?.name ?? 'Produtor'}! 🎉</h1>
          <p className="text-muted">Seu cadastro foi aprovado. Complete o processo para começar a gerar créditos.</p>
        </div>

        {/* Banner pós-aprovação */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-success/5 shadow-sm">
          <CardContent className="py-10 flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center">
              <PartyPopper size={32} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Cadastro Aprovado!</h2>
              <p className="text-sm text-muted max-w-md">
                Parabéns! Sua propriedade foi analisada e aprovada pela Venture Carbon.
                O próximo passo é cadastrar os <strong className="text-foreground">talhões da sua fazenda</strong> e informar os dados de manejo para iniciar o monitoramento.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 w-full max-w-lg text-left">
              {[
                { n: '1', label: 'Área da Fazenda', desc: 'Faça upload do KML ou demarque no mapa', icon: MapPin },
                { n: '2', label: 'Cadastre os Talhões', desc: 'Demarque cada talhão individualmente', icon: Layers },
                { n: '3', label: 'Informe o Manejo', desc: 'Culturas e práticas por talhão', icon: Leaf },
              ].map(step => (
                <div key={step.n} className="bg-background/60 border border-border/50 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{step.n}</span>
                    <step.icon size={13} className="text-primary" />
                    <span className="text-xs font-bold text-foreground">{step.label}</span>
                  </div>
                  <p className="text-[11px] text-muted">{step.desc}</p>
                </div>
              ))}
            </div>
            <Button className="gap-2 h-12 px-8 rounded-xl text-base bg-primary" onClick={() => navigate('/dashboard/mrv')}>
              <Layers size={18} /> Ir para o MRV
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

      {/* O que fazer agora */}
      {nextAction && (() => {
        const { icon: Icon, color, bg, label, desc, link, cta } = nextAction
        return (
          <div className={`rounded-xl border ${bg} p-4 flex items-center gap-4`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon size={20} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${color}`}>{label}</p>
              <p className="text-xs text-muted mt-0.5 truncate">{desc}</p>
            </div>
            <button
              onClick={() => navigate(link)}
              className={`shrink-0 text-xs font-semibold ${color} hover:underline flex items-center gap-1`}
            >
              {cta}
            </button>
          </div>
        )
      })()}

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((a, i) => {
            const isDanger = a.tipo === 'danger'
            return (
              <div key={i} className={`rounded-xl border text-sm overflow-hidden ${isDanger ? 'bg-danger/5 border-danger/20' : 'bg-warning/5 border-warning/20'}`}>
                <div className={`flex items-start gap-3 p-4 border-l-4 ${isDanger ? 'border-l-danger' : 'border-l-warning'}`}>
                  <AlertCircle size={16} className={`flex-shrink-0 mt-0.5 ${isDanger ? 'text-danger' : 'text-warning'}`} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={`font-semibold ${isDanger ? 'text-danger' : 'text-warning'}`}>{a.title}</p>
                    <ul className="space-y-0.5">
                      {a.items.map((item, j) => (
                        <li key={j} className={`text-xs ${isDanger ? 'text-danger/80' : 'text-warning/80'}`}>• {item}</li>
                      ))}
                    </ul>
                    {(a.moreCount ?? 0) > 0 && (
                      <p className={`text-xs ${isDanger ? 'text-danger/60' : 'text-warning/60'}`}>e mais {a.moreCount}...</p>
                    )}
                  </div>
                  {a.link && (
                    <Link to={a.link} className={`flex items-center gap-1 text-xs font-semibold shrink-0 hover:underline ${isDanger ? 'text-danger' : 'text-warning'}`}>
                      Ver no MRV <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Banner talhões pendentes */}
      {meusTalhoes.filter(t => t.tipo === 'projeto').length === 0 && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Layers size={20} className="text-primary shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">Cadastre seus talhões para iniciar o monitoramento</p>
                <p className="text-xs text-muted">Demarque as áreas de cada talhão e informe o manejo para gerar seus créditos de carbono.</p>
              </div>
            </div>
            <Button size="sm" className="rounded-xl gap-2 shrink-0" onClick={() => navigate('/dashboard/mrv')}>
              <Layers size={14} /> Cadastrar Talhões
            </Button>
          </CardContent>
        </Card>
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
            highlightTalhaoId={hoveredTalhaoId ?? undefined}
            onTalhaoClick={(talhaoId: string) => navigate('/dashboard/mrv', { state: { talhaoId } })}
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
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-accent/5 cursor-default"
                    onMouseEnter={() => setHoveredTalhaoId(t.id)}
                    onMouseLeave={() => setHoveredTalhaoId(null)}
                  >
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
