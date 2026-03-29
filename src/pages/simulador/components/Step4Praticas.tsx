import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { SimuladorData } from '../schema'
import { ArrowRight, ArrowLeft } from 'lucide-react'

const PRATICAS = [
  { id: 'plantio_direto', label: 'Transição para Plantio Direto', fatorDesc: 'Alto impacto SOC', desc: 'Sair do convencional para zero revolvimento' },
  { id: 'cobertura', label: 'Introdução de Plantas de Cobertura', fatorDesc: 'Impacto contínuo', desc: 'Braquiária, crotalária, milheto na entressafra' },
  { id: 'organico', label: 'Fertilizantes Orgânicos', fatorDesc: 'Médio impacto', desc: 'Substituição parcial de NPK' },
  { id: 'ilpf', label: 'Sistemas Integrados (ILP/ILPF)', fatorDesc: 'Muito alto impacto', desc: 'Integração Lavoura-Pecuária-Floresta' },
  { id: 'rotacao', label: 'Rotação de Culturas Complexa', fatorDesc: 'Médio impacto', desc: 'Diversificação com leguminosas' },
  { id: 'biologicos', label: 'Insumos Biológicos', fatorDesc: 'Baixo impacto', desc: 'Fixadores de N e solubilizadores' },
]

export function Step4Praticas({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { watch, setValue, formState: { errors } } = useFormContext<SimuladorData>()
  const praticas = watch('praticas') || []
  const horizonte = watch('horizonte')

  const togglePratica = (id: string) => {
    if (praticas.includes(id)) {
      setValue('praticas', praticas.filter((p) => p !== id), { shouldValidate: true })
    } else {
      setValue('praticas', [...praticas, id], { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-foreground mb-1">Práticas Sustentáveis</h3>
          <p className="text-sm text-muted">
            Selecione quais novas práticas você pretende implementar ou expandir na sua área. 
            O mercado valoriza a "adicionalidade" (o que você fará a mais do que a região).
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PRATICAS.map((pratica) => (
            <label
              key={pratica.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                praticas.includes(pratica.id)
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/60 hover:bg-secondary/20'
              }`}
            >
              <Checkbox
                checked={praticas.includes(pratica.id)}
                onCheckedChange={() => togglePratica(pratica.id)}
                className="mt-0.5"
              />
              <div className="space-y-1 leading-none">
                <span className="font-medium text-sm block">{pratica.label}</span>
                <span className="text-xs text-muted block line-clamp-2">{pratica.desc}</span>
                <span className="text-xs text-primary/80 font-medium inline-block mt-1 px-1.5 py-0.5 rounded-sm bg-primary/10">
                  {pratica.fatorDesc}
                </span>
              </div>
            </label>
          ))}
        </div>
        {errors.praticas && <p className="text-sm text-destructive">{errors.praticas.message}</p>}

        <div className="pt-4 border-t border-border/50">
          <Label className="text-base font-medium mb-3 block">Horizonte do Projeto</Label>
          <RadioGroup 
            value={horizonte} 
            onValueChange={(val) => setValue('horizonte', val as '10'|'20', { shouldValidate: true })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="10" id="h10" />
              <Label htmlFor="h10" className="font-normal">10 anos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="20" id="h20" />
              <Label htmlFor="h20" className="font-normal">20 anos <span className="text-xs text-success ml-1">(Recomendado)</span></Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onPrev} className="gap-2">
          <ArrowLeft size={16} /> Anterior
        </Button>
        <Button type="button" onClick={onNext} className="gap-2">
          Analisar Resultados <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
