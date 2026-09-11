import type { CircuitConfig, CircuitSession } from '../types'
import { CIRCUITS } from '../lib/dataIndex'
import CustomSelect from './CustomSelect'

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
          <CustomSelect
            id="season-select"
            className="selector-select-wrap selector-select-season"
            value={String(selectedSeason)}
            options={SEASONS.map(s => ({ value: String(s.key), label: s.label }))}
            onChange={value => onSeasonChange(value === 'historical' ? 'historical' : Number(value))}
          />
        </label>

        <label className="selector-field selector-field-race" htmlFor="race-select">
          <span className="selector-label">Race</span>
          <CustomSelect
            id="race-select"
            className="selector-select-wrap"
            value={selectedCircuit.id}
            options={seasonCircuits.map(c => ({
              value: c.id,
              label: c.name + (c.hasData ? '' : ' — Preview'),
              prefix: c.flag,
              dimmed: !c.hasData,
            }))}
            onChange={value => {
              const selected = seasonCircuits.find(c => c.id === value)
              if (!selected) return
              onCircuitChange(selected)
              onSessionChange(selected.sessions[0])
            }}
          />
        </label>

        <label className="selector-field selector-field-session" htmlFor="session-select">
          <span className="selector-label">Session</span>
          <CustomSelect
            id="session-select"
            className="selector-select-wrap"
            value={selectedSession.type}
            options={selectedCircuit.sessions.map(s => ({ value: s.type, label: s.label }))}
            onChange={value => {
              const selected = selectedCircuit.sessions.find(s => s.type === value)
              if (selected) onSessionChange(selected)
            }}
          />
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
