import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SimuladorData } from '../schema'
import { ArrowRight, ArrowLeft, UploadCloud, CheckCircle2, FileX, Map as MapIcon } from 'lucide-react'
import area from '@turf/area'
import type { FeatureCollection, Feature } from 'geojson'
import { cn } from '@/lib/utils'
import { MapDemarcationOverlay } from '@/components/MapDemarcationOverlay'

import { kml } from '@tmcw/togeojson'

/**
 * Parseia KML e extrai coordenadas de Polygon/LineString/Point
 * Retorna um GeoJSON FeatureCollection usando togeojson
 */
function kmlToGeoJson(kmlText: string): { geojson: FeatureCollection; hectares: number } | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(kmlText, 'text/xml')
    const geojson = kml(doc) as FeatureCollection

    if (!geojson || !geojson.features || geojson.features.length === 0) return null

    const totalArea = geojson.features.reduce((acc: number, f: Feature) => {
      if (f.geometry && f.geometry.type === 'Polygon') {
        return acc + area(f)
      }
      return acc
    }, 0)

    return { geojson, hectares: totalArea / 10000 }
  } catch {
    return null
  }
}

export function Step2Area({ 
  onNext, 
  onPrev, 
  onMapEditToggle, 
  onLocationSelect: _onLocationSelect,
  onGeoJsonSelect
}: { 
  onNext: () => void; 
  onPrev: () => void; 
  onMapEditToggle?: (active: boolean) => void; 
  onLocationSelect?: (coord: [number, number]) => void;
  onGeoJsonSelect?: (geojson: FeatureCollection) => void;
}) {
  const methods = useFormContext<SimuladorData>()
  const { register, formState: { errors }, watch } = methods
  const [kmlStatus, setKmlStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [isDrawing, setIsDrawing] = useState(false)

  // Get current location coords for initial map position
  const estado = watch('localizacao.estado')
  const municipio = watch('localizacao.municipio')

  // Toggle map drawing mode
  const handleMapToggle = (active: boolean) => {
    setIsDrawing(active)
    if (onMapEditToggle) onMapEditToggle(active)
  }

  const handleCompleteDrawing = (_points: [number, number][], hectares: number) => {
    methods.setValue('area.hectares', hectares, { shouldValidate: true })
    setKmlStatus('ok')
    handleMapToggle(false)
  }

  const handleKmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const result = kmlToGeoJson(text)
      if (!result) {
        setKmlStatus('error')
        return
      }
      setKmlStatus('ok')
      methods.setValue('area.hectares', parseFloat(result.hectares.toFixed(2)), { shouldValidate: true })
      
      if (onGeoJsonSelect) {
        onGeoJsonSelect(result.geojson)
      }
    }
    reader.readAsText(file)
    e.target.value = '' // reset input
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Área do Projeto</h2>
        <p className="text-sm text-muted-foreground mt-1">Informe a área total elegível.</p>
      </div>

      <div className="space-y-6 max-w-sm mx-auto w-full">
        {/* Upload KML */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Demarque a área elegível (Opcional)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-20 flex-col gap-2 rounded-xl text-border hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-colors" onClick={() => handleMapToggle(true)}>
              <MapIcon size={20} />
              <span className="text-xs">Desenhar no Mapa</span>
            </Button>
            
            <label className={cn(
              'flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
              kmlStatus === 'ok' ? 'border-success/40 bg-success/5 text-success' : kmlStatus === 'error' ? 'border-danger/40 bg-danger/5 text-danger' : 'border-border/60 hover:border-primary/40 hover:bg-primary/5 text-muted'
            )}>
              <input type="file" accept=".kml" className="hidden" onChange={handleKmlUpload} />
              {kmlStatus === 'ok' ? (
                <><CheckCircle2 size={20} /><span className="text-xs font-medium text-center">Calculado!</span></>
              ) : kmlStatus === 'error' ? (
                <><FileX size={20} /><span className="text-xs text-center">Inválido</span></>
              ) : (
                <><UploadCloud size={20} /><span className="text-xs text-center">Arquivo .KML</span></>
              )}
            </label>
          </div>
        </div>

        <div className="p-5 border rounded-xl bg-surface/50 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="area.hectares" className="text-base font-medium">Área Total (hectares) *</Label>
            <Input id="area.hectares" type="number" step="0.01" className="text-lg py-6" placeholder="Ex: 500"
              {...register('area.hectares', { valueAsNumber: true })} />
            {errors.area?.hectares && <p className="text-sm text-destructive">{errors.area.hectares.message}</p>}
          </div>
          <p className="text-xs text-muted text-center">
            Mínimo aceito de <strong className="text-primary">500 hectares</strong> de área elegível.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-auto pt-6">
        <Button type="button" variant="outline" onClick={onPrev} className="rounded-xl h-12 w-20">
          <ArrowLeft size={16} />
        </Button>
        <Button type="button" onClick={onNext} className="rounded-xl h-12 flex-1 font-semibold">
          Próximo <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>

      {/* Map Drawing Portal Overlay */}
      <MapDemarcationOverlay
        isOpen={isDrawing}
        onClose={() => handleMapToggle(false)}
        onComplete={handleCompleteDrawing}
        title="Desenhar no Mapa"
        description={`Demarque a área da fazenda em ${municipio || 'sua região'} / ${estado || ''}.`}
      />
    </div>
  )
}

