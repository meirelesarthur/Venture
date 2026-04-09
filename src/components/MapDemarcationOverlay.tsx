import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents } from 'react-leaflet'
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

// Internal component to handle map clicks
function MapDrawer({ points, setPoints }: { points: [number, number][]; setPoints: (p: [number, number][]) => void }) {
  useMapEvents({
    click(e) {
      setPoints([...points, [e.latlng.lat, e.latlng.lng]])
    }
  })
  return (
    <>
      {points.length > 2 && <Polygon positions={points} color="#057185" fillColor="#057185" fillOpacity={0.3} weight={2} />}
      {points.length === 2 && <Polygon positions={points} color="#057185" weight={2} dashArray="4" />}
      {points.map((p, i) => (
        <CircleMarker key={i} center={p} radius={4} color="#057185" weight={2} fillColor="#ffffff" fillOpacity={1} />
      ))}
    </>
  )
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

  // Portal to body to avoid transform clipping issues
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background">
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
      >
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        <MapDrawer points={points} setPoints={setPoints} />
      </MapContainer>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] w-full max-w-sm px-4">
        <div className="bg-background/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-border/50 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
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
