import { useEffect, useState, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SimuladorData } from '../schema'
import { ArrowRight, ArrowLeft, TrendingUp, Leaf, AlertCircle, Wifi, WifiOff } from 'lucide-react'
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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Horizonte */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-foreground">Práticas Regenerativas</h3>
          <p className="text-sm text-muted">Selecione quais práticas pretende implementar ou expandir na área.</p>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium whitespace-nowrap">Horizonte:</Label>
          <RadioGroup
            value={horizonte}
            onValueChange={v => setValue('horizonte', v as '10'|'20', { shouldValidate: true })}
            className="flex gap-3"
          >
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="10" id="h10" />
              <Label htmlFor="h10" className="font-normal cursor-pointer">10 anos</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="20" id="h20" />
              <Label htmlFor="h20" className="font-normal cursor-pointer">
                20 anos <span className="text-xs text-success ml-1">(Recomendado)</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Lista de práticas */}
        <div className="lg:col-span-3 space-y-2.5">
          {PRATICAS_LIST.map(pratica => {
            const fator = fatores[pratica.id] ?? 0
            return (
              <label
                key={pratica.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${
                  praticas.includes(pratica.id)
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/60 hover:bg-secondary/20 hover:border-border'
                }`}
              >
                <Checkbox
                  checked={praticas.includes(pratica.id)}
                  onCheckedChange={() => togglePratica(pratica.id)}
                  className="mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 space-y-0.5 leading-none min-w-0">
                  <span className="font-medium text-sm block text-foreground">{pratica.label}</span>
                  <span className="text-xs text-muted block">{pratica.desc}</span>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    praticas.includes(pratica.id) ? 'bg-primary/15 text-primary' : 'bg-muted/10 text-muted'
                  }`}>
                    {fmtN(fator, 1)} tCO₂e/ha
                  </span>
                </div>
              </label>
            )
          })}
          {errors.praticas && <p className="text-sm text-destructive">{errors.praticas.message}</p>}
        </div>

        {/* Card de resultado em tempo real — fixo à direita */}
        <div className="lg:col-span-2">
          <div className="sticky top-4 space-y-3">
            <Card className={`border-2 transition-colors duration-300 ${calculo ? 'border-success/30 shadow-md' : 'border-border/40'}`}>
              <div className={`p-5 rounded-xl ${calculo ? 'bg-success/5' : 'bg-muted/5'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className={calculo ? 'text-success' : 'text-muted'} />
                  <p className="text-sm font-semibold text-foreground">Estimativa em Tempo Real</p>
                  {/* Badge PTAX */}
                  <div className="ml-auto">
                    {ptaxLoading ? (
                      <span className="text-xs text-muted animate-pulse">Buscando PTAX...</span>
                    ) : ptaxEstimado ? (
                      <Badge className="bg-warning/10 text-warning border-warning/20 shadow-none text-xs flex items-center gap-1">
                        <WifiOff size={10} /> Câmbio estimado
                      </Badge>
                    ) : (
                      <Badge className="bg-success/10 text-success border-success/20 shadow-none text-xs flex items-center gap-1">
                        <Wifi size={10} /> PTAX ao vivo
                      </Badge>
                    )}
                  </div>
                </div>

                {!calculo ? (
                  <div className="text-center py-8 text-muted text-sm">
                    <Leaf size={32} className="mx-auto mb-3 opacity-30" />
                    Selecione ao menos uma prática para ver a estimativa
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Receita total — destaque */}
                    <div className="text-center bg-success/10 rounded-xl p-4 border border-success/20">
                      <p className="text-xs text-success/80 mb-1 font-medium">Receita Total ({horizonte} anos)</p>
                      <p className="text-3xl font-bold text-success">{fmt(calculo.receita_total)}</p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Receita anual</span>
                        <span className="font-semibold text-foreground">{fmt(calculo.receita_anual)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Por hectare / ano</span>
                        <span className="font-semibold text-foreground">{fmt(calculo.receita_ha_ano)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">tCO₂e estimado / ano</span>
                        <span className="font-semibold text-primary">{fmtN(calculo.tco2e_ano, 0)} t</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Fator combinado</span>
                        <span className="font-semibold">{fmtN(calculo.fatorCombinado, 2)} tCO₂e/ha</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-border/40 pt-2">
                        <span className="text-muted">Custo para você</span>
                        <span className="font-bold text-success">R$ 0,00</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted text-center">
                      US$ {preco_base_usd}/VCU · PTAX R$ {fmtN(ptax, 4)} · Buffer {BUFFER_POOL * 100}%
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Aviso se já prática avançada (elegibilidade) */}
            {praticas.includes('plantio_direto') && watch('culturas')?.some((c: any) => c.usa_cobertura && c.usa_org) && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20 text-xs text-warning">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Adicionalidade limitada:</strong> Sua fazenda já pratica plantio direto, cobertura e adubação orgânica.
                  A elegibilidade depende de expansão significativa dessas práticas. Nosso time avaliará o contexto regional.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onPrev} className="gap-2">
          <ArrowLeft size={16} /> Anterior
        </Button>
        <Button type="button" onClick={onNext} className="gap-2" disabled={praticas.length === 0}>
          Analisar Resultados <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
