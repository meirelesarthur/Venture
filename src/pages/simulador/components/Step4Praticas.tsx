import { useEffect, useState, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SimuladorData } from '../schema'
import { ArrowRight, ArrowLeft, TrendingUp, Leaf, Wifi, WifiOff } from 'lucide-react'
import { useDataStore } from '@/store/data'

// Mapeamento de prática → chave no parametros_sistema
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

const PRATICAS_LIST = [
  { id: 'plantio_direto', label: 'Plantio Direto (SPD)',           desc: 'Sair do convencional para zero revolvimento' },
  { id: 'cobertura',      label: 'Plantas de Cobertura',            desc: 'Braquiária, crotalária, milheto na entressafra' },
  { id: 'rotacao',        label: 'Rotação de Culturas Complexa',    desc: 'Diversificação com leguminosas' },
  { id: 'ilpf',           label: 'Sistemas Integrados (ILP/ILPF)', desc: 'Integração Lavoura-Pecuária-Floresta' },
  { id: 'pastagem',       label: 'Reforma de Pastagem Degradada',   desc: 'Recuperação de pastagens com alta adição de C' },
  { id: 'organico',       label: 'Fertilizantes Orgânicos',         desc: 'Substituição parcial de NPK sintético' },
  { id: 'biologicos',     label: 'Insumos Biológicos',              desc: 'Fixadores de N e solubilizadores de P' },
  { id: 'rotac_pasto',    label: 'Manejo Rotacionado de Pastagem',  desc: 'Pastejo Racional Voisin ou Intensivo' },
]

const BUFFER_POOL = 0.15
const PTAX_FALLBACK = 5.65

async function fetchPtax(): Promise<{ valor: number; estimado: boolean }> {
  try {
    const hoje = new Date()
    // Tenta hoje, se não tiver (feriado/fds) tenta D-1
    for (let dias = 0; dias < 7; dias++) {
      const d = new Date(hoje)
      d.setDate(d.getDate() - dias)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const yyyy = d.getFullYear()
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${mm}-${dd}-${yyyy}'&$format=json&$select=cotacaoVenda`
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (!resp.ok) continue
      const data = await resp.json()
      if (data?.value?.length > 0) {
        return { valor: data.value[0].cotacaoVenda, estimado: dias > 0 }
      }
    }
  } catch {}
  return { valor: PTAX_FALLBACK, estimado: true }
}

export function Step4Praticas({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { watch, setValue, formState: { errors } } = useFormContext<SimuladorData>()
  const praticas = watch('praticas') || []
  const horizonte = watch('horizonte')
  const hectares   = watch('area.hectares') || 0

  const { getParam } = useDataStore()
  const preco_base_usd = getParam('preco_base_usd') || 20

  const [ptax, setPtax] = useState(PTAX_FALLBACK)
  const [ptaxEstimado, setPtaxEstimado] = useState(false)
  const [ptaxLoading, setPtaxLoading] = useState(true)

  useEffect(() => {
    fetchPtax().then(({ valor, estimado }) => {
      setPtax(valor)
      setPtaxEstimado(estimado)
      setPtaxLoading(false)
    })
  }, [])

  // Fatores SOC lidos do store
  const fatores = useMemo(() => {
    const result: Record<string, number> = {}
    for (const [id, chave] of Object.entries(PRATICA_PARAM)) {
      result[id] = getParam(chave) || 0.5
    }
    return result
  }, [getParam])

  // Cálculo em tempo real
  const calculo = useMemo(() => {
    if (praticas.length === 0 || hectares <= 0) return null
    const anos = parseInt(horizonte || '10', 10)
    const preco_brl = preco_base_usd * ptax

    const valores = praticas.map(p => fatores[p] || 0.5).sort((a, b) => b - a)
    const fatorCombinado = valores[0] + 0.30 * valores.slice(1).reduce((a, b) => a + b, 0)

    const tco2e_ano = hectares * fatorCombinado
    const receita_anual = tco2e_ano * preco_brl * (1 - BUFFER_POOL)
    const receita_total = receita_anual * anos

    return {
      fatorCombinado,
      tco2e_ano,
      receita_anual,
      receita_total,
      receita_ha_ano: receita_anual / (hectares || 1),
    }
  }, [praticas, horizonte, hectares, fatores, ptax, preco_base_usd])

  const togglePratica = (id: string) => {
    if (praticas.includes(id)) {
      setValue('praticas', praticas.filter(p => p !== id), { shouldValidate: true })
    } else {
      setValue('praticas', [...praticas, id], { shouldValidate: true })
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  const fmtN = (n: number, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
      {/* Horizonte */}
      <div className="mb-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Práticas & Resultados</h3>
          <p className="text-sm text-muted mt-1">Selecione quais práticas pretende implementar ou expandir na área.</p>
        </div>
        
        <div className="bg-surface/50 p-3 rounded-xl border border-border/50">
          <Label className="text-xs font-semibold mb-2 block">Horizonte de Projeto:</Label>
          <RadioGroup
            value={horizonte}
            onValueChange={v => setValue('horizonte', v as '10'|'20', { shouldValidate: true })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="10" id="h10" />
              <Label htmlFor="h10" className="font-medium text-sm cursor-pointer">10 anos</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="20" id="h20" />
              <Label htmlFor="h20" className="font-medium text-sm cursor-pointer">
                20 anos <span className="text-xs text-primary font-bold ml-1">(Recomendado)</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="space-y-6">
        {/* Lista de práticas */}
        <div className="space-y-2.5">
          {PRATICAS_LIST.map(pratica => {
            const fator = fatores[pratica.id] ?? 0
            return (
              <label
                key={pratica.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all duration-200 ${
                  praticas.includes(pratica.id)
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/60 hover:bg-secondary/20 hover:border-border'
                }`}
              >
                <Checkbox
                  checked={praticas.includes(pratica.id)}
                  onCheckedChange={() => togglePratica(pratica.id)}
                  className="mt-1 flex-shrink-0"
                />
                <div className="flex-1 space-y-0.5 min-w-0">
                  <span className="font-semibold text-sm block text-foreground leading-tight">{pratica.label}</span>
                  <span className="text-[11px] text-muted block leading-tight">{pratica.desc}</span>
                </div>
                <div className="flex-shrink-0 text-right mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    praticas.includes(pratica.id) ? 'bg-primary/15 text-primary' : 'bg-muted/10 text-muted'
                  }`}>
                    {fmtN(fator, 1)} tCO₂
                  </span>
                </div>
              </label>
            )
          })}
          {errors.praticas && <p className="text-sm text-destructive">{errors.praticas.message}</p>}
        </div>

        {/* Card de resultado em tempo real */}
        <div className="space-y-3 pb-6">
          <Card className={`border-2 transition-colors duration-300 ${calculo ? 'border-success/30 shadow-md' : 'border-border/40'}`}>
            <div className={`p-5 rounded-xl ${calculo ? 'bg-success/5' : 'bg-muted/5'}`}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className={calculo ? 'text-success' : 'text-muted'} />
                <p className="text-sm font-semibold text-foreground">Estimativa de Ganhos</p>
                <div className="ml-auto">
                  {ptaxLoading ? (
                    <span className="text-[10px] text-muted animate-pulse">Buscando PTAX...</span>
                  ) : ptaxEstimado ? (
                    <Badge className="bg-warning/10 text-warning border-warning/20 shadow-none text-[10px] px-1 py-0!"><WifiOff size={8} className="mr-1"/> Estimado</Badge>
                  ) : (
                    <Badge className="bg-success/10 text-success border-success/20 shadow-none text-[10px] px-1 py-0!"><Wifi size={8} className="mr-1"/> Cotação hoje</Badge>
                  )}
                </div>
              </div>

              {!calculo ? (
                <div className="text-center py-6 text-muted text-xs">
                  <Leaf size={24} className="mx-auto mb-2 opacity-30" />
                  Selecione práticas acima para projetar
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center bg-success/10 rounded-xl p-3 border border-success/20">
                    <p className="text-[10px] text-success/80 mb-0.5 font-bold uppercase tracking-wider">Receita Total Bruta</p>
                    <p className="text-2xl font-black text-success">{fmt(calculo.receita_total)}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Receita anual</span>
                      <span className="font-semibold text-foreground">{fmt(calculo.receita_anual)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Por hectare / ano</span>
                      <span className="font-semibold">{fmt(calculo.receita_ha_ano)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Geração Média Estimada</span>
                      <span className="font-semibold text-primary">{fmtN(calculo.tco2e_ano, 0)} VCUs/ano</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex gap-3 mt-auto pt-4 pb-2 border-t border-border/50 bg-background">
        <Button type="button" variant="outline" onClick={onPrev} className="rounded-xl h-12 w-20 flex-shrink-0">
          <ArrowLeft size={16} />
        </Button>
        <Button type="button" onClick={onNext} className="rounded-xl h-12 flex-1 font-semibold" disabled={praticas.length === 0}>
          Avançar <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  )
}
