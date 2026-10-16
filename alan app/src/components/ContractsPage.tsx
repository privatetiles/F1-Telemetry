import { useState } from 'react'
import { DRIVER_INFO } from '../lib/driverData'
import { TEAM_COLORS } from '../lib/paceData'
import { driverColor } from '../lib/teamColors'

interface ContractDriver {
  code: string
  contract: number | 'TBD'
  status: 'confirmed' | 'expiring' | 'rumored'
  note?: string
}

interface TeamEntry {
  name: string
  drivers: [ContractDriver, ContractDriver]
}

const CURRENT_YEAR = 2026

// Contract data — update as deals are confirmed
const TEAMS: TeamEntry[] = [
  { name: 'Red Bull Racing', drivers: [
    { code: 'VER', contract: 2028, status: 'confirmed' },
    { code: 'HAD', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'McLaren', drivers: [
    { code: 'NOR', contract: 2027, status: 'confirmed' },
    { code: 'PIA', contract: 2026, status: 'expiring', note: 'Extension expected' },
  ]},
  { name: 'Ferrari', drivers: [
    { code: 'LEC', contract: 2029, status: 'confirmed' },
    { code: 'HAM', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'Mercedes', drivers: [
    { code: 'RUS', contract: 2026, status: 'expiring' },
    { code: 'ANT', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'Aston Martin', drivers: [
    { code: 'ALO', contract: 2026, status: 'expiring', note: 'Decision expected by year end' },
    { code: 'STR', contract: 2030, status: 'confirmed' },
  ]},
  { name: 'Williams', drivers: [
    { code: 'ALB', contract: 2027, status: 'confirmed' },
    { code: 'SAI', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'Haas F1 Team', drivers: [
    { code: 'BEA', contract: 2027, status: 'confirmed' },
    { code: 'OCO', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'Audi', drivers: [
    { code: 'HUL', contract: 2026, status: 'expiring' },
    { code: 'BOR', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'Racing Bulls', drivers: [
    { code: 'LAW', contract: 2026, status: 'expiring' },
    { code: 'LIN', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'Alpine', drivers: [
    { code: 'GAS', contract: 2026, status: 'expiring' },
    { code: 'COL', contract: 2026, status: 'expiring' },
  ]},
  { name: 'Cadillac', drivers: [
    { code: 'BOT', contract: 2026, status: 'expiring' },
    { code: 'PER', contract: 2026, status: 'expiring', note: 'Future in F1 uncertain' },
  ]},
]

// Manually curated news items — add new entries at the top
const NEWS_ITEMS = [
  { date: 'Oct 2026', text: 'Alpine confirms both GAS and COL seats are under review for 2027 — junior academy drivers being evaluated.', tag: 'Alpine' },
  { date: 'Oct 2026', text: 'Alonso says he will make a decision on his 2027 plans "before the end of the Abu Dhabi weekend."', tag: 'Aston Martin' },
  { date: 'Oct 2026', text: 'Russell in advanced talks with Mercedes over multi-year extension into 2027-28.', tag: 'Mercedes' },
  { date: 'Sep 2026', text: 'Cadillac confirms both Bottas and Perez contracts expire end of 2026; team exploring options for 2027 grid.', tag: 'Cadillac' },
  { date: 'Sep 2026', text: 'Hülkenberg linked to management change at Audi as team shifts focus toward 2027 full works entry.', tag: 'Audi' },
  { date: 'Aug 2026', text: 'Piastri and McLaren in talks over multi-year extension — deal expected to be confirmed before end of season.', tag: 'McLaren' },
]

const STATUS_LABELS: Record<ContractDriver['status'], string> = {
  confirmed: 'Confirmed',
  expiring:  'Expiring',
  rumored:   'Rumored move',
}

function StatusBadge({ status }: { status: ContractDriver['status'] }) {
  return (
    <span className={`contract-badge contract-badge-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function DriverRow({ d, teamColor }: { d: ContractDriver; teamColor: string }) {
  const info = DRIVER_INFO[d.code]
  const drvColor = driverColor(d.code)
  const isExpiring = typeof d.contract === 'number' && d.contract <= CURRENT_YEAR

  return (
    <div className="contract-driver-row">
      <span className="contract-driver-dot" style={{ background: drvColor }} />
      <span className="contract-driver-flag">{info?.flag}</span>
      <span className="contract-driver-name">
        {info ? `${info.firstName} ${info.lastName}` : d.code}
      </span>
      <span className="contract-driver-code" style={{ color: teamColor }}>{d.code}</span>
      <div className="contract-driver-meta">
        <span className={`contract-year ${isExpiring ? 'expiring' : ''}`}>
          {d.contract === 'TBD' ? 'TBD' : `Through ${d.contract}`}
        </span>
        <StatusBadge status={d.status} />
      </div>
      {d.note && <span className="contract-driver-note">{d.note}</span>}
    </div>
  )
}

function TeamCard({ team }: { team: TeamEntry }) {
  const color = TEAM_COLORS[team.name] ?? '#445566'
  return (
    <div className="contract-team-card">
      <div className="contract-team-accent" style={{ background: color }} />
      <div className="contract-team-body">
        <div className="contract-team-name" style={{ color }}>{team.name}</div>
        {team.drivers.map(d => (
          <DriverRow key={d.code} d={d} teamColor={color} />
        ))}
      </div>
    </div>
  )
}

export default function ContractsPage() {
  const [filter, setFilter] = useState<'all' | 'expiring'>('all')

  const expiring = TEAMS.flatMap(t => t.drivers).filter(d =>
    typeof d.contract === 'number' && d.contract <= CURRENT_YEAR
  )

  const visibleTeams = filter === 'expiring'
    ? TEAMS.filter(t => t.drivers.some(d => typeof d.contract === 'number' && d.contract <= CURRENT_YEAR))
    : TEAMS

  return (
    <div className="contracts-page">
      <div className="contracts-header">
        <div>
          <h1 className="contracts-title">Driver Market</h1>
          <p className="contracts-subtitle">2026 grid contracts · {expiring.length} seats expiring end of season</p>
        </div>
        <div className="contracts-filter-btns">
          <button
            className={`contracts-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >All drivers</button>
          <button
            className={`contracts-filter-btn ${filter === 'expiring' ? 'active' : ''}`}
            onClick={() => setFilter('expiring')}
          >Expiring {CURRENT_YEAR}</button>
        </div>
      </div>

      {/* Silly season watch strip */}
      {filter === 'all' && (
        <div className="silly-season-strip">
          <span className="silly-season-label">2027 WATCH</span>
          <div className="silly-season-chips">
            {expiring.map(d => {
              const info = DRIVER_INFO[d.code]
              const col = driverColor(d.code)
              return (
                <span key={d.code} className="silly-chip" style={{ borderColor: col, color: col }}>
                  {info?.flag} {d.code}
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div className="contracts-grid">
        {visibleTeams.map(t => <TeamCard key={t.name} team={t} />)}
      </div>

      {/* News section */}
      <div className="contracts-news">
        <h2 className="contracts-news-title">Silly Season News</h2>
        <div className="contracts-news-list">
          {NEWS_ITEMS.map((item, i) => (
            <div className="contracts-news-item" key={i}>
              <div className="contracts-news-meta">
                <span className="contracts-news-date">{item.date}</span>
                <span className="contracts-news-tag">{item.tag}</span>
              </div>
              <p className="contracts-news-text">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
