import { driverColor } from '../lib/teamColors'

interface Props {
  drivers: string[]
  activeDrivers: Set<string>
  dnfDrivers: Set<string>
  onSelect: (driver: string) => void
  lapTimes: Record<string, number>
  highlightedDriver: string | null
  onHighlight: (driver: string | null) => void
  soloMode: boolean
  onSoloToggle: () => void
  currentPositions?: Record<string, number>
  lapsBehind?: Record<string, number>
  gapsToAhead?: Record<string, number>
  currentCompounds?: Record<string, string>
  tunedDriver?: string | null
  onTuneDriver?: (driver: string | null) => void
}

export default function DriverPanel({
  drivers,
  activeDrivers,
  dnfDrivers,
  onSelect,
  lapTimes,
  highlightedDriver,
  onHighlight,
  soloMode,
  onSoloToggle,
  currentPositions,
  lapsBehind,
  gapsToAhead,
  currentCompounds,
  tunedDriver,
  onTuneDriver,
}: Props) {
  const liveMode = !!currentPositions

  // In live mode (full race), sort by current race position; otherwise by lap time.
  // Within the lapped-driver group (lapTimes = Infinity), sort by laps behind ascending.
  const classified = drivers
    .filter((d) => !dnfDrivers.has(d))
    .sort((a, b) => {
      if (liveMode) return (currentPositions![a] ?? 999) - (currentPositions![b] ?? 999)
      const lta = lapTimes[a] ?? Infinity
      const ltb = lapTimes[b] ?? Infinity
      if (lta !== ltb) return lta - ltb
      // Both lapped (Infinity): fewer laps behind = higher position
      return (lapsBehind?.[a] ?? 0) - (lapsBehind?.[b] ?? 0)
    })

  const dnfList = drivers.filter((d) => dnfDrivers.has(d))
  const sorted = [...classified, ...dnfList]
  const fastestTime = Math.min(...classified.map((d) => lapTimes[d]).filter(isFinite))

  return (
    <div className="driver-panel">
      <div className="panel-header">
        <span className="panel-title">Drivers</span>
        <button
          className={`solo-toggle ${soloMode ? 'active' : ''}`}
          onClick={onSoloToggle}
          title={soloMode ? 'Switch to all drivers' : 'Switch to single driver'}
        >
          {soloMode ? '1' : 'ALL'}
        </button>
      </div>

      <div className="driver-list">
        {sorted.map((driver, idx) => {
          const isDnf = dnfDrivers.has(driver)
          const t = lapTimes[driver]
          const delta = !isDnf && isFinite(t) && isFinite(fastestTime) ? t - fastestTime : null
          const active = activeDrivers.has(driver)
          const highlighted = highlightedDriver === driver
          const pos = liveMode
            ? (currentPositions![driver] ?? idx + 1)
            : idx + 1

          return (
            <div
              key={driver}
              className={[
                'driver-row',
                active ? 'active' : 'inactive',
                highlighted ? 'highlighted' : '',
                isDnf ? 'dnf' : '',
              ].join(' ')}
              onClick={() => !isDnf && onSelect(driver)}
              onMouseEnter={() => !soloMode && !isDnf && onHighlight(driver)}
              onMouseLeave={() => !soloMode && onHighlight(null)}
            >
              <span className="driver-pos">{isDnf ? '—' : `P${pos}`}</span>
              <span className="driver-dot" style={{ background: driverColor(driver) }} />
              <span className="driver-name">{driver}</span>
              {liveMode && currentCompounds?.[driver] && (
                <span className={`compound-chip compound-${currentCompounds[driver].toLowerCase()}`}>
                  {currentCompounds[driver][0]}
                </span>
              )}
              {onTuneDriver && !isDnf && (
                <button
                  className={`radio-tune-btn ${tunedDriver === driver ? 'tuned' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTuneDriver(tunedDriver === driver ? null : driver)
                  }}
                  title={tunedDriver === driver ? `Disconnect from ${driver}` : `Tune to ${driver}`}
                >
                  📻
                </button>
              )}
              <span className={`driver-time ${isDnf ? 'dnf-label' : ''}`}>
                {isDnf
                  ? 'DNF'
                  : liveMode
                  ? lapsBehind?.[driver] != null
                    ? `+${lapsBehind[driver]} Lap${lapsBehind[driver] > 1 ? 's' : ''}`
                    : pos === 1
                    ? 'LEADER'
                    : gapsToAhead?.[driver] != null
                    ? `+${gapsToAhead[driver].toFixed(1)}s`
                    : '—'
                  : isFinite(t)
                  ? delta === 0 || delta === null
                    ? formatTime(t)
                    : `+${delta!.toFixed(3)}`
                  : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(3)
  return `${m}:${s.padStart(6, '0')}`
}
