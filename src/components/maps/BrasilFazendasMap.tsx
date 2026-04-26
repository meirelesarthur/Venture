import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { StyleSpecification, GeoJSONSource } from 'maplibre-gl'
import type { Fazenda, Talhao, Cliente } from '@/store/types'

// ── Tile style ─────────────────────────────────────────────────────────────────

const LIGHT_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'],
      tileSize: 256,
      attribution: '© CartoDB © OpenStreetMap',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
}

// ── Coordinates ────────────────────────────────────────────────────────────────

const MUNICIPIO_COORDS: Record<string, [number, number]> = {
  'Sorriso':                    [-12.55, -55.72],
  'Lucas do Rio Verde':         [-13.05, -55.90],
  'Cristalina':                 [-16.76, -47.61],
  'Campo Verde':                [-15.54, -55.17],
  'Rondonópolis':               [-16.47, -54.64],
  'Rio Verde':                  [-17.80, -50.93],
  'Barreiras':                  [-12.15, -45.00],
  'Bagé':                       [-31.33, -54.10],
  'Três Lagoas':                [-20.75, -51.68],
  'Cascavel':                   [-24.96, -53.46],
  'Chapada dos Guimarães':      [-15.46, -55.75],
  'Luís Eduardo Magalhães':     [-12.10, -45.79],
  'Santarém':                   [-2.44,  -54.71],
  'Manaus':                     [-3.10,  -60.02],
  'Ariquemes':                  [-9.91,  -63.04],
  'Rio Branco':                 [-9.97,  -67.81],
  'Boa Vista':                  [2.82,   -60.67],
  'Palmas':                     [-10.24, -48.35],
  'Macapá':                     [0.04,   -51.06],
  'Belém':                      [-1.46,  -48.50],
  'Parauapebas':                [-6.07,  -49.90],
  'Parintins':                  [-2.63,  -56.74],
}

const UF_COORDS: Record<string, [number, number]> = {
  AC: [-9.97,  -67.81], AL: [-9.67,  -35.74], AP: [0.03,   -51.07],
  AM: [-3.10,  -60.02], BA: [-12.97, -38.50], CE: [-3.72,  -38.54],
  DF: [-15.78, -47.93], ES: [-20.32, -40.34], GO: [-16.69, -49.26],
  MA: [-2.53,  -44.30], MT: [-15.60, -56.10], MS: [-20.46, -54.62],
  MG: [-19.92, -43.94], PA: [-1.46,  -48.50], PB: [-7.12,  -34.86],
  PR: [-25.43, -49.27], PE: [-8.05,  -34.88], PI: [-5.09,  -42.80],
  RJ: [-22.91, -43.17], RN: [-5.80,  -35.21], RS: [-30.03, -51.23],
  RO: [-8.76,  -63.90], RR: [2.82,   -60.67], SC: [-27.59, -48.55],
  SP: [-23.55, -46.63], SE: [-10.92, -37.07], TO: [-10.18, -48.33],
}

const PRIMARY      = '#057A8F'
const PRIMARY_DARK = '#045F70'

// ── Helpers ────────────────────────────────────────────────────────────────────

function getFarmCoords(f: Fazenda): [number, number] {
  return MUNICIPIO_COORDS[f.municipio] ?? UF_COORDS[f.estado] ?? [-14, -51]
}

function makePolygon(lat: number, lng: number, areaHa: number): [number, number][] {
  const ladoM = Math.sqrt(areaHa * 10_000)
  const dLat  = ladoM / 2 / 111_320
  const dLng  = ladoM / 2 / (111_320 * Math.cos((lat * Math.PI) / 180))
  return [
    [lng - dLng, lat + dLat],
    [lng + dLng, lat + dLat],
    [lng + dLng, lat - dLat],
    [lng - dLng, lat - dLat],
    [lng - dLng, lat + dLat],
  ]
}

// ── Popup HTML ─────────────────────────────────────────────────────────────────

interface FarmProps {
  id: string
  nome: string
  municipio: string
  estado: string
  areaTotalHa: number
  zonaClimatica: string
  clienteNome: string
  statusMRV: string
  projetoCount: number
  controlCount: number
  areaTalhoes: number
}

function mrvStatusStyle(status: string): { color: string; bg: string; label: string } {
  if (status.toLowerCase().includes('aprovad'))  return { color: '#16A34A', bg: '#F0FDF4', label: status }
  if (status.toLowerCase().includes('validaç'))  return { color: '#D97706', bg: '#FFFBEB', label: status }
  if (status.toLowerCase().includes('submiss'))  return { color: '#057A8F', bg: '#F0FDFA', label: status }
  if (status.toLowerCase().includes('pendente')) return { color: '#DC2626', bg: '#FEF2F2', label: status }
  return { color: '#6B7280', bg: '#F9FAFB', label: status }
}

function farmPopupHtml(p: FarmProps): string {
  const zona     = p.zonaClimatica === 'tropical_umido' ? 'Tropical Úmido' : 'Tropical Seco'
  const zonaCol  = p.zonaClimatica === 'tropical_umido' ? PRIMARY : '#D97706'
  const mrv      = mrvStatusStyle(p.statusMRV)
  const socArea  = p.areaTalhoes > 0
    ? `${p.areaTalhoes.toLocaleString('pt-BR')} ha`
    : '—'

  return `
    <div style="font-family:system-ui;width:230px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 8px 24px rgba(0,0,0,0.12);overflow:hidden">

      <!-- Header -->
      <div style="padding:12px 14px 10px;border-bottom:1px solid #f1f5f9">
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:2px;line-height:1.3">${p.nome}</div>
        <div style="font-size:11px;color:#64748b;display:flex;align-items:center;gap:4px">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          ${p.municipio} · ${p.estado}
        </div>
      </div>

      <!-- Metrics grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #f1f5f9">
        <div style="padding:10px 14px;border-right:1px solid #f1f5f9">
          <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Área Total</div>
          <div style="font-size:16px;font-weight:700;color:#0f172a">${p.areaTotalHa.toLocaleString('pt-BR')}<span style="font-size:10px;font-weight:400;color:#94a3b8"> ha</span></div>
        </div>
        <div style="padding:10px 14px">
          <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Talhões MRV</div>
          <div style="font-size:13px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:6px">
            <span style="color:#16A34A">${p.projetoCount}<span style="font-size:10px;font-weight:400;color:#6B7280"> proj</span></span>
            <span style="color:#057A8F">${p.controlCount}<span style="font-size:10px;font-weight:400;color:#6B7280"> ctrl</span></span>
          </div>
        </div>
      </div>

      <!-- Tags row -->
      <div style="padding:8px 14px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #f1f5f9">
        <span style="font-size:10px;font-weight:600;color:${zonaCol};background:${zonaCol}18;padding:2px 7px;border-radius:99px;border:1px solid ${zonaCol}30">${zona}</span>
        <span style="font-size:10px;font-weight:600;color:${mrv.color};background:${mrv.bg};padding:2px 7px;border-radius:99px;border:1px solid ${mrv.color}30">${mrv.label}</span>
      </div>

      <!-- Producer row -->
      <div style="padding:8px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #f1f5f9">
        <div style="width:22px;height:22px;border-radius:50%;background:${PRIMARY};color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${p.clienteNome.charAt(0)}</div>
        <span style="font-size:11px;color:#475569;font-weight:500">${p.clienteNome}</span>
      </div>

      <!-- CTA footer -->
      <div style="padding:8px 14px;background:#f8fafc;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:10px;color:#94a3b8">Área em MRV: ${socArea}</span>
        <span style="font-size:10px;font-weight:600;color:${PRIMARY};display:flex;align-items:center;gap:3px">
          Abrir MRV
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </span>
      </div>
    </div>`
}

function clusterPopupHtml(count: number): string {
  return `
    <div style="font-family:system-ui;padding:10px 14px;background:#fff;border-radius:10px;border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.10)">
      <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:1px">${count} fazendas</div>
      <div style="font-size:11px;color:#94a3b8">Clique para expandir</div>
    </div>`
}

// ── GeoJSON builders ───────────────────────────────────────────────────────────

type FarmFeatureProps = FarmProps

function buildPointsGeoJSON(fazendas: Fazenda[], talhoes: Talhao[], clientes: Cliente[]) {
  return {
    type: 'FeatureCollection' as const,
    features: fazendas.map(f => {
      const [lat, lng]   = getFarmCoords(f)
      const meusTalhoes  = talhoes.filter(t => t.fazendaId === f.id)
      const projetoCount = meusTalhoes.filter(t => t.tipo === 'projeto').length
      const controlCount = meusTalhoes.filter(t => t.tipo === 'control_site').length
      const areaTalhoes  = meusTalhoes.filter(t => t.tipo === 'projeto').reduce((s, t) => s + t.areaHa, 0)
      const cliente      = clientes.find(c => c.id === f.produtorId)

      const props: FarmFeatureProps = {
        id:           f.id,
        nome:         f.nome,
        municipio:    f.municipio,
        estado:       f.estado,
        areaTotalHa:  f.areaTotalHa,
        zonaClimatica: f.zonaClimatica,
        clienteNome:  cliente?.nome ?? 'Produtor',
        statusMRV:    cliente?.statusMRV ?? '—',
        projetoCount,
        controlCount,
        areaTalhoes,
      }

      return {
        type:       'Feature' as const,
        geometry:   { type: 'Point' as const, coordinates: [lng, lat] as [number, number] },
        properties: props,
      }
    }),
  }
}

function buildPolyGeoJSON(fazendas: Fazenda[], talhoes: Talhao[], clientes: Cliente[]) {
  return {
    type: 'FeatureCollection' as const,
    features: fazendas.map(f => {
      const [lat, lng]   = getFarmCoords(f)
      const meusTalhoes  = talhoes.filter(t => t.fazendaId === f.id)
      const projetoCount = meusTalhoes.filter(t => t.tipo === 'projeto').length
      const controlCount = meusTalhoes.filter(t => t.tipo === 'control_site').length
      const areaTalhoes  = meusTalhoes.filter(t => t.tipo === 'projeto').reduce((s, t) => s + t.areaHa, 0)
      const cliente      = clientes.find(c => c.id === f.produtorId)

      const props: FarmFeatureProps = {
        id:           f.id,
        nome:         f.nome,
        municipio:    f.municipio,
        estado:       f.estado,
        areaTotalHa:  f.areaTotalHa,
        zonaClimatica: f.zonaClimatica,
        clienteNome:  cliente?.nome ?? 'Produtor',
        statusMRV:    cliente?.statusMRV ?? '—',
        projetoCount,
        controlCount,
        areaTalhoes,
      }

      return {
        type:       'Feature' as const,
        geometry:   { type: 'Polygon' as const, coordinates: [makePolygon(lat, lng, f.areaTotalHa)] },
        properties: props,
      }
    }),
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  fazendas:       Fazenda[]
  talhoes:        Talhao[]
  clientes:       Cliente[]
  height?:        string
  onFazendaClick?: (fazendaId: string) => void
}

export default function BrasilFazendasMap({ fazendas, talhoes, clientes, height = '320px', onFazendaClick }: Props) {
  const containerRef    = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<maplibregl.Map | null>(null)
  const onClickRef      = useRef(onFazendaClick)
  onClickRef.current    = onFazendaClick

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container:          containerRef.current,
      style:              LIGHT_STYLE,
      center:             [-51, -14],
      zoom:               3.8,
      minZoom:            2.5,
      maxZoom:            14,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('load', () => {
      // ── Sources ────────────────────────────────────────────────────────────
      map.addSource('farms-points', {
        type:           'geojson',
        data:           buildPointsGeoJSON(fazendas, talhoes, clientes),
        cluster:        true,
        clusterMaxZoom: 11,
        clusterRadius:  55,
      })

      map.addSource('farms-poly', {
        type: 'geojson',
        data: buildPolyGeoJSON(fazendas, talhoes, clientes),
      })

      // ── Polygon layers (fade in at zoom 6) ────────────────────────────────
      map.addLayer({
        id: 'poly-fill', type: 'fill', source: 'farms-poly', minzoom: 6,
        paint: {
          'fill-color':   PRIMARY,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0, 7, 0.13],
        },
      })
      map.addLayer({
        id: 'poly-outline', type: 'line', source: 'farms-poly', minzoom: 6,
        paint: {
          'line-color':   PRIMARY_DARK,
          'line-width':   1.5,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0, 7, 0.7],
        },
      })

      // ── Cluster layers ─────────────────────────────────────────────────────
      map.addLayer({
        id: 'cluster-glow', type: 'circle', source: 'farms-points',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': PRIMARY, 'circle-opacity': 0.12, 'circle-blur': 0.8,
          'circle-radius': ['step', ['get', 'point_count'], 30, 5, 42, 15, 54],
        },
      })
      map.addLayer({
        id: 'clusters', type: 'circle', source: 'farms-points',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': PRIMARY, 'circle-opacity': 0.88,
          'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff', 'circle-stroke-opacity': 0.6,
          'circle-radius': ['step', ['get', 'point_count'], 18, 5, 26, 15, 34],
        },
      })
      map.addLayer({
        id: 'cluster-count', type: 'symbol', source: 'farms-points',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 13, 'text-anchor': 'center',
        },
        paint: { 'text-color': '#ffffff' },
      })

      // ── Individual farm layers ─────────────────────────────────────────────
      map.addLayer({
        id: 'unclustered', type: 'circle', source: 'farms-points',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': PRIMARY, 'circle-radius': 9, 'circle-opacity': 0.9,
          'circle-stroke-width': 2.5, 'circle-stroke-color': '#ffffff', 'circle-stroke-opacity': 0.8,
        },
      })
      map.addLayer({
        id: 'unclustered-label', type: 'symbol', source: 'farms-points',
        filter: ['!', ['has', 'point_count']], minzoom: 9,
        layout: {
          'text-field': ['get', 'nome'],
          'text-font': ['Open Sans SemiBold', 'Arial Unicode MS Regular'],
          'text-size': 11, 'text-anchor': 'top', 'text-offset': [0, 1.2], 'text-max-width': 10,
        },
        paint: { 'text-color': '#0f172a', 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
      })

      // ── Interactions ───────────────────────────────────────────────────────
      const popup = new maplibregl.Popup({
        closeButton: false, closeOnClick: false, offset: 16, maxWidth: '260px',
      })

      // Cluster: click → zoom, hover → count popup
      map.on('click', 'clusters', async e => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
        if (!features.length) return
        const clusterId = features[0].properties?.cluster_id as number
        const coords    = (features[0].geometry as GeoJSON.Point).coordinates as [number, number]
        try {
          const zoom = await (map.getSource('farms-points') as GeoJSONSource).getClusterExpansionZoom(clusterId)
          map.easeTo({ center: coords, zoom, duration: 500 })
        } catch {
          map.easeTo({ center: coords, zoom: map.getZoom() + 2, duration: 500 })
        }
      })

      map.on('mouseenter', 'clusters', e => {
        map.getCanvas().style.cursor = 'pointer'
        if (!e.features?.length) return
        popup.setLngLat(e.lngLat).setHTML(clusterPopupHtml(e.features[0].properties?.point_count)).addTo(map)
      })
      map.on('mousemove', 'cluster-count', e => popup.setLngLat(e.lngLat))
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; popup.remove() })

      // Farm: hover → rich popup; click → navigate to MRV
      const showFarm = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        if (!e.features?.length) return
        map.getCanvas().style.cursor = 'pointer'
        popup.setLngLat(e.lngLat).setHTML(farmPopupHtml(e.features[0].properties as FarmProps)).addTo(map)
      }
      const moveFarm = (e: maplibregl.MapMouseEvent) => popup.setLngLat(e.lngLat)
      const hideFarm = () => { map.getCanvas().style.cursor = ''; popup.remove() }

      const clickFarm = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        if (!e.features?.length) return
        const id = (e.features[0].properties as FarmProps).id
        onClickRef.current?.(id)
      }

      for (const layer of ['unclustered', 'poly-fill'] as const) {
        map.on('mouseenter', layer, showFarm)
        map.on('mousemove',  layer, moveFarm)
        map.on('mouseleave', layer, hideFarm)
        map.on('click',      layer, clickFarm)
      }
    })

    return () => { map.remove(); mapRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-sync when data changes
  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    ;(map.getSource('farms-points') as GeoJSONSource | undefined)?.setData(buildPointsGeoJSON(fazendas, talhoes, clientes))
    ;(map.getSource('farms-poly')   as GeoJSONSource | undefined)?.setData(buildPolyGeoJSON(fazendas, talhoes, clientes))
  }, [fazendas, talhoes, clientes])

  return <div ref={containerRef} style={{ height }} className="w-full" />
}
