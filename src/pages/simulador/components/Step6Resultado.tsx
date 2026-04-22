import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { SimuladorData } from '../schema'
import { CheckCircle2, TrendingUp, MessageCircle, UserPlus } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
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

export function Step6Resultado({ onPrev }: { onPrev: () => void }) {
  const { watch } = useFormContext<SimuladorData>()
  const data = watch()

  const { getParam } = useDataStore()
  const preco_base_usd = getParam('preco_base_usd') || 20
  const ptax = getParam('ptax_fallback') || 5.65

  const { receitas, tCO2eAno, receitaAnualMedia, receitaTotal } = useMemo(() => {
    const anos = parseInt(data.horizonte || '10', 10)
    const preco_brl = preco_base_usd * ptax

    let tco2e_ano_total = 0
    let receita_anual_carbono_total = 0
    let area_total = 0

    const talhoes = data.talhoes || []
    talhoes.forEach(t => {
      if (!t.praticas || t.praticas.length === 0 || t.areaHectares <= 0) return
      area_total += t.areaHectares
      
      const valores = t.praticas.map(p => getParam(PRATICA_PARAM[p] || '') || 0.5).sort((a, b) => b - a)
      let fC = 0
      if (valores.length > 0) {
        fC = valores[0] + 0.3 * valores.slice(1).reduce((acc, val) => acc + val, 0)
      }

      const tco2e_ano = t.areaHectares * fC
      const receita_anual_carbono = tco2e_ano * preco_brl * (1 - BUFFER_POOL)

      tco2e_ano_total += tco2e_ano
      receita_anual_carbono_total += receita_anual_carbono
    })

    const ganho_produtividade = receita_anual_carbono_total * 0.06
    const custo_praticas = area_total * 15 // ~R$ 15/ha/ano
    const lucro_liquido = receita_anual_carbono_total + ganho_produtividade - custo_praticas

    const chartData = []
    let acumulado = 0
    for (let i = 1; i <= anos; i++) {
      acumulado += lucro_liquido
      chartData.push({
        ano: `A ${i}`,
        ganhoCarbono: Math.round(receita_anual_carbono_total),
        ganhoProdutividade: Math.round(ganho_produtividade),
        custo: Math.round(custo_praticas),
        lucroLiquido: Math.round(lucro_liquido),
        lucroAcumulado: Math.round(acumulado),
      })
    }

    return {
      receitas: chartData,
      tCO2eAno: Math.round(tco2e_ano_total),
      receitaAnualMedia: lucro_liquido,
      receitaTotal: lucro_liquido * anos,
    }
  }, [data.talhoes, data.horizonte, getParam, preco_base_usd, ptax])

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
  const nome = data.lead?.nome?.split(' ')[0] ?? 'produtor'
  const waMsg = encodeURIComponent(
    `Olá! Sou ${data.lead?.nome ?? 'produtor'} e simulei meu potencial na Venture Carbon.\n` +
    `🌿 Área: ${data.area?.hectares} ha\n` +
    `💰 Estimativa: ${fmt(receitaTotal)} em ${data.horizonte} anos\n`
  )

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="text-center space-y-3 pb-2 border-b border-border/50">
        <div className="mx-auto w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 size={24} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Sua estimativa, {nome}!</h2>
        <p className="text-xs text-muted">
          Baseado nos <strong className="text-foreground">{data.area?.hectares?.toLocaleString('pt-BR')} ha</strong> elegíveis.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 bg-primary/5 border-primary/20 text-center space-y-1">
          <p className="text-[10px] font-medium text-muted">tCO₂e / ano</p>
          <p className="text-lg font-bold text-primary">{tCO2eAno.toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="p-3 bg-success/5 border-success/20 text-center space-y-1">
          <TrendingUp className="mx-auto text-success mb-1" size={16} />
          <p className="text-[10px] font-medium text-muted">Lucro Anual</p>
          <p className="text-lg font-bold text-success">{fmt(receitaAnualMedia)}</p>
        </Card>
      </div>

      <Card className="p-3 bg-accent/5 border-border/50 text-center space-y-1">
        <p className="text-xs font-medium text-muted">Lucro Acumulado ({data.horizonte} anos)</p>
        <p className="text-2xl font-bold text-foreground">{fmt(receitaTotal)}</p>
      </Card>

      {/* Gráfico */}
      <div className="pt-0">
        <h3 className="text-sm font-bold mb-1 text-center">Acumulado projetado (R$)</h3>
        <p className="text-[10px] text-muted text-center mb-2">Ganho Carbono + Produtividade − Custo</p>
        <div className="h-[140px] w-full -ml-3">
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
              <YAxis axisLine={false} tickLine={false} fontSize={10} tickFormatter={val => `${(val/1000).toFixed(0)}k`} width={45} />
              <Tooltip
                cursor={{ fill: 'var(--color-accent)', opacity: 0.05 }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)', fontSize: '11px', padding: '6px' }}
                formatter={(val: any, name: any) => {
                  return [fmt(val), name === 'lucroAcumulado' ? 'Acumulado' : 'Líquido/ano']
                }}
                labelStyle={{ fontWeight: 'bold', color: 'var(--color-foreground)' }}
              />
              <Area
                type="stepAfter"
                dataKey="lucroAcumulado"
                stroke="var(--color-success)"
                strokeWidth={2}
                fill="url(#colorLucro)"
                dot={{ r: 2, fill: 'var(--color-success)', strokeWidth: 0 }}
                activeDot={{ r: 4, fill: 'var(--color-success)', stroke: 'white', strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

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

      <div className="flex flex-col gap-2 pt-1 pb-4">
        <a href={`https://wa.me/5565999999999?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button type="button" variant="outline" className="w-full h-9 rounded-xl gap-2 font-semibold border-success text-success hover:bg-success/5 text-xs">
            <MessageCircle size={14} /> Consultor Especializado
          </Button>
        </a>
        <Button asChild className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-white gap-2 font-bold shadow-md">
          <Link to="/criar-conta?origem=simulador">
            <UserPlus size={16} /> Criar Conta e Salvar MRV
          </Link>
        </Button>
        <Button type="button" variant="ghost" onClick={onPrev} className="w-full h-8 rounded-xl text-xs text-muted-foreground">
          Voltar e editar
        </Button>
      </div>
    </div>
  )
}
