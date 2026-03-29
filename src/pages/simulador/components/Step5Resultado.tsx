import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { SimuladorData } from '../schema'
import { ArrowLeft, CheckCircle2, TrendingUp, Leaf } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// Mock factors based on VM0042 logic for the simulator
const FATORES: Record<string, number> = {
  ilpf: 1.5,
  plantio_direto: 0.8,
  cobertura: 0.5,
  rotacao: 0.4,
  organico: 0.3,
  biologicos: 0.2,
}

const PRECO_USD = 20
const PTAX_MOCK = 5.5
const PRECO_BRL = PRECO_USD * PTAX_MOCK
const BUFFER_POOL = 0.15

export function Step5Resultado({ onPrev }: { onPrev: () => void }) {
  const { watch } = useFormContext<SimuladorData>()
  const data = watch()

  const { receitas, tCO2eAquisicao, receitaAnualMedia, receitaTotal } = useMemo(() => {
    const area = data.area?.hectares || 0
    const anos = parseInt(data.horizonte || '10', 10)
    
    // Formula: fator_combinado = maior_fator + 0.30 * soma_dos_demais
    const selectedFatores = (data.praticas || []).map(p => FATORES[p] || 0.1).sort((a, b) => b - a)
    let fatorCombinado = 0
    if (selectedFatores.length > 0) {
      fatorCombinado = selectedFatores[0] + 0.3 * selectedFatores.slice(1).reduce((acc, val) => acc + val, 0)
    }

    // Baseline vs Project mock logic
    const tCO2e_por_ha_ano = fatorCombinado * 1.0 // simplification
    const tCO2e_ano = tCO2e_por_ha_ano * area
    const vcu_ano = tCO2e_ano * (1 - BUFFER_POOL)
    const receita_ano = vcu_ano * PRECO_BRL

    const chartData = []
    let acumulado = 0

    // VCU standard verification is usually every 1 to 5 years. Let's show yearly for the simulator.
    for (let i = 1; i <= anos; i++) {
      acumulado += receita_ano
      chartData.push({
        ano: `Ano ${i}`,
        receita: Math.round(receita_ano),
        acumulado: Math.round(acumulado),
      })
    }

    return {
      receitas: chartData,
      tCO2eAquisicao: Math.round(tCO2e_ano),
      receitaAnualMedia: receita_ano,
      receitaTotal: acumulado
    }
  }, [data])

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-3xl font-bold text-foreground">Sua Estimativa de Créditos</h2>
        <p className="text-muted max-w-lg mx-auto">
          Baseado na sua área de <strong className="text-foreground">{data.area?.hectares} ha</strong> e adoção de práticas regenerativas, 
          este é o potencial do seu projeto.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6 bg-primary/5 border-primary/20 text-center space-y-2">
          <Leaf className="mx-auto text-primary mb-2" size={24} />
          <h4 className="text-sm font-medium text-muted">Acréscimo de Carbono (tCO₂e/ano)</h4>
          <p className="text-2xl font-bold text-primary">{tCO2eAquisicao.toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="p-6 bg-success/5 border-success/20 text-center space-y-2">
          <TrendingUp className="mx-auto text-success mb-2" size={24} />
          <h4 className="text-sm font-medium text-muted">Receita Média Anual Estimada</h4>
          <p className="text-2xl font-bold text-success">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaAnualMedia)}
          </p>
        </Card>
        <Card className="p-6 bg-accent border-border/50 text-center space-y-2">
          <CheckCircle2 className="mx-auto text-muted-foreground mb-2" size={24} />
          <h4 className="text-sm font-medium text-muted">Receita Total ({data.horizonte} anos)</h4>
          <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaTotal)}
          </p>
        </Card>
      </div>

      <div className="pt-6">
        <h3 className="text-lg font-medium mb-6 text-center">Projeção de Receita (R$)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={receitas} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="ano" axisLine={false} tickLine={false} tickMargin={10} fontSize={12} fill="var(--color-muted)" />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                fontSize={12} 
                tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} 
                width={80}
              />
              <Tooltip 
                cursor={{ fill: 'var(--color-accent)' }} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}
              />
              <Bar dataKey="receita" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-center text-muted mt-4">
          * Valores brutos estimados. Custos de estruturação, auditoria VVB e buffer pool (15%) aplicados. PTAX simulada em R$ {PTAX_MOCK.toFixed(2)}. 
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onPrev} className="gap-2 w-full sm:w-auto">
          <ArrowLeft size={16} /> Refazer Simulação
        </Button>
        <div className="flex gap-4 w-full sm:w-auto">
          <Button type="button" variant="outline" className="w-full sm:w-auto">
            Falar com Consultor
          </Button>
          <Button asChild className="w-full sm:w-auto bg-success hover:bg-success/90 text-white">
            <Link to="/criar-conta">Criar Conta e Iniciar</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
