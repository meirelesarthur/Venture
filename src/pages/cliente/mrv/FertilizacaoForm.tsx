import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Droplets, Plus, Save, Trash2, Info, Paperclip, X } from 'lucide-react'
import { useDataStore } from '@/store/data'
import type { FertilizanteSint, FertilizanteOrg, Calcario } from '@/store/data'
import { toast } from 'sonner'

// FERTILIZANTES SINTÉTICOS (Apêndice A lookup simplificado)
const FERT_SINT = ['ureia','sulfato_amonio','nitrato_amonio','map','dap','kcl','superfosfato_simples','superfosfato_triplo','npk_formulado','outro']
const LABEL_FERT: Record<string,string> = {
  ureia: 'Ureia (46-0-0)', sulfato_amonio: 'Sulfato de Amônio (21-0-0)', nitrato_amonio: 'Nitrato de Amônio (34-0-0)',
  map: 'MAP (11-52-0)', dap: 'DAP (18-46-0)', kcl: 'Cloreto de Potássio - KCl',
  superfosfato_simples: 'Superfosfato Simples', superfosfato_triplo: 'Superfosfato Triplo', npk_formulado: 'NPK Formulado',
  outro: 'Outro (Especificar)'
}
const FERT_ORG = ['esterco_bovino','esterco_suino','cama_frango','composto_organico','biofertilizante','torta_mamona','outro']
const LABEL_ORG: Record<string,string> = {
  esterco_bovino: 'Esterco Bovino', esterco_suino: 'Esterco Suíno', cama_frango: 'Cama de Frango',
  composto_organico: 'Composto Orgânico', biofertilizante: 'Biofertilizante Líquido', torta_mamona: 'Torta de Mamona',
  outro: 'Outro (Especificar)'
}
const CORRETIVOS = ['calcitico','dolomítico','gesso_agricola']
const LABEL_CORRETIVO: Record<string,string> = {
  calcitico: 'Calcário Calcítico', dolomítico: 'Calcário Dolomítico', gesso_agricola: 'Gesso Agrícola'
}

// NC_SF: % N no fertilizante (simplificado)
const NC_SF: Record<string,number> = {
  ureia: 0.46, sulfato_amonio: 0.21, nitrato_amonio: 0.34, map: 0.11, dap: 0.18,
  kcl: 0, superfosfato_simples: 0, superfosfato_triplo: 0, npk_formulado: 0.1
}

interface Props {
  talhaoIds: string[]
  fazendaId: string
  anoAgricola: number
  locked: boolean
}

export default function FertilizacaoForm({ talhaoIds, fazendaId, anoAgricola, locked }: Props) {
  const { saveManejoRascunho, updateManejo, manejo } = useDataStore()
  
  const primeiroTalhaoId = talhaoIds[0]
  const existente = manejo.find(m => m.talhaoId === primeiroTalhaoId && m.anoAgricola === anoAgricola && m.cenario === 'projeto')

  const [sint, setSint] = useState<FertilizanteSint[]>(existente?.fertilizantesSint ?? [{ tipo: '', qtdKgHa: 0, usaInibidor: false }])
  const [org, setOrg]   = useState<FertilizanteOrg[]>(existente?.fertilizantesOrg ?? [])
  const [calc, setCalc] = useState<Calcario[]>(existente?.calcario ?? [])
  const [biologicos, setBiologicos] = useState<{nome: string}[]>(existente?.produtosBiologicos ?? [])
  // Inline file uploads per item (index-based)
  const [sintFiles, setSintFiles] = useState<Record<number, string>>({})
  const [orgFiles, setOrgFiles]   = useState<Record<number, string>>({})


  const handleFileUpload = (setter: React.Dispatch<React.SetStateAction<Record<number, string>>>, idx: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) setter(prev => ({ ...prev, [idx]: file.name }))
    }
    input.click()
  }

  useEffect(() => {
    const primeiroTalhaoId = talhaoIds[0]
    const m = manejo.find(x => x.talhaoId === primeiroTalhaoId && x.anoAgricola === anoAgricola && x.cenario === 'projeto')
    setSint(m?.fertilizantesSint ?? [{ tipo: '', qtdKgHa: 0, usaInibidor: false }])
    setOrg(m?.fertilizantesOrg ?? [])
    setCalc(m?.calcario ?? [])
    setBiologicos(m?.produtosBiologicos ?? [])
  }, [talhaoIds, anoAgricola])

  const totalN = sint.reduce((acc, f) => acc + (NC_SF[f.tipo] ?? 0) * f.qtdKgHa, 0)
  const estimatedN2O = +(totalN * 0.0047 * 44 / 28).toFixed(2) // kg N2O/ha → tCO2e/ha aproximado

  const updateSint = (i: number, f: keyof FertilizanteSint, v: any) =>
    setSint(prev => prev.map((r, idx) => idx === i ? { ...r, [f]: v } : r))
  const updateOrg  = (i: number, f: keyof FertilizanteOrg, v: any)  =>
    setOrg (prev => prev.map((r, idx) => idx === i ? { ...r, [f]: v } : r))
  const updateCalc = (i: number, f: keyof Calcario, v: any)           =>
    setCalc(prev => prev.map((r, idx) => idx === i ? { ...r, [f]: v } : r))

  const handleSave = () => {
    if (!talhaoIds.length) { toast.error('Nenhum talhão selecionado.'); return }

    talhaoIds.forEach(tId => {
      const payload = {
        talhaoId: tId, fazendaId, anoAgricola, cenario: 'projeto' as const, status: 'rascunho' as const,
        fertilizantesSint: sint, fertilizantesOrg: org, calcario: calc, produtosBiologicos: biologicos
      }
      const existingId = manejo.find(m => m.talhaoId === tId && m.anoAgricola === anoAgricola && m.cenario === 'projeto')?.id
      if (existingId) {
        updateManejo(existingId, payload)
      } else {
        saveManejoRascunho(payload)
      }
    })

    toast.success(`Dados de fertilização salvos para ${talhaoIds.length} talhão(ões)!`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Droplets className="text-primary" size={20} /> Fertilização e Adubação
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Registre todos os insumos aplicados na safra.</p>
      </div>

      {/* ── Sintéticos ───────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Fertilizantes Sintéticos</Label>
          <span className="text-xs text-muted bg-surface px-2 py-1 rounded-lg border border-border/50">
            N total estimado: <strong>{totalN.toFixed(1)} kg N/ha</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sint.map((f, i) => (
            <div key={i} className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl bg-surface/50 relative">
              <div className="flex justify-between items-start">
                <div className="space-y-1 w-full max-w-[70%]">
                  <Label className="text-xs">Produto *</Label>
                  <Select value={f.tipo} onValueChange={v => updateSint(i, 'tipo', v)} disabled={locked}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>{FERT_SINT.map(t => <SelectItem key={t} value={t}>{LABEL_FERT[t]}</SelectItem>)}</SelectContent>
                  </Select>
                  {f.tipo === 'outro' && (
                    <Input 
                      placeholder="Descreva o fertilizante..." 
                      value={f.outroNome || ''} 
                      onChange={e => updateSint(i, 'outroNome', e.target.value)} 
                      disabled={locked} 
                      className="mt-2 text-sm h-9"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-6">
                  {!locked && (
                    <button type="button" className="text-muted hover:text-primary" title="Anexar nota fiscal" onClick={() => handleFileUpload(setSintFiles, i)}>
                      <Paperclip size={14} />
                    </button>
                  )}
                  {!locked && sint.length > 1 && (
                    <button className="text-muted hover:text-danger" onClick={() => setSint(prev => prev.filter((_,idx)=>idx!==i))}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-end gap-3">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Dose (kg/ha)</Label>
                  <Input type="number" min={0} value={f.qtdKgHa || ''} onChange={e => updateSint(i,'qtdKgHa',Number(e.target.value))} disabled={locked} className="rounded-xl h-9 text-sm" />
                </div>
                <div className="space-y-1 flex-[1.5]">
                  <Label className="text-xs border-b pb-1 w-full flex">Usa inibidor de urease?</Label>
                  <div className="flex items-center gap-2 h-9 pt-1">
                    <Switch checked={f.usaInibidor} onCheckedChange={v => updateSint(i,'usaInibidor',v)} disabled={locked} />
                    <span className="text-[10px] text-muted">{f.usaInibidor ? 'Sim (EF -)' : 'Não'}</span>
                  </div>
                </div>
              </div>
              {NC_SF[f.tipo] > 0 && (
                <span className="text-[10px] text-muted absolute top-2 right-4">NC: {(NC_SF[f.tipo]*100).toFixed(0)}%</span>
              )}
              {sintFiles[i] && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="upload-badge"><Paperclip size={8} /> {sintFiles[i]}</span>
                  {!locked && <button className="text-muted hover:text-danger" onClick={() => setSintFiles(prev => { const n = {...prev}; delete n[i]; return n })}><X size={10} /></button>}
                </div>
              )}
            </div>
          ))}
        </div>

        {!locked && (
          <Button variant="outline" className="w-full border-dashed gap-2 text-sm" onClick={() => setSint(prev => [...prev, { tipo:'', qtdKgHa:0, usaInibidor:false }])}>
            <Plus size={14} /> Adicionar Fertilizante Sintético
          </Button>
        )}

        {totalN > 0 && (
          <div className="flex items-center gap-2 p-3 bg-warning/5 border border-warning/20 rounded-xl text-sm text-warning mt-2">
            <Info size={14} />
            N₂O estimado (IPCC Tier 1): <strong>{estimatedN2O} tCO₂e/ha/ano</strong> (EF1 médio, sem inibidores)
          </div>
        )}
      </div>

      <Separator />

      {/* ── Orgânicos ─────────────────────────────────── */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Fertilizantes Orgânicos</Label>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {org.map((f, i) => (
            <div key={i} className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl bg-surface/50 relative">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1 pr-3">
                  <Label className="text-xs">Tipo de Orgânico</Label>
                  <Select value={f.tipo} onValueChange={v => updateOrg(i,'tipo',v)} disabled={locked}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>{FERT_ORG.map(t => <SelectItem key={t} value={t}>{LABEL_ORG[t]}</SelectItem>)}</SelectContent>
                  </Select>
                  {f.tipo === 'outro' && (
                    <Input 
                      placeholder="Descreva o adubo..." 
                      value={f.outroNome || ''} 
                      onChange={e => updateOrg(i, 'outroNome', e.target.value)} 
                      disabled={locked} 
                      className="mt-2 text-sm h-9"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-6">
                  {!locked && (
                    <button type="button" className="text-muted hover:text-primary" title="Anexar nota fiscal" onClick={() => handleFileUpload(setOrgFiles, i)}>
                      <Paperclip size={14} />
                    </button>
                  )}
                  {!locked && (
                    <button className="text-muted hover:text-danger" onClick={() => setOrg(prev => prev.filter((_,idx)=>idx!==i))}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1 w-1/2">
                <Label className="text-xs">Dose (t/ha)</Label>
                <Input type="number" min={0} step={0.1} value={f.qtdTHa || ''} onChange={e => updateOrg(i,'qtdTHa',Number(e.target.value))} disabled={locked} className="rounded-xl h-9 text-sm" />
              </div>
              {orgFiles[i] && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="upload-badge"><Paperclip size={8} /> {orgFiles[i]}</span>
                  {!locked && <button className="text-muted hover:text-danger" onClick={() => setOrgFiles(prev => { const n = {...prev}; delete n[i]; return n })}><X size={10} /></button>}
                </div>
              )}
            </div>
          ))}
        </div>
        {!locked && (
          <Button variant="outline" className="w-full border-dashed gap-2 text-sm" onClick={() => setOrg(prev => [...prev, { tipo:'', qtdTHa:0 }])}>
            <Plus size={14} /> Adicionar Orgânico
          </Button>
        )}
      </div>

      <Separator />

      {/* ── Biológicos ────────────────────────────────── */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Produtos Biológicos</Label>
        <p className="text-xs text-muted">Inoculantes, bioestimulantes ou defensivos biológicos.</p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {biologicos.map((b, i) => (
            <div key={i} className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl bg-surface/50">
              <div className="space-y-1">
                <Label className="text-xs">Nome do Produto</Label>
                <div className="flex gap-2">
                  <Input 
                    value={b.nome} 
                    onChange={e => setBiologicos(prev => prev.map((x, idx) => idx === i ? { ...x, nome: e.target.value } : x))} 
                    disabled={locked} 
                    className="rounded-xl h-9 text-sm flex-1" 
                    placeholder="Ex: Trichoderma"
                  />
                  {!locked && (
                    <button className="text-muted hover:text-danger pb-2" onClick={() => setBiologicos(prev => prev.filter((_,idx)=>idx!==i))}>
                      <Trash2 size={16} className="mt-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {!locked && (
          <Button variant="outline" className="w-full border-dashed gap-2 text-sm" onClick={() => setBiologicos(prev => [...prev, { nome: '' }])}>
            <Plus size={14} /> Adicionar Produto Biológico
          </Button>
        )}
      </div>

      <Separator />

      {/* ── Corretivos ────────────────────────────────── */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Corretivos de Solo</Label>
        <p className="text-xs text-muted">Calcário e gesso agrícola. Gesso = CO₂ nulo (metodologia VM0042).</p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {calc.map((f, i) => (
            <div key={i} className="flex items-end gap-3 p-4 border border-border/50 rounded-xl bg-surface/50">
              <div className="space-y-1 flex-[2]">
                <Label className="text-xs">Tipo de Corretivo</Label>
                <Select value={f.tipo} onValueChange={v => updateCalc(i,'tipo',v)} disabled={locked}>
                  <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>{CORRETIVOS.map(t => <SelectItem key={t} value={t}>{LABEL_CORRETIVO[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Dose (t/ha)</Label>
                <Input type="number" min={0} step={0.1} value={f.qtdTHa || ''} onChange={e => updateCalc(i,'qtdTHa',Number(e.target.value))} disabled={locked} className="rounded-xl h-9 text-sm" />
              </div>
              {!locked && (
                <button className="text-muted hover:text-danger pb-2" onClick={() => setCalc(prev => prev.filter((_,idx)=>idx!==i))}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {!locked && (
          <Button variant="outline" className="w-full border-dashed gap-2 text-sm" onClick={() => setCalc(prev => [...prev, { tipo:'', qtdTHa:0 }])}>
            <Plus size={14} /> Adicionar Corretivo
          </Button>
        )}
      </div>

      {!locked && (
        <div className="flex justify-end pt-4">
          <Button className="rounded-xl gap-2" onClick={handleSave}><Save size={16} /> Salvar Rascunho</Button>
        </div>
      )}
    </div>
  )
}
