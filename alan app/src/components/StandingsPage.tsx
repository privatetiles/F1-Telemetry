import { useEffect, useState } from 'react'
import { fetchDriverStandings, fetchConstructorStandings, CONSTRUCTOR_TEAM } from '../lib/f1Api'
import type { DriverStanding, ConstructorStanding } from '../lib/f1Api'
import { TEAM_COLORS } from '../lib/paceData'

export default function StandingsPage() {
  const [drivers, setDrivers]           = useState<DriverStanding[]>([])
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(false)

  useEffect(() => {
    setLoading(true); setError(false)
    Promise.all([fetchDriverStandings(), fetchConstructorStandings()])
      .then(([d, c]) => { setDrivers(d); setConstructors(c) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading">Loading standings…</div>
  if (error)   return <div className="page-error">Failed to load standings</div>

  const maxDriverPts = parseFloat(drivers[0]?.points ?? '1') || 1
  const maxConPts    = parseFloat(constructors[0]?.points ?? '1') || 1

  return (
    <div className="standings-page">
      {/* Driver Championship */}
      <section className="standings-section">
        <h2 className="standings-title">Driver Championship</h2>
        <div className="standings-table">
          <div className="standings-head">
            <span className="sc-pos">#</span>
            <span className="sc-driver">Driver</span>
            <span className="sc-team">Team</span>
            <span className="sc-bar" />
            <span className="sc-pts">PTS</span>
            <span className="sc-wins">W</span>
          </div>
          {drivers.map((d) => {
            const teamName = CONSTRUCTOR_TEAM[d.Constructors[0]?.constructorId] ?? d.Constructors[0]?.name ?? '—'
            const color    = TEAM_COLORS[teamName] ?? '#445'
            const pts      = parseFloat(d.points)
            const barW     = (pts / maxDriverPts) * 100
            const pos      = parseInt(d.position)
            const posColor = pos === 1 ? '#f0c040' : pos <= 3 ? '#aaa' : '#556'
            return (
              <div key={d.Driver.code} className="standings-row">
                <span className="sc-pos" style={{ color: posColor }}>{d.position}</span>
                <span className="sc-driver">
                  <span className="sc-code">{d.Driver.code}</span>
                  <span className="sc-name">{d.Driver.givenName} {d.Driver.familyName}</span>
                </span>
                <span className="sc-team">
                  <span className="sc-dot" style={{ background: color }} />
                  {teamName}
                </span>
                <span className="sc-bar">
                  <span className="sc-bar-fill" style={{ width: `${barW}%`, background: color + 'aa' }} />
                </span>
                <span className="sc-pts">{d.points}</span>
                <span className="sc-wins">{d.wins}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Constructor Championship */}
      <section className="standings-section">
        <h2 className="standings-title">Constructor Championship</h2>
        <div className="standings-table">
          <div className="standings-head">
            <span className="sc-pos">#</span>
            <span className="sc-team-wide">Team</span>
            <span className="sc-bar" />
            <span className="sc-pts">PTS</span>
            <span className="sc-wins">W</span>
          </div>
          {constructors.map((c) => {
            const teamName = CONSTRUCTOR_TEAM[c.Constructor.constructorId] ?? c.Constructor.name
            const color    = TEAM_COLORS[teamName] ?? '#445'
            const pts      = parseFloat(c.points)
            const barW     = (pts / maxConPts) * 100
            const pos      = parseInt(c.position)
            const posColor = pos === 1 ? '#f0c040' : pos <= 3 ? '#aaa' : '#556'
            return (
              <div key={c.Constructor.constructorId} className="standings-row">
                <span className="sc-pos" style={{ color: posColor }}>{c.position}</span>
                <span className="sc-team-wide">
                  <span className="sc-dot" style={{ background: color }} />
                  {teamName}
                </span>
                <span className="sc-bar">
                  <span className="sc-bar-fill" style={{ width: `${barW}%`, background: color + 'aa' }} />
                </span>
                <span className="sc-pts">{c.points}</span>
                <span className="sc-wins">{c.wins}</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
