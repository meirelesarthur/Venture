import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/store/data'
import { useAuthStore } from '@/store/auth'
import { Users, Map, DollarSign, Trophy, TrendingUp, ArrowRight, Eye, EyeOff, HelpCircle, Star } from 'lucide-react'

export default function ParceiroDashboard() {
  const { leads, comissoes, parceiros } = useDataStore()
  const { user } = useAuthStore()
  const [showValues, setShowValues] = useState(false)

  // Para o parceiro mock (carlos-1 = parceiro-1 = p1)
  const parceiroId = 'p1'
  const parceiroAtual = parceiros.find(p => p.id === parceiroId)
  const comissaoPercentual = parceiroAtual?.comissaoPercentual ?? 100

  const meusLeads = leads.filter(l => l.parceiroId === parceiroId)
  const minhasComissoes = comissoes.filter(c => c.parceiroId === parceiroId)
  const totalPago = minhasComissoes.filter(c => c.status === 'pago').reduce((a, c) => a + c.valor, 0)
  const totalProjetado = minhasComissoes.filter(c => c.status === 'projetado').reduce((a, c) => a + c.valor, 0)
  const hectares = meusLeads.filter(l => l.status !== 'recusado').reduce((a, l) => a + l.area, 0)
  const convertidos = meusLeads.filter(l => l.status === 'contratado' || l.status === 'efetivado').length

  // Ranking mock — parceiro no pos 1
  const ranking = parceiros
    .map(p => ({ ...p, score: p.hectaresCarteira ?? 0 }))
    .sort((a, b) => b.score - a.score)
  const myPos = ranking.findIndex(p => p.id === parceiroId) + 1

  const NIVEIS = [
    { nome: 'Bronze',  min: 0,     max: 5000,  color: 'text-yellow-700',  bg: 'bg-yellow-700/10 border-yellow-700/20' },
    { nome: 'Prata',   min: 5000,  max: 15000, color: 'text-gray-400',    bg: 'bg-gray-400/10 border-gray-400/20' },
    { nome: 'Ouro',    min: 15000, max: 40000, color: 'text-yellow-500',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { nome: 'Platina', min: 40000, max: 99999, color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/20' },
  ]
  const nivelAtual = NIVEIS.findLast(n => hectares >= n.min) ?? NIVEIS[0]
  const proximoNivel = NIVEIS[NIVEIS.indexOf(nivelAtual) + 1]
  const progressoNivel = proximoNivel
    ? Math.min(100, ((hectares - nivelAtual.min) / (proximoNivel.min - nivelAtual.min)) * 100)
    : 100

  const formatValue = (n: number) => {
    if (!showValues) return 'R$ ••••••'
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel do Parceiro</h1>
          <p className="text-muted">Bem-vindo, {user?.name}. Desempenho da sua carteira.</p>
        </div>
        <Button asChild className="gap-2 rounded-xl">
          <Link to="/parceiro/leads/novo"><Users size={16} /> Indicar Produtor</Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Leads', value: meusLeads.length, sub: `${convertidos} convertidos`, Icon: Users, color: 'text-primary', bg: '' },
          { label: 'Hectares na Carteira', value: `${hectares.toLocaleString('pt-BR')} ha`, sub: 'Leads ativos/aprovados', Icon: Map, color: 'text-warning', bg: '' },
          { label: 'Comissão Realizada', value: formatValue(totalPago), sub: 'Ano 0 pago', Icon: DollarSign, color: 'text-success', bg: 'bg-success/5 border-success/20' },
          { label: 'Seu Ranking', value: `${myPos}º lugar`, sub: 'Entre todos parceiros', Icon: Trophy, color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
        ].map(kpi => (
          <Card key={kpi.label} className={`border-border/50 shadow-sm bg-surface ${kpi.bg}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted">{kpi.label}</CardTitle>
              <kpi.Icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Nível + tabela de níveis compacta */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Seu Nível: <span className={nivelAtual.color}>{nivelAtual.nome}</span></CardTitle>
              {/* Tabela de níveis compacta inline */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors">
                  <HelpCircle size={14} /> Níveis
                </button>
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-border rounded-xl shadow-lg p-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <p className="text-xs font-medium text-foreground mb-2">Tabela de Níveis</p>
                  <div className="space-y-1.5">
                    {NIVEIS.map(n => (
                      <div key={n.nome} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs ${n.bg}`}>
                        <div className="flex items-center gap-1.5">
                          <Star size={10} className={n.color} />
                          <span className={`font-semibold ${n.color}`}>{n.nome}</span>
                        </div>
                        <span className="text-muted-foreground">{n.min.toLocaleString('pt-BR')} – {n.max.toLocaleString('pt-BR')} ha</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted mt-2">Nível Prata+ desbloqueiam bônus de +20% na comissão.</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {proximoNivel ? (
              <>
                <p className="text-sm text-muted">
                  Alcance <strong>{proximoNivel.min.toLocaleString('pt-BR')} ha</strong> para subir para <strong className={NIVEIS[NIVEIS.indexOf(nivelAtual)+1]?.color}>{proximoNivel.nome}</strong> e desbloquear bônus de +20%.
                </p>
                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-2.5 rounded-full transition-all duration-700" style={{ width: `${progressoNivel}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>{hectares.toLocaleString('pt-BR')} ha</span>
                  <span>Faltam {(proximoNivel.min - hectares).toLocaleString('pt-BR')} ha</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-success font-medium">🏆 Nível máximo atingido!</p>
            )}
          </CardContent>
        </Card>

        {/* Projeção financeira */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={18} className="text-success" /> Projeção de Comissões</CardTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowValues(!showValues)}
                  className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
                >
                  {showValues ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showValues ? 'Ocultar' : 'Mostrar'}
                </button>
                {/* Tooltip regras */}
                <div className="relative group">
                  <HelpCircle size={14} className="text-muted cursor-help" />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-border rounded-xl shadow-lg p-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <p className="text-xs font-medium text-foreground mb-2">Regras de Comissão</p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <p><strong className="text-success">Ano 0 (Garantido):</strong> Pago na assinatura do contrato + coleta de solo. Calculado como ha × US$ 1,00/ha × PTAX{comissaoPercentual !== 100 ? ` × ${comissaoPercentual}%` : ''}.</p>
                      <p><strong className="text-primary">Anos 2, 4, 6, 8, 10:</strong> Condicionado à performance de créditos emitidos. Cálculo: (VCUs/2) × ha × US$/ha × PTAX.</p>
                      {comissaoPercentual !== 100 && <p className="text-primary font-bold mt-1">Sua taxa especial: {comissaoPercentual}%</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-success/5 rounded-xl border border-success/20">
                <p className="text-xs text-success/80">Realizado</p>
                <p className={`text-xl font-bold text-success ${!showValues ? 'value-masked' : ''}`}>{formatValue(totalPago)}</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-xs text-primary/80">A Receber</p>
                <p className={`text-xl font-bold text-primary ${!showValues ? 'value-masked' : ''}`}>{formatValue(totalProjetado)}</p>
              </div>
            </div>
            <Button variant="outline" asChild className="w-full rounded-xl gap-2">
              <Link to="/parceiro/comissoes">Ver Extrato Completo <ArrowRight size={14} /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Últimos leads */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4 flex-row items-center justify-between">
          <CardTitle className="text-lg">Últimas Indicações</CardTitle>
          <Button variant="ghost" size="sm" className="cursor-default hover:bg-transparent">Ver todos</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {meusLeads.slice(0, 4).map(lead => (
              <div key={lead.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{lead.nome}</p>
                  <p className="text-xs text-muted">{lead.fazenda} • {lead.area.toLocaleString('pt-BR')} ha • {lead.data}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  lead.status === 'contratado' || lead.status === 'efetivado' ? 'bg-success/10 text-success border-success/20' :
                  lead.status === 'aprovado' ? 'bg-primary/10 text-primary border-primary/20' :
                  lead.status === 'recusado' ? 'bg-danger/10 text-danger border-danger/20' :
                  'bg-warning/10 text-warning border-warning/20'
                }`}>
                  {lead.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
