import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Leaf, Save } from 'lucide-react'
import { useDataStore } from '@/store/data'
import { toast } from 'sonner'

const CULTURAS = ['soja','milho','trigo','algodao','arroz','sorgo','cafe','pastagem_braquiaria','pastagem_coloniao','cana','algodao','outro']
const LABEL_CULTURA: Record<string,string> = {
  soja: 'Soja', milho: 'Milho', trigo: 'Trigo', arroz: 'Arroz', sorgo: 'Sorgo',
  cafe: 'Café', pastagem_braquiaria: 'Pastagem – Braquiária', pastagem_coloniao: 'Pastagem – Colonião',
  cana: 'Cana-de-açúcar', algodao: 'Algodão', outro: 'Outro'
}
const PREP_SOLO = ['convencional','reduzido','direto']
const LABEL_PREP: Record<string,string> = { convencional: 'Convencional', reduzido: 'Cultivo Reduzido', direto: 'Plantio Direto' }
const IRRIGACAO_TIPOS = ['pivo','gotejamento','aspersao','subsuperficial','inundacao']
const LABEL_IRRIG: Record<string,string> = { pivo: 'Pivô Central', gotejamento: 'Gotejamento', aspersao: 'Aspersão', subsuperficial: 'Subsuperficial', inundacao: 'Inundação' }

interface Props {
  talhaoId: string
  anoAgricola: number
  locked: boolean
  manejoId?: string
}

export default function LavouraForm({ talhaoId, anoAgricola, locked, manejoId }: Props) {
  const { saveManejoRascunho, updateManejo, manejo } = useDataStore()

  const existente = manejoId ? manejo.find(m => m.id === manejoId) : undefined

  const [cultura, setCultura] = useState(existente?.cultura ?? '')
  const [preparo, setPreparo] = useState('direto')
  const [dataPlantio, setDataPlantio] = useState(existente?.dataPlantio ?? '')
  const [dataColheita, setDataColheita] = useState(existente?.dataColheita ?? '')
  const [produtividade, setProdutividade] = useState<string>(existente?.produtividade?.toString() ?? '')
  const [unidade, setUnidade] = useState<'sacas_ha'|'t_ha'>(existente?.unidadeProd ?? 'sacas_ha')
  const [residuosCampo, setResiduosCampo] = useState(existente?.residuosCampo ?? true)
  const [queimaResiduos, setQueimaResiduos] = useState(existente?.queimaResiduos ?? false)
  const [usaIrrigacao, setUsaIrrigacao] = useState(existente?.usaIrrigacao ?? false)
  const [tipoIrrig, setTipoIrrig] = useState(existente?.tipoIrrigacao ?? '')

  // Atualiza ao trocar de talhão/ano
  useEffect(() => {
    const m = manejo.find(x => x.talhaoId === talhaoId && x.anoAgricola === anoAgricola && x.cenario === 'projeto')
    if (m) {
      setCultura(m.cultura ?? '')
      setDataPlantio(m.dataPlantio ?? '')
      setDataColheita(m.dataColheita ?? '')
      setProdutividade(m.produtividade?.toString() ?? '')
      setUnidade(m.unidadeProd ?? 'sacas_ha')
      setResiduosCampo(m.residuosCampo ?? true)
      setQueimaResiduos(m.queimaResiduos ?? false)
      setUsaIrrigacao(m.usaIrrigacao ?? false)
      setTipoIrrig(m.tipoIrrigacao ?? '')
    } else {
      setCultura(''); setDataPlantio(''); setDataColheita(''); setProdutividade('')
      setResiduosCampo(true); setQueimaResiduos(false); setUsaIrrigacao(false); setTipoIrrig('')
    }
  }, [talhaoId, anoAgricola])

  const mesesCobertura = (() => {
    if (!dataPlantio || !dataColheita) return null
    const p = new Date(dataPlantio), c = new Date(dataColheita)
    if (isNaN(p.getTime()) || isNaN(c.getTime())) return null
    return Math.max(0, Math.round((c.getTime() - p.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  })()

  const handleSave = () => {
    if (!talhaoId) { toast.error('Selecione um talhão.'); return }
    if (!cultura)  { toast.error('Informe a cultura plantada.'); return }
    const payload = {
      talhaoId, anoAgricola, cenario: 'projeto' as const, status: 'rascunho' as const,
      cultura, dataPlantio, dataColheita,
      produtividade: produtividade ? Number(produtividade) : undefined,
      unidadeProd: unidade, residuosCampo, queimaResiduos, usaIrrigacao,
      tipoIrrigacao: usaIrrigacao ? tipoIrrig : undefined,
    }
    if (manejoId) { updateManejo(manejoId, payload) } else { saveManejoRascunho(payload) }
    toast.success('Dados de lavoura salvos!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Leaf className="text-primary" size={20} /> Uso do Solo e Culturas
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Informe a cultura e as práticas para a safra selecionada.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cultura */}
        <div className="space-y-2">
          <Label>Cultura Principal *</Label>
          <Select value={cultura} onValueChange={setCultura} disabled={locked}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {CULTURAS.map(c => <SelectItem key={c} value={c}>{LABEL_CULTURA[c]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Preparo */}
        <div className="space-y-2">
          <Label>Sistema de Preparo do Solo</Label>
          <Select value={preparo} onValueChange={setPreparo} disabled={locked}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PREP_SOLO.map(p => <SelectItem key={p} value={p}>{LABEL_PREP[p]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Datas */}
        <div className="space-y-2">
          <Label>Data de Plantio</Label>
          <Input type="date" value={dataPlantio} onChange={e => setDataPlantio(e.target.value)} disabled={locked} className="rounded-xl" />
        </div>

        <div className="space-y-2">
          <Label>Data de Colheita (estimada)</Label>
          <Input type="date" value={dataColheita} onChange={e => setDataColheita(e.target.value)} disabled={locked} className="rounded-xl" />
        </div>

        {/* Produtividade */}
        <div className="space-y-2">
          <Label>Produtividade Alcançada</Label>
          <div className="flex gap-2">
            <Input
              type="number" placeholder="Ex: 62" value={produtividade}
              onChange={e => setProdutividade(e.target.value)} disabled={locked}
              className="rounded-xl flex-1"
            />
            <Select value={unidade} onValueChange={v => setUnidade(v as any)} disabled={locked}>
              <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sacas_ha">sc/ha</SelectItem>
                <SelectItem value="t_ha">t/ha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cobertura info */}
        {mesesCobertura !== null && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary">
            <Leaf size={14} />
            <span>Período de cobertura vegetativa estimado: <strong>{mesesCobertura} meses</strong></span>
          </div>
        )}
      </div>

      <Separator />

      {/* Toggles */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-surface/50">
          <div>
            <p className="text-sm font-medium">Resíduos mantidos no campo?</p>
            <p className="text-xs text-muted mt-0.5">Palha/colmo deixados após colheita</p>
          </div>
          <Switch checked={residuosCampo} onCheckedChange={setResiduosCampo} disabled={locked} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-surface/50">
          <div>
            <p className="text-sm font-medium">Queima de resíduos?</p>
            <p className="text-xs text-muted mt-0.5">Queimada de palha pós-colheita</p>
          </div>
          <Switch checked={queimaResiduos} onCheckedChange={setQueimaResiduos} disabled={locked || !residuosCampo} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-surface/50">
          <div>
            <p className="text-sm font-medium">Usa irrigação?</p>
            <p className="text-xs text-muted mt-0.5">Sistema de irrigação artificial</p>
          </div>
          <Switch checked={usaIrrigacao} onCheckedChange={setUsaIrrigacao} disabled={locked} />
        </div>

        {usaIrrigacao && (
          <div className="space-y-2">
            <Label className="text-sm">Tipo de Irrigação</Label>
            <Select value={tipoIrrig} onValueChange={setTipoIrrig} disabled={locked}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {IRRIGACAO_TIPOS.map(t => <SelectItem key={t} value={t}>{LABEL_IRRIG[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!locked && (
        <div className="flex justify-end pt-4">
          <Button className="rounded-xl gap-2" onClick={handleSave}>
            <Save size={16} /> Salvar Rascunho
          </Button>
        </div>
      )}
    </div>
  )
}
