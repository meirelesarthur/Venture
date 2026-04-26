import { useEffect, useRef } from 'react'
import { Map, useMap, MapMarker, MarkerContent, MarkerPopup, MapControls } from '@/components/ui/map'
import maplibregl from 'maplibre-gl'
import type { Talhao, ControlSite, MatchResult } from '@/store/data'
import type { StyleSpecification, GeoJSONSource } from 'maplibre-gl'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FazendaMapProps {
  talhoes: Talhao[]
  height?: string
  onTalhaoClick?: (id: string) => void
  interactive?: boolean
  centerLat?: number
  centerLng?: number
  controlSites?: ControlSite[]
  matchResults?: MatchResult[]
  fazendaLat?: number
  fazendaLng?: number
  fazendaNome?: string
  fazendaId?: string
  highlightTalhaoId?: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CORES: Record<Talhao['tipo'], string> = {
  projeto:      '#16A34A',
  control_site: '#057A8F',
  excluido:     '#9CA3AF',
}

const COB_CORES: Record<string, string> = {
  coberta:    '#16A34A',
  parcial:    '#D97706',
  descoberta: '#DC2626',
}

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }],
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function gerarPoligonoMock(lat: number, lng: number, areaHa: number, tipo: string): [number, number][] {
  const ladoM = Math.sqrt(areaHa * 10000)
  const deltaLat = ladoM / 2 / 111320
  const deltaLng = ladoM / 2 / (111320 * Math.cos((lat * Math.PI) / 180))
  const off = tipo === 'control_site' ? 0.003 : tipo === 'excluido' ? -0.003 : 0
  return [
    [lng - deltaLng + off, lat + deltaLat + off],
    [lng + deltaLng + off, lat + deltaLat + off],
    [lng + deltaLng + off, lat - deltaLat + off],
    [lng - deltaLng + off, lat - deltaLat + off],
    [lng - deltaLng + off, lat + deltaLat + off],
  ]
}

// ── Polygon Layer (GeoJSON via MapLibre) ───────────────────────────────────────

interface PolyLayerProps {
  talhoes: Talhao[]
  onTalhaoClick?: (id: string) => void
  highlightTalhaoId?: string
}

function buildHoverHtml(talhao: Talhao): string {
  const tipoLabel = { projeto: 'Projeto', control_site: 'Control Site', excluido: 'Excluído' }[talhao.tipo]
  const tipoCor  = CORES[talhao.tipo]
  const socStr   = talhao.socPercent ? `${talhao.socPercent}%` : '—'
  const socCor   = talhao.socPercent ? '#16A34A' : '#9CA3AF'
  const validRow = talhao.dadosValidados
    ? `<div style="padding:6px 14px;background:#F0FDF4;border-top:1px solid #DCFCE7;font-size:11px;color:#16A34A;font-weight:600">✓ Dados validados</div>`
    : ''
  return `
    <div style="font-family:system-ui;min-width:190px;padding:0;background:#fff;border-radius:12px;overflow:hidden;pointer-events:none">
      <div style="padding:12px 14px 10px;border-bottom:1px solid #F3F4F6">
        <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:6px">${talhao.nome}</div>
        <span style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;background:${tipoCor}18;border:1px solid ${tipoCor}50;color:${tipoCor};font-size:11px;font-weight:600">${tipoLabel}</span>
      </div>
      <div style="padding:10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Área</div>
          <div style="font-size:14px;font-weight:700;color:#111">${talhao.areaHa.toLocaleString('pt-BR')} <span style="font-size:11px;font-weight:400;color:#6B7280">ha</span></div>
        </div>
        <div>
          <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">SOC</div>
          <div style="font-size:14px;font-weight:700;color:${socCor}">${socStr}</div>
        </div>
      </div>
      ${validRow}
      <div style="padding:7px 14px;background:#F8FAFC;border-top:1px solid #F3F4F6;font-size:10px;color:#9CA3AF;display:flex;align-items:center;gap:4px">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Clique para abrir no MRV
      </div>
    </div>`
}

function PolyLayer({ talhoes, onTalhaoClick, highlightTalhaoId }: PolyLayerProps) {
  const { map, isLoaded } = useMap()
  const sourceId   = 'talhoes-source'
  const clickRef   = useRef(onTalhaoClick)
  const hoverPopup = useRef<maplibregl.Popup | null>(null)
  clickRef.current = onTalhaoClick

  useEffect(() => {
    if (!map || !isLoaded) return

    const features = talhoes.map(talhao => {
      const lat    = talhao.latCenter ?? -12.55
      const lng    = talhao.lngCenter ?? -55.72
      const coords = gerarPoligonoMock(lat, lng, talhao.areaHa, talhao.tipo)
      return {
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [coords] },
        properties: {
          id:         talhao.id,
          color:      CORES[talhao.tipo],
          highlighted: talhao.id === highlightTalhaoId ? 1 : 0,
          hoverHtml:  buildHoverHtml(talhao),
        },
      }
    })

    const geojson = { type: 'FeatureCollection' as const, features }

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as GeoJSONSource).setData(geojson)
    } else {
      map.addSource(sourceId, { type: 'geojson', data: geojson })
      map.addLayer({
        id: 'talhoes-fill',
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['case', ['==', ['get', 'highlighted'], 1], 0.55, 0.25],
        },
      })
      map.addLayer({
        id: 'talhoes-line',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['==', ['get', 'highlighted'], 1], 3.5, 2],
        },
      })

      // ── Hover popup ────────────────────────────────────────────────────────
      map.on('mouseenter', 'talhoes-fill', e => {
        map.getCanvas().style.cursor = 'pointer'
        if (!e.features?.length) return
        const props = e.features[0].properties as { hoverHtml: string }
        hoverPopup.current?.remove()
        hoverPopup.current = new maplibregl.Popup({
          closeButton:   false,
          closeOnClick:  false,
          className:     'talhao-hover-popup',
          maxWidth:      '240px',
          offset:        12,
        })
          .setLngLat(e.lngLat)
          .setHTML(props.hoverHtml)
          .addTo(map)
      })

      map.on('mousemove', 'talhoes-fill', e => {
        hoverPopup.current?.setLngLat(e.lngLat)
      })

      map.on('mouseleave', 'talhoes-fill', () => {
        map.getCanvas().style.cursor = ''
        hoverPopup.current?.remove()
        hoverPopup.current = null
      })

      // ── Click → navigate ───────────────────────────────────────────────────
      map.on('click', 'talhoes-fill', e => {
        if (!e.features?.length) return
        hoverPopup.current?.remove()
        hoverPopup.current = null
        clickRef.current?.((e.features[0].properties as { id: string }).id)
      })
    }

    // Fit bounds
    const bounds = new maplibregl.LngLatBounds()
    features.forEach(f => f.geometry.coordinates[0].forEach(c => bounds.extend(c)))
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, duration: 1000, maxZoom: 18 })
  }, [map, isLoaded, talhoes, highlightTalhaoId])

  return null
}

// ── Control Site Marker ────────────────────────────────────────────────────────

function ControlSiteMarker({ cs }: { cs: ControlSite }) {
  if (!cs.centroide_lat || !cs.centroide_lng) return null
  return (
    <MapMarker latitude={cs.centroide_lat} longitude={cs.centroide_lng}>
      <MarkerContent>
        <div className="h-3.5 w-3.5 rounded-full border-2 border-white shadow-md bg-[#057A8F]" />
      </MarkerContent>
      <MarkerPopup closeButton>
        <p className="font-semibold text-sm mb-1">{cs.nome}</p>
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Zona IPCC: {cs.zona_climatica_ipcc ?? '—'}</p>
          <p>Textura FAO: {cs.classe_textural_fao ?? '—'}</p>
          <p>Solo WRB: {cs.grupo_solo_wrb ?? '—'}</p>
          <p>SOC médio: {cs.soc_medio_pct != null ? `${cs.soc_medio_pct.toFixed(2)}%` : '—'}</p>
          <p>n amostras: {cs.n_amostras_soc ?? '—'}</p>
        </div>
      </MarkerPopup>
    </MapMarker>
  )
}

// ── Fazenda Marker ─────────────────────────────────────────────────────────────

interface FazendaMarkerProps {
  lat: number
  lng: number
  nome?: string
  fazendaId: string
  matchResults: MatchResult[]
}

function FazendaMarker({ lat, lng, nome, fazendaId, matchResults }: FazendaMarkerProps) {
  const mrs = matchResults.filter(r => r.fazendaId === fazendaId)
  const best = mrs.reduce<MatchResult | null>((acc, r) => (!acc || r.score > acc.score ? r : acc), null)
  const status = best?.statusCobertura ?? (mrs.length > 0 ? 'descoberta' : null)
  const cor = status ? (COB_CORES[status] ?? '#6B7280') : '#6B7280'
  const statusLabel =
    status === 'coberta' ? '✅ Cobertura completa (9/9)' :
    status === 'parcial' ? '⚠️ Cobertura parcial' :
    status === 'descoberta' ? '❌ Descoberta' : '—'

  return (
    <MapMarker latitude={lat} longitude={lng}>
      <MarkerContent>
        <div
          className="h-4 w-4 rounded-full border-2 border-white shadow-lg"
          style={{ background: cor }}
        />
      </MarkerContent>
      <MarkerPopup closeButton>
        <p className="font-semibold text-sm mb-1">{nome ?? 'Fazenda'}</p>
        <p className="text-xs text-muted-foreground">{statusLabel}</p>
        {best && (
          <p className="text-[11px] text-muted-foreground mt-1">
            Score: {best.score}% · {best.criteriosPendentes.length} pendente(s)
          </p>
        )}
      </MarkerPopup>
    </MapMarker>
  )
}

// ── FazendaMap ─────────────────────────────────────────────────────────────────

export default function FazendaMap({
  talhoes,
  height = '420px',
  onTalhaoClick,
  centerLat,
  centerLng,
  controlSites = [],
  matchResults = [],
  fazendaLat,
  fazendaLng,
  fazendaNome,
  fazendaId,
  highlightTalhaoId,
}: FazendaMapProps) {
  const defaultLat = centerLat ?? talhoes.find(t => t.latCenter)?.latCenter ?? -12.55
  const defaultLng = centerLng ?? talhoes.find(t => t.lngCenter)?.lngCenter ?? -55.72

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden">
      <Map
        styles={{ light: OSM_STYLE, dark: OSM_STYLE }}
        viewport={{ center: [defaultLng, defaultLat], zoom: 12 }}
        className="w-full h-full"
      >
        <PolyLayer
          talhoes={talhoes}
          onTalhaoClick={onTalhaoClick}
          highlightTalhaoId={highlightTalhaoId}
        />

        {controlSites.map(cs => (
          <ControlSiteMarker key={cs.id} cs={cs} />
        ))}

        {fazendaLat != null && fazendaLng != null && fazendaId && (
          <FazendaMarker
            lat={fazendaLat}
            lng={fazendaLng}
            nome={fazendaNome}
            fazendaId={fazendaId}
            matchResults={matchResults}
          />
        )}

        <MapControls position="bottom-right" showZoom showLocate />
      </Map>
    </div>
  )
}
