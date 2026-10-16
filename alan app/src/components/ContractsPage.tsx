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

// Contract data — last updated Oct 2026
const TEAMS: TeamEntry[] = [
  { name: 'Red Bull Racing', drivers: [
    { code: 'VER', contract: 2030, status: 'confirmed' },
    { code: 'HAD', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'McLaren', drivers: [
    { code: 'NOR', contract: 2030, status: 'confirmed' },
    { code: 'PIA', contract: 2028, status: 'confirmed' },
  ]},
  { name: 'Ferrari', drivers: [
    { code: 'LEC', contract: 2028, status: 'confirmed' },
    { code: 'HAM', contract: 2027, status: 'confirmed', note: 'Holds personal option to extend to 2028' },
  ]},
  { name: 'Mercedes', drivers: [
    { code: 'RUS', contract: 2027, status: 'confirmed', note: 'Performance clause activated' },
    { code: 'ANT', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'Aston Martin', drivers: [
    { code: 'ALO', contract: 2027, status: 'confirmed', note: 'Extended Sep 29 — Adrian Newey cited as key factor' },
    { code: 'STR', contract: 2030, status: 'confirmed' },
  ]},
  { name: 'Williams', drivers: [
    { code: 'SAI', contract: 2027, status: 'confirmed' },
    { code: 'ALB', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'Haas F1 Team', drivers: [
    { code: 'BEA', contract: 2027, status: 'confirmed' },
    { code: 'OCO', contract: 2026, status: 'expiring', note: 'Confirmed departure — Camara signed for 2027' },
  ]},
  { name: 'Audi', drivers: [
    { code: 'HUL', contract: 2027, status: 'confirmed', note: 'Confirmed at Baku GP (Sep 25)' },
    { code: 'BOR', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'Racing Bulls', drivers: [
    { code: 'LAW', contract: 2026, status: 'expiring', note: 'Expected to be retained — decision imminent' },
    { code: 'LIN', contract: 2027, status: 'confirmed' },
  ]},
  { name: 'Alpine', drivers: [
    { code: 'GAS', contract: 2028, status: 'confirmed' },
    { code: 'COL', contract: 2027, status: 'confirmed', note: 'Extension confirmed Aug 27' },
  ]},
  { name: 'Cadillac', drivers: [
    { code: 'BOT', contract: 2027, status: 'rumored', note: 'Seat at risk — Ocon & Herta linked' },
    { code: 'PER', contract: 2027, status: 'confirmed', note: 'Multi-year deal; team reviewing lineup' },
  ]},
]

// Manually curated news items — add new entries at the top
const NEWS_ITEMS = [
  { date: 'Oct 2026', text: 'Cadillac considering replacing Bottas for 2027 — Esteban Ocon and Colton Herta both linked to second seat. Perez considered the more secure of the two.', tag: 'Cadillac' },
  { date: 'Oct 2026', text: 'Liam Lawson widely expected to be retained at Racing Bulls alongside Lindblad. Ted Kravitz reports Red Bull have "already made the decision" — official announcement pending.', tag: 'Racing Bulls' },
  { date: 'Sep 2026', text: 'Fernando Alonso signs Aston Martin extension for 2027, citing Adrian Newey\'s presence as the decisive factor. Confirmed Sep 29 alongside Lance Stroll.', tag: 'Aston Martin' },
  { date: 'Sep 2026', text: 'Audi confirm Hülkenberg and Bortoleto for 2027 at Baku. Team boss Binotto shuts down persistent Sainz-to-Audi rumours definitively.', tag: 'Audi' },
  { date: 'Aug 2026', text: 'Haas sign Rafael Camara (Ferrari Academy, 21) to a multi-year deal for 2027. Ocon confirmed departure — described himself as a "free agent" during Azerbaijan GP weekend.', tag: 'Haas' },
  { date: 'Aug 2026', text: 'Alpine announce Colapinto extension (Aug 27) — unchanged 2027 lineup with Gasly (contracted through 2028) confirmed on Formula1.com.', tag: 'Alpine' },
  { date: 'Aug 2026', text: 'Williams sign both Sainz and Albon to 2027 extensions despite difficult season. Sainz multi-year, Albon one-year. Sainz-to-Audi rumours killed off simultaneously.', tag: 'Williams' },
  { date: 'Aug 2026', text: 'Verstappen signs Red Bull deal through 2030 (Aug 20). Piastri extends with McLaren through 2028. George Russell confirms Mercedes performance clause is activated for 2027.', tag: 'Market' },
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
    (typeof d.contract === 'number' && d.contract <= CURRENT_YEAR) || d.status === 'rumored'
  )

  const visibleTeams = filter === 'expiring'
    ? TEAMS.filter(t => t.drivers.some(d =>
        (typeof d.contract === 'number' && d.contract <= CURRENT_YEAR) || d.status === 'rumored'
      ))
    : TEAMS

  return (
    <div className="contracts-page">
      <div className="contracts-header">
        <div>
          <h1 className="contracts-title">Driver Market</h1>
          <p className="contracts-subtitle">2026 grid · {expiring.length} seat{expiring.length !== 1 ? 's' : ''} still open for 2027 · updated Oct 2026</p>
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
