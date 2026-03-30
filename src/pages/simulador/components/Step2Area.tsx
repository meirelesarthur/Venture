import { useEffect, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SimuladorData } from '../schema'
import { ArrowRight, ArrowLeft, UploadCloud, Map as MapIcon, Edit3, CheckCircle2, FileX } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import area from '@turf/area'
import { cn } from '@/lib/utils'

/**
 * Parseia KML e extrai coordenadas de Polygon/LineString/Point
 * Retorna um GeoJSON FeatureCollection
 */
function kmlToGeoJson(kmlText: string): { geojson: any; hectares: number } | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(kmlText, 'text/xml')
    const coordinates: number[][][] = []

    // Suporte a <Polygon> com <coordinates>
    const polygons = doc.querySelectorAll('Polygon')
    polygons.forEach(poly => {
      const coordEl = poly.querySelector('outerBoundaryIs coordinates, coordinates')
      if (!coordEl?.textContent) return
      const coords = coordEl.textContent.trim().split(/\s+/).map(c => {
        const [lng, lat] = c.split(',').map(Number)
        return [lng, lat]
      }).filter(c => !isNaN(c[0]) && !isNaN(c[1]))
      if (coords.length >= 3) coordinates.push(coords)
    })

    if (coordinates.length === 0) return null

    const features = coordinates.map(coords => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [coords] }
    }))

    const geojson = { type: 'FeatureCollection', features }
    const totalArea = features.reduce((acc, f) => acc + area(f as any), 0)
    return { geojson, hectares: totalArea / 10000 }
  } catch {
    return null
  }
}

export function Step2Area({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const methods = useFormContext<SimuladorData>()
  const { register, formState: { errors } } = methods
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const drawnLayersRef = useRef<L.FeatureGroup | null>(null)
  const [mode, setMode] = useState<'manual' | 'map'>('manual')
  const [kmlStatus, setKmlStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [kmlFileName, setKmlFileName] = useState('')

  useEffect(() => {
    if (mode === 'map' && mapRef.current && !mapInstance) {
      const map = L.map(mapRef.current).setView([-12.9714, -50.9297], 5)

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
      }).addTo(map)

      const drawnItems = new L.FeatureGroup()
      map.addLayer(drawnItems)
      drawnLayersRef.current = drawnItems

      const drawControl = new L.Control.Draw({
        draw: {
          polyline: false, circle: false, circlemarker: false, marker: false,
          polygon: { allowIntersection: false, shapeOptions: { color: '#057A8F' } },
          rectangle: { shapeOptions: { color: '#057A8F' } }
        },
        edit: { featureGroup: drawnItems, remove: true }
      })
      map.addControl(drawControl)

      const updateArea = () => {
        let totalHa = 0
        drawnItems.eachLayer((layer: any) => {
          if (layer.toGeoJSON) totalHa += area(layer.toGeoJSON()) / 10000
        })
        methods.setValue('area.hectares', parseFloat(totalHa.toFixed(2)), { shouldValidate: true })
      }

      map.on(L.Draw.Event.CREATED, (e: any) => {
        drawnItems.addLayer(e.layer)
        updateArea()
      })
      map.on(L.Draw.Event.EDITED, updateArea)
      map.on(L.Draw.Event.DELETED, updateArea)

      setMapInstance(map)
    }

    return () => {
      if (mode === 'manual' && mapInstance) {
        mapInstance.remove()
        setMapInstance(null)
        drawnLayersRef.current = null
      }
    }
  }, [mode, mapInstance, methods])

  const handleKmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setKmlFileName(file.name)
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

      // Renderizar no mapa se modo mapa ativo
      if (mapInstance && drawnLayersRef.current) {
        drawnLayersRef.current.clearLayers()
        result.geojson.features.forEach((f: any) => {
          const layer = L.geoJSON(f, { style: { color: '#16A34A', weight: 2 } })
          drawnLayersRef.current!.addLayer(layer)
        })
        try { mapInstance.fitBounds(drawnLayersRef.current.getBounds(), { padding: [20, 20] }) } catch {}
      }
    }
    reader.readAsText(file)
    e.target.value = '' // reset input
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          type="button"
          variant={mode === 'manual' ? 'default' : 'outline'}
          onClick={() => setMode('manual')}
          className="h-16 flex flex-col gap-1 items-center justify-center transition-all"
        >
          <span className={cn("text-base", mode === 'manual' ? 'text-primary-foreground' : 'text-foreground')}>Inserção Manual</span>
          <span className={cn("text-xs font-normal", mode === 'manual' ? 'text-primary-foreground/80' : 'text-muted')}>Digitar hectares</span>
        </Button>
        <Button
          type="button"
          variant={mode === 'map' ? 'default' : 'outline'}
          onClick={() => setMode('map')}
          className="h-16 flex flex-col gap-1 items-center justify-center transition-all"
        >
          <div className="flex items-center gap-2">
            <MapIcon size={16} />
            <span className={cn("text-base", mode === 'map' ? 'text-primary-foreground' : 'text-foreground')}>Mapa Interativo</span>
          </div>
          <span className={cn("text-xs font-normal", mode === 'map' ? 'text-primary-foreground/80' : 'text-muted')}>KML ou Desenho</span>
        </Button>
      </div>

      {mode === 'manual' ? (
        <div className="space-y-5 max-w-sm mx-auto">
          <div className="p-5 border rounded-xl bg-surface/50 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="area.hectares" className="text-base font-medium">Área Total (hectares)</Label>
              <Input id="area.hectares" type="number" step="0.01" className="text-lg py-6" placeholder="Ex: 500"
                {...register('area.hectares', { valueAsNumber: true })} />
              {errors.area?.hectares && <p className="text-sm text-destructive">{errors.area.hectares.message}</p>}
            </div>
            <p className="text-xs text-muted text-center">Insira apenas a área produtiva elegível.</p>
          </div>

          {/* Upload KML mesmo em modo manual */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ou importe um KML para calcular automaticamente</Label>
            <label className={cn(
              'flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
              kmlStatus === 'ok' ? 'border-success/40 bg-success/5' : kmlStatus === 'error' ? 'border-danger/40 bg-danger/5' : 'border-border/60 hover:border-primary/40 hover:bg-primary/5'
            )}>
              <input type="file" accept=".kml" className="hidden" onChange={handleKmlUpload} />
              {kmlStatus === 'ok' ? (
                <><CheckCircle2 size={18} className="text-success flex-shrink-0" /><span className="text-sm text-success font-medium">{kmlFileName} — área calculada!</span></>
              ) : kmlStatus === 'error' ? (
                <><FileX size={18} className="text-danger flex-shrink-0" /><span className="text-sm text-danger">Arquivo inválido. Use um KML com polígono.</span></>
              ) : (
                <><UploadCloud size={18} className="text-muted flex-shrink-0" /><span className="text-sm text-muted">Arraste ou clique para selecionar arquivo .kml</span></>
              )}
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2"><Edit3 size={16} /> Desenhe sua área no mapa</h3>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border border-border/60 bg-surface hover:bg-accent/5 transition-colors text-sm">
              <UploadCloud size={15} className="text-primary" />
              <span className="text-sm font-medium">Importar KML</span>
              <input type="file" accept=".kml" className="hidden" onChange={handleKmlUpload} />
            </label>
          </div>
          {kmlStatus === 'ok' && (
            <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
              <CheckCircle2 size={13} /> {kmlFileName} importado e renderizado no mapa.
            </div>
          )}
          {kmlStatus === 'error' && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              <FileX size={13} /> Arquivo KML inválido. Verifique se contém polígonos.
            </div>
          )}
          <p className="text-xs text-muted">Use as ferramentas no canto esquerdo para desenhar e editar a área. O cálculo em hectares é automático.</p>
          <div ref={mapRef} className="w-full h-[420px] rounded-xl border border-border shadow-inner bg-accent/20 overflow-hidden relative z-0" />
          <div className="max-w-xs ml-auto">
            <Label htmlFor="area.hectares.map" className="text-xs text-muted mb-1 block">Hectares Calculados</Label>
            <Input id="area.hectares.map" type="number" step="0.01" {...register('area.hectares', { valueAsNumber: true })} />
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
