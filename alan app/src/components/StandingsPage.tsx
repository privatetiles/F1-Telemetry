import { useEffect, useState } from 'react'
import {
  fetchDriverStandings, fetchConstructorStandings,
  fetchAllResults, fetchDriverStandingsByRound, CONSTRUCTOR_TEAM,
} from '../lib/f1Api'
import type { DriverStanding, ConstructorStanding } from '../lib/f1Api'
import { TEAM_COLORS } from '../lib/paceData'

interface ChartSeries {
  code: string
  color: string
  points: number[]
}

const ROUND_ABBR: Record<string, string> = {
  'Australian': 'AUS', 'Chinese': 'CHN', 'Japanese': 'JPN',
  'Miami': 'MIA', 'Canadian': 'CAN', 'Monaco': 'MON',
  'Spanish': 'ESP', 'Austrian': 'AUT', 'British': 'GBR',
  'Belgian': 'BEL', 'Hungarian': 'HUN', 'Dutch': 'NED',
  'Italian': 'ITA', 'Singapore': 'SGP', 'United States': 'USA',
  'Mexico City': 'MEX', 'São Paulo': 'BRA', 'Las Vegas': 'LVG',
  'Qatar': 'QAT', 'Abu Dhabi': 'UAE', 'Barcelona-Catalunya': 'BCN',
  'Madrid': 'MAD',
}

function raceAbbr(raceName: string): string {
  const name = raceName.replace(' Grand Prix', '').trim()
  return ROUND_ABBR[name] ?? name.slice(0, 3).toUpperCase()
}

export default function StandingsPage() {
  const [drivers, setDrivers]           = useState<DriverStanding[]>([])
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(false)

  const [chartSeries, setChartSeries]   = useState<ChartSeries[]>([])
  const [chartRounds, setChartRounds]   = useState<string[]>([])
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => {
    setLoading(true); setError(false)
    Promise.all([fetchDriverStandings(), fetchConstructorStandings()])
      .then(([d, c]) => { setDrivers(d); setConstructors(c) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    Promise.all([fetchAllResults(), fetchDriverStandings()])
      .then(async ([races, currentDrivers]) => {
        const roundNums = races.map(r => parseInt(r.round)).sort((a, b) => a - b)
        const perRound = await Promise.all(
          roundNums.map(r => fetchDriverStandingsByRound(r).catch(() => []))
        )
        const top8 = currentDrivers.slice(0, 8)
        const series: ChartSeries[] = top8.map(dr => {
          const teamName = CONSTRUCTOR_TEAM[dr.Constructors[0]?.constructorId] ?? ''
          const color = TEAM_COLORS[teamName] ?? '#445'
          const pts = perRound.map(rStandings => {
            const found = rStandings.find(s => s.Driver.code === dr.Driver.code)
            return found ? parseFloat(found.points) : 0
          })
          return { code: dr.Driver.code, color, points: pts }
        })
        setChartSeries(series)
        setChartRounds(races.map(r => raceAbbr(r.raceName)))
      })
      .catch(() => {})
      .finally(() => setChartLoading(false))
  }, [])

  if (loading) return <div className="page-loading">Loading standings…</div>
  if (error)   return <div className="page-error">Failed to load standings</div>

  const maxDriverPts = parseFloat(drivers[0]?.points ?? '1') || 1
  const maxConPts    = parseFloat(constructors[0]?.points ?? '1') || 1

  // Chart geometry
  const W = 580, H = 240
  const PAD = { top: 12, right: 8, bottom: 28, left: 40 }
  const cw = W - PAD.left - PAD.right
  const ch = H - PAD.top - PAD.bottom
  const n = chartRounds.length
  const maxPts = Math.max(...chartSeries.flatMap(s => s.points), 100)
  const yStep = maxPts <= 100 ? 25 : maxPts <= 200 ? 50 : 100
  const yTicks: number[] = []
  for (let y = 0; y <= maxPts + yStep; y += yStep) yTicks.push(y)
  const xPos = (i: number) => PAD.left + (n > 1 ? (i / (n - 1)) * cw : cw / 2)
  const yPos = (pts: number) => PAD.top + ch - (pts / (yTicks[yTicks.length - 1] || 1)) * ch

  return (
    <div className="standings-page">

      {/* Points Over Time chart */}
      <section className="standings-section">
        <h2 className="standings-title">Points Over Time — Top 8</h2>
        {chartLoading ? (
          <div className="page-loading-sm">Loading chart…</div>
        ) : chartSeries.length === 0 ? (
          <div className="page-empty">No data yet</div>
        ) : (
          <div className="pts-chart-wrap">
            <svg viewBox={`0 0 ${W} ${H}`} className="pts-chart-svg">
              {/* Horizontal grid lines */}
              {yTicks.map(y => (
                <line key={y}
                  x1={PAD.left} x2={W - PAD.right}
                  y1={yPos(y)} y2={yPos(y)}
                  stroke="#1a2330" strokeWidth="1" strokeDasharray="3,4"
                />
              ))}
              {/* Y axis labels */}
              {yTicks.map(y => (
                <text key={y} x={PAD.left - 6} y={yPos(y) + 4}
                  textAnchor="end" fontSize="9" fill="#445" fontFamily="monospace">
                  {y}
                </text>
              ))}
              {/* X axis labels */}
              {chartRounds.map((label, i) => (
                <text key={i} x={xPos(i)} y={H - PAD.bottom + 14}
                  textAnchor="middle" fontSize="9" fill="#445" fontFamily="monospace">
                  {label}
                </text>
              ))}
              {/* Lines + dots */}
              {chartSeries.map(s => (
                <g key={s.code}>
                  <polyline
                    points={s.points.map((p, i) => `${xPos(i)},${yPos(p)}`).join(' ')}
                    fill="none" stroke={s.color} strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                  {s.points.map((p, i) => (
                    <circle key={i} cx={xPos(i)} cy={yPos(p)} r="3" fill={s.color} />
                  ))}
                </g>
              ))}
            </svg>
            {/* Legend */}
            <div className="pts-chart-legend">
              {chartSeries.map(s => (
                <span key={s.code} className="pts-legend-item">
                  <span className="pts-legend-dot" style={{ background: s.color }} />
                  {s.code}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

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
