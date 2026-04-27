import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { SimuladorData } from '../schema'
import { CheckCircle2, TrendingUp, MessageCircle, ArrowRight, Leaf, Star, Share2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useDataStore } from '@/store/data'
import { PRATICA_PARAM, CULTURA_BONUS, BUFFER_POOL } from '@/constants/simulador'

export function Step6Resultado({ onPrev }: { onPrev: () => void }) {
  const { watch } = useFormContext<SimuladorData>()
  const data = watch()
  const { getParam } = useDataStore()

  const preco_base_usd = getParam('preco_base_usd') || 20
  const ptax = getParam('ptax_fallback') || 5.65

  const { receitas, tCO2eAno, receitaAnualMedia, receitaTotal } = useMemo(() => {
    const anos = parseInt(data.horizonte || '10', 10)
    const preco_brl = preco_base_usd * ptax
    const areaHa = data.area?.hectares || 0

    // Fator base das práticas selecionadas
    const praticas = data.praticas || []
    const valores = praticas.map(p => getParam(PRATICA_PARAM[p] || '') || 0.5).sort((a, b) => b - a)
    let fC = 0
    if (valores.length > 0) {
      fC = valores[0] + 0.3 * valores.slice(1).reduce((acc, val) => acc + val, 0)
    }

    // Bônus pelo preparo de solo das culturas
    const culturas = data.culturas || []
    const bonusCulturas = culturas.reduce((acc, c) => acc + (CULTURA_BONUS[c.tipo_preparo || 'convencional'] || 0), 0)
    const fCTotal = fC + bonusCulturas * 0.2 // peso 20% do bônus de culturas

    const tco2e_ano = areaHa * Math.max(fCTotal, 0.3) // mínimo 0.3 tCO2e/ha/ano
    const receita_anual_carbono = tco2e_ano * preco_brl * (1 - BUFFER_POOL)
    const ganho_produtividade = receita_anual_carbono * 0.06
    const custo_praticas = areaHa * 15
    const lucro_liquido = receita_anual_carbono + ganho_produtividade - custo_praticas

    const chartData = []
    let acumulado = 0
    for (let i = 1; i <= anos; i++) {
      acumulado += lucro_liquido
      chartData.push({
        ano: `A ${i}`,
        ganhoCarbono: Math.round(receita_anual_carbono),
        ganhoProdutividade: Math.round(ganho_produtividade),
        custo: Math.round(custo_praticas),
        lucroLiquido: Math.round(lucro_liquido),
        lucroAcumulado: Math.round(acumulado),
      })
    }

    return {
      receitas: chartData,
      tCO2eAno: Math.round(tco2e_ano),
      receitaAnualMedia: lucro_liquido,
      receitaTotal: lucro_liquido * anos,
    }
  }, [data.praticas, data.culturas, data.area?.hectares, data.horizonte, getParam, preco_base_usd, ptax])

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
  const nome = data.lead?.nome?.split(' ')[0] ?? 'produtor'
  const waMsg = encodeURIComponent(
    `Olá! Sou ${data.lead?.nome ?? 'produtor'} e simulei meu potencial na Venture Carbon.\n` +
    `🌿 Área: ${data.area?.hectares} ha\n` +
    `💰 Estimativa: ${fmt(receitaTotal)} em ${data.horizonte} anos\n`
  )

  return (
    <div className="flex flex-col p-6 space-y-5">
      {/* Header */}
      <div className="text-center space-y-2 pb-3 border-b border-border/50">
        <div className="mx-auto w-14 h-14 bg-success/10 text-success rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Parabéns, {nome}!</h2>
        <p className="text-xs text-muted">
          Sua propriedade de <strong className="text-foreground">{data.area?.hectares?.toLocaleString('pt-BR')} ha</strong> tem potencial real de geração de créditos de carbono.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 bg-primary/5 border-primary/20 text-center space-y-1">
          <Leaf size={14} className="mx-auto text-primary mb-1" />
          <p className="text-[10px] font-medium text-muted">tCO₂e / ano</p>
          <p className="text-xl font-bold text-primary">{tCO2eAno.toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="p-3 bg-success/5 border-success/20 text-center space-y-1">
          <TrendingUp size={14} className="mx-auto text-success mb-1" />
          <p className="text-[10px] font-medium text-muted">Lucro Anual</p>
          <p className="text-xl font-bold text-success">{fmt(receitaAnualMedia)}</p>
        </Card>
      </div>

      <Card className="p-4 bg-gradient-to-r from-primary/10 to-success/10 border-primary/20 text-center">
        <p className="text-xs font-medium text-muted mb-1">Lucro Acumulado ({data.horizonte} anos)</p>
        <p className="text-3xl font-bold text-foreground">{fmt(receitaTotal)}</p>
      </Card>

      {/* Gráfico */}
      <div>
        <h3 className="text-sm font-bold mb-1 text-center">Acumulado projetado (R$)</h3>
        <div className="h-[130px] w-full -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={receitas} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="ano" axisLine={false} tickLine={false} tickMargin={5} fontSize={10} />
              <YAxis axisLine={false} tickLine={false} fontSize={10} tickFormatter={val => `${(val / 1000).toFixed(0)}k`} width={45} />
              <Tooltip
                cursor={{ fill: 'var(--color-accent)', opacity: 0.05 }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)', fontSize: '11px', padding: '6px' }}
                formatter={(val: unknown) => [fmt(val as number), 'Acumulado']}
                labelStyle={{ fontWeight: 'bold', color: 'var(--color-foreground)' }}
              />
              <Area type="stepAfter" dataKey="lucroAcumulado" stroke="var(--color-success)" strokeWidth={2} fill="url(#colorLucro)"
                dot={{ r: 2, fill: 'var(--color-success)', strokeWidth: 0 }}
                activeDot={{ r: 4, fill: 'var(--color-success)', stroke: 'white', strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Composição */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="bg-surface/50 px-3 py-1.5 border-b border-border/50">
          <h3 className="text-[10px] uppercase tracking-wider font-bold text-foreground">Composição Anual</h3>
        </div>
        <div className="p-2 grid grid-cols-1 gap-1.5 text-xs">
          <div className="flex justify-between items-center px-2 py-1.5 bg-success/5 rounded border border-success/20">
            <span className="text-success/80 text-[11px]">Rec. Carbono</span>
            <span className="font-bold text-success text-[11px]">{fmt(receitas[0]?.ganhoCarbono ?? 0)}</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1.5 bg-primary/5 rounded border border-primary/20">
            <span className="text-primary/80 text-[11px]">Produtividade</span>
            <span className="font-bold text-primary text-[11px]">{fmt(receitas[0]?.ganhoProdutividade ?? 0)}</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1.5 bg-danger/5 rounded border border-danger/20">
            <span className="text-danger/80 text-[11px]">Custo Práticas</span>
            <span className="font-bold text-danger text-[11px]">- {fmt(receitas[0]?.custo ?? 0)}</span>
          </div>
        </div>
      </Card>

      {/* CTA Principal — completar cadastro */}
      <div className="space-y-3 pt-1 pb-4">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center space-y-2">
          <Star size={18} className="mx-auto text-primary" />
          <p className="text-sm font-bold text-foreground">Próximo passo: complete seu cadastro</p>
          <p className="text-xs text-muted">
            Após aprovação, você cadastra seus talhões e inicia o MRV para gerar seus créditos de carbono certificados.
          </p>
        </div>

        <Button asChild className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white gap-2 font-bold shadow-lg text-sm">
          <Link to="/criar-conta?origem=simulador">
            Completar Cadastro <ArrowRight size={16} />
          </Link>
        </Button>

        <a href={`https://wa.me/5565999999999?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="w-full block">
          <Button type="button" variant="outline" className="w-full h-9 rounded-xl gap-2 font-semibold border-success text-success hover:bg-success/5 text-xs">
            <MessageCircle size={14} /> Falar com Consultor
          </Button>
        </a>

        <button
          type="button"
          onClick={() => {
            const url = window.location.origin + '/simulacao'
            navigator.clipboard.writeText(
              `🌿 Simulei meu potencial de carbono na Venture Carbon!\n` +
              `Área: ${data.area?.hectares} ha · Estimativa: ${fmt(receitaTotal)} em ${data.horizonte} anos\n` +
              `Simule também: ${url}`
            ).then(() => {
              const btn = document.getElementById('share-btn-text')
              if (btn) { btn.textContent = 'Link copiado!'; setTimeout(() => { btn.textContent = 'Compartilhar resultado' }, 2000) }
            })
          }}
          className="w-full h-8 rounded-xl text-xs text-muted-foreground flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
        >
          <Share2 size={12} />
          <span id="share-btn-text">Compartilhar resultado</span>
        </button>

        <Button type="button" variant="ghost" onClick={onPrev} className="w-full h-8 rounded-xl text-xs text-muted-foreground">
          Voltar e editar
        </Button>
      </div>
    </div>
  )
}
