import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Save, Lock, Edit3, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useDataStore } from '@/store/data'
import type { ParametroSistema } from '@/store/data'


// Agrupamentos conforme §4.9 do guia
const GRUPOS = [
  {
    titulo: 'Parâmetros Financeiros',
    desc: 'Impactam simulador, comissões e projeções de receita.',
    cor: 'border-primary/20 bg-primary/5',
    chaves: ['preco_base_usd', 'ptax_fallback', 'buffer_pool', 'comissao_base_usd_ha'],
  },
  {
    titulo: 'Potenciais de Aquecimento Global (GWP) — Somente Leitura',
    desc: 'Constantes IPCC AR5. Não editáveis (VM0042 §8.6.3).',
    cor: 'border-muted/30',
    chaves: ['gwp_ch4', 'gwp_n2o'],
  },
  {
    titulo: 'Fatores de Emissão N₂O (EF1)',
    desc: 'EF1 por zona climática e uso de inibidor. Apenas editáveis com justificativa peer-reviewed.',
    cor: 'border-warning/20',
    chaves: ['ef1_n2o_default', 'ef1_n2o_inibidor', 'ef1_n2o_umido', 'ef1_n2o_seco'],
  },
  {
    titulo: 'Frações de Volatilização e Lixiviação',
    desc: 'Usadas no cálculo de N₂O indireto (fertilizantes + orgânicos).',
    cor: 'border-warning/20',
    chaves: ['frac_gasf', 'frac_gasf_ureia', 'frac_gasm', 'frac_leach', 'ef4_n2o_volat', 'ef5_n2o_leach'],
  },
  {
    titulo: 'Fatores de Emissão CO₂',
    desc: 'IPCC 2019 GL: combustíveis fósseis e calcário. Editáveis com fonte peer-reviewed.',
    cor: 'border-muted/30',
    chaves: ['ef_diesel', 'ef_gasolina', 'ef_limestone', 'ef_dolomite'],
  },
  {
    titulo: 'Fatores SOC — Simulador de Leads',
    desc: 'Fatores de sequestro por prática regenerativa. Editáveis pelo admin. Afetam estimativas no simulador público.',
    cor: 'border-success/20 bg-success/5',
    chaves: ['soc_fator_spdpd','soc_fator_cobertura','soc_fator_rotacao','soc_fator_ilpf','soc_fator_pastagem','soc_fator_org','soc_fator_biologicos','soc_fator_rotac_past'],
  },
]

function ParamRow({ param }: { param: ParametroSistema }) {
  const { setParametro } = useDataStore()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(param.valor))
  const [fonte, setFonte] = useState(param.fonte ?? '')

  const handleSave = () => {
    const n = parseFloat(val)
    if (isNaN(n)) { toast.error('Valor inválido.'); return }
    setParametro(param.chave, n, fonte || undefined)
    toast.success(`"${param.chave}" atualizado.`)
    setEditing(false)
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-border/30 last:border-0`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-mono font-medium text-foreground">{param.chave}</p>
          {!param.editavel && <Lock size={11} className="text-muted-foreground shrink-0" />}
        </div>
        <p className="text-xs text-muted mt-0.5">{param.descricao}</p>
        {param.fonte && <p className="text-xs text-primary mt-0.5">Fonte: {param.fonte}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <Input
                value={val}
                onChange={e => setVal(e.target.value)}
                className="h-8 w-28 rounded-lg text-sm font-mono"
                step="any"
                type="number"
                autoFocus
              />
              <Input
                value={fonte}
                onChange={e => setFonte(e.target.value)}
                className="h-7 w-48 rounded-lg text-xs"
                placeholder="Fonte/justificativa..."
              />
            </div>
            <Button size="sm" className="h-8 rounded-lg" onClick={handleSave}>
              <Save size={13} />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => { setEditing(false); setVal(String(param.valor)) }}>✕</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
              {typeof param.valor === 'number' && param.valor < 0.01
                ? param.valor.toExponential(4)
                : param.valor.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}
              {param.unidade ? ` ${param.unidade}` : ''}
            </span>
            {param.editavel ? (
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => setEditing(true)}>
                <Edit3 size={13} />
              </Button>
            ) : (
              <Badge variant="outline" className="text-xs border-muted/30 text-muted-foreground shadow-none bg-muted/10">
                <Lock size={9} className="mr-1" /> Constante
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminParametros() {
  const { parametros, resetToInitialData } = useDataStore()

  const getParam = (chave: string) => parametros.find(p => p.chave === chave)

  const handleReset = () => {
    if (window.confirm('Restaurar todos os parâmetros para os valores padrão?')) {
      resetToInitialData()
      toast.success('Parâmetros restaurados para os valores default.')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parâmetros Globais</h1>
          <p className="text-muted">Configurações financeiras e fatores de emissão. Metodologia VM0042 v2.2 + IPCC AR5.</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl text-danger border-danger/30 hover:bg-danger/5" onClick={handleReset}>
          Restaurar Defaults
        </Button>
      </div>

      <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-primary flex items-start gap-2">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>
          Constantes metodológicas (<Lock size={10} className="inline" />) não são editáveis por padrão.
          Para sobrescrever com um fator projeto-específico peer-reviewed, use o campo "Fonte/justificativa" ao ativar edição.
          Seguindo §8.6.3 da VM0042 e hierarquia de EFs.
        </span>
      </div>

      <div className="space-y-4">
        {GRUPOS.map(grupo => {
          const params = grupo.chaves.map(c => getParam(c)).filter(Boolean) as ParametroSistema[]
          if (params.length === 0) return null
          return (
            <Card key={grupo.titulo} className={`border shadow-sm ${grupo.cor}`}>
              <CardHeader className="border-b bg-surface/50 pb-3">
                <CardTitle className="text-base">{grupo.titulo}</CardTitle>
                <CardDescription className="text-xs">{grupo.desc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 divide-y divide-border/20">
                {params.map(p => <ParamRow key={p.chave} param={p} />)}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
