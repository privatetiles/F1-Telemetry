import { useMemo } from 'react'
import type { TelemetryPoint } from '../types'
import { driverColor } from '../lib/teamColors'
import { computeBattleGaps } from '../lib/battleGaps'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [battleDrivers, driverTelemetry, targetTime],
  )

  const active = battleDrivers.length >= 2

  return (
    <div className="battle-panel">
      <div className="battle-header">
        <span className="battle-title">BATTLE</span>
        <span className="battle-subtitle">{battleDrivers.length}/5</span>
      </div>

      <div className="battle-driver-select">
        {availableDrivers.map((d) => {
          const isSel = battleDrivers.includes(d)
          const disabled = !isSel && battleDrivers.length >= MAX_BATTLE
          return (
            <button
              key={d}
              className={`battle-pill ${isSel ? 'sel' : ''} ${disabled ? 'dim' : ''}`}
              style={isSel ? { borderColor: driverColor(d), color: driverColor(d) } : {}}
              onClick={() => toggle(d)}
              disabled={disabled}
            >
              {d}
            </button>
          )
        })}
      </div>

      {!active && (
        <div className="battle-hint">Pick 2–5 drivers to see live gaps</div>
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
