import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function makeIcon(color, emoji) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px;height:36px;
        background:${color};
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:14px;line-height:1">${emoji}</span>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

function FitBounds({ polyline, origin, pickup, dropoff }) {
  const map = useMap()
  useEffect(() => {
    const pts = []
    if (polyline?.length) pts.push(...polyline.map(c => [c[0], c[1]]))
    if (origin?.coords) pts.push(origin.coords)
    if (pickup?.coords) pts.push(pickup.coords)
    if (dropoff?.coords) pts.push(dropoff.coords)
    if (pts.length > 1) {
      map.fitBounds(pts, { padding: [40, 40] })
    } else if (pts.length === 1) {
      map.setView(pts[0], 8)
    }
  }, [map, polyline, origin, pickup, dropoff])
  return null
}

export default function RouteMap({ route }) {
  const { origin, pickup, dropoff, polyline } = route

  const center = origin?.coords || [39.5, -98.35]

  const greenIcon = makeIcon('#4ade80', '🚛')
  const blueIcon = makeIcon('#60a5fa', '📦')
  const amberIcon = makeIcon('#fbbf24', '🏁')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-lg">Route Map</h2>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /> Current</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Pickup</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Dropoff</span>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ height: 420, border: '1px solid #2a2f3f' }}>
        <MapContainer
          center={center}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />

          {polyline && polyline.length > 1 && (
            <Polyline
              positions={polyline.map(c => [c[0], c[1]])}
              pathOptions={{ color: '#4455ff', weight: 4, opacity: 0.85 }}
            />
          )}

          {origin?.coords && (
            <Marker position={origin.coords} icon={greenIcon}>
              <Popup>
                <div style={{ color: '#e2e8f0', background: '#20242f', padding: '4px' }}>
                  <strong style={{ color: '#4ade80' }}>🚛 Current Location</strong><br />
                  {origin.label}
                </div>
              </Popup>
            </Marker>
          )}

          {pickup?.coords && (
            <Marker position={pickup.coords} icon={blueIcon}>
              <Popup>
                <div style={{ color: '#e2e8f0', background: '#20242f', padding: '4px' }}>
                  <strong style={{ color: '#60a5fa' }}>📦 Pickup</strong><br />
                  {pickup.label}
                </div>
              </Popup>
            </Marker>
          )}

          {dropoff?.coords && (
            <Marker position={dropoff.coords} icon={amberIcon}>
              <Popup>
                <div style={{ color: '#e2e8f0', background: '#20242f', padding: '4px' }}>
                  <strong style={{ color: '#fbbf24' }}>🏁 Dropoff</strong><br />
                  {dropoff.label}
                </div>
              </Popup>
            </Marker>
          )}

          <FitBounds polyline={polyline} origin={origin} pickup={pickup} dropoff={dropoff} />
        </MapContainer>
      </div>

      {/* Route stats bar */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        {[
          { label: 'Total Distance', value: `${route.distance_miles?.toLocaleString()} mi` },
          { label: 'Est. Drive Time', value: formatHours(route.duration_hours) },
          { label: 'Avg Speed', value: '55 mph' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg px-4 py-3 text-center" style={{ background: '#1a1d27', border: '1px solid #2a2f3f' }}>
            <div className="text-white font-semibold">{value}</div>
            <div className="text-slate-600 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatHours(h) {
  if (!h) return '—'
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return `${hrs}h ${String(mins).padStart(2, '0')}m`
}
