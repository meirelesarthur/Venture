import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Plus, Save, Trash2 } from 'lucide-react'
import { useDataStore } from '@/store/data'
import type { RegistroPecuaria } from '@/store/data'
import { toast } from 'sonner'

const TIPOS_ANIMAL = ['bovino_corte','bovino_leite','bubalino','ovino','caprino','suino','equino','aves']
const LABEL_ANIMAL: Record<string,string> = {
  bovino_corte: 'Bovino de Corte', bovino_leite: 'Bovino de Leite',
  bubalino: 'Bubalino', ovino: 'Ovino', caprino: 'Caprino',
  suino: 'Suíno', equino: 'Equino', aves: 'Aves'
}
const SISTEMAS = ['confinamento','semi_confinamento','extensivo','semi_extensivo']
const LABEL_SISTEMA: Record<string,string> = {
  confinamento: 'Confinamento', semi_confinamento: 'Semi-confinamento',
  extensivo: 'Extensivo', semi_extensivo: 'Semi-extensivo'
}
const DIETAS = ['pasto_degradado','pasto_melhorado','silagem','concentrado','misto']
const LABEL_DIETA: Record<string,string> = {
  pasto_degradado: 'Pasto Degradado', pasto_melhorado: 'Pasto Melhorado',
  silagem: 'Silagem/Volumoso', concentrado: 'Concentrado', misto: 'Misto'
}

const emptyAnimal = (): RegistroPecuaria => ({
  tipoAnimal: '', sistema: 'extensivo', quantidade: 0, pesoMedio: 450, mesesNaArea: 12, dieta: 'pasto_melhorado'
})

interface Props { talhaoId?: string; fazendaId?: string; anoAgricola: number; locked: boolean; manejoId?: string }

export default function PecuariaForm({ talhaoId, fazendaId, anoAgricola, locked, manejoId }: Props) {
  const { saveManejoRascunho, updateManejo, manejo } = useDataStore()
  const existente = manejoId ? manejo.find(m => m.id === manejoId) : undefined
  const [registros, setRegistros] = useState<RegistroPecuaria[]>(existente?.pecuaria ?? [emptyAnimal()])

  useEffect(() => {
    const m = manejo.find(x => (fazendaId ? x.fazendaId === fazendaId : x.talhaoId === talhaoId) && x.anoAgricola === anoAgricola && x.cenario === 'projeto')
    setRegistros(m?.pecuaria ?? [emptyAnimal()])
  }, [talhaoId, fazendaId, anoAgricola])

  const update = (i: number, field: keyof RegistroPecuaria, value: any) => {
    setRegistros(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  const estimateCH4 = (r: RegistroPecuaria) => {
    // EF simplificado por tipo (kgCH4/cab/ano)
    const ef: Record<string,number> = { bovino_corte: 62, bovino_leite: 90, bubalino: 55, ovino: 8, caprino: 5, suino: 1.5, equino: 18, aves: 0 }
    const base = ef[r.tipoAnimal] ?? 0
    return Math.round(base * r.quantidade * (r.mesesNaArea / 12) * 25 / 1000 * 10) / 10 // tCO2e
  }

  const handleSave = () => {
    const payload = {
      talhaoId, fazendaId, anoAgricola, cenario: 'projeto' as const, status: 'rascunho' as const,
      pecuaria: registros,
    }
    if (manejoId) { updateManejo(manejoId, payload) } else { saveManejoRascunho(payload) }
    toast.success('Dados de pecuária salvos!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Users className="text-primary" size={20} /> Pecuária e Criações
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Informe cada categoria animal presente na área do projeto.</p>
      </div>

      {registros.map((r, i) => {
        const ch4 = estimateCH4(r)
        return (
          <div key={i} className="border border-border/50 rounded-2xl p-5 space-y-4 relative bg-surface/50">
            {registros.length > 1 && !locked && (
              <button
                onClick={() => setRegistros(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-3 right-3 text-muted hover:text-danger transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Animal *</Label>
                <Select value={r.tipoAnimal} onValueChange={v => update(i, 'tipoAnimal', v)} disabled={locked}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_ANIMAL.map(t => <SelectItem key={t} value={t}>{LABEL_ANIMAL[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sistema de Produção</Label>
                <Select value={r.sistema} onValueChange={v => update(i, 'sistema', v)} disabled={locked}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SISTEMAS.map(s => <SelectItem key={s} value={s}>{LABEL_SISTEMA[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dieta Predominante</Label>
                <Select value={r.dieta} onValueChange={v => update(i, 'dieta', v)} disabled={locked}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIETAS.map(d => <SelectItem key={d} value={d}>{LABEL_DIETA[d]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Número de Cabeças</Label>
                <Input
                  type="number" min={0} value={r.quantidade || ''}
                  onChange={e => update(i, 'quantidade', Number(e.target.value))}
                  disabled={locked} className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Peso Médio (kg)</Label>
                <Input
                  type="number" min={0} value={r.pesoMedio || ''}
                  onChange={e => update(i, 'pesoMedio', Number(e.target.value))}
                  disabled={locked} className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Meses na Área / Ano</Label>
                <Input
                  type="number" min={1} max={12} value={r.mesesNaArea || ''}
                  onChange={e => update(i, 'mesesNaArea', Number(e.target.value))}
                  disabled={locked} className="rounded-xl"
                />
              </div>
            </div>

            {r.tipoAnimal && r.quantidade > 0 && (
              <div className="flex items-center gap-3 p-3 bg-warning/5 border border-warning/20 rounded-xl text-sm text-warning">
                <span className="font-semibold">CH₄ estimado (entérico + esterco):</span>
                <span className="font-bold">{ch4} tCO₂e/ano</span>
                <span className="text-xs text-muted ml-auto">Cálculo IPCC Tier 1 simplificado</span>
              </div>
            )}
          </div>
        )
      })}

      <Button
        variant="outline" className="w-full border-dashed gap-2" disabled={locked}
        onClick={() => setRegistros(prev => [...prev, emptyAnimal()])}
      >
        <Plus size={16} /> Adicionar Categoria Animal
      </Button>

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
