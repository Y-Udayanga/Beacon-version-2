import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { Emergency } from '@/lib/api'
import { cn, severityColor, timeAgo } from '@/lib/utils'
import { Flame, Heart, Shield, CloudLightning, AlertTriangle } from 'lucide-react'

// Fix for default Leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapViewProps {
  emergencies: Emergency[]
  onCardClick: (e: Emergency) => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  fire: <Flame size={14} />,
  medical: <Heart size={14} />,
  crime: <Shield size={14} />,
  natural_disaster: <CloudLightning size={14} />,
  other: <AlertTriangle size={14} />,
}

// Custom icon creator based on severity
const createCustomIcon = (severity: number) => {
  const colorClass = severityColor(severity)
  // Extract background color from class (e.g. bg-red-500)
  // We'll just use simple colors for the marker
  let color = '#3b82f6' // Default blue
  if (severity === 5) color = '#ef4444'
  else if (severity === 4) color = '#f97316'
  else if (severity === 3) color = '#eab308'
  else if (severity === 2) color = '#22c55e'
  
  const markerHtml = `
    <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
      ${severity}
    </div>
  `
  
  return L.divIcon({
    html: markerHtml,
    className: 'custom-leaflet-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// Component to fit map to emergencies — only runs ONCE on initial load.
// Subsequent realtime polls do NOT reset the viewport so the user can freely pan/zoom.
function MapUpdater({ emergencies }: { emergencies: Emergency[] }) {
  const map = useMap()
  const hasFit = useRef(false)
  
  useEffect(() => {
    if (hasFit.current) return // Don't re-fit after the first successful fit
    const validEmergencies = emergencies.filter(e => e.location_lat != null && e.location_lng != null)
    if (validEmergencies.length > 0) {
      const bounds = L.latLngBounds(validEmergencies.map(e => [e.location_lat!, e.location_lng!]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
      hasFit.current = true
    }
  }, [emergencies, map])
  
  return null
}

export default function MapView({ emergencies, onCardClick }: MapViewProps) {
  // Default center (can be somewhere generic if no emergencies)
  const defaultCenter: [number, number] = [39.8283, -98.5795] // Center of US
  
  const validEmergencies = emergencies.filter(e => e.location_lat != null && e.location_lng != null)
  const initialCenter = validEmergencies.length > 0 
    ? [validEmergencies[0].location_lat!, validEmergencies[0].location_lng!] as [number, number]
    : defaultCenter

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border">
      <MapContainer 
        center={initialCenter} 
        zoom={4} 
        style={{ height: '100%', width: '100%', zIndex: 10 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater emergencies={validEmergencies} />
        
        {validEmergencies.map((emergency) => (
          <Marker 
            key={emergency.id} 
            position={[emergency.location_lat!, emergency.location_lng!]}
            icon={createCustomIcon(emergency.severity)}
            eventHandlers={{
              click: () => onCardClick(emergency)
            }}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                  <span className={cn('px-2 py-0.5 rounded text-xs font-bold text-white', severityColor(emergency.severity))}>
                    Sev {emergency.severity}
                  </span>
                  <span className="flex items-center gap-1 text-xs capitalize text-muted-foreground">
                    {categoryIcons[emergency.category] || categoryIcons.other}
                    {emergency.category?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm line-clamp-2 mb-2">
                  {emergency.description || 'No description provided.'}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">{timeAgo(emergency.created_at)}</span>
                  <button 
                    onClick={() => onCardClick(emergency)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
