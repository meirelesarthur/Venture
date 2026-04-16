import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Talhao, ControlSite, MatchResult } from '@/store/data'

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

// Cores de cobertura de fazenda
const COB_CORES = {
  coberta:    '#16A34A',  // verde — 9/9 critérios
  parcial:    '#D97706',  // amarelo — geofísico OK, SOC/manejo pendente
  descoberta: '#DC2626',  // vermelho — sem cobertura
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
  // Novos props opcionais para cobertura
  controlSites?: ControlSite[]
  matchResults?: MatchResult[]
  // Centroide da fazenda para marcador colorido de cobertura
  fazendaLat?: number
  fazendaLng?: number
  fazendaNome?: string
  fazendaId?: string
}

export default function FazendaMap({
  talhoes,
  height = '420px',
  onTalhaoClick,
  interactive = true,
  centerLat,
  centerLng,
  controlSites = [],
  matchResults = [],
  fazendaLat,
  fazendaLng,
  fazendaNome,
  fazendaId,
}: FazendaMapProps) {
  const mapRef    = useRef<L.Map | null>(null)
  const divRef    = useRef<HTMLDivElement>(null)
  const layersRef = useRef<L.Layer[]>([])

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

  // Atualiza polígonos de talhões quando mudarem
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove camadas anteriores
    layersRef.current.forEach(l => map.removeLayer(l))
    layersRef.current = []

    const bounds: [number, number][] = []

    // ── Círculos de cobertura de control sites (250 km) ──────────────────
    for (const cs of controlSites) {
      const lat = cs.centroide_lat
      const lng = cs.centroide_lng
      if (!lat || !lng) continue

      const circle = L.circle([lat, lng], {
        radius: 250_000, // 250 km em metros
        color: '#057A8F',
        fillColor: '#057A8F',
        fillOpacity: 0.05,
        weight: 1.5,
        dashArray: '6 4',
      }).addTo(map)

      circle.bindPopup(`
        <div style="font-family:system-ui;min-width:180px">
          <strong style="font-size:13px">🗺 ${cs.nome}</strong>
          <div style="margin-top:6px;color:#6B7280;font-size:11px;line-height:1.6">
            Zona IPCC: ${cs.zona_climatica_ipcc ?? '—'}<br>
            Textura FAO: ${cs.classe_textural_fao ?? '—'}<br>
            Solo WRB: ${cs.grupo_solo_wrb ?? '—'}<br>
            SOC médio: ${cs.soc_medio_pct?.toFixed(2) ?? '—'}%<br>
            n amostras: ${cs.n_amostras_soc ?? '—'}
          </div>
          <div style="margin-top:4px;font-size:10px;color:#9CA3AF">Cobertura geofísica estimada: 250 km (MVP)</div>
        </div>
      `)

      // Marcador do centroide do CS
      const csIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#057A8F;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        className: '',
      })
      const marker = L.marker([lat, lng], { icon: csIcon }).addTo(map)
      marker.bindTooltip(cs.nome, { permanent: false, direction: 'top' })

      layersRef.current.push(circle, marker)
    }

    // ── Marcador da fazenda com cor de cobertura ──────────────────────────
    if (fazendaLat && fazendaLng && fazendaId) {
      const mrs = matchResults.filter(r => r.fazendaId === fazendaId)
      const best = mrs.reduce<typeof mrs[0] | null>((acc, r) => !acc || r.score > acc.score ? r : acc, null)
      const status = best?.statusCobertura ?? (mrs.length > 0 ? 'descoberta' : null)
      const cor = status ? COB_CORES[status] : '#6B7280'
      const statusLabel = status === 'coberta' ? '✅ Cobertura completa (9/9)' : status === 'parcial' ? '⚠️ Cobertura parcial' : status === 'descoberta' ? '❌ Descoberta' : '—'

      const fazIcon = L.divIcon({
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${cor};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        className: '',
      })
      const fazMarker = L.marker([fazendaLat, fazendaLng], { icon: fazIcon }).addTo(map)
      fazMarker.bindPopup(`
        <div style="font-family:system-ui;min-width:160px">
          <strong>${fazendaNome ?? 'Fazenda'}</strong>
          <div style="margin-top:4px;font-size:12px;color:#6B7280">${statusLabel}</div>
          ${best ? `<div style="margin-top:4px;font-size:11px;color:#6B7280">Score: ${best.score}% · ${best.criteriosPendentes.length} pendente(s)</div>` : ''}
        </div>
      `)
      layersRef.current.push(fazMarker)
    }

    // ── Talhões ───────────────────────────────────────────────────────────
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
      const ptsInfo = talhao.pontosColetados ? `<br>Pts. coletados: ${talhao.pontosColetados}` : ''
      const statusSolo = talhao.dadosValidados
        ? '<span style="color:#16A34A">✓ Solo validado</span>'
        : '<span style="color:#D97706">⚠ Solo pendente</span>'
      const tipoLabel = talhao.tipo === 'projeto' ? 'Projeto' : talhao.tipo === 'control_site' ? 'Control Site' : 'Excluído'

      polygon.bindPopup(`
        <div style="font-family:system-ui;min-width:160px">
          <strong style="font-size:14px">${talhao.nome}</strong>
          <div style="margin-top:4px;color:#6B7280;font-size:12px">
            ${talhao.areaHa} ha · ${tipoLabel}<br>
            ${socInfo}${ptsInfo}<br>
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
  }, [talhoes, controlSites, matchResults, fazendaLat, fazendaLng, fazendaId, onTalhaoClick])

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <div ref={divRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
