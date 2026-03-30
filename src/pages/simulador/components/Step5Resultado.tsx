import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { SimuladorData } from '../schema'
import { ArrowLeft, CheckCircle2, TrendingUp, Leaf, MessageCircle, UserPlus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useDataStore } from '@/store/data'

const BUFFER_POOL = 0.15
const PRATICA_PARAM: Record<string, string> = {
  plantio_direto: 'soc_fator_spdpd',
  cobertura:      'soc_fator_cobertura',
  rotacao:        'soc_fator_rotacao',
  ilpf:           'soc_fator_ilpf',
  pastagem:       'soc_fator_pastagem',
  organico:       'soc_fator_org',
  biologicos:     'soc_fator_biologicos',
  rotac_pasto:    'soc_fator_rotac_past',
}

export function Step5Resultado({ onPrev }: { onPrev: () => void }) {
  const { watch } = useFormContext<SimuladorData>()
  const data = watch()

  const { getParam } = useDataStore()
  const preco_base_usd = getParam('preco_base_usd') || 20
  // PTAX da Step4 (já carregada) ou fallback
  const ptax = getParam('ptax_fallback') || 5.65

  const { receitas, tCO2eAno, receitaAnualMedia, receitaTotal, fatorCombinado } = useMemo(() => {
    const area = data.area?.hectares || 0
    const anos = parseInt(data.horizonte || '10', 10)
    const preco_brl = preco_base_usd * ptax

    const selectedFatores = (data.praticas || []).map(p => getParam(PRATICA_PARAM[p] || '') || 0.5).sort((a, b) => b - a)
    let fC = 0
    if (selectedFatores.length > 0) {
      fC = selectedFatores[0] + 0.3 * selectedFatores.slice(1).reduce((acc, val) => acc + val, 0)
    }

    const tco2e_ano = area * fC
    const receita_anual = tco2e_ano * preco_brl * (1 - BUFFER_POOL)

    const chartData = []
    for (let i = 1; i <= anos; i++) {
      chartData.push({ ano: `Ano ${i}`, receita: Math.round(receita_anual) })
    }

    return {
      receitas: chartData,
      tCO2eAno: Math.round(tco2e_ano),
      receitaAnualMedia: receita_anual,
      receitaTotal: receita_anual * anos,
      fatorCombinado: fC,
    }
  }, [data, getParam, preco_base_usd, ptax])

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  const nome = data.lead?.nome?.split(' ')[0] ?? 'produtor'
  const waMsg = encodeURIComponent(
    `Olá! Sou ${data.lead?.nome ?? 'produtor'} e simulei meu potencial de créditos de carbono na plataforma Venture Carbon.\n` +
    `🌿 Área: ${data.area?.hectares} ha\n` +
    `💰 Estimativa: ${fmt(receitaTotal)} em ${data.horizonte} anos\n` +
    `Gostaria de saber mais!`
  )

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-3xl font-bold text-foreground">Olá, {nome}! Sua estimativa está pronta.</h2>
        <p className="text-muted max-w-lg mx-auto">
          Baseado nos <strong className="text-foreground">{data.area?.hectares?.toLocaleString('pt-BR')} ha</strong> e{' '}
          <strong className="text-foreground">{data.praticas?.length} prática(s)</strong> selecionadas, este é o seu potencial.
        </p>
      </div>

      {/* 3 Métricas principais */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6 bg-primary/5 border-primary/20 text-center space-y-2">
          <Leaf className="mx-auto text-primary mb-2" size={24} />
          <h4 className="text-sm font-medium text-muted">tCO₂e Removidas / ano</h4>
          <p className="text-2xl font-bold text-primary">{tCO2eAno.toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="p-6 bg-success/5 border-success/20 text-center space-y-2">
          <TrendingUp className="mx-auto text-success mb-2" size={24} />
          <h4 className="text-sm font-medium text-muted">Receita Anual Estimada</h4>
          <p className="text-2xl font-bold text-success">{fmt(receitaAnualMedia)}</p>
        </Card>
        <Card className="p-6 bg-accent border-border/50 text-center space-y-2">
          <CheckCircle2 className="mx-auto text-muted-foreground mb-2" size={24} />
          <h4 className="text-sm font-medium text-muted">Receita Total ({data.horizonte} anos)</h4>
          <p className="text-2xl font-bold text-foreground">{fmt(receitaTotal)}</p>
        </Card>
      </div>

      {/* Gráfico de projeção */}
      <div className="pt-2">
        <h3 className="text-lg font-medium mb-4 text-center">Projeção de Receita (R$)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={receitas} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="ano" axisLine={false} tickLine={false} tickMargin={10} fontSize={11} />
              <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={val => `R$ ${(val/1000).toFixed(0)}k`} width={75} />
              <Tooltip
                cursor={{ fill: 'var(--color-accent)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any) => [fmt(val), 'Receita estimada']}
              />
              <Bar dataKey="receita" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparativo Convencional vs Regenerativo */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="bg-surface/50 px-5 py-3 border-b border-border/50">
          <h3 className="text-base font-semibold text-foreground">Manejo Convencional vs. Regenerativo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/10">
                <th className="text-left p-3 font-medium text-muted">Critério</th>
                <th className="text-center p-3 font-medium text-muted">Convencional</th>
                <th className="text-center p-3 font-medium text-success">Com Venture Carbon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[
                { criterio: 'Custo do programa', conv: 'N/A', vc: <span className="font-bold text-success">R$ 0</span>, sub: 'Venture arca 100%' },
                { criterio: 'Receita adicional / ha / ano', conv: '—', vc: fmt(receitaAnualMedia / (data.area?.hectares || 1)), sub: 'via créditos de carbono' },
                { criterio: 'Carbono removido / ano', conv: '—', vc: `${tCO2eAno.toLocaleString('pt-BR')} tCO₂e`, sub: 'certificados pela Verra' },
                { criterio: 'Fator SOC combinado', conv: '—', vc: `${fatorCombinado.toFixed(2)} tCO₂e/ha`, sub: 'VM0042 v2.2' },
                { criterio: 'Receptor dos créditos', conv: '—', vc: 'Você, o produtor', sub: 'divisão contratual garantida' },
              ].map(row => (
                <tr key={row.criterio} className="hover:bg-accent/5">
                  <td className="p-3">
                    <p className="font-medium text-foreground">{row.criterio}</p>
                    <p className="text-xs text-muted">{row.sub}</p>
                  </td>
                  <td className="p-3 text-center text-muted">{row.conv}</td>
                  <td className="p-3 text-center">
                    <span className="font-semibold text-foreground">{row.vc}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-center text-muted">
        * Valores estimados. Sujeito a aprovação do Motor de Cálculos (RothC + IPCC). PTAX R$ {ptax.toFixed(4)} · Buffer pool {BUFFER_POOL * 100}%.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onPrev} className="gap-2 w-full sm:w-auto">
          <ArrowLeft size={16} /> Refazer Simulação
        </Button>
        <div className="flex gap-3 w-full sm:w-auto">
          <a
            href={`https://wa.me/5565999999999?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none"
          >
            <Button type="button" variant="outline" className="w-full gap-2">
              <MessageCircle size={16} className="text-green-600" />
              Falar com Consultor
            </Button>
          </a>
          <Button asChild className="flex-1 sm:flex-none bg-success hover:bg-success/90 text-white gap-2">
            <Link to="/criar-conta">
              <UserPlus size={16} />
              Criar Conta e Iniciar
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
