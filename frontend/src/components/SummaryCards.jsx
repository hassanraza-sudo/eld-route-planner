import { FiNavigation, FiClock, FiDroplet, FiMoon, FiFileText, FiBattery } from 'react-icons/fi'

function Card({ icon: Icon, label, value, sub, color = '#4455ff', warn }) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#1a1d27', border: `1px solid ${warn ? '#f59e0b40' : '#2a2f3f'}` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        {warn && <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b30' }}>{warn}</span>}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
    </div>
  )
}

export default function SummaryCards({ summary }) {
  const totalDriveH = Math.floor(summary.total_driving_hours)
  const totalDriveM = Math.round((summary.total_driving_hours - totalDriveH) * 60)
  const driveStr = `${totalDriveH}h ${String(totalDriveM).padStart(2, '0')}m`

  return (
    <div>
      <h2 className="text-white font-semibold text-lg mb-4">Trip Summary</h2>
      {summary.using_mock_route && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm flex items-start gap-3" style={{ background: '#f59e0b10', border: '1px solid #f59e0b30', color: '#fbbf24' }}>
          <span>⚠️</span>
          <div>
            <strong>Using estimated route data.</strong>
            {summary.api_error
              ? ` API error: ${summary.api_error}`
              : ' No ORS API key found. Set ORS_API_KEY in backend/.env for real routing.'
            }
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card
          icon={FiNavigation}
          label="Total Distance"
          value={`${summary.total_distance_miles.toLocaleString()} mi`}
          sub={`${summary.distance_to_pickup_miles} mi to pickup`}
          color="#4455ff"
        />
        <Card
          icon={FiClock}
          label="Drive Time"
          value={driveStr}
          sub={`${summary.total_days} day${summary.total_days !== 1 ? 's' : ''} total`}
          color="#a78bfa"
        />
        <Card
          icon={FiDroplet}
          label="Fuel Stops"
          value={summary.fuel_stop_count}
          sub="Every 1,000 miles"
          color="#38bdf8"
        />
        <Card
          icon={FiMoon}
          label="Rest Stops"
          value={summary.rest_stop_count}
          sub="10-hr + breaks"
          color="#818cf8"
        />
        <Card
          icon={FiFileText}
          label="Log Sheets"
          value={summary.total_log_sheets}
          sub="FMCSA ELD format"
          color="#4ade80"
        />
        <Card
          icon={FiBattery}
          label="Cycle Remaining"
          value={`${summary.remaining_cycle_hours}h`}
          sub={`of 70-hour limit`}
          color={summary.remaining_cycle_hours < 10 ? '#f87171' : '#f59e0b'}
          warn={summary.remaining_cycle_hours < 10 ? 'Low' : undefined}
        />
      </div>
    </div>
  )
}
