import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Map, useMap } from '@/components/ui/map'
import type { StyleSpecification } from 'maplibre-gl'
import { Button } from '@/components/ui/button'
import { Map as MapIcon, RotateCcw, Check, X } from 'lucide-react'
import area from '@turf/area'
import * as turf from '@turf/helpers'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MapDemarcationOverlayProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (points: [number, number][], hectares: number) => void
  title?: string
  description?: string
  initialCenter?: [number, number]
  initialZoom?: number
}

const satelliteStyle: StyleSpecification = {
  version: 8,
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256
    }
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'esri-imagery',
      minzoom: 0,
      maxzoom: 19
    }
  ]
}

// Internal component to handle map clicks
function MapDrawer({ points, setPoints }: { points: [number, number][]; setPoints: React.Dispatch<React.SetStateAction<[number, number][]>> }) {
  const { map, isLoaded } = useMap()

  // Handle map clicks
  useEffect(() => {
    if (!map || !isLoaded) return

    const handleClick = (e: any) => {
      // Store as [lat, lng] to maintain compatibility with the rest of the application
      setPoints(prev => [...prev, [e.lngLat.lat, e.lngLat.lng]])
    }

    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
    }
  }, [map, isLoaded, setPoints])

  // Handle drawing layers
  useEffect(() => {
    if (!map || !isLoaded) return

    const sourceId = 'demarcation-source'
    
    const features: any[] = []
    
    // Points
    points.forEach((p, i) => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p[1], p[0]] },
        properties: { id: i }
      })
    })

    // Polygon / Line
    if (points.length > 2) {
      const closedCoords = [...points, points[0]].map(p => [p[1], p[0]])
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [closedCoords] },
        properties: {}
      })
    } else if (points.length === 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: points.map(p => [p[1], p[0]]) },
        properties: {}
      })
    }

    const geojson = {
      type: 'FeatureCollection',
      features
    }

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as any).setData(geojson)
    } else {
      map.addSource(sourceId, { type: 'geojson', data: geojson as any })
      
      map.addLayer({
        id: 'draw-poly-fill',
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#057185',
          'fill-opacity': 0.3
        },
        filter: ['==', '$type', 'Polygon']
      })
      
      map.addLayer({
        id: 'draw-poly-stroke',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#057185',
          'line-width': 2
        },
        filter: ['in', '$type', 'Polygon', 'LineString']
      })
      
      map.addLayer({
        id: 'draw-points',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 4,
          'circle-color': '#ffffff',
          'circle-stroke-color': '#057185',
          'circle-stroke-width': 2
        },
        filter: ['==', '$type', 'Point']
      })
    }
  }, [map, isLoaded, points])

  return null
}

export function MapDemarcationOverlay({
  isOpen,
  onClose,
  onComplete,
  title = 'Demarque sua Área',
  description = 'Clique no mapa para criar os pontos do polígono que delimita sua área elegível.',
  initialCenter = [-15.7801, -47.9292],
  initialZoom = 4
}: MapDemarcationOverlayProps) {
  const [points, setPoints] = useState<[number, number][]>([])

  // Reset points when opened
  useEffect(() => {
    if (isOpen) {
      setPoints([])
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleComplete = () => {
    if (points.length < 3) {
      toast.error('Demarque pelo menos 3 pontos para formar uma área.')
      return
    }
    // Turf uses [lng, lat]
    const closedCoords = [...points, points[0]].map(p => [p[1], p[0]])
    const geojson = turf.polygon([closedCoords])
    const calcArea = area(geojson as any) / 10000
    onComplete(points, parseFloat(calcArea.toFixed(2)))
    setPoints([])
  }

  const handleCancel = () => {
    setPoints([])
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background">
      <Map
        styles={{ light: satelliteStyle, dark: satelliteStyle }}
        viewport={{ center: [initialCenter[1], initialCenter[0]], zoom: initialZoom }}
        className="w-full h-full"
      >
        <MapDrawer points={points} setPoints={setPoints} />
      </Map>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] w-full max-w-sm px-4 pointer-events-none">
        <div className="bg-background/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-border/50 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <MapIcon size={18} className="text-primary" /> {title}
            </h3>
            <button onClick={handleCancel} className="text-muted hover:text-foreground">
              <X size={20} />
            </button>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>

          <div className="flex items-center gap-2 bg-surface p-2.5 rounded-xl border border-border/40">
            <span className="text-xs font-semibold text-muted pl-2 uppercase tracking-tight">
              Pontos demarcados: <span className={cn(points.length >= 3 ? "text-primary" : "text-foreground")}>{points.length}</span>
            </span>
            <div className="ml-auto flex gap-2">
              {points.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setPoints([])} className="h-8 px-2 text-xs text-muted hover:text-danger hover:bg-danger/5">
                  <RotateCcw size={12} className="mr-1" /> Limpar
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleCancel} variant="outline" className="flex-1 rounded-xl h-10">
              Cancelar
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 rounded-xl h-10 shadow-md shadow-primary/20"
              disabled={points.length < 3}
            >
              <Check size={16} className="mr-1" /> Concluir
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
