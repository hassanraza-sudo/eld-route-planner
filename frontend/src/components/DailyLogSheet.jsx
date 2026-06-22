import { useRef } from 'react'
import { FiDownload } from 'react-icons/fi'

// FMCSA status row indices (0-indexed from top)
const STATUS_ROWS = {
  off_duty: 0,
  sleeper_berth: 1,
  driving: 2,
  on_duty_not_driving: 3,
}

const ROW_LABELS = ['Off Duty', 'Sleeper Berth', 'Driving', 'On Duty\nNot Driving']
const ROW_COLORS = ['#60a5fa', '#a78bfa', '#4ade80', '#fbbf24']

// SVG layout constants
const SVG_W = 900
const SVG_H = 420
const GRID_X = 180       // where the 24-hour grid starts
const GRID_W = 680       // width of the 24-hour grid
const GRID_Y = 80        // top of the grid rows
const ROW_H = 50         // height of each status row
const ROWS = 4
const HEADER_H = 80

function hoursToX(hour) {
  // hour is 0–24
  return GRID_X + (hour / 24) * GRID_W
}

function buildStatusSegments(entries) {
  /**
   * Convert log entries to {rowIndex, x1, x2} segments for the ELD grid.
   */
  const segments = []
  for (const entry of entries) {
    const rowIdx = STATUS_ROWS[entry.status]
    if (rowIdx === undefined) continue
    const x1 = hoursToX(Math.min(entry.start_hour, 24))
    const x2 = hoursToX(Math.min(entry.end_hour, 24))
    if (x2 > x1 + 0.5) {
      segments.push({ rowIdx, x1, x2, label: entry.label, status: entry.status })
    }
  }
  return segments
}

function ELDGrid({ entries, dayDate }) {
  const segments = buildStatusSegments(entries)

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block', background: '#fff' }}>
      {/* Header background */}
      <rect x="0" y="0" width={SVG_W} height={HEADER_H - 5} fill="#f8fafc" />
      <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="white" stroke="#cbd5e1" strokeWidth="1" />

      {/* Title */}
      <text x="16" y="22" fontSize="11" fontWeight="bold" fill="#1e293b" fontFamily="Arial, sans-serif">
        DRIVER'S DAILY LOG — RECORD OF DUTY STATUS
      </text>
      <text x="16" y="36" fontSize="9" fill="#64748b" fontFamily="Arial, sans-serif">
        (As required by FMCSA regulations 49 CFR Part 395)
      </text>

      {/* Date */}
      <text x="16" y="58" fontSize="9" fill="#94a3b8" fontFamily="Arial, sans-serif">DATE</text>
      <text x="16" y="72" fontSize="10" fontWeight="600" fill="#1e293b" fontFamily="Arial, sans-serif">
        {dayDate}
      </text>

      {/* 24-hour column headers */}
      {Array.from({ length: 25 }, (_, i) => {
        const x = hoursToX(i)
        const label = i === 0 ? 'Midnight' : i === 12 ? 'Noon' : i === 24 ? '' : String(i)
        return (
          <g key={i}>
            <line x1={x} y1={GRID_Y - 12} x2={x} y2={GRID_Y + ROWS * ROW_H} stroke={i % 6 === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={i % 6 === 0 ? 1 : 0.5} />
            <text x={x} y={GRID_Y - 15} fontSize="8" textAnchor="middle" fill="#94a3b8" fontFamily="Arial, sans-serif">
              {label}
            </text>
            {/* Quarter-hour ticks (minor) */}
            {i < 24 && [0.25, 0.5, 0.75].map(q => {
              const qx = hoursToX(i + q)
              return <line key={q} x1={qx} y1={GRID_Y} x2={qx} y2={GRID_Y + ROWS * ROW_H} stroke="#f1f5f9" strokeWidth="0.5" />
            })}
          </g>
        )
      })}

      {/* Row labels + backgrounds */}
      {ROW_LABELS.map((label, i) => {
        const y = GRID_Y + i * ROW_H
        const isEven = i % 2 === 0
        return (
          <g key={i}>
            <rect x="0" y={y} width={SVG_W} height={ROW_H} fill={isEven ? '#fafafa' : 'white'} />
            <rect x="0" y={y} width={GRID_X - 2} height={ROW_H} fill={isEven ? '#f1f5f9' : '#f8fafc'} />
            <line x1="0" y1={y + ROW_H} x2={SVG_W} y2={y + ROW_H} stroke="#e2e8f0" strokeWidth="0.5" />
            {/* Row number */}
            <text x="10" y={y + ROW_H / 2 + 4} fontSize="9" fontWeight="bold" fill="#94a3b8" fontFamily="Arial, sans-serif">
              {i + 1}
            </text>
            {/* Color indicator */}
            <rect x="20" y={y + 8} width="4" height={ROW_H - 16} fill={ROW_COLORS[i]} rx="2" />
            {/* Label */}
            {label.split('\n').map((line, li) => (
              <text key={li} x="30" y={y + (label.includes('\n') ? 18 + li * 14 : ROW_H / 2 + 4)} fontSize="9" fill="#374151" fontFamily="Arial, sans-serif">
                {line}
              </text>
            ))}
          </g>
        )
      })}

      {/* Status line segments */}
      {segments.map((seg, i) => {
        const y = GRID_Y + seg.rowIdx * ROW_H
        const color = ROW_COLORS[seg.rowIdx]
        return (
          <g key={i}>
            {/* Fill bar */}
            <rect
              x={seg.x1}
              y={y + 4}
              width={Math.max(1, seg.x2 - seg.x1)}
              height={ROW_H - 8}
              fill={color}
              opacity="0.2"
              rx="2"
            />
            {/* Bold status line at vertical center */}
            <line
              x1={seg.x1}
              y1={y + ROW_H / 2}
              x2={seg.x2}
              y2={y + ROW_H / 2}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Vertical drop lines at transitions */}
            <line x1={seg.x1} y1={GRID_Y} x2={seg.x1} y2={GRID_Y + ROWS * ROW_H} stroke={color} strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2 2" />
            <line x1={seg.x2} y1={GRID_Y} x2={seg.x2} y2={GRID_Y + ROWS * ROW_H} stroke={color} strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2 2" />
          </g>
        )
      })}

      {/* Grid border */}
      <rect x={GRID_X} y={GRID_Y} width={GRID_W} height={ROWS * ROW_H} fill="none" stroke="#94a3b8" strokeWidth="1" />
      <line x1="0" y1={GRID_Y} x2={SVG_W} y2={GRID_Y} stroke="#cbd5e1" strokeWidth="1" />

      {/* Bottom totals section */}
      {(() => {
        const bottomY = GRID_Y + ROWS * ROW_H + 12
        const hours = [
          entries.filter(e => e.status === 'off_duty').reduce((s, e) => s + e.duration_hours, 0),
          entries.filter(e => e.status === 'sleeper_berth').reduce((s, e) => s + e.duration_hours, 0),
          entries.filter(e => e.status === 'driving').reduce((s, e) => s + e.duration_hours, 0),
          entries.filter(e => e.status === 'on_duty_not_driving').reduce((s, e) => s + e.duration_hours, 0),
        ]
        const totalMiles = entries.filter(e => e.status === 'driving').reduce((s, e) => s + (e.miles || 0), 0)

        return (
          <g>
            <text x="16" y={bottomY + 12} fontSize="8" fill="#64748b" fontFamily="Arial, sans-serif">TOTAL HOURS</text>
            {hours.map((h, i) => {
              const x = hoursToX(i * 6) - 20
              return (
                <g key={i}>
                  <rect x={x} y={bottomY} width={60} height={22} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" rx="2" />
                  <text x={x + 30} y={bottomY + 15} fontSize="10" fontWeight="bold" textAnchor="middle" fill={ROW_COLORS[i]} fontFamily="Arial, sans-serif">
                    {h.toFixed(1)}h
                  </text>
                </g>
              )
            })}
            <text x={SVG_W - 120} y={bottomY + 10} fontSize="8" fill="#64748b" fontFamily="Arial, sans-serif">TOTAL MILES</text>
            <text x={SVG_W - 120} y={bottomY + 22} fontSize="11" fontWeight="bold" fill="#1e293b" fontFamily="Arial, sans-serif">
              {totalMiles.toFixed(0)}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}

export default function DailyLogSheet({ log, index }) {
  const ref = useRef()

  const dayDate = `Day ${log.day} of Trip`

  const downloadPNG = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `eld-log-day-${log.day}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('PNG export failed:', e)
      alert('PNG export failed. Please try PDF instead.')
    }
  }

  const downloadPDF = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`eld-log-day-${log.day}.pdf`)
    } catch (e) {
      console.error('PDF export failed:', e)
      alert('PDF export failed.')
    }
  }

  return (
    <div className="eld-log-sheet" style={{ border: '1px solid #2a2f3f', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      {/* Log sheet header bar */}
      <div className="flex items-center justify-between px-4 py-3 no-print" style={{ background: '#1a1d27', borderBottom: '1px solid #2a2f3f' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#4455ff20', color: '#6b83ff', border: '1px solid #4455ff30' }}>
            DAY {log.day}
          </span>
          <span className="text-white text-sm font-medium">Daily Log Sheet</span>
          <span className="text-slate-500 text-xs">
            {log.total_miles} mi · {log.driving_hours}h driving · {log.log_entries?.length} entries
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadPNG}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: '#20242f', color: '#94a3b8', border: '1px solid #2a2f3f' }}
          >
            <FiDownload size={12} /> PNG
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: '#4455ff', color: 'white' }}
          >
            <FiDownload size={12} /> PDF
          </button>
        </div>
      </div>

      {/* The actual ELD log (rendered as SVG) */}
      <div ref={ref} style={{ background: '#fff', padding: '8px' }}>
        <ELDGrid entries={log.log_entries || []} dayDate={dayDate} />

        {/* Remarks section */}
        {log.log_entries && log.log_entries.length > 0 && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid #e2e8f0', background: '#fafafa' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 4, fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>REMARKS</div>
            <div style={{ fontSize: 9, color: '#374151', fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}>
              {log.log_entries.map((e, i) => (
                <span key={i}>
                  {e.start_clock}–{e.end_clock}: {e.label}{i < log.log_entries.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
