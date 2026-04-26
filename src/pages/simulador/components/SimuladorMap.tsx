import { useEffect } from 'react'
import { Map, useMap, MapControls } from '@/components/ui/map'
import maplibregl from 'maplibre-gl'
import type { StyleSpecification, GeoJSONSource } from 'maplibre-gl'
import type { GeoJSON } from 'geojson'

const satelliteStyle: StyleSpecification = {
  version: 8,
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
    },
  },
  layers: [{ id: 'satellite', type: 'raster', source: 'esri-imagery', minzoom: 0, maxzoom: 19 }],
}

interface FlyToProps {
  center: [number, number] // [lng, lat]
  zoom: number
}

function FlyToManager({ center, zoom }: FlyToProps) {
  const { map } = useMap()
  useEffect(() => {
    if (!map) return
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom()
    const dist = Math.sqrt((currentCenter.lng - center[0]) ** 2 + (currentCenter.lat - center[1]) ** 2)
    if (dist > 0.01 || Math.abs(currentZoom - zoom) > 0.5) {
      map.flyTo({ center, zoom, duration: 1500, essential: true })
    }
  }, [center, zoom, map])
  return null
}

function MapStateSync({ onMove }: { onMove?: (center: [number, number], zoom: number) => void }) {
  const { map } = useMap()
  useEffect(() => {
    if (!map || !onMove) return
    const handleMove = () => {
      const { lng, lat } = map.getCenter()
      onMove([lat, lng], map.getZoom())
    }
    map.on('moveend', handleMove)
    return () => { map.off('moveend', handleMove) }
  }, [map, onMove])
  return null
}

function GeoJsonLayer({ geojson }: { geojson: GeoJSON.FeatureCollection }) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) return

    const sourceId = 'kml-geojson'

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as GeoJSONSource).setData(geojson)
    } else {
      map.addSource(sourceId, { type: 'geojson', data: geojson })
      map.addLayer({ id: 'kml-poly-fill',   type: 'fill',   source: sourceId, paint: { 'fill-color': '#16A34A', 'fill-opacity': 0.3 },                                         filter: ['==', '$type', 'Polygon'] })
      map.addLayer({ id: 'kml-poly-stroke', type: 'line',   source: sourceId, paint: { 'line-color': '#16A34A', 'line-width': 2 },                                              filter: ['in', '$type', 'Polygon', 'LineString'] })
      map.addLayer({ id: 'kml-points',      type: 'circle', source: sourceId, paint: { 'circle-radius': 4, 'circle-color': '#ffffff', 'circle-stroke-color': '#16A34A', 'circle-stroke-width': 2 }, filter: ['==', '$type', 'Point'] })
    }

    // Fit bounds robustly across all geometry types
    try {
      const bounds = new maplibregl.LngLatBounds()
      let hasFeatures = false

      const extendCoord = (c: number[]) => { bounds.extend(c as [number, number]); hasFeatures = true }

      const processGeometry = (geometry: GeoJSON.Geometry) => {
        if (geometry.type === 'Point') {
          extendCoord(geometry.coordinates)
        } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
          geometry.coordinates.forEach(extendCoord)
        } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
          geometry.coordinates.forEach(ring => ring.forEach(extendCoord))
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach(poly => poly.forEach(ring => ring.forEach(extendCoord)))
        } else if (geometry.type === 'GeometryCollection') {
          geometry.geometries.forEach(processGeometry)
        }
      }

      geojson.features.forEach(f => { if (f.geometry) processGeometry(f.geometry) })
      if (hasFeatures) map.fitBounds(bounds, { padding: 80, duration: 2000 })
    } catch (err) {
      console.error('Error fitting bounds:', err)
    }
  }, [map, isLoaded, geojson])

  return null
}

export interface SimuladorMapProps {
  center: [number, number] // [lat, lng] — inverted for MapLibre
  zoom: number
  geojson?: GeoJSON.FeatureCollection
  onMove?: (center: [number, number], zoom: number) => void
}

export function SimuladorMap({ center, zoom, geojson, onMove }: SimuladorMapProps) {
  const lngLat: [number, number] = [center[1], center[0]]

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-black">
      <Map
        styles={{ light: satelliteStyle, dark: satelliteStyle }}
        viewport={{ center: lngLat, zoom }}
      >
        <FlyToManager center={lngLat} zoom={zoom} />
        <MapStateSync onMove={onMove} />
        {geojson && <GeoJsonLayer geojson={geojson} />}
        <div className="absolute inset-0 bg-black/30 pointer-events-none z-[400]" />
        <MapControls position="bottom-right" showZoom />
      </Map>
    </div>
  )
}
