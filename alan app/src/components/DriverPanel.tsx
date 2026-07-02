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
}: Props) {
  // Sort: classified drivers by lap time first, then DNFs at bottom
  const classified = drivers
    .filter((d) => !dnfDrivers.has(d))
    .sort((a, b) => (lapTimes[a] ?? Infinity) - (lapTimes[b] ?? Infinity))

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
        {sorted.map((driver, pos) => {
          const isDnf = dnfDrivers.has(driver)
          const t = lapTimes[driver]
          const delta = !isDnf && isFinite(t) && isFinite(fastestTime) ? t - fastestTime : null
          const active = activeDrivers.has(driver)
          const highlighted = highlightedDriver === driver

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
              <span className="driver-pos">{isDnf ? '—' : pos + 1}</span>
              <span className="driver-dot" style={{ background: driverColor(driver) }} />
              <span className="driver-name">{driver}</span>
              <span className={`driver-time ${isDnf ? 'dnf-label' : ''}`}>
                {isDnf
                  ? 'DNF'
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
