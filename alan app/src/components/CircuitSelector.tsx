import type { CircuitConfig, CircuitSession } from '../types'
import { CIRCUITS } from '../lib/dataIndex'

interface Props {
  selectedCircuit: CircuitConfig
  selectedSession: CircuitSession
  onCircuitChange: (circuit: CircuitConfig) => void
  onSessionChange: (session: CircuitSession) => void
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

export default function CircuitSelector({
  selectedCircuit,
  selectedSession,
  onCircuitChange,
  onSessionChange,
}: Props) {
  const nextRace = CIRCUITS
    .filter((c) => daysUntil(c.raceDate) >= 0)
    .sort((a, b) => a.raceDate.localeCompare(b.raceDate))[0] ?? null

  return (
    <div className="circuit-selector">
      {nextRace && (
        <div className="countdown-bar">
          <span className="countdown-label">Next GP</span>
          <span className="countdown-flag">{nextRace.flag}</span>
          <span className="countdown-name">{nextRace.name}</span>
          <span className="countdown-days">{countdownLabel(nextRace.raceDate)}</span>
        </div>
      )}

      <div className="selector-group">
        <label>Circuit</label>
        <div className="pill-row">
          {CIRCUITS.map((c) => {
            const locked = !c.hasData
            const active = c.id === selectedCircuit.id
            return (
              <button
                key={c.id}
                className={`pill ${active ? 'active' : ''} ${locked ? 'locked' : ''} ${c.hasPrediction ? 'predicted' : ''}`}
                title={locked ? `Predicted — race ${countdownLabel(c.raceDate) || 'TBC'}` : undefined}
                onClick={() => {
                  onCircuitChange(c)
                  onSessionChange(c.sessions[0])
                }}
              >
                {c.flag} {c.name}{locked ? ' ★' : ''}
              </button>
            )
          })}
        </div>
      </div>

      <div className="selector-group">
        <label>Session</label>
        <div className="pill-row">
          {selectedCircuit.sessions.map((s) => (
            <button
              key={s.type}
              className={`pill ${s.type === selectedSession.type ? 'active' : ''}`}
              onClick={() => onSessionChange(s)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
