import { useState } from 'react'
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
  const [sheetOpen, setSheetOpen] = useState(false)
  const seasonCircuits = getSeasonCircuits(selectedSeason)

  const nextRace = getSeasonCircuits(2026)
    .filter((c) => daysUntil(c.raceDate) >= 0)
    .sort((a, b) => a.raceDate.localeCompare(b.raceDate))[0] ?? null

  const sessionOptions = selectedCircuit.sessions.map(s => ({ value: s.type, label: s.label }))
  const raceOptions = seasonCircuits.map(c => ({
    value: c.id,
    label: c.name + (c.hasData ? '' : ' — Preview'),
    prefix: c.flag,
    dimmed: !c.hasData,
  }))
  const seasonOptions = SEASONS.map(s => ({ value: String(s.key), label: s.label }))

  function handleSeasonChange(value: string) {
    onSeasonChange(value === 'historical' ? 'historical' : Number(value))
  }

  function handleRaceChange(value: string) {
    const selected = seasonCircuits.find(c => c.id === value)
    if (!selected) return
    onCircuitChange(selected)
    onSessionChange(selected.sessions[0])
  }

  function handleSessionChange(value: string) {
    const selected = selectedCircuit.sessions.find(s => s.type === value)
    if (selected) {
      onSessionChange(selected)
      setSheetOpen(false)
    }
  }

  return (
    <section className="circuit-selector" aria-label="Replay selection">
      {/* Desktop selectors */}
      <div className="selector-fields">
        <label className="selector-field" htmlFor="season-select">
          <span className="selector-label">Season</span>
          <CustomSelect
            id="season-select"
            className="selector-select-wrap selector-select-season"
            value={String(selectedSeason)}
            options={seasonOptions}
            onChange={handleSeasonChange}
          />
        </label>

        <label className="selector-field selector-field-race" htmlFor="race-select">
          <span className="selector-label">Race</span>
          <CustomSelect
            id="race-select"
            className="selector-select-wrap"
            value={selectedCircuit.id}
            options={raceOptions}
            onChange={handleRaceChange}
          />
        </label>

        <label className="selector-field selector-field-session" htmlFor="session-select">
          <span className="selector-label">Session</span>
          <CustomSelect
            id="session-select"
            className="selector-select-wrap"
            value={selectedSession.type}
            options={sessionOptions}
            onChange={handleSessionChange}
          />
        </label>
      </div>

      {/* Mobile trigger pill */}
      <button
        className="selector-mobile-trigger"
        onClick={() => setSheetOpen(true)}
        aria-label="Change circuit and session"
      >
        <span className="selector-mobile-flag">{selectedCircuit.flag}</span>
        <span className="selector-mobile-name">{selectedCircuit.name}</span>
        <span className="selector-mobile-sep">·</span>
        <span className="selector-mobile-session">{selectedSession.label}</span>
        <svg className="selector-mobile-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="selector-sheet-root">
          <div className="selector-sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="selector-sheet" role="dialog" aria-modal="true" aria-label="Select session">
            <div className="selector-sheet-header">
              <span className="selector-sheet-title">Select Session</span>
              <button className="selector-sheet-close" onClick={() => setSheetOpen(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="selector-sheet-body">
              <label className="selector-field" htmlFor="sheet-season-select">
                <span className="selector-label">Season</span>
                <CustomSelect
                  id="sheet-season-select"
                  className="selector-select-wrap"
                  value={String(selectedSeason)}
                  options={seasonOptions}
                  onChange={handleSeasonChange}
                />
              </label>
              <label className="selector-field selector-field-race" htmlFor="sheet-race-select">
                <span className="selector-label">Race</span>
                <CustomSelect
                  id="sheet-race-select"
                  className="selector-select-wrap"
                  value={selectedCircuit.id}
                  options={raceOptions}
                  onChange={handleRaceChange}
                />
              </label>
              <label className="selector-field" htmlFor="sheet-session-select">
                <span className="selector-label">Session</span>
                <CustomSelect
                  id="sheet-session-select"
                  className="selector-select-wrap"
                  value={selectedSession.type}
                  options={sessionOptions}
                  onChange={handleSessionChange}
                />
              </label>
            </div>
          </div>
        </div>
      )}

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
