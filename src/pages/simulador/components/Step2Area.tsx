import { useEffect, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SimuladorData } from '../schema'
import { ArrowRight, ArrowLeft, UploadCloud, Map as MapIcon, Edit3 } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import area from '@turf/area'
import { cn } from '@/lib/utils'

export function Step2Area({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const methods = useFormContext<SimuladorData>()
  const { register, formState: { errors } } = methods
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const [mode, setMode] = useState<'manual' | 'map'>('manual')

  useEffect(() => {
    if (mode === 'map' && mapRef.current && !mapInstance) {
      // Initialize basic leaflet map pointing to typical farm regions in Brazil
      const map = L.map(mapRef.current).setView([-12.9714, -50.9297], 5) // Center on central Brazil
      
      // Satellite/Hybrid like imagery (using ESRI World Imagery for a farm look)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }).addTo(map)

      // Initialize the FeatureGroup to store editable layers
      const drawnItems = new L.FeatureGroup()
      map.addLayer(drawnItems)

      // Initialize the draw control
      const drawControl = new L.Control.Draw({
        draw: {
          polyline: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: 'Polígonos não podem se interceptar!'
            },
            shapeOptions: {
              color: '#10b981' // primary color roughly
            }
          },
          rectangle: {
            shapeOptions: {
              color: '#10b981'
            }
          }
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      })
      map.addControl(drawControl)

      // Event listener for when a polygon is drawn
      map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer

        // if there's already a drawn item, we can clear it to keep only 1 area, or accumulate.
        // For simplicity, let's just clear and keep the new one (1 plot per lead simulation).
        drawnItems.clearLayers()
        drawnItems.addLayer(layer)

        // Calculate area using Turf
        const geojson = layer.toGeoJSON()
        const squareMeters = area(geojson)
        const hectaresStr = (squareMeters / 10000).toFixed(2)
        
        // Update the form value
        const { setValue } = methods
        if (setValue) {
           setValue('area.hectares', Number(hectaresStr), { shouldValidate: true })
        }
      })

      // Event listener for editing a polygon
      map.on(L.Draw.Event.EDITED, (e: any) => {
        const layers = e.layers
        layers.eachLayer((layer: any) => {
          const geojson = layer.toGeoJSON()
          const squareMeters = area(geojson)
          const hectaresStr = (squareMeters / 10000).toFixed(2)
          
          const { setValue } = methods
          if (setValue) {
            setValue('area.hectares', Number(hectaresStr), { shouldValidate: true })
          }
        })
      })

      // Event listener for removing
      map.on(L.Draw.Event.DELETED, () => {
         const { setValue } = methods
         if (setValue) {
           setValue('area.hectares', 0, { shouldValidate: true })
         }
      })

      setMapInstance(map)
    }

    return () => {
      if (mode === 'manual' && mapInstance) {
        mapInstance.remove()
        setMapInstance(null)
      }
    }
  }, [mode, mapInstance])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button 
          type="button" 
          variant={mode === 'manual' ? 'default' : 'outline'}
          onClick={() => setMode('manual')}
          className="h-16 flex flex-col gap-1 items-center justify-center transition-all bg-surface"
        >
          <span className={cn("text-base", mode === 'manual' ? 'text-primary-foreground' : 'text-foreground')}>Inserção Manual</span>
          <span className={cn("text-xs font-normal", mode === 'manual' ? 'text-primary-foreground/80' : 'text-muted')}>Digitar hectares</span>
        </Button>
        <Button 
          type="button" 
          variant={mode === 'map' ? 'default' : 'outline'}
          onClick={() => setMode('map')}
          className="h-16 flex flex-col gap-1 items-center justify-center transition-all bg-surface"
        >
          <div className="flex items-center gap-2">
            <MapIcon size={16} />
            <span className={cn("text-base", mode === 'map' ? 'text-primary-foreground' : 'text-foreground')}>Mapa Interativo</span>
          </div>
          <span className={cn("text-xs font-normal", mode === 'map' ? 'text-primary-foreground/80' : 'text-muted')}>KML ou Desenho</span>
        </Button>
      </div>

      {mode === 'manual' ? (
        <div className="space-y-4 max-w-sm mx-auto p-4 border rounded-xl bg-surface/50">
          <div className="space-y-2">
            <Label htmlFor="area.hectares" className="text-lg">Área Total (Equivalente em Hectares)</Label>
            <Input id="area.hectares" type="number" step="0.01" className="text-lg py-6" placeholder="Ex: 500" {...register('area.hectares', { valueAsNumber: true })} />
            {errors.area?.hectares && <p className="text-sm text-destructive">{errors.area.hectares.message}</p>}
          </div>
          <p className="text-xs text-muted text-center pt-2">
            Insira apenas a área produtiva elegível.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2"><Edit3 size={16} /> Desenhe sua área no mapa</h3>
            <Button type="button" variant="secondary" size="sm" className="gap-2 text-xs">
              <UploadCloud size={14} /> Importar KML
            </Button>
          </div>
          <p className="text-xs text-muted mb-2">Utilize as ferramentas no canto esquerdo do mapa para desenhar o polígono da sua propriedade rural. O cálculo em hectares será feito automaticamente.</p>
          <div 
            ref={mapRef} 
            className="w-full h-[400px] rounded-xl border border-border shadow-inner bg-accent/20 overflow-hidden relative z-0" 
          />
          <div className="max-w-xs ml-auto">
            <Label htmlFor="area.hectares" className="text-xs text-muted mb-1 block">Hectares Calculados</Label>
            <Input id="area.hectares" type="number" step="0.01" {...register('area.hectares', { valueAsNumber: true })} />
            {errors.area?.hectares && <p className="text-sm text-destructive">{errors.area.hectares.message}</p>}
          </div>
        </div>
      )}

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
