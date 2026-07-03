import { useEffect, useState } from 'react'
import { fetchConstructorStandings, CONSTRUCTOR_TEAM } from '../lib/f1Api'
import type { ConstructorStanding } from '../lib/f1Api'
import { DRIVER_INFO } from '../lib/driverData'
import { TEAM_COLORS } from '../lib/paceData'

const TEAM_DETAILS: Record<string, { base: string; chassis: string; power: string }> = {
  'Red Bull Racing': { base: 'Milton Keynes, UK',   chassis: 'RB21',     power: 'Honda RBPT' },
  'McLaren':         { base: 'Woking, UK',           chassis: 'MCL39',    power: 'Mercedes' },
  'Ferrari':         { base: 'Maranello, Italy',     chassis: 'SF-26',    power: 'Ferrari' },
  'Mercedes':        { base: 'Brackley, UK',         chassis: 'W16',      power: 'Mercedes' },
  'Aston Martin':    { base: 'Silverstone, UK',      chassis: 'AMR26',    power: 'Mercedes' },
  'Alpine':          { base: 'Enstone, UK',          chassis: 'A526',     power: 'Renault' },
  'Williams':        { base: 'Grove, UK',            chassis: 'FW47',     power: 'Mercedes' },
  'Racing Bulls':    { base: 'Faenza, Italy',        chassis: 'VCARB 02', power: 'Honda RBPT' },
  'Haas F1 Team':   { base: 'Kannapolis, USA',      chassis: 'VF-26',    power: 'Ferrari' },
  'Audi':            { base: 'Hinwil, Switzerland',  chassis: 'C46',      power: 'Audi' },
  'Cadillac':        { base: 'Concord, USA',         chassis: 'VSGP01',   power: 'GM/Ferrari' },
}

export default function TeamsPage() {
  const [standings, setStandings] = useState<ConstructorStanding[]>([])

  useEffect(() => {
    fetchConstructorStandings().then(setStandings).catch(() => {})
  }, [])

  const standingMap: Record<string, ConstructorStanding> = {}
  for (const s of standings) {
    const teamName = CONSTRUCTOR_TEAM[s.Constructor.constructorId] ?? s.Constructor.name
    standingMap[teamName] = s
  }

  const teams = Object.keys(TEAM_DETAILS).sort((a, b) => {
    const pa = parseInt(standingMap[a]?.position ?? '99')
    const pb = parseInt(standingMap[b]?.position ?? '99')
    return pa - pb
  })

  return (
    <div className="teams-page">
      <h2 className="page-title">2026 Constructor Lineup</h2>
      <p className="page-intro">
        Eleven constructors contest the 2026 Formula 1 World Championship — the largest grid in over a decade. The headline story is the arrival of Cadillac from Concord, USA and Audi from Hinwil, Switzerland, both debuting new power unit programmes from scratch. The 2026 technical regulations mandate fully active aerodynamic systems and a significantly revised hybrid architecture, resetting the development pecking order and opening the constructor championship in ways not seen since the major overhaul of 2022. Teams are ranked by current points total.
      </p>
      <div className="teams-grid">
        {teams.map((teamName) => {
          const color   = TEAM_COLORS[teamName] ?? '#445'
          const s       = standingMap[teamName]
          const details = TEAM_DETAILS[teamName]!
          const drivers = Object.entries(DRIVER_INFO).filter(([, d]) => d.team === teamName)
          const pos     = s?.position ?? '—'
          const posNum  = parseInt(pos)
          const posColor = posNum === 1 ? '#f0c040' : posNum <= 3 ? '#bbb' : '#667'

          return (
            <div className="team-card" key={teamName}>
              <div className="team-card-accent" style={{ background: color }} />
              <div className="team-card-body">
                <div className="team-header">
                  <h3 className="team-name" style={{ color }}>{teamName}</h3>
                  {s && (
                    <div className="team-champ-pos">
                      <span className="tc-pos" style={{ color: posColor }}>P{s.position}</span>
                      <span className="tc-pts">{s.points} pts</span>
                      {parseInt(s.wins) > 0 && <span className="tc-wins">{s.wins}W</span>}
                    </div>
                  )}
                </div>
                <div className="team-drivers">
                  {drivers.map(([code, d]) => (
                    <span key={code} className="team-driver-chip">
                      <span className="tdc-flag">{d.flag}</span>
                      <span className="tdc-code">{code}</span>
                      <span className="tdc-num" style={{ color }}>#{d.number}</span>
                    </span>
                  ))}
                </div>
                <div className="team-details">
                  <span className="td-item"><span className="td-key">Base</span>{details.base}</span>
                  <span className="td-item"><span className="td-key">Chassis</span>{details.chassis}</span>
                  <span className="td-item"><span className="td-key">Power</span>{details.power}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
