import { useEffect, useState } from 'react'
import { fetchDriverStandings } from '../lib/f1Api'
import type { DriverStanding } from '../lib/f1Api'
import { DRIVER_INFO } from '../lib/driverData'
import { TEAM_COLORS } from '../lib/paceData'

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
      <div className="drivers-grid">
        {entries.map(([code, info]) => {
          const s      = standingMap[code]
          const color  = TEAM_COLORS[info.team] ?? '#445'
          const pos    = s?.position ?? '—'
          const pts    = s?.points ?? '—'
          const wins   = s?.wins ?? '—'
          const posNum = parseInt(pos)
          const posColor = posNum === 1 ? '#f0c040' : posNum <= 3 ? '#bbb' : '#667'
          return (
            <div className="driver-card" key={code}>
              <div className="driver-card-bar" style={{ background: color }} />
              <div className="driver-card-body">
                <div className="driver-card-top">
                  <span className="driver-flag">{info.flag}</span>
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
