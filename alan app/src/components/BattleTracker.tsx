import { useMemo } from 'react'
import type { TelemetryPoint } from '../types'
import { driverColor } from '../lib/teamColors'
import { computeBattleGaps } from '../lib/battleGaps'
import Icon from './Icon'

function formatLapTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

function formatGap(sec: number): string {
  if (sec < 0) return `−${Math.abs(sec).toFixed(3)}`
  return `+${sec.toFixed(3)}`
}

interface Props {
  drivers: string[]
  driverTelemetry: Record<string, TelemetryPoint[]>
  progress: number
  refLapDuration: number
  battleDrivers: string[]
  onChangeBattleDrivers: (d: string[]) => void
}

const MAX_BATTLE = 5

export default function BattleTracker({
  drivers,
  driverTelemetry,
  progress,
  refLapDuration,
  battleDrivers,
  onChangeBattleDrivers,
}: Props) {
  const availableDrivers = drivers.filter((d) => driverTelemetry[d])
  const selectableDrivers = availableDrivers.filter((driver) => !battleDrivers.includes(driver))

  function toggle(driver: string) {
    if (battleDrivers.includes(driver)) {
      onChangeBattleDrivers(battleDrivers.filter((d) => d !== driver))
    } else if (battleDrivers.length < MAX_BATTLE) {
      onChangeBattleDrivers([...battleDrivers, driver])
    }
  }

  const targetTime = progress * refLapDuration

  const gapData = useMemo(
    () => computeBattleGaps(battleDrivers, driverTelemetry, targetTime),
    [battleDrivers, driverTelemetry, targetTime],
  )

  const active = battleDrivers.length >= 2

  return (
    <div className="battle-panel">
      <div className="battle-header">
        <span className="battle-title">BATTLE</span>
        <span className="battle-subtitle">{battleDrivers.length}/5</span>
      </div>

      <div className="battle-controls">
        <label className="battle-add-field">
          <span className="battle-control-label">Track drivers</span>
          <span className="battle-add-select-wrap">
            <select
              value=""
              onChange={(event) => {
                if (event.target.value) toggle(event.target.value)
              }}
              disabled={battleDrivers.length >= MAX_BATTLE || selectableDrivers.length === 0}
              aria-label="Add driver to battle"
            >
              <option value="">Add a driver…</option>
              {selectableDrivers.map((driver) => (
                <option key={driver} value={driver}>{driver}</option>
              ))}
            </select>
            <Icon name="chevron-down" size={14} />
          </span>
        </label>

        {battleDrivers.length > 0 && (
          <div className="battle-selected-drivers" aria-label="Tracked drivers">
            {battleDrivers.map((driver) => (
            <button
              key={driver}
              className="battle-selected-driver"
              style={{ borderColor: driverColor(driver), color: driverColor(driver) }}
              onClick={() => toggle(driver)}
              title={`Remove ${driver}`}
            >
              {driver}<span aria-hidden>×</span>
            </button>
            ))}
          </div>
        )}
      </div>

      {!active && (
        <div className="battle-hint">
          {battleDrivers.length === 0 ? 'Add two drivers to compare live gaps.' : 'Add one more driver to start comparing.'}
        </div>
      )}

      {active && (
        <div className="battle-gap-list">
          {gapData.map(({ driver, gap, gapToAhead, position }) => {
            const col = driverColor(driver)
            const isLeader = position === 1
            return (
              <div key={driver} className="battle-gap-row">
                <span className="battle-pos" style={{ color: isLeader ? '#f0c040' : '#556' }}>
                  P{position}
                </span>
                <span className="battle-dot" style={{ background: col }} />
                <span className="battle-drv" style={{ color: col }}>{driver}</span>
                <span className="battle-time">
                  {isLeader
                    ? <span className="battle-laptime">{formatLapTime(targetTime)}</span>
                    : <span className={`battle-gap ${gap > 1 ? 'far' : gap > 0.3 ? 'mid' : 'close'}`}>
                        {formatGap(gap)}
                      </span>
                  }
                </span>
                {!isLeader && gapToAhead !== null && (
                  <span className="battle-ahead" title="Gap to car ahead">
                    {gapToAhead <= 0.001 ? 'DRS' : `△${gapToAhead.toFixed(3)}`}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {active && (
        <div className="battle-footer">
          gap to leader · △ to car ahead
        </div>
      )}
    </div>
  )
}
