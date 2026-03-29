import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import type { SimuladorData } from '../schema'
import { ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react'

const TIPOS_CULTURA = [
  'Soja', 'Milho', 'Algodão', 'Cana-de-açúcar', 'Café', 'Pastagem', 'Trigo', 'Outro'
]

export function Step3Cultura({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { formState: { errors } } = useFormContext<SimuladorData>()

  // useFieldArray to manage multiple cultures dynamically
  const { fields, append, remove, update } = useFieldArray<SimuladorData, 'culturas'>({
    name: 'culturas',
  })

  // Add a default culture if empty
  if (fields.length === 0) {
    append({ id: crypto.randomUUID(), nome: '', tipo_preparo: 'convencional', usa_cobertura: false, usa_org: false, tem_pecuaria: false })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Quais culturas você produz ou planeja produzir na área elegível? Adicione e configure o manejo de cada uma.
        </p>

        {fields.map((field, index) => (
          <Card key={field.id} className="p-4 border border-border/50 bg-secondary/30 relative">
            <div className="absolute top-2 right-2">
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="text-muted hover:text-danger h-8 w-8" onClick={() => remove(index)}>
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
            
            <div className="space-y-4 pr-8">
              <div className="space-y-2">
                <Label>Cultura</Label>
                <Select
                  value={field.nome}
                  onValueChange={(val) => update(index, { ...field, nome: val })}
                >
                  <SelectTrigger className="bg-surface">
                    <SelectValue placeholder="Selecione a cultura" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CULTURA.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {field.nome && (
                <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                  <div className="space-y-2">
                    <Label className="text-xs">Preparo do Solo Atual</Label>
                    <Select
                      value={field.tipo_preparo}
                      onValueChange={(val: any) => update(index, { ...field, tipo_preparo: val })}
                    >
                      <SelectTrigger className="bg-surface h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="convencional">Convencional</SelectItem>
                        <SelectItem value="reduzido">Cultivo Reduzido</SelectItem>
                        <SelectItem value="direto">Plantio Direto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-normal cursor-pointer" htmlFor={`cob-${field.id}`}>Usa planta de cobertura?</Label>
                      <Switch 
                        id={`cob-${field.id}`} 
                        checked={field.usa_cobertura} 
                        onCheckedChange={(val) => update(index, { ...field, usa_cobertura: val })} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-normal cursor-pointer" htmlFor={`org-${field.id}`}>Uso de organomineral?</Label>
                      <Switch 
                        id={`org-${field.id}`} 
                        checked={field.usa_org} 
                        onCheckedChange={(val) => update(index, { ...field, usa_org: val })} 
                      />
                    </div>
                    {field.nome === 'Pastagem' && (
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-normal cursor-pointer" htmlFor={`pec-${field.id}`}>Integração Lavoura-Pecuária?</Label>
                        <Switch 
                          id={`pec-${field.id}`} 
                          checked={field.tem_pecuaria} 
                          onCheckedChange={(val) => update(index, { ...field, tem_pecuaria: val })} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}

        {errors.culturas && <p className="text-sm text-destructive">{errors.culturas.message}</p>}

        <Button 
          type="button" 
          variant="outline" 
          disabled={fields.some(f => !f.nome)}
          className="w-full border-dashed"
          onClick={() => append({ id: crypto.randomUUID(), nome: '', tipo_preparo: 'convencional', usa_cobertura: false, usa_org: false, tem_pecuaria: false })}
        >
          <Plus size={16} className="mr-2" /> Adicionar Cultura / Área
        </Button>
      </div>

      <div className="flex justify-between pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onPrev} className="gap-2">
          <ArrowLeft size={16} /> Anterior
        </Button>
        <Button type="button" onClick={onNext} className="gap-2">
          Próximo <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
