import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tractor, Plus, Save, Trash2, Info, Paperclip, X } from 'lucide-react'
import { useDataStore } from '@/store/data'
import type { OperacaoMec } from '@/store/data'
import { toast } from 'sonner'

const OPERACOES = ['plantio','colheita','pulverizacao','adubacao_base','adubacao_cobertura','calagem','subsolagem','gradeacao','irrigacao_bombeamento','transporte_interno']
const LABEL_OP: Record<string,string> = {
  plantio: 'Plantio', colheita: 'Colheita', pulverizacao: 'Pulverização',
  adubacao_base: 'Adubação de Base', adubacao_cobertura: 'Adubação de Cobertura',
  calagem: 'Aplicação de Calcário', subsolagem: 'Subsolagem', gradeacao: 'Gradeação',
  irrigacao_bombeamento: 'Bombeamento de Irrigação', transporte_interno: 'Transporte Interno'
}
const COMBUSTIVEIS = ['diesel','gasolina','etanol','eletricidade']
const LABEL_COMB: Record<string,string> = { diesel: 'Diesel B', gasolina: 'Gasolina', etanol: 'Etanol (EF=0)', eletricidade: 'Eletricidade (energia renovável)' }
// EF CO2 por litro (kgCO2/L)
const EF_COMB: Record<string,number> = { diesel: 2.63, gasolina: 2.27, etanol: 0, eletricidade: 0 }

interface Props {
  talhaoIds: string[]
  fazendaId: string
  anoAgricola: number
  locked: boolean
}

export default function OperacionalForm({ talhaoIds, fazendaId, anoAgricola, locked }: Props) {
  const { saveManejoRascunho, updateManejo, manejo } = useDataStore()

  const primeiroTalhaoId = talhaoIds[0]
  const existente = manejo.find(m => m.talhaoId === primeiroTalhaoId && m.anoAgricola === anoAgricola && m.cenario === 'projeto')
  const [ops, setOps] = useState<OperacaoMec[]>(existente?.operacoes ?? [{ operacao:'', combustivel:'diesel', litros:0 }])
  const [opFiles, setOpFiles] = useState<Record<number, string>>({})

  const handleFileUpload = (idx: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) setOpFiles(prev => ({ ...prev, [idx]: file.name }))
    }
    input.click()
  }


  const update = <K extends keyof OperacaoMec>(i: number, f: K, v: OperacaoMec[K]) =>
    setOps(prev => prev.map((r, idx) => idx === i ? { ...r, [f]: v } : r))

  const totalCO2 = ops.reduce((acc, op) => acc + (EF_COMB[op.combustivel] ?? 0) * op.litros / 1000, 0)

  const handleSave = () => {
    if (!talhaoIds.length) { toast.error('Nenhum talhão selecionado.'); return }

    talhaoIds.forEach(tId => {
      const payload = {
        talhaoId: tId, fazendaId, anoAgricola, cenario: 'projeto' as const, status: 'rascunho' as const,
        operacoes: ops
      }
      const existingId = manejo.find(m => m.talhaoId === tId && m.anoAgricola === anoAgricola && m.cenario === 'projeto')?.id
      if (existingId) {
        updateManejo(existingId, payload)
      } else {
        saveManejoRascunho(payload)
      }
    })

    toast.success(`Dados operacionais salvos para ${talhaoIds.length} talhão(ões)!`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Tractor className="text-primary" size={20} /> Operações Mecanizadas
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Registre as operações com máquinas e consumo de combustível por hectare.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead className="bg-accent/10">
            <tr>
              <th className="text-left p-3 font-medium text-muted-foreground">Operação</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Combustível</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Litros/ha</th>
              <th className="text-left p-3 font-medium text-muted-foreground">CO₂e (t/ha)</th>
              {!locked && <th className="p-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {ops.map((op, i) => {
              const co2 = ((EF_COMB[op.combustivel] ?? 0) * op.litros / 1000).toFixed(3)
              return (
                <tr key={i} className="bg-surface/50">
                  <td className="p-2">
                    <Select value={op.operacao} onValueChange={v => update(i,'operacao',v)} disabled={locked}>
                      <SelectTrigger className="rounded-lg h-8 text-sm border-0 bg-transparent">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERACOES.map(o => <SelectItem key={o} value={o}>{LABEL_OP[o]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Select value={op.combustivel} onValueChange={v => update(i,'combustivel',v)} disabled={locked}>
                      <SelectTrigger className="rounded-lg h-8 text-sm border-0 bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMBUSTIVEIS.map(c => <SelectItem key={c} value={c}>{LABEL_COMB[c]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number" min={0} step={0.5} value={op.litros || ''}
                      onChange={e => update(i,'litros',Number(e.target.value))}
                      disabled={locked}
                      className="h-8 rounded-lg text-sm border-0 bg-transparent w-24"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <span className={`text-xs font-medium ${Number(co2) > 0 ? 'text-warning' : 'text-success'}`}>{co2}</span>
                  </td>
                  {!locked && (
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => handleFileUpload(i)} className="text-muted hover:text-primary" title="Anexar comprovante">
                          <Paperclip size={12} />
                        </button>
                        <button onClick={() => setOps(prev => prev.filter((_,idx)=>idx!==i))} className="text-muted hover:text-danger">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {opFiles[i] && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="upload-badge"><Paperclip size={8} /> {opFiles[i]}</span>
                          <button className="text-muted hover:text-danger" onClick={() => setOpFiles(prev => { const n = {...prev}; delete n[i]; return n })}><X size={8} /></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t-2 border-border bg-surface">
            <tr>
              <td colSpan={2} className="p-3 text-sm font-semibold text-foreground">Total CO₂e Combustíveis</td>
              <td></td>
              <td className="p-3 text-center font-bold text-warning">{totalCO2.toFixed(3)} t/ha</td>
              {!locked && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {totalCO2 > 0 && (
        <div className="flex items-center gap-2 p-3 bg-warning/5 border border-warning/20 rounded-xl text-sm text-warning">
          <Info size={14} />
          CO₂ de combustíveis será descontado das remoções líquidas (Scope 1 on-farm). Use etanol para reduzir impacto.
        </div>
      )}

      {!locked && (
        <Button variant="outline" className="w-full border-dashed gap-2 text-sm" onClick={() => setOps(prev => [...prev, { operacao:'', combustivel:'diesel', litros:0 }])}>
          <Plus size={14} /> Adicionar Operação
        </Button>
      )}

      {!locked && (
        <div className="flex justify-end pt-4">
          <Button className="rounded-xl gap-2" onClick={handleSave}><Save size={16} /> Salvar Rascunho</Button>
        </div>
      )}
    </div>
  )
}
