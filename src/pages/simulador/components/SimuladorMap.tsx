import { useEffect } from 'react'
import { Map, useMap } from '@/components/ui/map'
import maplibregl from 'maplibre-gl'
import type { StyleSpecification } from 'maplibre-gl'

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

interface FlyToProps {
  center: [number, number] // [lng, lat]
  zoom: number
}

function FlyToManager({ center, zoom }: FlyToProps) {
  const { map } = useMap()
  useEffect(() => {
    if (map) {
      const currentCenter = map.getCenter()
      const currentZoom = map.getZoom()
      
      // Só faz flyTo se a diferença for significativa para evitar loops ou resets bruscos
      const dist = Math.sqrt(Math.pow(currentCenter.lng - center[0], 2) + Math.pow(currentCenter.lat - center[1], 2))
      if (dist > 0.01 || Math.abs(currentZoom - zoom) > 0.5) {
        map.flyTo({ center, zoom, duration: 1500, essential: true })
      }
    }
  }, [center, zoom, map])
  return null
}

function MapStateSync({ onMove }: { onMove?: (center: [number, number], zoom: number) => void }) {
  const { map } = useMap()
  
  useEffect(() => {
    if (!map || !onMove) return
    
    const handleMove = () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      onMove([center.lat, center.lng], zoom)
    }
    
    map.on('moveend', handleMove)
    return () => { map.off('moveend', handleMove) }
  }, [map, onMove])
  
  return null
}

interface SimuladorMapProps {
  center: [number, number] // Vindo do SimuladorPage como [lat, lng], precisa inverter
  zoom: number
  geojson?: any
  onMove?: (center: [number, number], zoom: number) => void
}

function GeoJsonLayer({ geojson }: { geojson: any }) {
  const { map, isLoaded } = useMap()
  
  useEffect(() => {
    if (!map || !isLoaded || !geojson) return
    
    const sourceId = 'kml-geojson'
    
    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson)
    } else {
      map.addSource(sourceId, { type: 'geojson', data: geojson })
      
      map.addLayer({
        id: 'kml-poly-fill',
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#16A34A',
          'fill-opacity': 0.3
        },
        filter: ['==', '$type', 'Polygon']
      })
      
      map.addLayer({
        id: 'kml-poly-stroke',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#16A34A',
          'line-width': 2
        },
        filter: ['in', '$type', 'Polygon', 'LineString']
      })
      
      map.addLayer({
        id: 'kml-points',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 4,
          'circle-color': '#ffffff',
          'circle-stroke-color': '#16A34A',
          'circle-stroke-width': 2
        },
        filter: ['==', '$type', 'Point']
      })
    }
    
    // Fit bounds robusto
    try {
      const bounds = new maplibregl.LngLatBounds()
      let hasFeatures = false
      
      const processGeometry = (geometry: any) => {
        if (!geometry) return
        if (geometry.type === 'Point') {
          bounds.extend(geometry.coordinates)
          hasFeatures = true
        } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
          geometry.coordinates.forEach((c: any) => {
            bounds.extend(c)
            hasFeatures = true
          })
        } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
          geometry.coordinates.forEach((ring: any) => {
            ring.forEach((c: any) => {
              bounds.extend(c)
              hasFeatures = true
            })
          })
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach((poly: any) => {
            poly.forEach((ring: any) => {
              ring.forEach((c: any) => {
                bounds.extend(c)
                hasFeatures = true
              })
            })
          })
        } else if (geometry.type === 'GeometryCollection') {
          geometry.geometries.forEach(processGeometry)
        }
      }

      geojson.features.forEach((f: any) => processGeometry(f.geometry))

      if (hasFeatures) {
        map.fitBounds(bounds, { padding: 80, duration: 2000 })
      }
    } catch (err) {
      console.error('Error fitting bounds:', err)
    }
  }, [map, isLoaded, geojson])
  
  return null
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
        {/* Overlay escuro opcional para garantir a legibilidade das UI on top */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none z-[400]" />
      </Map>
    </div>
  )
}
