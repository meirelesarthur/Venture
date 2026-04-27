import { useRef, useState } from 'react'
import area from '@turf/area'
import { Upload, FileCheck, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FeatureCollection } from 'geojson'

interface KmlUploaderProps {
  onLoad: (result: { areaHa: number; geojson: FeatureCollection; fileName: string }) => void
  label?: string
  className?: string
}

// Parser KML → GeoJSON usando DOMParser nativo (zero dependências extras)
function parseKml(kmlText: string): { coordinates: number[][][]; areaHa: number } | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(kmlText, 'application/xml')
    const parseError = doc.querySelector('parsererror')
    if (parseError) return null

    // Pega todos os elementos <coordinates>
    const coordElements = doc.querySelectorAll('coordinates')
    if (coordElements.length === 0) return null

    const allPolygons: number[][][] = []

    coordElements.forEach(el => {
      const raw = el.textContent?.trim() ?? ''
      const points = raw.split(/\s+/).map(p => {
        const parts = p.split(',')
        const lng = parseFloat(parts[0])
        const lat = parseFloat(parts[1])
        if (!isNaN(lng) && !isNaN(lat)) return [lng, lat]
        return null
      }).filter(Boolean) as number[][]

      if (points.length >= 3) {
        // Fecha o polígono se necessário
        const last = points[points.length - 1]
        const first = points[0]
        if (last[0] !== first[0] || last[1] !== first[1]) {
          points.push(first)
        }
        allPolygons.push(points)
      }
    })

    if (allPolygons.length === 0) return null

    // Calcula área via turf
    const geojson = {
      type: 'FeatureCollection',
      features: allPolygons.map(poly => ({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [poly] },
        properties: {},
      })),
    }

    let areaM2 = 0
    for (const feature of geojson.features) {
      areaM2 += area(feature.geometry as any)
    }
    const areaHa = areaM2 / 10000

    return { coordinates: allPolygons, areaHa }
  } catch {
    return null
  }
}

export default function KmlUploader({ onLoad, label = 'Carregar KML da propriedade', className }: KmlUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [info, setInfo] = useState<{ fileName: string; areaHa: number } | null>(null)

  const processFile = (file: File) => {
    setStatus('loading')
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const result = parseKml(text)
      if (!result) {
        setStatus('error')
        return
      }
      const geojson: import('geojson').FeatureCollection = {
        type: 'FeatureCollection',
        features: result.coordinates.map(poly => ({
          type: 'Feature' as const,
          geometry: { type: 'Polygon' as const, coordinates: [poly] },
          properties: { nome: file.name },
        })),
      }
      setStatus('ok')
      setInfo({ fileName: file.name, areaHa: result.areaHa })
      onLoad({ areaHa: result.areaHa, geojson, fileName: file.name })
    }
    reader.readAsText(file)
  }

  const handleFile = (files: FileList | null) => {
    if (!files || files.length === 0) return
    processFile(files[0])
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center
        ${dragging ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/50 hover:bg-accent/5'}
        ${status === 'ok' ? 'border-success/60 bg-success/5' : ''}
        ${status === 'error' ? 'border-danger/60 bg-danger/5' : ''}
        ${className ?? ''}
      `}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".kml,.kmz"
        className="hidden"
        onChange={e => handleFile(e.target.files)}
      />

      {status === 'idle' && (
        <>
          <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted mt-1">Arraste e solte ou clique · Formatos: .kml, .kmz</p>
        </>
      )}

      {status === 'loading' && (
        <>
          <Loader2 size={28} className="mx-auto mb-2 text-primary animate-spin" />
          <p className="text-sm font-medium text-foreground">Processando arquivo…</p>
          <p className="text-xs text-muted mt-1">Calculando área via turf.js</p>
        </>
      )}

      {status === 'ok' && info && (
        <>
          <FileCheck size={28} className="mx-auto mb-2 text-success" />
          <p className="text-sm font-semibold text-success">{info.fileName}</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {info.areaHa.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha
          </p>
          <p className="text-xs text-muted">Área calculada via turf.js</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-xs rounded-xl"
            onClick={e => { e.stopPropagation(); setStatus('idle'); setInfo(null) }}
          >
            Trocar arquivo
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle size={28} className="mx-auto mb-2 text-danger" />
          <p className="text-sm font-semibold text-danger">Arquivo inválido</p>
          <p className="text-xs text-muted mt-1">Verifique se é um KML válido com coordenadas</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-xs rounded-xl"
            onClick={e => { e.stopPropagation(); setStatus('idle') }}
          >
            Tentar novamente
          </Button>
        </>
      )}
    </div>
  )
}
