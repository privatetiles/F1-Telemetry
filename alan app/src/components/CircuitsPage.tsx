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

export default function CircuitsPage() {
  const sorted = Object.entries(CIRCUIT_DATA).sort(
    ([a], [b]) => (CIRCUIT_ROUND[a] ?? 99) - (CIRCUIT_ROUND[b] ?? 99)
  )

  return (
    <div className="circuits-page">
      <h2 className="page-title">2026 Circuit Guide</h2>
      <div className="circuits-grid">
        {sorted.map(([id, c]) => {
          const flag  = CIRCUIT_FLAGS[id] ?? '🏁'
          const round = CIRCUIT_ROUND[id] ?? '?'
          return (
            <div className="circuit-card" key={id}>
              <div className="circuit-card-header">
                <span className="circ-round">R{round}</span>
                <span className="circ-flag">{flag}</span>
                <div className="circ-name-block">
                  <span className="circ-country">{c.country}</span>
                  <span className="circ-name">{c.fullName}</span>
                </div>
              </div>
              <div className="circuit-card-stats">
                <div className="circ-stat">
                  <span className="cs-key">Length</span>
                  <span className="cs-val">{c.length}</span>
                </div>
                <div className="circ-stat">
                  <span className="cs-key">Race Laps</span>
                  <span className="cs-val">{c.laps}</span>
                </div>
                <div className="circ-stat">
                  <span className="cs-key">DRS Zones</span>
                  <span className="cs-val">{c.drsZones}</span>
                </div>
                <div className="circ-stat circ-stat-wide">
                  <span className="cs-key">Lap Record</span>
                  <span className="cs-val">
                    {c.lapRecord === '—'
                      ? '—'
                      : <>{c.lapRecord} <span className="cs-sub">({c.lapRecordHolder}, {c.lapRecordYear})</span></>
                    }
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
