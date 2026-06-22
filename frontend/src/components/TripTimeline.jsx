const STATUS_CONFIG = {
  driving: { color: '#4ade80', bg: '#4ade8015', label: 'Driving', dot: '#4ade80' },
  off_duty: { color: '#60a5fa', bg: '#60a5fa15', label: 'Off Duty', dot: '#60a5fa' },
  on_duty_not_driving: { color: '#fbbf24', bg: '#fbbf2415', label: 'On Duty', dot: '#fbbf24' },
  sleeper_berth: { color: '#a78bfa', bg: '#a78bfa15', label: 'Sleeper', dot: '#a78bfa' },
}

function getEventStyle(event) {
  const label = event.label || ''
  if (label.includes('Pickup')) return { color: '#38bdf8', bg: '#38bdf815', dot: '#38bdf8', label: 'Pickup' }
  if (label.includes('Dropoff')) return { color: '#fb923c', bg: '#fb923c15', dot: '#fb923c', label: 'Dropoff' }
  if (label.includes('Fuel')) return { color: '#f472b6', bg: '#f472b615', dot: '#f472b6', label: 'Fuel Stop' }
  if (label.includes('Break')) return { color: '#a78bfa', bg: '#a78bfa15', dot: '#a78bfa', label: 'Break' }
  if (label.includes('Restart')) return { color: '#f87171', bg: '#f8717115', dot: '#f87171', label: 'Restart' }
  return STATUS_CONFIG[event.status] || STATUS_CONFIG.off_duty
}

export default function TripTimeline({ schedule }) {
  // Group by day
  const byDay = {}
  for (const ev of schedule) {
    if (!byDay[ev.day]) byDay[ev.day] = []
    byDay[ev.day].push(ev)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-lg">Trip Timeline</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { color: '#4ade80', label: 'Driving' },
            { color: '#fbbf24', label: 'On Duty' },
            { color: '#60a5fa', label: 'Off Duty' },
            { color: '#f472b6', label: 'Fuel' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(byDay).map(([day, events]) => (
          <div key={day}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-xs font-mono px-2.5 py-1 rounded" style={{ background: '#4455ff20', color: '#6b83ff', border: '1px solid #4455ff30' }}>
                DAY {day}
              </div>
              <div className="flex-1 h-px" style={{ background: '#2a2f3f' }} />
              <span className="text-xs text-slate-600">
                {events.length} event{events.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {events.map((event, i) => {
                const style = getEventStyle(event)
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors"
                    style={{ background: style.bg, border: `1px solid ${style.dot}20` }}
                  >
                    {/* Time */}
                    <div className="text-xs font-mono text-slate-500 w-24 shrink-0">
                      {event.start_clock} → {event.end_clock}
                    </div>

                    {/* Dot + line */}
                    <div className="relative flex items-center justify-center w-3 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: style.dot }} />
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{event.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: style.dot }}>
                        {style.label} · {event.duration_formatted}
                        {event.miles > 0 ? ` · ${event.miles.toFixed(0)} mi` : ''}
                      </div>
                    </div>

                    {/* Duration badge */}
                    <div className="text-xs font-mono shrink-0" style={{ color: style.color }}>
                      {event.duration_formatted}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
