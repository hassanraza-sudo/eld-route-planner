import { useState } from 'react'
import { FiArrowLeft, FiTruck, FiMap, FiClock, FiDroplet, FiFileText } from 'react-icons/fi'
import SummaryCards from '../components/SummaryCards'
import RouteMap from '../components/RouteMap'
import TripTimeline from '../components/TripTimeline'
import StopsPanel from '../components/StopsPanel'
import DailyLogSheet from '../components/DailyLogSheet'

const TABS = [
  { id: 'map', label: 'Route Map', icon: FiMap },
  { id: 'timeline', label: 'Timeline', icon: FiClock },
  { id: 'stops', label: 'Stops', icon: FiDroplet },
  { id: 'logs', label: 'Daily Logs', icon: FiFileText },
]

export default function ResultsPage({ tripData, formValues, onBack }) {
  const [activeTab, setActiveTab] = useState('map')
  const { route, summary, stops, schedule, daily_logs } = tripData

  return (
    <div className="min-h-screen" style={{ background: '#0f1117' }}>
      {/* ── NAV ── */}
      <nav style={{ background: '#1a1d27', borderBottom: '1px solid #2a2f3f' }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg px-3 py-1.5"
            style={{ border: '1px solid #2a2f3f' }}
          >
            <FiArrowLeft size={14} />
            New Trip
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4455ff, #7b5ea7)' }}>
              <FiTruck className="text-white" size={15} />
            </div>
            <span className="font-semibold text-white">ELD Route Planner</span>
          </div>
          <div className="ml-auto text-xs text-slate-600 hidden sm:block font-mono">
            {formValues?.current_location} → {formValues?.pickup_location} → {formValues?.dropoff_location}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary cards */}
        <SummaryCards summary={summary} />

        {/* Tab navigation */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#1a1d27', border: '1px solid #2a2f3f' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={
                activeTab === id
                  ? { background: '#4455ff', color: 'white' }
                  : { color: '#64748b' }
              }
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'map' && (
            <div className="rounded-2xl p-6" style={{ background: '#1a1d27', border: '1px solid #2a2f3f' }}>
              <RouteMap route={route} />
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="rounded-2xl p-6" style={{ background: '#1a1d27', border: '1px solid #2a2f3f' }}>
              <TripTimeline schedule={schedule} />
            </div>
          )}

          {activeTab === 'stops' && (
            <div className="rounded-2xl p-6" style={{ background: '#1a1d27', border: '1px solid #2a2f3f' }}>
              <h2 className="text-white font-semibold text-lg mb-4">Fuel &amp; Rest Stops</h2>
              <StopsPanel stops={stops} />
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-semibold text-lg">FMCSA ELD Daily Log Sheets</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {daily_logs.length} log sheet{daily_logs.length !== 1 ? 's' : ''} generated · Download each as PNG or PDF
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                {daily_logs.map((log, i) => (
                  <DailyLogSheet key={i} log={log} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* HOS Rules reference */}
        <div className="rounded-xl p-5" style={{ background: '#1a1d27', border: '1px solid #2a2f3f' }}>
          <h3 className="text-white font-medium text-sm mb-3">Applied HOS Rules — Property Carrying Driver (70 Hr / 8 Days)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: 'Max Drive/Day', value: '11 hrs' },
              { label: 'Duty Window', value: '14 hrs' },
              { label: 'Break After', value: '8 hrs driving' },
              { label: 'Break Duration', value: '30 min' },
              { label: 'Rest Required', value: '10 hrs off' },
              { label: 'Cycle Limit', value: '70 hrs / 8 days' },
              { label: 'Cycle Restart', value: '34 hrs off' },
              { label: 'Fuel Stops', value: 'Every 1,000 mi' },
              { label: 'Pickup Time', value: '1 hr on duty' },
              { label: 'Dropoff Time', value: '1 hr on duty' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg px-3 py-2" style={{ background: '#20242f' }}>
                <div className="text-white text-sm font-semibold">{value}</div>
                <div className="text-slate-600 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
