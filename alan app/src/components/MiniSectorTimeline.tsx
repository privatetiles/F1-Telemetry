import type { ProcessedMiniSector, ColorMode } from '../types'
import { characteristicColor, deltaToColor } from '../lib/miniSectors'
import { driverColor } from '../lib/teamColors'

const CATEGORY_COLORS: Record<string, string> = {
  'Slow corners': '#e74c3c',
  'Fast corners': '#27ae60',
  'Straights':    '#8899aa',
}

const CATEGORY_LABELS: Record<string, string> = {
  'Slow corners': 'Slow',
  'Fast corners': 'Fast',
  'Straights':    'Str',
}

interface Props {
  miniSectors: ProcessedMiniSector[]
  activeDrivers: Set<string>
  highlightedDriver: string | null
  colorMode: ColorMode
  onColorModeChange: (mode: ColorMode) => void
  progress: number
}

function fastestInSector(ms: ProcessedMiniSector): { driver: string; time: number } | null {
  let bestDriver: string | null = null
  let bestTime = Infinity
  for (const [driver, stats] of Object.entries(ms.driverStats)) {
    if (stats.timeSpent < bestTime) {
      bestTime = stats.timeSpent
      bestDriver = driver
    }
  }
  return bestDriver ? { driver: bestDriver, time: bestTime } : null
}

export default function MiniSectorTimeline({
  miniSectors,
  highlightedDriver,
  colorMode,
  onColorModeChange,
  progress,
}: Props) {
  if (miniSectors.length === 0) return null

  const maxDelta = Math.max(
    ...miniSectors.flatMap((ms) =>
      Object.values(ms.driverStats).map((s) => s.deltaVsFastest)
    )
  )

  const currentSectorIdx = Math.floor(progress * miniSectors.length)

  // null in All mode with nothing hovered — no auto-fallback to first driver
  const focusDriver = highlightedDriver

  const fastestPerSector = miniSectors.map(fastestInSector)
  const hasCategoryData = miniSectors[0]?.category != null

  return (
    <div className="mini-sector-timeline">
      <div className="timeline-header">
        <span className="timeline-title">Mini Sectors</span>
        <div className="color-mode-toggle">
          <button
            className={`pill small ${colorMode === 'speed' ? 'active' : ''}`}
            onClick={() => onColorModeChange('speed')}
          >
            {hasCategoryData ? 'Track Type' : 'Speed'}
          </button>
          <button
            className={`pill small ${colorMode === 'delta' ? 'active' : ''}`}
            onClick={() => onColorModeChange('delta')}
          >
            Time Delta
          </button>
        </div>
      </div>

      {/* Sector color bar */}
      <div className="sector-bar">
        {miniSectors.map((ms, i) => {
          const color = colorMode === 'speed'
            ? (ms.category ? (CATEGORY_COLORS[ms.category] ?? '#667') : characteristicColor(ms.avgThrottleRef, ms.avgBrakeRef))
            : focusDriver && ms.driverStats[focusDriver]
            ? deltaToColor(ms.driverStats[focusDriver].deltaVsFastest, maxDelta)
            : '#333'

          return (
            <div
              key={i}
              className={`sector-cell ${i === currentSectorIdx ? 'current' : ''}`}
              style={{ background: color }}
              title={ms.category ? `${ms.category}: ${ms.avgSpeedRef.toFixed(0)} km/h` : `S${i + 1}: ${ms.avgSpeedRef.toFixed(0)} km/h`}
            />
          )
        })}
      </div>

      {/* All mode: fastest driver per sector row */}
      {!focusDriver && (
        <div className="delta-rows">
          <div className="delta-driver-label" style={{ color: '#778' }}>
            Fastest driver per mini sector
          </div>
          <div className="delta-row">
            {fastestPerSector.map((best, i) => {
              if (!best) return <div key={i} className="delta-cell empty" />
              const bg = driverColor(best.driver)
              return (
                <div
                  key={i}
                  className={`delta-cell fastest-cell ${i === currentSectorIdx ? 'current' : ''}`}
                  style={{ background: bg }}
                  title={`S${i + 1}: ${best.driver} — ${best.time.toFixed(3)}s`}
                >
                  <span className="fastest-driver">{best.driver}</span>
                  <span className="fastest-time">{best.time.toFixed(2)}s</span>
                </div>
              )
            })}
          </div>
          <div className="sector-numbers">
            {miniSectors.map((_, i) => (
              <span key={i} className="sector-num">
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Solo / hovered driver: time delta row */}
      {focusDriver && (
        <div className="delta-rows">
          <div className="delta-driver-label" style={{ color: driverColor(focusDriver) }}>
            {focusDriver} — time delta vs fastest per mini sector
          </div>
          <div className="delta-row">
            {miniSectors.map((ms, i) => {
              const stats = ms.driverStats[focusDriver]
              if (!stats) return <div key={i} className="delta-cell empty" />
              const delta = stats.deltaVsFastest
              return (
                <div
                  key={i}
                  className={`delta-cell ${i === currentSectorIdx ? 'current' : ''}`}
                  style={{ background: deltaToColor(delta, maxDelta) }}
                  title={`S${i + 1}: ${delta >= 0 ? '+' : ''}${delta.toFixed(3)}s`}
                >
                  <span className="delta-value">
                    {delta < 0.001 ? '—' : `+${delta.toFixed(2)}`}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="sector-numbers">
            {miniSectors.map((_, i) => (
              <span key={i} className="sector-num">
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sector detail — All mode */}
      {!focusDriver && miniSectors[currentSectorIdx] && (() => {
        const best = fastestPerSector[currentSectorIdx]
        if (!best) return null
        const ms = miniSectors[currentSectorIdx]
        const catLabel = ms.category ? CATEGORY_LABELS[ms.category] ?? ms.category : `S${currentSectorIdx + 1}`
        const catColor = ms.category ? CATEGORY_COLORS[ms.category] : undefined
        return (
          <div className="sector-detail">
            <span style={catColor ? { color: catColor, fontWeight: 600 } : undefined}>{catLabel}</span>
            <span style={{ color: driverColor(best.driver), fontWeight: 700 }}>{best.driver}</span>
            <span>Fastest: {best.time.toFixed(3)}s</span>
            <span>Avg speed: {ms.driverStats[best.driver]?.avgSpeed.toFixed(0)} km/h</span>
            <span>Min speed: {ms.driverStats[best.driver]?.minSpeed.toFixed(0)} km/h</span>
          </div>
        )
      })()}

      {/* Sector detail — Solo / hover mode */}
      {focusDriver && miniSectors[currentSectorIdx] && miniSectors[currentSectorIdx].driverStats[focusDriver] && (() => {
        const ms = miniSectors[currentSectorIdx]
        const catLabel = ms.category ? CATEGORY_LABELS[ms.category] ?? ms.category : `S${currentSectorIdx + 1}`
        const catColor = ms.category ? CATEGORY_COLORS[ms.category] : undefined
        return (
          <div className="sector-detail">
            <span style={catColor ? { color: catColor, fontWeight: 600 } : undefined}>{catLabel}</span>
            <span>Avg speed: {ms.driverStats[focusDriver].avgSpeed.toFixed(0)} km/h</span>
            <span>Min speed: {ms.driverStats[focusDriver].minSpeed.toFixed(0)} km/h</span>
            <span>Time: {ms.driverStats[focusDriver].timeSpent.toFixed(3)}s</span>
            <span>Delta: {ms.driverStats[focusDriver].deltaVsFastest >= 0 ? '+' : ''}{ms.driverStats[focusDriver].deltaVsFastest.toFixed(3)}s</span>
          </div>
        )
      })()}
    </div>
  )
}
