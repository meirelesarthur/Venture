import { useState } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SimuladorData } from '../schema'
import { ArrowRight, ArrowLeft, Map as MapIcon, Plus, Trash2 } from 'lucide-react'
import { MapDemarcationOverlay } from '@/components/MapDemarcationOverlay'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'

export function Step3Talhoes({ onNext, onPrev, onMapEditToggle }: { onNext: () => void; onPrev: () => void; onMapEditToggle?: (active: boolean) => void }) {
  const methods = useFormContext<SimuladorData>()
  const { register, control, formState: { errors } } = methods
  const { fields, append, remove } = useFieldArray({
    control,
    name: "talhoes"
  })

  const [isDrawing, setIsDrawing] = useState(false)
  
  const handleMapToggle = (active: boolean) => {
    setIsDrawing(active)
    if (onMapEditToggle) onMapEditToggle(active)
  }

  const handleCompleteDrawing = (_points: [number, number][], hectares: number) => {
    append({
      id: uuidv4(),
      nome: `Talhão ${fields.length + 1}`,
      areaHectares: hectares,
    })
    handleMapToggle(false)
    toast.success(`Talhão ${fields.length + 1} criado com ${hectares} ha.`)
  }

  const handleNext = () => {
    if (fields.length === 0) {
      toast.error('Demarque ou adicione pelo menos um talhão.')
      return
    }
    onNext()
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Talhões</h2>
        <p className="text-sm text-muted-foreground mt-1">Divida a área elegível em talhões de manejo.</p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto w-full flex-1">
        
        <Button type="button" variant="outline" className="w-full h-14 flex items-center justify-center gap-2 rounded-xl border-dashed border-2 hover:bg-primary/5 hover:border-primary hover:text-primary transition-colors text-muted" onClick={() => handleMapToggle(true)}>
          <MapIcon size={18} />
          <span>Demarcar Novo Talhão no Mapa</span>
        </Button>

        {fields.length > 0 && (
          <div className="space-y-3 mt-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border border-border/50 rounded-xl bg-surface/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Talhão {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="h-8 w-8 p-0 text-muted hover:text-danger hover:bg-danger/10 rounded-full">
                    <Trash2 size={14} />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome</Label>
                    <Input {...register(`talhoes.${index}.nome`)} className="h-9 text-sm rounded-lg bg-background" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Área (ha)</Label>
                    <Input type="number" step="0.01" {...register(`talhoes.${index}.areaHectares`, { valueAsNumber: true })} className="h-9 text-sm rounded-lg bg-background" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {fields.length === 0 && (
          <div className="text-center py-8 text-sm text-muted">
            Nenhum talhão demarcado ainda.
          </div>
        )}

        {errors.talhoes?.message && <p className="text-sm text-destructive text-center">{errors.talhoes.message}</p>}
      </div>

      <div className="flex gap-3 mt-auto pt-6">
        <Button type="button" variant="outline" onClick={onPrev} className="rounded-xl h-12 w-20">
          <ArrowLeft size={16} />
        </Button>
        <Button type="button" onClick={handleNext} className="rounded-xl h-12 flex-1 font-semibold">
          Próximo <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>

      <MapDemarcationOverlay
        isOpen={isDrawing}
        onClose={() => handleMapToggle(false)}
        onComplete={handleCompleteDrawing}
        title="Demarcar Talhão"
        description="Clique no mapa para criar os limites deste talhão."
      />
    </div>
  )
}
