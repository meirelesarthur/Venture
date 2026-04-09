import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin } from 'lucide-react'

// Simple coordinate mapping for Brazil states (Capital coords just for the zoom effect)
export const STATE_COORDS: Record<string, [number, number]> = {
  AC: [-9.02, -70.81], AL: [-9.57, -36.78], AM: [-3.41, -65.85], AP: [1.41, -51.77],
  BA: [-12.57, -41.70], CE: [-5.32, -39.30], DF: [-15.79, -47.88], ES: [-19.18, -40.30],
  GO: [-15.82, -49.83], MA: [-4.96, -45.27], MG: [-18.51, -44.55], MS: [-20.77, -54.36],
  MT: [-12.64, -55.42], PA: [-3.70, -52.49], PB: [-7.23, -36.78], PE: [-8.81, -36.95],
  PI: [-7.71, -42.72], PR: [-25.25, -52.02], RJ: [-22.90, -43.20], RN: [-5.79, -36.53],
  RO: [-11.50, -63.58], RR: [2.73, -62.07], RS: [-30.03, -51.21], SC: [-27.24, -50.21],
  SE: [-10.57, -37.38], SP: [-23.55, -46.63], TO: [-10.17, -48.29]
}

interface Props {
  onNext: () => void
  onPrev?: () => void
  onLocationSelect: (coord: [number, number]) => void
}

export function Step1Localizacao({ onNext, onPrev, onLocationSelect }: Props) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<any>()
  const estado = watch('localizacao.estado')

  const handleStateChange = (val: string) => {
    setValue('localizacao.estado', val, { shouldValidate: true })
    setValue('localizacao.municipio', '', { shouldValidate: true }) // clear specific city on state change
    if (STATE_COORDS[val]) {
      onLocationSelect(STATE_COORDS[val])
    }
  }

  const [municipios, setMunicipios] = useState<string[]>([])
  
  useEffect(() => {
    if (estado) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`)
        .then(res => res.json())
        .then(data => setMunicipios(data.map((m: any) => m.nome).sort()))
        .catch(() => setMunicipios(['Erro ao carregar']))
    } else {
      setMunicipios([])
    }
  }, [estado])

  return (
    <div className="flex flex-col p-8 min-h-[400px]">
      <div className="flex justify-center mb-6">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin size={24} className="text-primary" />
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Sua Fazenda</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Insira o nome e a localização da propriedade
        </p>
      </div>

      <div className="space-y-4 mb-8 text-left">
        <div className="space-y-1">
          <Label>Nome da Fazenda</Label>
          <Input 
            {...register('localizacao.fazenda')} 
            placeholder="Ex: Fazenda Boa Esperança" 
            className="rounded-xl h-11"
          />
          {(errors.localizacao as any)?.fazenda && <span className="text-xs text-danger">{String((errors.localizacao as any).fazenda.message)}</span>}
        </div>

        <div className="space-y-1">
          <Label>Estado</Label>
          <Select value={estado || ''} onValueChange={handleStateChange}>
            <SelectTrigger className="rounded-xl h-11">
              <SelectValue placeholder="Selecione o estado..." />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(STATE_COORDS).map(uf => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(errors.localizacao as any)?.estado && <span className="text-xs text-danger">{String((errors.localizacao as any).estado.message)}</span>}
        </div>

        <div className="space-y-1">
          <Label>Município</Label>
          <Select 
            value={watch('localizacao.municipio') || ''} 
            onValueChange={(val) => setValue('localizacao.municipio', val, { shouldValidate: true })} 
            disabled={!estado || municipios.length === 0}
          >
            <SelectTrigger className="rounded-xl h-11">
              <SelectValue placeholder={estado ? "Selecione a cidade..." : "Selecione um estado antes"} />
            </SelectTrigger>
            <SelectContent>
              {municipios.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(errors.localizacao as any)?.municipio && <span className="text-xs text-danger">{String((errors.localizacao as any).municipio.message)}</span>}
        </div>
      </div>

      <div className="flex gap-3 mt-auto">
        {onPrev && (
          <Button type="button" variant="outline" className="rounded-xl h-12 w-20" onClick={onPrev}>
            Voltar
          </Button>
        )}
        <Button 
          type="button" 
          className="rounded-xl h-12 flex-1 font-semibold"
          onClick={onNext}
        >
          Criar Fazenda →
        </Button>
      </div>
    </div>
  )
}
