import { useEffect, useRef, useState } from 'react'
import { Map, useMap } from '@/components/ui/map'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Talhao, ControlSite, MatchResult } from '@/store/data'

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
  const ladoM = Math.sqrt(areaHa * 10000)
  const deltaLat = (ladoM / 2) / 111320
  const deltaLng = (ladoM / 2) / (111320 * Math.cos(lat * Math.PI / 180))
  const off = tipo === 'control_site' ? 0.003 : tipo === 'excluido' ? -0.003 : 0

  return [
    [lng - deltaLng + off, lat + deltaLat + off], // [lng, lat] para MapLibre/GeoJSON
    [lng + deltaLng + off, lat + deltaLat + off],
    [lng + deltaLng + off, lat - deltaLat + off],
    [lng - deltaLng + off, lat - deltaLat + off],
    [lng - deltaLng + off, lat + deltaLat + off], // fechar
  ]
}

function MapLayers({
  talhoes,
  controlSites,
  matchResults,
  fazendaLat,
  fazendaLng,
  fazendaNome,
  fazendaId,
  onTalhaoClick,
  highlightTalhaoId,
}: any) {
  const { map, isLoaded } = useMap()
  const markersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!map || !isLoaded) return

    // Limpar markers anteriores
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const sourceId = 'talhoes-source'
    const features: any[] = []
    const bounds = new maplibregl.LngLatBounds()
    let hasBounds = false

    // ── Talhões ───────────────────────────────────────────────────────────
    for (const talhao of talhoes) {
      const lat = talhao.latCenter ?? -12.55
      const lng = talhao.lngCenter ?? -55.72
      const cor  = CORES[talhao.tipo as keyof typeof CORES] ?? CORES.excluido

      const coords = gerarPoligonoMock(lat, lng, talhao.areaHa, talhao.tipo)
      coords.forEach(c => bounds.extend(c as [number, number]))
      hasBounds = true

      const socInfo = talhao.socPercent ? `SOC: ${talhao.socPercent}%` : 'SOC: não informado'
      const ptsInfo = talhao.pontosColetados ? `<br>Pts. coletados: ${talhao.pontosColetados}` : ''
      const statusSolo = talhao.dadosValidados
        ? '<span style="color:#16A34A">✓ Solo validado</span>'
        : '<span style="color:#D97706">⚠ Solo pendente</span>'
      const tipoLabel = talhao.tipo === 'projeto' ? 'Projeto' : talhao.tipo === 'control_site' ? 'Control Site' : 'Excluído'

      const desc = `
        <div style="font-family:system-ui;min-width:160px;padding:4px">
          <strong style="font-size:14px">${talhao.nome}</strong>
          <div style="margin-top:4px;color:#6B7280;font-size:12px">
            ${talhao.areaHa} ha · ${tipoLabel}<br>
            ${socInfo}${ptsInfo}<br>
            ${statusSolo}
          </div>
        </div>
      `

      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: { id: talhao.id, color: cor, description: desc, highlighted: talhao.id === highlightTalhaoId ? 1 : 0 }
      })
    }

    const geojson = { type: 'FeatureCollection', features }

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson as any)
    } else {
      map.addSource(sourceId, { type: 'geojson', data: geojson as any })
      
      map.addLayer({
        id: 'talhoes-fill',
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['case', ['==', ['get', 'highlighted'], 1], 0.55, 0.25]
        }
      })

      map.addLayer({
        id: 'talhoes-line',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['==', ['get', 'highlighted'], 1], 3.5, 2]
        }
      })

      // Click event for polygons
      map.on('click', 'talhoes-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const { description, id } = feature.properties as any
        
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(description)
          .addTo(map)

        if (onTalhaoClick) {
          onTalhaoClick(id)
        }
      })

      // Cursor change
      map.on('mouseenter', 'talhoes-fill', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'talhoes-fill', () => { map.getCanvas().style.cursor = '' })
    }

    // ── Círculos de cobertura de control sites (250 km) ──────────────────
    for (const cs of controlSites) {
      const lat = cs.centroide_lat
      const lng = cs.centroide_lng
      if (!lat || !lng) continue
      hasBounds = true
      bounds.extend([lng, lat])

      // Para desenhar círculos km precisos, criaríamos um buffer turf, mas podemos usar CircleMarker de maplibre para simplificar no MVP
      // Criar marcador HTML
      const el = document.createElement('div')
      el.style.width = '14px'
      el.style.height = '14px'
      el.style.borderRadius = '50%'
      el.style.background = '#057A8F'
      el.style.border = '2px solid white'
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)'

      const popupHtml = `
        <div style="font-family:system-ui;min-width:180px;padding:4px">
          <strong style="font-size:13px">🗺 ${cs.nome}</strong>
          <div style="margin-top:6px;color:#6B7280;font-size:11px;line-height:1.6">
            Zona IPCC: ${cs.zona_climatica_ipcc ?? '—'}<br>
            Textura FAO: ${cs.classe_textural_fao ?? '—'}<br>
            Solo WRB: ${cs.grupo_solo_wrb ?? '—'}<br>
            SOC médio: ${cs.soc_medio_pct?.toFixed(2) ?? '—'}%<br>
            n amostras: ${cs.n_amostras_soc ?? '—'}
          </div>
        </div>
      `

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(popupHtml))
        .addTo(map)
      markersRef.current.push(marker)
    }

    // ── Marcador da fazenda com cor de cobertura ──────────────────────────
    if (fazendaLat && fazendaLng && fazendaId) {
      hasBounds = true
      bounds.extend([fazendaLng, fazendaLat])

      const mrs = matchResults.filter((r: any) => r.fazendaId === fazendaId)
      const best = mrs.reduce<any>((acc: any, r: any) => !acc || r.score > acc.score ? r : acc, null)
      const status = best?.statusCobertura ?? (mrs.length > 0 ? 'descoberta' : null)
      const cor = status ? COB_CORES[status as keyof typeof COB_CORES] : '#6B7280'
      const statusLabel = status === 'coberta' ? '✅ Cobertura completa (9/9)' : status === 'parcial' ? '⚠️ Cobertura parcial' : status === 'descoberta' ? '❌ Descoberta' : '—'

      const el = document.createElement('div')
      el.style.width = '16px'
      el.style.height = '16px'
      el.style.borderRadius = '50%'
      el.style.background = cor
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'

      const popupHtml = `
        <div style="font-family:system-ui;min-width:160px;padding:4px">
          <strong>${fazendaNome ?? 'Fazenda'}</strong>
          <div style="margin-top:4px;font-size:12px;color:#6B7280">${statusLabel}</div>
          ${best ? `<div style="margin-top:4px;font-size:11px;color:#6B7280">Score: ${best.score}% · ${best.criteriosPendentes.length} pendente(s)</div>` : ''}
        </div>
      `

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([fazendaLng, fazendaLat])
        .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(popupHtml))
        .addTo(map)
      markersRef.current.push(marker)
    }

    if (hasBounds) {
      map.fitBounds(bounds, { padding: 60, duration: 1000, maxZoom: 18 })
    }
  }, [map, isLoaded, talhoes, controlSites, matchResults, fazendaLat, fazendaLng, fazendaId, onTalhaoClick, highlightTalhaoId])

  return null
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
  highlightTalhaoId,
}: FazendaMapProps & { highlightTalhaoId?: string }) {
  // Centro default
  const defaultLat = centerLat ?? talhoes.find(t => t.latCenter)?.latCenter ?? -12.55
  const defaultLng = centerLng ?? talhoes.find(t => t.lngCenter)?.lngCenter ?? -55.72

  // OpenStreetMap style para MapLibre
  const osmStyle = {
    version: 8 as 8,
    sources: {
      osm: {
        type: 'raster' as 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap'
      }
    },
    layers: [
      {
        id: 'osm',
        type: 'raster' as 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  }

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <Map
        styles={{ light: osmStyle, dark: osmStyle }}
        viewport={{ center: [defaultLng, defaultLat], zoom: 12 }}
        className="w-full h-full"
      >
        <MapLayers
          talhoes={talhoes}
          controlSites={controlSites}
          matchResults={matchResults}
          fazendaLat={fazendaLat}
          fazendaLng={fazendaLng}
          fazendaNome={fazendaNome}
          fazendaId={fazendaId}
          onTalhaoClick={onTalhaoClick}
          highlightTalhaoId={highlightTalhaoId}
        />
      </Map>
    </div>
  )
}
