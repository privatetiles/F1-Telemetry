import { useState } from 'react'
import { CIRCUIT_DATA } from '../lib/circuitData'

const CIRCUIT_FLAGS: Record<string, string> = {
  australia:          '🇦🇺',
  china:              '🇨🇳',
  japan:              '🇯🇵',
  miami:              '🇺🇸',
  canadian:           '🇨🇦',
  monaco:             '🇲🇨',
  barcelona_catalunya:'🇪🇸',
  austrian:           '🇦🇹',
  british:            '🇬🇧',
  belgian:            '🇧🇪',
  hungarian:          '🇭🇺',
  dutch:              '🇳🇱',
  italian:            '🇮🇹',
  madrid:             '🇪🇸',
  azerbaijan:         '🇦🇿',
  singapore:          '🇸🇬',
  united_states:      '🇺🇸',
  mexican_city:       '🇲🇽',
  sao_paulo:          '🇧🇷',
  las_vegas:          '🇺🇸',
  qatar:              '🇶🇦',
  abu_dhabi:          '🇦🇪',
}

const CIRCUIT_ROUND: Record<string, number> = {
  australia: 1, china: 2, japan: 3, miami: 4, canadian: 5, monaco: 6,
  barcelona_catalunya: 7, austrian: 8, british: 9, belgian: 10,
  hungarian: 11, dutch: 12, italian: 13, madrid: 14, azerbaijan: 15,
  singapore: 16, united_states: 17, mexican_city: 18, sao_paulo: 19,
  las_vegas: 20, qatar: 21, abu_dhabi: 22,
}

const DOWNFORCE_COLOR: Record<string, string> = {
  'Very Low': '#e74c3c',
  'Low':      '#e67e22',
  'Medium':   '#f0c040',
  'High':     '#27ae60',
}

const TYPE_COLOR: Record<string, string> = {
  'Permanent':      '#3672C6',
  'Street':         '#e10600',
  'Semi-Permanent': '#8e44ad',
}

function DownforceBar({ level }: { level: string }) {
  const levels = ['Very Low', 'Low', 'Medium', 'High']
  const idx = levels.indexOf(level)
  return (
    <div className="df-bar-wrap">
      {levels.map((l, i) => (
        <span
          key={l}
          className="df-bar-seg"
          style={{ background: i <= idx ? DOWNFORCE_COLOR[level] : '#1e2a3a' }}
        />
      ))}
    </div>
  )
}

export default function CircuitsPage() {
  const [search, setSearch] = useState('')

  const sorted = Object.entries(CIRCUIT_DATA)
    .sort(([a], [b]) => (CIRCUIT_ROUND[a] ?? 99) - (CIRCUIT_ROUND[b] ?? 99))
    .filter(([, c]) =>
      search === '' ||
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase()) ||
      c.locality.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="circuits-page">
      <h2 className="page-title">2026 Circuit Guide</h2>
      <p className="page-intro">
        The 2026 Formula 1 calendar spans 22 rounds across five continents. Each card includes the key
        technical data used by race engineers: lap length, corner count, DRS zones, downforce requirement,
        top speed, direction, and the circuit character that defines its strategic challenges.
      </p>

      <input
        className="circuit-search"
        placeholder="Search circuits…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="circuits-grid">
        {sorted.map(([id, c]) => {
          const flag  = CIRCUIT_FLAGS[id] ?? '🏁'
          const round = CIRCUIT_ROUND[id] ?? '?'
          const raceDist = (c.lengthKm * c.laps).toFixed(1)

          return (
            <div className="circuit-card" key={id}>

              {/* Header */}
              <div className="circuit-card-header">
                <span className="circ-round">R{round}</span>
                <span className="circ-flag">{flag}</span>
                <div className="circ-name-block">
                  <span className="circ-country">{c.locality}, {c.country}</span>
                  <span className="circ-name">{c.fullName}</span>
                </div>
              </div>

              {/* Type + direction badges */}
              <div className="circ-badges">
                <span className="circ-badge" style={{ borderColor: TYPE_COLOR[c.circuitType], color: TYPE_COLOR[c.circuitType] }}>
                  {c.circuitType}
                </span>
                <span className="circ-badge circ-badge-dim">
                  {c.direction === 'Clockwise' ? '↻ CW' : '↺ CCW'}
                </span>
                <span className="circ-badge circ-badge-dim">
                  Since {c.firstGP}
                </span>
              </div>

              {/* Stats grid */}
              <div className="circuit-card-stats">
                <div className="circ-stat">
                  <span className="cs-key">Length</span>
                  <span className="cs-val">{c.length}</span>
                </div>
                <div className="circ-stat">
                  <span className="cs-key">Corners</span>
                  <span className="cs-val">{c.corners}</span>
                </div>
                <div className="circ-stat">
                  <span className="cs-key">Race Laps</span>
                  <span className="cs-val">{c.laps}</span>
                </div>
                <div className="circ-stat">
                  <span className="cs-key">Race Dist.</span>
                  <span className="cs-val">{raceDist} km</span>
                </div>
                <div className="circ-stat">
                  <span className="cs-key">DRS Zones</span>
                  <span className="cs-val">{c.drsZones}</span>
                </div>
                <div className="circ-stat">
                  <span className="cs-key">Top Speed</span>
                  <span className="cs-val">{c.topSpeed}</span>
                </div>

                {/* Downforce — full width */}
                <div className="circ-stat circ-stat-wide">
                  <span className="cs-key">Downforce</span>
                  <span className="cs-val cs-val-df">
                    <span style={{ color: DOWNFORCE_COLOR[c.downforceLevel] }}>{c.downforceLevel}</span>
                    <DownforceBar level={c.downforceLevel} />
                  </span>
                </div>

                {/* Lap record — full width */}
                <div className="circ-stat circ-stat-wide">
                  <span className="cs-key">Lap Record</span>
                  <span className="cs-val">
                    {c.lapRecord === '—'
                      ? <span className="cs-sub">No record yet</span>
                      : <>{c.lapRecord} <span className="cs-sub">{c.lapRecordHolder}, {c.lapRecordYear}</span></>
                    }
                  </span>
                </div>
              </div>

              {/* Character note */}
              <div className="circ-character">{c.character}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
