import { useState } from 'react'
import { FiTruck, FiMapPin, FiClock, FiZap, FiShield, FiFileText } from 'react-icons/fi'
import { planTrip } from '../services/api'

const FEATURE_CARDS = [
  { icon: FiMapPin, title: 'Smart Routing', desc: 'Geocoded route planning via OpenRouteService with automatic mock fallback' },
  { icon: FiClock, title: 'HOS Compliance', desc: '11/14/70-hour rules, 30-min break logic, 10-hr rest, 34-hr cycle restart' },
  { icon: FiShield, title: 'FMCSA Logs', desc: 'Authentic grid-based ELD daily log sheets per FMCSA format, one per day' },
  { icon: FiZap, title: 'Auto Fuel Stops', desc: 'Fuel stops inserted every 1,000 miles automatically along the route' },
  { icon: FiFileText, title: 'Multi-Day Trips', desc: 'Generates complete schedule across multiple days until trip is complete' },
  { icon: FiTruck, title: 'Export Logs', desc: 'Download each daily log as PNG or PDF for compliance documentation' },
]

export default function HomePage({ onResults, initialValues }) {
  const [form, setForm] = useState(initialValues || {
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const { current_location, pickup_location, dropoff_location, current_cycle_used } = form

    if (!current_location.trim() || !pickup_location.trim() || !dropoff_location.trim()) {
      setError('All location fields are required.')
      return
    }
    const cycleNum = parseFloat(current_cycle_used)
    if (isNaN(cycleNum) || cycleNum < 0 || cycleNum > 70) {
      setError('Current Cycle Used must be a number between 0 and 70.')
      return
    }

    setLoading(true)
    try {
      const data = await planTrip({
        current_location: current_location.trim(),
        pickup_location: pickup_location.trim(),
        dropoff_location: dropoff_location.trim(),
        current_cycle_used: cycleNum,
      })
      onResults(data, form)
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to plan trip. Is the backend running?'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const fillExample = () => {
    setForm({
      current_location: 'Chicago, IL',
      pickup_location: 'St Louis, MO',
      dropoff_location: 'Dallas, TX',
      current_cycle_used: '20',
    })
    setError('')
  }

  return (
    <div className="min-h-screen" style={{ background: '#0f1117' }}>
      {/* ── NAV ── */}
      <nav style={{ background: '#1a1d27', borderBottom: '1px solid #2a2f3f' }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4455ff, #7b5ea7)' }}>
              <FiTruck className="text-white" size={18} />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">ELD Route Planner</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded font-mono" style={{ background: '#4455ff20', color: '#6b83ff', border: '1px solid #4455ff40' }}>
              70 Hr / 8-Day Rule
            </span>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-24 px-6">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(#4455ff 1px, transparent 1px), linear-gradient(90deg, #4455ff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl" style={{ background: '#4455ff' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8" style={{ background: '#4455ff15', border: '1px solid #4455ff30', color: '#6b83ff' }}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            FMCSA-Compliant ELD Logging
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            HOS-Compliant
            <br />
            <span style={{ background: 'linear-gradient(135deg, #4455ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Route Planning
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Enter your route and hours used. Get a fully compliant trip schedule, fuel stops, rest stops,
            and FMCSA ELD daily log sheets — automatically.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            {['11-Hour Driving Limit', '14-Hour Duty Window', '30-Min Break Rule', '10-Hr Rest Requirement', '70-Hr Cycle Tracking'].map(r => (
              <span key={r} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4455ff' }} />
                {r}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANNER FORM ── */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl overflow-hidden" style={{ background: '#1a1d27', border: '1px solid #2a2f3f' }}>
            <div className="px-8 py-6" style={{ borderBottom: '1px solid #2a2f3f' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-semibold text-lg">Plan Your Trip</h2>
                  <p className="text-slate-500 text-sm mt-1">Enter city names, state abbreviations, or full addresses</p>
                </div>
                <button
                  onClick={fillExample}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: '#4455ff15', color: '#6b83ff', border: '1px solid #4455ff30' }}
                  onMouseEnter={e => e.target.style.background = '#4455ff25'}
                  onMouseLeave={e => e.target.style.background = '#4455ff15'}
                >
                  Load Example
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Route visual connector */}
              <div className="relative">
                {/* Current Location */}
                <FormField
                  label="Current Location"
                  name="current_location"
                  value={form.current_location}
                  onChange={handleChange}
                  placeholder="e.g. Chicago, IL"
                  dot="bg-green-400"
                  icon={<FiMapPin size={14} />}
                />

                {/* Connector line */}
                <div className="flex items-center my-1 ml-2">
                  <div className="w-0.5 h-8 ml-1.5" style={{ background: 'linear-gradient(to bottom, #4ade80, #4455ff)' }} />
                </div>

                {/* Pickup */}
                <FormField
                  label="Pickup Location"
                  name="pickup_location"
                  value={form.pickup_location}
                  onChange={handleChange}
                  placeholder="e.g. St Louis, MO"
                  dot="bg-blue-400"
                  icon={<FiMapPin size={14} />}
                />

                <div className="flex items-center my-1 ml-2">
                  <div className="w-0.5 h-8 ml-1.5" style={{ background: 'linear-gradient(to bottom, #60a5fa, #f59e0b)' }} />
                </div>

                {/* Dropoff */}
                <FormField
                  label="Dropoff Location"
                  name="dropoff_location"
                  value={form.dropoff_location}
                  onChange={handleChange}
                  placeholder="e.g. Dallas, TX"
                  dot="bg-amber-400"
                  icon={<FiMapPin size={14} />}
                />
              </div>

              {/* Cycle hours */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Current Cycle Used (Hours)
                </label>
                <div className="relative">
                  <FiClock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    name="current_cycle_used"
                    value={form.current_cycle_used}
                    onChange={handleChange}
                    placeholder="0–70 hours used this 8-day cycle"
                    min="0"
                    max="70"
                    step="0.5"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none transition-colors"
                    style={{ background: '#20242f', border: '1px solid #2a2f3f' }}
                    onFocus={e => e.target.style.borderColor = '#4455ff'}
                    onBlur={e => e.target.style.borderColor = '#2a2f3f'}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1.5">Remaining = 70 − this value. 34-hr restart triggered if exhausted.</p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#ff444415', border: '1px solid #ff444430', color: '#fc8181' }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-semibold text-white transition-all text-sm"
                style={{
                  background: loading ? '#2a2f3f' : 'linear-gradient(135deg, #4455ff, #7b5ea7)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Planning Route...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiTruck size={16} />
                    Generate Trip Plan
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-6 pb-24" style={{ borderTop: '1px solid #2a2f3f' }}>
        <div className="max-w-6xl mx-auto pt-16">
          <h3 className="text-center text-white font-semibold text-2xl mb-2">What Gets Generated</h3>
          <p className="text-center text-slate-500 text-sm mb-12">Everything a truck driver and fleet manager needs</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURE_CARDS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl p-5 transition-colors" style={{ background: '#1a1d27', border: '1px solid #2a2f3f' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: '#4455ff15' }}>
                  <Icon size={16} style={{ color: '#6b83ff' }} />
                </div>
                <h4 className="text-white font-medium text-sm mb-1.5">{title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #2a2f3f' }} className="py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <FiTruck size={14} />
            <span>ELD Route Planner — Full Stack Developer Assessment</span>
          </div>
          <div className="text-slate-700 text-xs font-mono">
            FMCSA 49 CFR Part 395 · 70 Hr / 8-Day Cycle
          </div>
        </div>
      </footer>
    </div>
  )
}

function FormField({ label, name, value, onChange, placeholder, dot, icon }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-3 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none transition-colors"
          style={{ background: '#20242f', border: '1px solid #2a2f3f' }}
          onFocus={e => e.target.style.borderColor = '#4455ff'}
          onBlur={e => e.target.style.borderColor = '#2a2f3f'}
        />
      </div>
    </div>
  )
}
