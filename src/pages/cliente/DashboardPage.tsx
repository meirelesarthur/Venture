import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { useDataStore } from '@/store/data'
import { Leaf, MapPin, ArrowRight, AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import FazendaMap from '@/components/maps/FazendaMap'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { clientes, talhoes, manejo, fazendas } = useDataStore()
  const navigate = useNavigate()

  const userClient = clientes.find(c => c.userId === user?.id) ?? clientes[0]
  const fazenda = fazendas.find(f => f.produtorId === userClient?.id) ?? fazendas[0]
  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazenda?.id)

  // Progresso MRV
  const mrvProgress = useMemo(() => {
    const aprovados = manejo.filter(m => m.talhaoId === meusTalhoes[0]?.id && m.status === 'aprovado').length
    const total = 5
    const percent = Math.min(100, Math.round((aprovados / total) * 100))
    return { percent, aprovados, total }
  }, [manejo, meusTalhoes])

  // Alertas dinâmicos
  const alertas = useMemo(() => {
    const list: { text: string; tipo: 'warning' | 'danger' | 'info' }[] = []
    const talhoeSemSolo = meusTalhoes.find(t => !t.socPercent && t.tipo === 'projeto')
    if (talhoeSemSolo) list.push({ text: `Dados de solo do ${talhoeSemSolo.nome} não cadastrados.`, tipo: 'warning' })
    const semManejo = meusTalhoes.filter(t => t.tipo === 'projeto' && !manejo.some(m => m.talhaoId === t.id))
    if (semManejo.length) list.push({ text: `${semManejo.length} talhão(ões) sem dados MRV da safra atual.`, tipo: 'danger' })
    const correcao = manejo.find(m => m.status === 'correcao')
    if (correcao) list.push({ text: 'Correção solicitada pelo admin. Acesse o MRV para revisar.', tipo: 'danger' })
    return list
  }, [meusTalhoes, manejo])

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

      {/* Progresso MRV */}
      <Card className="border-border/50 shadow-sm bg-surface">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">Progresso MRV — Safra 2025/26</CardTitle>
            <span className="text-sm text-muted">{mrvProgress.percent}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${mrvProgress.percent}%` }}
            />
          </div>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {['Lavoura','Pecuária','Fertilização','Operacional','Documentos'].map((step, i) => {
              const hasDone = mrvProgress.aprovados > i
              const hasPending = manejo.some(m => m.talhaoId === meusTalhoes[0]?.id && m.status === 'pendente')
              return (
                <div key={step} className="space-y-1">
                  <div className={`mx-auto h-6 w-6 rounded-full flex items-center justify-center ${hasDone ? 'bg-success text-white' : hasPending ? 'bg-warning/20 text-warning' : 'bg-secondary text-muted-foreground'}`}>
                    {hasDone ? <CheckCircle2 size={14} /> : hasPending ? <Clock size={12} /> : <span className="text-xs">{i+1}</span>}
                  </div>
                  <p className="text-muted-foreground">{step}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mapa da fazenda (2ª linha) */}
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
                      {m && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${m.status === 'aprovado' ? 'bg-success/10 text-success border-success/20' : m.status === 'pendente' ? 'bg-warning/10 text-warning border-warning/20' : m.status === 'correcao' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-muted/10 text-muted border-border/50'}`}>
                          {m.status === 'aprovado' ? '✓ Aprovado' : m.status === 'pendente' ? '⏳ Revisão' : m.status === 'correcao' ? '⚠ Correção' : 'Rascunho'}
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
