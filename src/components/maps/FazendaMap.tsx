import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Talhao } from '@/store/data'

// Fix leaflet marker icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Cores conforme design system do guia (§2.1)
const CORES = {
  projeto:      '#16A34A',  // --map-project (verde)
  control_site: '#057A8F',  // --map-control (azul)
  excluido:     '#9CA3AF',  // --map-excluded (cinza)
}

// Gera polígono aproximado (quadrado) em volta do centro lat/lng
function gerarPoligonoMock(lat: number, lng: number, areaHa: number, tipo: string): [number, number][] {
  // Raio aproximado a partir da área (1 ha ≈ 100m × 100m)
  const ladoM = Math.sqrt(areaHa * 10000)
  const deltaLat = (ladoM / 2) / 111320
  const deltaLng = (ladoM / 2) / (111320 * Math.cos(lat * Math.PI / 180))

  // Offset diferente por tipo para não sobrepor
  const off = tipo === 'control_site' ? 0.003 : tipo === 'excluido' ? -0.003 : 0

  return [
    [lat + deltaLat + off, lng - deltaLng + off],
    [lat + deltaLat + off, lng + deltaLng + off],
    [lat - deltaLat + off, lng + deltaLng + off],
    [lat - deltaLat + off, lng - deltaLng + off],
  ]
}

interface FazendaMapProps {
  talhoes: Talhao[]
  height?: string
  onTalhaoClick?: (talhaoId: string) => void
  interactive?: boolean
  centerLat?: number
  centerLng?: number
}

export default function FazendaMap({
  talhoes,
  height = '420px',
  onTalhaoClick,
  interactive = true,
  centerLat,
  centerLng,
}: FazendaMapProps) {
  const mapRef   = useRef<L.Map | null>(null)
  const divRef   = useRef<HTMLDivElement>(null)
  const layersRef = useRef<L.Polygon[]>([])

  // Centro default: Sorriso-MT (região típica de projeto)
  const defaultLat = centerLat ?? talhoes.find(t => t.latCenter)?.latCenter ?? -12.55
  const defaultLng = centerLng ?? talhoes.find(t => t.lngCenter)?.lngCenter ?? -55.72

  useEffect(() => {
    if (!divRef.current || mapRef.current) return

    const map = L.map(divRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 12,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Atualiza polígonos quando talhões mudarem
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove camadas anteriores
    layersRef.current.forEach(l => map.removeLayer(l))
    layersRef.current = []

    const bounds: [number, number][] = []

    for (const talhao of talhoes) {
      const lat = talhao.latCenter ?? defaultLat
      const lng = talhao.lngCenter ?? defaultLng
      const cor  = CORES[talhao.tipo] ?? CORES.excluido

      const coordenadas = gerarPoligonoMock(lat, lng, talhao.areaHa, talhao.tipo)
      bounds.push(...coordenadas)

      const polygon = L.polygon(coordenadas, {
        color:       cor,
        fillColor:   cor,
        fillOpacity: 0.25,
        weight:      2,
      }).addTo(map)

      // Popup com informações do talhão
      const socInfo = talhao.socPercent ? `SOC: ${talhao.socPercent}%` : 'SOC: não informado'
      const statusSolo = talhao.dadosValidados
        ? '<span style="color:#16A34A">✓ Solo validado</span>'
        : '<span style="color:#D97706">⚠ Solo pendente</span>'
      const tipoLabel = talhao.tipo === 'projeto' ? 'Projeto' : talhao.tipo === 'control_site' ? 'Control Site' : 'Excluído'

      polygon.bindPopup(`
        <div style="font-family:system-ui;min-width:160px">
          <strong style="font-size:14px">${talhao.nome}</strong>
          <div style="margin-top:4px;color:#6B7280;font-size:12px">
            ${talhao.areaHa} ha · ${tipoLabel}<br>
            ${socInfo}<br>
            ${statusSolo}
          </div>
        </div>
      `)

      if (onTalhaoClick) {
        polygon.on('click', () => onTalhaoClick(talhao.id))
      }

      layersRef.current.push(polygon)
    }

    // Centraliza o mapa nos talhões
    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [20, 20] })
      } catch {
        // ignore
      }
    }
  }, [talhoes, onTalhaoClick])

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <div ref={divRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
