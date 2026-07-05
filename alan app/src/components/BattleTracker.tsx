import { useState, useMemo } from 'react'
import type { TelemetryPoint } from '../types'
import { driverColor } from '../lib/teamColors'

// ── Interpolation helpers ────────────────────────────────────────────────────

function distanceAtTime(tel: TelemetryPoint[], t: number): number {
  if (tel.length === 0) return 0
  if (t <= tel[0].time) return tel[0].distance
  const last = tel[tel.length - 1]
  if (t >= last.time) return last.distance
  let lo = 0, hi = tel.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (tel[mid].time < t) lo = mid; else hi = mid
  }
  const a = tel[lo], b = tel[hi]
  const frac = (t - a.time) / (b.time - a.time)
  return a.distance + frac * (b.distance - a.distance)
}

function timeAtDistance(tel: TelemetryPoint[], dist: number): number {
  if (tel.length === 0) return 0
  if (dist <= tel[0].distance) return tel[0].time
  const last = tel[tel.length - 1]
  if (dist >= last.distance) return last.time
  let lo = 0, hi = tel.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (tel[mid].distance < dist) lo = mid; else hi = mid
  }
  const a = tel[lo], b = tel[hi]
  if (b.distance === a.distance) return a.time
  const frac = (dist - a.distance) / (b.distance - a.distance)
  return a.time + frac * (b.time - a.time)
}

function formatLapTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

function formatGap(sec: number): string {
  if (sec < 0) return `−${Math.abs(sec).toFixed(3)}`
  return `+${sec.toFixed(3)}`
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  drivers: string[]
  driverTelemetry: Record<string, TelemetryPoint[]>
  progress: number
  refLapDuration: number
}

const MAX_BATTLE = 5

export default function BattleTracker({ drivers, driverTelemetry, progress, refLapDuration }: Props) {
  const [selected, setSelected] = useState<string[]>([])

  const availableDrivers = drivers.filter((d) => driverTelemetry[d])

  function toggle(driver: string) {
    setSelected((prev) => {
      if (prev.includes(driver)) return prev.filter((d) => d !== driver)
      if (prev.length >= MAX_BATTLE) return prev
      return [...prev, driver]
    })
  }

  const targetTime = progress * refLapDuration

  const gapData = useMemo(() => {
    if (selected.length < 2) return []

    const positions = selected
      .filter((d) => driverTelemetry[d])
      .map((d) => ({
        driver: d,
        dist: distanceAtTime(driverTelemetry[d], targetTime),
      }))
      .sort((a, b) => b.dist - a.dist)

    const leaderTel = driverTelemetry[positions[0]?.driver]

    return positions.map((dp, i) => {
      const gap = i === 0 ? 0 : targetTime - timeAtDistance(leaderTel, dp.dist)
      const gapToAhead = i === 0 ? null
        : targetTime - timeAtDistance(driverTelemetry[positions[i - 1].driver], dp.dist)
      return { driver: dp.driver, gap, gapToAhead, position: i + 1 }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, driverTelemetry, targetTime])

  const active = selected.length >= 2

  return (
    <div className="battle-panel">
      <div className="battle-header">
        <span className="battle-title">BATTLE</span>
        <span className="battle-subtitle">{selected.length}/5</span>
      </div>

      <div className="battle-driver-select">
        {availableDrivers.map((d) => {
          const isSel = selected.includes(d)
          const disabled = !isSel && selected.length >= MAX_BATTLE
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

      {active && selected.length > 1 && (
        <div className="battle-footer">
          gap to leader · △ to car ahead
        </div>
      )}
    </div>
  )
}
