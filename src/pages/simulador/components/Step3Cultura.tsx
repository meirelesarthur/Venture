import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
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

  if (fields.length === 0) {
    append({ id: crypto.randomUUID(), nome: '', tipo_preparo: 'convencional', usa_cobertura: false, usa_org: false, tem_pecuaria: false })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Cultivos & Manejo</h2>
        <p className="text-sm text-muted-foreground mt-1">Quais culturas você produz ou planeja produzir?</p>
      </div>

      <div className="space-y-4 mb-6">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-xl bg-surface/50 relative">
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
                  <SelectTrigger className="bg-surface rounded-xl">
                    <SelectValue placeholder="Selecione a cultura" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CULTURA.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {field.nome && (
                <div className="space-y-3 pt-3 border-t border-border/50">
                  <div className="space-y-2">
                    <Label className="text-xs">Preparo do Solo Atual</Label>
                    <Select
                      value={field.tipo_preparo}
                      onValueChange={(val: any) => update(index, { ...field, tipo_preparo: val })}
                    >
                      <SelectTrigger className="bg-surface h-9 text-xs rounded-lg">
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
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                      <Label className="text-xs font-bold cursor-pointer text-primary" htmlFor={`saf-${field.id}`}>Faz Safrinha na mesma área?</Label>
                      <Switch 
                        id={`saf-${field.id}`} 
                        checked={field.has_safrinha || false} 
                        onCheckedChange={(val) => update(index, { ...field, has_safrinha: val, safrinha_nome: val ? field.safrinha_nome : undefined })} 
                      />
                    </div>
                    {field.has_safrinha && (
                      <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-200 bg-surface/30 p-3 rounded-lg border border-primary/20">
                        <Label className="text-xs text-muted-foreground">Qual a cultura de inverno (Safrinha)?</Label>
                        <Select
                          value={field.safrinha_nome || ''}
                          onValueChange={(val) => update(index, { ...field, safrinha_nome: val })}
                        >
                          <SelectTrigger className="bg-surface h-9 text-xs rounded-lg border-primary/30">
                            <SelectValue placeholder="Selecione a safrinha" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_CULTURA.filter(c => c !== 'Pastagem').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        ))}

        {errors.culturas && <p className="text-sm text-destructive">{errors.culturas.message}</p>}

        <Button 
          type="button" 
          variant="outline" 
          disabled={fields.some(f => !f.nome)}
          className="w-full border-dashed rounded-xl h-11"
          onClick={() => append({ id: crypto.randomUUID(), nome: '', tipo_preparo: 'convencional', usa_cobertura: false, usa_org: false, tem_pecuaria: false })}
        >
          <Plus size={16} className="mr-2" /> Adicionar Cultura / Área
        </Button>
      </div>

      <div className="flex gap-3 mt-auto pt-6">
        <Button type="button" variant="outline" onClick={onPrev} className="rounded-xl h-12 w-20">
          <ArrowLeft size={16} />
        </Button>
        <Button type="button" onClick={onNext} className="rounded-xl h-12 flex-1 font-semibold">
          Próximo <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  )
}
