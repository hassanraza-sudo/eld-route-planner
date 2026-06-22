import { FiDroplet, FiMoon, FiMapPin } from 'react-icons/fi'

export default function StopsPanel({ stops }) {
  const { fuel_stops = [], rest_stops = [] } = stops

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Fuel Stops */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a2f3f' }}>
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: '#1a1d27', borderBottom: '1px solid #2a2f3f' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#f472b615' }}>
            <FiDroplet size={13} style={{ color: '#f472b6' }} />
          </div>
          <div>
            <div className="text-white text-sm font-medium">Fuel Stops</div>
            <div className="text-slate-600 text-xs">Every 1,000 miles</div>
          </div>
          <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#f472b615', color: '#f472b6', border: '1px solid #f472b630' }}>
            {fuel_stops.length}
          </span>
        </div>
        <div style={{ background: '#20242f' }}>
          {fuel_stops.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-600 text-sm">
              No fuel stops needed — trip is under 1,000 miles
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#2a2f3f' }}>
              {fuel_stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-mono w-5 text-slate-600">{i + 1}</span>
                  <FiMapPin size={12} style={{ color: '#f472b6' }} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">{stop.label}</div>
                    <div className="text-slate-600 text-xs">Day {stop.day} · {stop.clock_time}</div>
                  </div>
                  <div className="text-xs text-slate-500 shrink-0">{stop.at_mile} mi</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rest Stops */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a2f3f' }}>
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: '#1a1d27', borderBottom: '1px solid #2a2f3f' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#60a5fa15' }}>
            <FiMoon size={13} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <div className="text-white text-sm font-medium">Rest Stops</div>
            <div className="text-slate-600 text-xs">HOS-mandated off-duty periods</div>
          </div>
          <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#60a5fa15', color: '#60a5fa', border: '1px solid #60a5fa30' }}>
            {rest_stops.length}
          </span>
        </div>
        <div style={{ background: '#20242f' }}>
          {rest_stops.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-600 text-sm">
              No mandatory rest stops needed
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#2a2f3f' }}>
              {rest_stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-mono w-5 text-slate-600">{i + 1}</span>
                  <FiMoon size={12} style={{ color: '#60a5fa' }} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">{stop.label}</div>
                    <div className="text-slate-600 text-xs">Day {stop.day} · {stop.clock_time}</div>
                  </div>
                  <div className="text-xs text-slate-500 shrink-0">
                    {stop.duration_hours}h
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
