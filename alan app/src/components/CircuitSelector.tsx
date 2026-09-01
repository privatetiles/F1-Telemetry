import type { CircuitConfig, CircuitSession } from '../types'
import { CIRCUITS } from '../lib/dataIndex'
import Icon from './Icon'

interface Props {
  selectedCircuit: CircuitConfig
  selectedSession: CircuitSession
  selectedSeason: 'historical' | number
  onCircuitChange: (circuit: CircuitConfig) => void
  onSessionChange: (session: CircuitSession) => void
  onSeasonChange: (season: 'historical' | number) => void
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function countdownLabel(dateStr: string): string {
  const d = daysUntil(dateStr)
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  if (d > 0)  return `in ${d} days`
  return ''
}

const SEASONS: Array<{ key: 'historical' | number; label: string }> = [
  { key: 'historical', label: 'Historical' },
  { key: 2026,         label: '2026' },
  { key: 2027,         label: '2027' },
]

function getSeasonCircuits(season: 'historical' | number): CircuitConfig[] {
  if (season === 'historical') return CIRCUITS.filter(c => c.year !== undefined && c.year < 2026)
  if (season === 2026)         return CIRCUITS.filter(c => !c.year)
  return CIRCUITS.filter(c => c.year === season)
}

export default function CircuitSelector({
  selectedCircuit,
  selectedSession,
  selectedSeason,
  onCircuitChange,
  onSessionChange,
  onSeasonChange,
}: Props) {
  const seasonCircuits = getSeasonCircuits(selectedSeason)

  const nextRace = getSeasonCircuits(2026)
    .filter((c) => daysUntil(c.raceDate) >= 0)
    .sort((a, b) => a.raceDate.localeCompare(b.raceDate))[0] ?? null

  return (
    <section className="circuit-selector" aria-label="Replay selection">
      <div className="selector-fields">
        <label className="selector-field" htmlFor="season-select">
          <span className="selector-label">Season</span>
          <span className="selector-select-wrap">
            <select
              id="season-select"
              className="selector-select selector-select-season"
              value={String(selectedSeason)}
              onChange={(event) => {
                const value = event.target.value
                onSeasonChange(value === 'historical' ? 'historical' : Number(value))
              }}
            >
              {SEASONS.map((season) => (
                <option key={String(season.key)} value={String(season.key)}>{season.label}</option>
              ))}
            </select>
            <Icon name="chevron-down" size={15} />
          </span>
        </label>

        <label className="selector-field selector-field-race" htmlFor="race-select">
          <span className="selector-label">Race</span>
          <span className="selector-select-wrap">
            <select
              id="race-select"
              className="selector-select"
              value={selectedCircuit.id}
              onChange={(event) => {
                const selected = seasonCircuits.find((candidate) => candidate.id === event.target.value)
                if (!selected) return
                onCircuitChange(selected)
                onSessionChange(selected.sessions[0])
              }}
            >
              {seasonCircuits.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}{candidate.hasData ? '' : ' — Preview'}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={15} />
          </span>
        </label>

        <label className="selector-field selector-field-session" htmlFor="session-select">
          <span className="selector-label">Session</span>
          <span className="selector-select-wrap">
            <select
              id="session-select"
              className="selector-select"
              value={selectedSession.type}
              onChange={(event) => {
                const selected = selectedCircuit.sessions.find((candidate) => candidate.type === event.target.value)
                if (selected) onSessionChange(selected)
              }}
            >
              {selectedCircuit.sessions.map((candidate) => (
                <option key={candidate.type} value={candidate.type}>{candidate.label}</option>
              ))}
            </select>
            <Icon name="chevron-down" size={15} />
          </span>
        </label>
      </div>

      {nextRace && selectedSeason === 2026 && (
        <div className="selector-next-race" aria-label={`Next race: ${nextRace.name} ${countdownLabel(nextRace.raceDate)}`}>
          <span className="selector-next-label">Up next</span>
          <span className="selector-next-name">{nextRace.name}</span>
          <span className="selector-next-days">{countdownLabel(nextRace.raceDate)}</span>
        </div>
      )}
    </section>
  )
}
