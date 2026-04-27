import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Save, Plus, Trash2 } from 'lucide-react'
import { useDataStore } from '@/store/data'
import type { CulturaManejo, PlantaCobertura } from '@/store/data'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

const CULTURAS = ['soja','milho','trigo','algodao','arroz','sorgo','cafe','pastagem_braquiaria','pastagem_coloniao','cana','outro']
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
  talhaoIds: string[]
  fazendaId: string
  anoAgricola: number
  locked: boolean
}

export default function LavouraForm({ talhaoIds, fazendaId, anoAgricola, locked }: Props) {
  const { saveManejoRascunho, updateManejo, manejo } = useDataStore()

  const primeiroTalhaoId = talhaoIds[0]
  const existente = manejo.find(m => m.talhaoId === primeiroTalhaoId && m.anoAgricola === anoAgricola && m.cenario === 'projeto')

  // Map legacy fields into cultures array if 'culturas' doesn't exist
  const initCulturas: CulturaManejo[] = existente?.culturas && existente.culturas.length > 0 
    ? existente.culturas 
    : existente?.cultura ? [{ 
        id: uuidv4(), nome: existente.cultura, dataPlantio: existente.dataPlantio, 
        dataColheita: existente.dataColheita, produtividade: existente.produtividade, unidadeProd: existente.unidadeProd 
      }]
    : [{ id: uuidv4(), nome: '' }]

  const [culturas, setCulturas] = useState<CulturaManejo[]>(initCulturas)
  const [plantas, setPlantas] = useState<PlantaCobertura[]>(existente?.plantasCobertura ?? [])
  
  const [preparo, setPreparo] = useState('direto')
  const [residuosCampo, setResiduosCampo] = useState(existente?.residuosCampo ?? true)
  const [queimaResiduos, setQueimaResiduos] = useState(existente?.queimaResiduos ?? false)
  const [usaIrrigacao, setUsaIrrigacao] = useState(existente?.usaIrrigacao ?? false)
  const [tipoIrrig, setTipoIrrig] = useState(existente?.tipoIrrigacao ?? '')


  const handleUpdateCultura = <K extends keyof CulturaManejo>(id: string, field: K, value: CulturaManejo[K]) => {
    setCulturas(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const handleAddCultura = () => {
    setCulturas(prev => [...prev, { id: uuidv4(), nome: '' }])
  }

  const handleRemoveCultura = (id: string) => {
    setCulturas(prev => prev.filter(c => c.id !== id))
  }

  const handleSave = () => {
    if (!talhaoIds.length) { toast.error('Nenhum talhão selecionado.'); return }
    if (culturas.some(c => !c.nome)) { toast.error('Selecione a cultura para todos os registros.'); return }
    
    talhaoIds.forEach(tId => {
      const payload = {
        talhaoId: tId, fazendaId, anoAgricola, cenario: 'projeto' as const, status: 'rascunho' as const,
        culturas, plantasCobertura: plantas,
        residuosCampo, queimaResiduos, usaIrrigacao, tipoIrrigacao: usaIrrigacao ? tipoIrrig : undefined,
      }
      
      const existingId = manejo.find(m => m.talhaoId === tId && m.anoAgricola === anoAgricola && m.cenario === 'projeto')?.id
      if (existingId) {
        updateManejo(existingId, payload)
      } else {
        saveManejoRascunho(payload)
      }
    })
    
    toast.success(`Dados de lavoura salvos para ${talhaoIds.length} talhão(ões)!`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          Uso do Solo e Culturas
        </h2>
        <p className="text-sm text-muted">Acompanhamento das safras no ano agrícola selecionado.</p>
      </div>

      <div className="space-y-4">
        {culturas.map((cultura, index) => {
          const title = index === 0 ? 'Safra Principal / Área 1' : `Safra / Área ${index + 1}`;

          return (
            <div key={cultura.id} className="p-4 border rounded-xl bg-surface/50 space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-foreground">{title}</h3>
                </div>
                {index > 0 && !locked && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveCultura(cultura.id)} className="h-8 w-8 text-danger hover:bg-danger/10 focus:ring-0">
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Cultura Principal *</Label>
                  <Select value={cultura.nome} onValueChange={v => handleUpdateCultura(cultura.id, 'nome', v)} disabled={locked}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {CULTURAS.map(c => <SelectItem key={c} value={c}>{LABEL_CULTURA[c]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Produtividade</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number" placeholder="Ex: 62" value={cultura.produtividade || ''}
                      onChange={e => handleUpdateCultura(cultura.id, 'produtividade', Number(e.target.value))} disabled={locked}
                      className="rounded-xl flex-1"
                    />
                    <Select value={cultura.unidadeProd || 'sacas_ha'} onValueChange={v => handleUpdateCultura(cultura.id, 'unidadeProd', v as 'sacas_ha' | 't_ha')} disabled={locked}>
                      <SelectTrigger className="w-24 rounded-xl px-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sacas_ha">sc/ha</SelectItem>
                        <SelectItem value="t_ha">t/ha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data de Plantio</Label>
                  <Input type="date" value={cultura.dataPlantio || ''} onChange={e => handleUpdateCultura(cultura.id, 'dataPlantio', e.target.value)} disabled={locked} className="rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label>Data de Colheita</Label>
                  <Input type="date" value={cultura.dataColheita || ''} onChange={e => handleUpdateCultura(cultura.id, 'dataColheita', e.target.value)} disabled={locked} className="rounded-xl" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Label htmlFor={`safrinha-${cultura.id}`} className="text-xs font-bold text-primary cursor-pointer">Rotação com Safrinha (Inverno)?</Label>
                <Switch 
                  id={`safrinha-${cultura.id}`}
                  checked={cultura.hasSafrinha || false} 
                  onCheckedChange={v => handleUpdateCultura(cultura.id, 'hasSafrinha', v)} 
                  disabled={locked}
                  className="scale-75"
                />
              </div>

              {cultura.hasSafrinha && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-background/50 p-4 rounded-xl border border-primary/20 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Cultura da Safrinha</Label>
                    <Select value={cultura.safrinhaNome || ''} onValueChange={v => handleUpdateCultura(cultura.id, 'safrinhaNome', v)} disabled={locked}>
                      <SelectTrigger className="rounded-xl bg-surface"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {CULTURAS.map(c => <SelectItem key={c} value={c}>{LABEL_CULTURA[c]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Produtividade</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number" placeholder="Ex: 80" value={cultura.safrinhaProdutividade || ''}
                        onChange={e => handleUpdateCultura(cultura.id, 'safrinhaProdutividade', Number(e.target.value))} disabled={locked}
                        className="rounded-xl flex-1 bg-surface"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Plantio (Safrinha)</Label>
                    <Input type="date" value={cultura.safrinhaDataPlantio || ''} onChange={e => handleUpdateCultura(cultura.id, 'safrinhaDataPlantio', e.target.value)} disabled={locked} className="rounded-xl bg-surface" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Colheita (Safrinha)</Label>
                    <Input type="date" value={cultura.safrinhaDataColheita || ''} onChange={e => handleUpdateCultura(cultura.id, 'safrinhaDataColheita', e.target.value)} disabled={locked} className="rounded-xl bg-surface" />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!locked && (
          <Button type="button" variant="outline" onClick={handleAddCultura} className="w-full rounded-xl border-dashed h-12 text-muted-foreground hover:text-foreground">
            <Plus size={16} className="mr-2" /> Adicionar Nova Safra / Área
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Plantas de Cobertura</Label>
          <p className="text-xs text-muted">Mix ou culturas solteiras usadas para proteção de solo e ciclagem.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plantas.map((p, i) => (
            <div key={i} className="p-4 border border-border/50 rounded-xl bg-surface/50 space-y-4 relative">
              <div className="space-y-2 pr-6">
                <Label className="text-xs">Espécie / Nome do Mix</Label>
                <Input value={p.especie} onChange={e => setPlantas(prev => prev.map((x, idx) => idx === i ? { ...x, especie: e.target.value } : x))} disabled={locked} className="rounded-xl h-9 text-sm" placeholder="Ex: Milheto + Braquiária" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={p.tipo} onValueChange={v => setPlantas(prev => prev.map((x, idx) => idx === i ? { ...x, tipo: v as 'mix' | 'solteira' } : x))} disabled={locked}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solteira">Solteira</SelectItem>
                      <SelectItem value="mix">Mix de Espécies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Data de Plantio</Label>
                  <Input type="date" value={p.dataPlantio} onChange={e => setPlantas(prev => prev.map((x, idx) => idx === i ? { ...x, dataPlantio: e.target.value } : x))} disabled={locked} className="rounded-xl h-9 text-sm text-muted-foreground" />
                </div>
              </div>
              {!locked && (
                <button type="button" className="absolute top-3 right-3 text-muted hover:text-danger" onClick={() => setPlantas(prev => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {!locked && (
          <Button variant="outline" type="button" onClick={() => setPlantas(prev => [...prev, { especie: '', tipo: 'solteira', dataPlantio: '' }])} className="w-full rounded-xl border-dashed h-10 text-muted-foreground hover:text-foreground text-sm">
            <Plus size={14} className="mr-2" /> Adicionar Planta de Cobertura
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Sistema de Preparo do Solo</Label>
        <Select value={preparo} onValueChange={setPreparo} disabled={locked}>
          <SelectTrigger className="rounded-xl md:w-1/2"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PREP_SOLO.map(p => <SelectItem key={p} value={p}>{LABEL_PREP[p]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

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
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-surface/50">
            <div className="flex-1 space-y-2">
              <Label className="text-sm">Tipo de Irrigação</Label>
              <Select value={tipoIrrig} onValueChange={setTipoIrrig} disabled={locked}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {IRRIGACAO_TIPOS.map(t => <SelectItem key={t} value={t}>{LABEL_IRRIG[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
