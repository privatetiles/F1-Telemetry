import { useEffect, useState } from 'react'
import { fetchDriverStandings } from '../lib/f1Api'
import type { DriverStanding } from '../lib/f1Api'
import { DRIVER_INFO } from '../lib/driverData'
import { TEAM_COLORS } from '../lib/paceData'
import { DRIVER_HIGHLIGHTS } from '../lib/raceHighlights'
import type { DriverHighlight } from '../lib/raceHighlights'

function CareerHighlights({ highlights }: { highlights: DriverHighlight[] }) {
  const [open, setOpen] = useState(false)
  if (highlights.length === 0) return null
  return (
    <>
      <button className="highlights-toggle" onClick={() => setOpen(o => !o)}>
        <span>{open ? '▾' : '▸'}</span> Career Highlights
      </button>
      <div className={`highlights-list${open ? ' open' : ''}`}>
        {highlights.map((h, i) => (
          <div className="dh-row" key={i}>
            <div className="dh-header">
              <span className="dh-year">{h.year}</span>
              <span className="dh-race">{h.race}</span>
            </div>
            <p className="dh-note">{h.note}</p>
          </div>
        ))}
      </div>
    </>
  )
}

interface DriverCardProps {
  code: string
  standingMap: Record<string, DriverStanding>
}

function DriverCard({ code, standingMap }: DriverCardProps) {
  const info      = DRIVER_INFO[code]
  const s         = standingMap[code]
  const color     = TEAM_COLORS[info.team] ?? '#445'
  const pos       = s?.position ?? '—'
  const pts       = s?.points ?? '—'
  const wins      = s?.wins ?? '—'
  const posNum    = parseInt(pos)
  const posColor  = posNum === 1 ? '#f0c040' : posNum <= 3 ? '#bbb' : '#667'
  const highlights = DRIVER_HIGHLIGHTS[code] ?? []

  return (
    <div className="driver-card">
      <div className="driver-card-bar" style={{ background: color }} />
      <div className="driver-card-body">
        <div className="driver-card-top">
          <span className="driver-num" style={{ color }}>{info.number}</span>
        </div>
        <div className="driver-code">{code}</div>
        <div className="driver-name">{info.firstName} {info.lastName}</div>
        <div className="driver-team" style={{ color }}>{info.team}</div>
        <div className="driver-stats">
          <div className="driver-stat">
            <span className="ds-label">POS</span>
            <span className="ds-val" style={{ color: posColor }}>{pos}</span>
          </div>
          <div className="driver-stat">
            <span className="ds-label">PTS</span>
            <span className="ds-val">{pts}</span>
          </div>
          <div className="driver-stat">
            <span className="ds-label">WIN</span>
            <span className="ds-val">{wins}</span>
          </div>
        </div>
        <CareerHighlights highlights={highlights} />
      </div>
    </div>
  )
}

export default function DriversPage() {
  const [standings, setStandings] = useState<DriverStanding[]>([])

  useEffect(() => {
    fetchDriverStandings().then(setStandings).catch(() => {})
  }, [])

  const standingMap: Record<string, DriverStanding> = {}
  for (const s of standings) standingMap[s.Driver.code] = s

  const entries = Object.entries(DRIVER_INFO).sort((a, b) => {
    const pa = parseInt(standingMap[a[0]]?.position ?? '99')
    const pb = parseInt(standingMap[b[0]]?.position ?? '99')
    return pa - pb
  })

  return (
    <div className="drivers-page">
      <h2 className="page-title">2026 Driver Roster</h2>
      <p className="page-intro">
        The 2026 Formula 1 season fields 22 drivers across 11 constructors, including two new American-backed entries — Cadillac and Audi — making their championship debuts. Sweeping regulation changes have introduced fully active aerodynamics and a revised hybrid power unit formula, compressing the performance gap across the grid and reshaping the driver standings compared to recent seasons. Cards are ranked by current championship position and updated live throughout the season.
      </p>
      <div className="drivers-grid">
        {entries.map(([code]) => (
          <DriverCard key={code} code={code} standingMap={standingMap} />
        ))}
      </div>
    </div>
  )
}
