import { useEffect, useState, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SimuladorData } from '../schema'
import { ArrowRight, ArrowLeft, TrendingUp, Wifi, WifiOff } from 'lucide-react'
import { useDataStore } from '@/store/data'

const PRATICAS_LIST = [
  { id: 'plantio_direto', label: 'Plantio Direto (SPD)',       desc: 'Zero revolvimento do solo' },
  { id: 'cobertura',      label: 'Plantas de Cobertura',       desc: 'Braquiária, crotalária...' },
  { id: 'rotacao',        label: 'Rotação Complexa',           desc: 'Diversificação com leguminosas' },
  { id: 'ilpf',           label: 'ILP/ILPF',                   desc: 'Integração Lavoura-Pecuária-Floresta' },
  { id: 'pastagem',       label: 'Reforma de Pastagem',        desc: 'Recuperação com adição de C' },
  { id: 'organico',       label: 'Fertilizantes Orgânicos',    desc: 'Substituição parcial de NPK' },
  { id: 'biologicos',     label: 'Insumos Biológicos',         desc: 'Fixadores de N / P' },
  { id: 'rotac_pasto',    label: 'Manejo Rotacionado',         desc: 'Pastejo Racional Voisin' },
]

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

const BUFFER_POOL = 0.15
const PTAX_FALLBACK = 5.65

async function fetchPtax(): Promise<{ valor: number; estimado: boolean }> {
  try {
    const hoje = new Date()
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
      if (data?.value?.length > 0) return { valor: data.value[0].cotacaoVenda, estimado: dias > 0 }
    }
  } catch {}
  return { valor: PTAX_FALLBACK, estimado: true }
}

export function Step4Praticas({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { watch, setValue } = useFormContext<SimuladorData>()
  const horizonte = watch('horizonte')
  const praticas = watch('praticas') || []
  const areaHa = watch('area.hectares') || 0

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

  const fatores = useMemo(() => {
    const result: Record<string, number> = {}
    for (const [id, chave] of Object.entries(PRATICA_PARAM)) {
      result[id] = getParam(chave) || 0.5
    }
    return result
  }, [getParam])

  const calculo = useMemo(() => {
    if (!praticas.length || !areaHa) return null
    const anos = parseInt(horizonte || '10', 10)
    const preco_brl = preco_base_usd * ptax
    const valores = praticas.map((p: string) => fatores[p] || 0.5).sort((a: number, b: number) => b - a)
    const fC = valores[0] + 0.3 * valores.slice(1).reduce((a: number, b: number) => a + b, 0)
    const tco2e_ano = areaHa * fC
    const receita_anual = tco2e_ano * preco_brl * (1 - BUFFER_POOL)
    return {
      tco2e_ano: Math.round(tco2e_ano),
      receita_anual: Math.round(receita_anual),
      receita_total: Math.round(receita_anual * anos),
    }
  }, [praticas, areaHa, horizonte, fatores, ptax, preco_base_usd])

  const togglePratica = (id: string) => {
    const atual = praticas || []
    const novas = atual.includes(id) ? atual.filter((p: string) => p !== id) : [...atual, id]
    setValue('praticas', novas)
  }

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground">Práticas de Manejo</h2>
        <p className="text-sm text-muted mt-1">Selecione as práticas sustentáveis que você adota ou pretende adotar.</p>
      </div>

      {/* Horizonte */}
      <div className="bg-surface/50 p-3 rounded-xl border border-border/50 mb-5">
        <Label className="text-xs font-semibold mb-2 block">Horizonte de Projeto:</Label>
        <RadioGroup value={horizonte} onValueChange={v => setValue('horizonte', v as '10' | '20', { shouldValidate: true })} className="flex gap-4">
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

      {/* Práticas */}
      <div className="space-y-2 mb-5">
        {PRATICAS_LIST.map(pratica => {
          const isChecked = praticas.includes(pratica.id)
          return (
            <label key={pratica.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${isChecked ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-secondary/20'}`}>
              <Checkbox checked={isChecked} onCheckedChange={() => togglePratica(pratica.id)} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-0.5 min-w-0">
                <span className="font-semibold text-sm block text-foreground">{pratica.label}</span>
                <span className="text-xs text-muted">{pratica.desc}</span>
              </div>
            </label>
          )
        })}
      </div>

      {/* Estimativa */}
      <Card className={`border-2 transition-colors mb-5 ${calculo ? 'border-success/30' : 'border-border/40'}`}>
        <div className={`p-4 rounded-xl ${calculo ? 'bg-success/5' : 'bg-muted/5'}`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className={calculo ? 'text-success' : 'text-muted'} />
            <p className="text-sm font-semibold text-foreground">Estimativa de Ganhos</p>
            <div className="ml-auto">
              {ptaxLoading ? <span className="text-[10px] text-muted animate-pulse">Buscando PTAX...</span>
                : ptaxEstimado
                  ? <Badge className="bg-warning/10 text-warning border-warning/20 shadow-none text-[10px]"><WifiOff size={8} className="mr-1" /> Estimado</Badge>
                  : <Badge className="bg-success/10 text-success border-success/20 shadow-none text-[10px]"><Wifi size={8} className="mr-1" /> Cotação hoje</Badge>}
            </div>
          </div>
          {!calculo
            ? <p className="text-center text-xs text-muted py-3">Selecione práticas para ver a estimativa</p>
            : (
              <div className="space-y-2">
                <div className="text-center bg-success/10 rounded-xl p-3 border border-success/20">
                  <p className="text-[10px] text-success/80 mb-0.5 font-bold uppercase tracking-wider">Receita Total ({horizonte} anos)</p>
                  <p className="text-2xl font-black text-success">{fmt(calculo.receita_total)}</p>
                </div>
                <div className="flex justify-between text-xs px-1">
                  <span className="text-muted">tCO₂e/ano estimado</span>
                  <span className="font-semibold text-primary">{calculo.tco2e_ano.toLocaleString('pt-BR')} VCUs</span>
                </div>
              </div>
            )}
        </div>
      </Card>

      <div className="flex gap-3 mt-auto pt-4 border-t border-border/50">
        <Button type="button" variant="outline" onClick={onPrev} className="rounded-xl h-12 w-20 flex-shrink-0">
          <ArrowLeft size={16} />
        </Button>
        <Button type="button" onClick={onNext} className="rounded-xl h-12 flex-1 font-semibold" disabled={!praticas.length}>
          Próximo <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  )
}
