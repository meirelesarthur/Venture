import { useAuthStore } from '@/store/auth'
import { useDataStore } from '@/store/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts'
import { TrendingUp, Leaf, DollarSign, AlertCircle } from 'lucide-react'

export default function ResultadosPage() {
  const { user } = useAuthStore()
  const { resultadosMotor, talhoes, fazendas, clientes, parametros } = useDataStore()

  const getParam = (k: string) => parametros.find(p => p.chave === k)?.valor ?? 0
  const ptax     = getParam('ptax_fallback')
  const precoUsd = getParam('preco_base_usd')

  const clienteAtual = clientes.find(c => c.userId === user?.id)
  const fazenda = fazendas.find(f => f.produtorId === clienteAtual?.id) ?? fazendas[0]
  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazenda?.id && t.tipo === 'projeto')
  const talhaoIds   = meusTalhoes.map(t => t.id)

  // Resultados do motor para esses talhões
  const meusResultados = resultadosMotor.filter(r => talhaoIds.includes(r.talhaoId))

  // VCUs por ano agrícola (agrupados)
  const vcuPorAno = meusResultados.reduce<Record<number, number>>((acc, r) => {
    acc[r.anoAgricola] = (acc[r.anoAgricola] ?? 0) + r.vcusEmitidosTotal
    return acc
  }, {})

  // Se não tem resultados do motor, usa estimativa do simulador (baseline racional)
  const totalVcuMotor  = meusResultados.reduce((a, r) => a + r.vcusEmitidosTotal, 0)
  const vcuHaEstimado  = meusTalhoes.reduce((a, t) => a + (t.socPercent ?? 2.0) * t.areaHa / 100, 0)
  const vcuExibido     = totalVcuMotor > 0 ? totalVcuMotor : vcuHaEstimado

  // Estimativa financeira
  const valorUsd = vcuExibido * precoUsd
  const valorBrl = valorUsd * ptax

  // Dados temporais para gráficos
  const anosHistorico = Object.entries(vcuPorAno).map(([ano, vcus]) => ({
    ano: `${ano}/${Number(ano)+1}`, vcus, receita: vcus * precoUsd * ptax,
  }))

  // Projeção 10 anos se tivermos VCUs
  const vcuHaRef = totalVcuMotor > 0
    ? meusResultados.reduce((a, r) => a + r.vcusEmitidosHa, 0) / meusResultados.length
    : 2.2
  const areaTotal = meusTalhoes.reduce((a, t) => a + t.areaHa, 0)

  const projecao10anos = Array.from({ length: 10 }, (_, i) => {
    const anoLabel = `${2026 + i}`
    const vcusProj = vcuHaRef * areaTotal * (1 + i * 0.02)  // crescimento 2% a.a.
    return {
      ano: anoLabel,
      vcus: Math.round(vcusProj),
      receita: Math.round(vcusProj * precoUsd * ptax),
      acumulado: Math.round(vcuHaRef * areaTotal * ((1 - (1.02)**(i+1)) / (1 - 1.02)) * precoUsd * ptax),
    }
  })

  // Detalhes por talhão
  const detalhesTalhao = meusTalhoes.map(t => {
    const res = meusResultados.filter(r => r.talhaoId === t.id)
    const ultimoRes = res[res.length - 1]
    return { talhao: t, resultado: ultimoRes }
  })

  const semDados = meusResultados.length === 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resultados & Extrato</h1>
          <p className="text-muted">{fazenda?.nome} · Histórico de VCUs e projeção financeira</p>
        </div>
        <div className="text-right text-xs text-muted space-y-0.5">
          <p>Câmbio simulado: <span className="font-semibold text-foreground">R$ {ptax.toFixed(2)}</span></p>
          <p>Preço VCU: <span className="font-semibold text-foreground">US$ {precoUsd.toFixed(2)}</span></p>
          <Badge variant="outline" className="text-xs shadow-none border-warning/30 text-warning bg-warning/5">Câmbio simulado</Badge>
        </div>
      </div>

      {semDados && (
        <div className="p-4 rounded-xl border border-warning/30 bg-warning/5 flex items-start gap-3">
          <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Motor de cálculos ainda não executado</p>
            <p className="text-xs text-muted mt-0.5">
              Os valores abaixo são estimativas baseadas nos dados de solo. Para resultados precisos, peça ao admin que execute o motor RothC.
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6 border-border/50 bg-surface">
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={16} className="text-success" />
            <h4 className="text-sm font-medium text-muted">VCUs {semDados ? 'Estimados' : 'Emitidos'}</h4>
          </div>
          <p className="text-3xl font-bold text-success">
            {Math.round(vcuExibido).toLocaleString('pt-BR')} <span className="text-sm font-normal text-muted">tCO₂e</span>
          </p>
          {semDados && <p className="text-xs text-warning mt-1">estimativa sem motor</p>}
        </Card>
        <Card className="p-6 border-border/50 bg-surface">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-primary" />
            <h4 className="text-sm font-medium text-muted">Valor de Mercado</h4>
          </div>
          <p className="text-3xl font-bold text-foreground">US$ {Math.round(valorUsd).toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted mt-1">≈ R$ {Math.round(valorBrl).toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="p-6 border-border/50 bg-surface">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-warning" />
            <h4 className="text-sm font-medium text-muted">Projeção 10 anos</h4>
          </div>
          <p className="text-3xl font-bold text-primary">
            {projecao10anos.reduce((a,b) => a+b.vcus, 0).toLocaleString('pt-BR')} <span className="text-sm font-normal text-muted">tCO₂e</span>
          </p>
          <p className="text-xs text-muted mt-1">R$ {projecao10anos.reduce((a,b) => a+b.receita, 0).toLocaleString('pt-BR')} receita projetada</p>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* VCUs histórico (motor) ou projeção */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-base">
              {anosHistorico.length > 0 ? 'VCUs por Safra (Motor)' : 'Projeção VCUs — 10 Anos'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={anosHistorico.length > 0 ? anosHistorico : projecao10anos.slice(0,5)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ano" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: unknown) => [`${(v as number).toLocaleString('pt-BR')} VCUs`, '']} />
                  <Bar dataKey="vcus" fill="var(--color-success, #16A34A)" radius={[4,4,0,0]} name="VCUs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Receita acumulada projetada */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-base">Receita Acumulada Projetada (10 anos)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projecao10anos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ano" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: unknown) => [`R$ ${(v as number).toLocaleString('pt-BR')}`, '']} />
                  <Line type="monotone" dataKey="acumulado" stroke="var(--color-primary, #057A8F)" strokeWidth={2.5} dot={{ r: 3 }} name="Acumulado" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SOC Trend Chart */}
      {meusTalhoes.length > 0 && (() => {
        const avgSoc = meusTalhoes.reduce((a, t) => a + (t.socPercent ?? 1.8), 0) / meusTalhoes.length
        const socTrendData = Array.from({ length: 10 }, (_, i) => ({
          ano: `${2026 + i}`,
          baseline: parseFloat(avgSoc.toFixed(2)),
          projeto: parseFloat((avgSoc * (1 + i * 0.06)).toFixed(2)),
        }))
        return (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b bg-surface/50 pb-4">
              <CardTitle className="text-base">Tendência de SOC — Baseline vs Projeto</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={socTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="ano" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: unknown, name: string) => [`${(v as number).toFixed(2)}%`, name === 'baseline' ? 'Baseline (sem manejo)' : 'Projeto (com manejo)']} />
                    <Line type="monotone" dataKey="baseline" stroke="var(--color-muted-foreground, #9CA3AF)" strokeWidth={2} strokeDasharray="5 3" dot={false} name="baseline" />
                    <Line type="monotone" dataKey="projeto"   stroke="var(--color-success, #16A34A)"         strokeWidth={2.5} dot={{ r: 3 }}               name="projeto"   />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-6 mt-3 text-xs text-muted justify-center">
                <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-muted-foreground/50 border-dashed border-t-2 border-muted-foreground/50" /><span>Baseline (sem manejo)</span></div>
                <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-success" /><span>Projeto</span></div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Detalhes por talhão */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4 flex-row items-center justify-between">
          <CardTitle className="text-base">Resultados por Talhão</CardTitle>
          {semDados && (
            <p className="text-xs text-muted">Peça ao admin para executar o motor</p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/5">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Talhão</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Área</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">VCUs emitidos</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">VCU/ha</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Receita (BRL)</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status motor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {detalhesTalhao.map(({ talhao, resultado }) => (
                  <tr key={talhao.id} className="hover:bg-accent/5 transition-colors">
                    <td className="p-3 font-medium text-foreground">{talhao.nome}</td>
                    <td className="p-3 text-muted">{talhao.areaHa.toLocaleString('pt-BR')} ha</td>
                    <td className="p-3">
                      {resultado
                        ? <span className="font-semibold text-success">{resultado.vcusEmitidosTotal.toFixed(1)} VCUs</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="p-3 text-muted">
                      {resultado ? resultado.vcusEmitidosHa.toFixed(3) : '—'}
                    </td>
                    <td className="p-3">
                      {resultado
                        ? `R$ ${Math.round(resultado.vcusEmitidosTotal * precoUsd * ptax).toLocaleString('pt-BR')}`
                        : '—'}
                    </td>
                    <td className="p-3">
                      {resultado
                        ? <Badge variant="outline" className="text-xs shadow-none bg-success/10 text-success border-success/20">Motor executado</Badge>
                        : <Badge variant="outline" className="text-xs shadow-none bg-muted/20 text-muted-foreground border-border/50">Pendente</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
