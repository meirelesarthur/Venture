import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface FlyToProps {
  center: [number, number]
  zoom: number
}

function FlyToMap({ center, zoom }: FlyToProps) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 2, easeLinearity: 0.25 })
  }, [center, zoom, map])
  return null
}

interface SimuladorMapProps {
  center: [number, number]
  zoom: number
}

export function SimuladorMap({ center, zoom }: SimuladorMapProps) {
  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />
        <FlyToMap center={center} zoom={zoom} />
      </MapContainer>
      {/* Overlay escuro opcional para garantir a legibilidade das UI on top */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none z-[400]" />
    </div>
  )
}
