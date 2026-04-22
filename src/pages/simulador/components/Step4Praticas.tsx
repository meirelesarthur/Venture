import { useEffect, useState, useMemo } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { SimuladorData } from '../schema'
import { ArrowRight, ArrowLeft, TrendingUp, Wifi, WifiOff, ChevronDown, ChevronUp } from 'lucide-react'
import { useDataStore } from '@/store/data'

const TIPOS_CULTURA = [
  'Soja', 'Milho', 'Algodão', 'Cana-de-açúcar', 'Café', 'Pastagem', 'Trigo', 'Outro'
]

const PRATICAS_LIST = [
  { id: 'plantio_direto', label: 'Plantio Direto (SPD)',           desc: 'Zero revolvimento' },
  { id: 'cobertura',      label: 'Plantas de Cobertura',            desc: 'Braquiária, crotalária...' },
  { id: 'rotacao',        label: 'Rotação Complexa',                desc: 'Diversificação com leguminosas' },
  { id: 'ilpf',           label: 'ILP/ILPF',                        desc: 'Integração Lavoura-Pecuária-Floresta' },
  { id: 'pastagem',       label: 'Reforma de Pastagem',             desc: 'Recuperação com adição de C' },
  { id: 'organico',       label: 'Fertilizantes Orgânicos',         desc: 'Substituição parcial de NPK' },
  { id: 'biologicos',     label: 'Insumos Biológicos',              desc: 'Fixadores de N / P' },
  { id: 'rotac_pasto',    label: 'Manejo Rotacionado',              desc: 'Pastejo Racional Voisin' },
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
      if (data?.value?.length > 0) {
        return { valor: data.value[0].cotacaoVenda, estimado: dias > 0 }
      }
    }
  } catch {}
  return { valor: PTAX_FALLBACK, estimado: true }
}

export function Step4Praticas({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { watch, setValue, formState: { errors }, control } = useFormContext<SimuladorData>()
  const { fields, update } = useFieldArray({ control, name: "talhoes" })
  
  const horizonte = watch('horizonte')
  const talhoes = watch('talhoes') || []

  const { getParam } = useDataStore()
  const preco_base_usd = getParam('preco_base_usd') || 20

  const [ptax, setPtax] = useState(PTAX_FALLBACK)
  const [ptaxEstimado, setPtaxEstimado] = useState(false)
  const [ptaxLoading, setPtaxLoading] = useState(true)

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

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

  // Cálculo por talhão e somatório
  const calculo = useMemo(() => {
    const anos = parseInt(horizonte || '10', 10)
    const preco_brl = preco_base_usd * ptax

    let tco2e_ano_total = 0
    let receita_anual_total = 0

    talhoes.forEach(t => {
      if (!t.praticas || t.praticas.length === 0 || t.areaHectares <= 0) return
      
      const valores = t.praticas.map(p => fatores[p] || 0.5).sort((a, b) => b - a)
      const fatorCombinado = valores[0] + 0.30 * valores.slice(1).reduce((a, b) => a + b, 0)

      const tco2e_ano = t.areaHectares * fatorCombinado
      const receita_anual = tco2e_ano * preco_brl * (1 - BUFFER_POOL)

      tco2e_ano_total += tco2e_ano
      receita_anual_total += receita_anual
    })

    if (tco2e_ano_total === 0) return null

    const receita_total = receita_anual_total * anos
    const area_total = talhoes.reduce((acc, t) => acc + t.areaHectares, 0)

    return {
      tco2e_ano: tco2e_ano_total,
      receita_anual: receita_anual_total,
      receita_total,
      receita_ha_ano: area_total > 0 ? receita_anual_total / area_total : 0,
    }
  }, [talhoes, horizonte, fatores, ptax, preco_base_usd])

  const togglePratica = (index: number, id: string) => {
    const talhao = talhoes[index]
    const praticas = talhao.praticas || []
    let novasPraticas = []
    
    if (praticas.includes(id)) {
      novasPraticas = praticas.filter(p => p !== id)
    } else {
      novasPraticas = [...praticas, id]
    }
    
    update(index, { ...talhao, praticas: novasPraticas })
  }

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  const fmtN = (n: number, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

  const isFormValid = talhoes.every(t => t.cultura && t.praticas && t.praticas.length > 0)

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
      <div className="mb-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Culturas & Manejo</h3>
          <p className="text-sm text-muted mt-1">Defina o cultivo e as práticas para cada talhão demarcado.</p>
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
        {/* Estimativas (Global) */}
        <div className="space-y-3 pb-2">
          <Card className={`border-2 transition-colors duration-300 ${calculo ? 'border-success/30 shadow-md' : 'border-border/40'}`}>
            <div className={`p-5 rounded-xl ${calculo ? 'bg-success/5' : 'bg-muted/5'}`}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className={calculo ? 'text-success' : 'text-muted'} />
                <p className="text-sm font-semibold text-foreground">Estimativa Global de Ganhos</p>
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
                <div className="text-center py-4 text-muted text-xs">
                  Preencha as práticas dos talhões para projetar
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center bg-success/10 rounded-xl p-3 border border-success/20">
                    <p className="text-[10px] text-success/80 mb-0.5 font-bold uppercase tracking-wider">Receita Total Bruta</p>
                    <p className="text-2xl font-black text-success">{fmt(calculo.receita_total)}</p>
                  </div>
                  <div className="space-y-2">
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

        {/* Lista de Talhões (Accordion) */}
        <div className="space-y-3">
          {fields.map((field, index) => {
            const isExpanded = expandedIndex === index
            const talhaoData = talhoes[index] || field
            const praticasSelecionadas = talhaoData.praticas || []
            const isValid = talhaoData.cultura && praticasSelecionadas.length > 0

            return (
              <div key={field.id} className={`border rounded-xl transition-all ${isExpanded ? 'border-primary/50 shadow-md bg-surface/30' : 'border-border/50 bg-background hover:border-primary/30'}`}>
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <div>
                    <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      {talhaoData.nome}
                      {isValid && <Badge className="bg-success/10 text-success border-success/20 shadow-none text-[10px] px-1.5 py-0 h-4">OK</Badge>}
                    </h4>
                    <p className="text-xs text-muted">{talhaoData.areaHectares} ha {talhaoData.cultura ? `• ${talhaoData.cultura}` : ''}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-border/50 space-y-4">
                    <div className="mt-4 space-y-2">
                      <Label className="text-xs">Cultura Principal</Label>
                      <Select
                        value={talhaoData.cultura || ''}
                        onValueChange={(val) => update(index, { ...talhaoData, cultura: val })}
                      >
                        <SelectTrigger className="bg-background h-10 text-sm rounded-lg">
                          <SelectValue placeholder="Selecione a cultura" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_CULTURA.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Práticas Adotadas</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {PRATICAS_LIST.map(pratica => {
                          const isChecked = praticasSelecionadas.includes(pratica.id)
                          return (
                            <label
                              key={pratica.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 transition-all duration-200 ${
                                isChecked ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-secondary/20'
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => togglePratica(index, pratica.id)}
                                className="mt-0.5 flex-shrink-0"
                              />
                              <div className="flex-1 space-y-0.5 min-w-0">
                                <span className="font-medium text-xs block text-foreground leading-tight">{pratica.label}</span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-auto pt-6 border-t border-border/50 bg-background">
        <Button type="button" variant="outline" onClick={onPrev} className="rounded-xl h-12 w-20 flex-shrink-0">
          <ArrowLeft size={16} />
        </Button>
        <Button type="button" onClick={onNext} className="rounded-xl h-12 flex-1 font-semibold" disabled={!isFormValid}>
          Avançar <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  )
}
