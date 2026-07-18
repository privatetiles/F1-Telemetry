import { useState } from 'react'
import { driverColor } from '../lib/teamColors'

const W = 900, H = 170
const PL = 26, PR = 8, PT = 10, PB = 22

interface Props {
  lapPositions: Record<string, number[]>
  totalLaps: number
  progress: number
  onProgressChange: (p: number) => void
  lapBoundaries: number[]
  activeDrivers: Set<string>
  highlightedDriver: string | null
}

export default function PositionChart({
  lapPositions,
  totalLaps,
  progress,
  onProgressChange,
  lapBoundaries,
  activeDrivers,
  highlightedDriver,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const drivers = Object.keys(lapPositions)
  const numDrivers = drivers.length
  if (numDrivers === 0 || totalLaps === 0) return null

  const chartW = W - PL - PR
  const chartH = H - PT - PB

  const cx = (lap: number) => PL + (lap / totalLaps) * chartW
  const cy = (pos: number) => PT + ((pos - 1) / Math.max(numDrivers - 1, 1)) * chartH

  const currentLap = Math.max(1, Math.min(totalLaps, Math.floor(progress * totalLaps) + 1))
  const progressX = cx(currentLap - 1 + (progress * totalLaps - (currentLap - 1)))

  const yLabels = [1, 5, 10, 15, 20].filter((p) => p <= numDrivers)
  const xLabels: number[] = []
  for (let lap = 10; lap <= totalLaps; lap += 10) xLabels.push(lap)

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * W
    const lapFrac = Math.max(0, Math.min(1, (svgX - PL) / chartW))
    const lapNum = Math.round(lapFrac * totalLaps)
    const p = lapNum === 0 ? 0 : (lapBoundaries[Math.min(lapNum, lapBoundaries.length - 1)] ?? lapNum / totalLaps)
    onProgressChange(Math.max(0, Math.min(1, p)))
  }

  // Draw inactive/non-highlighted first, highlighted last (on top)
  const sortedDrivers = [...drivers].sort((a, b) => {
    const aActive = activeDrivers.has(a)
    const bActive = activeDrivers.has(b)
    if (aActive !== bActive) return aActive ? 1 : -1
    if (a === highlightedDriver) return 1
    if (b === highlightedDriver) return -1
    return 0
  })

  return (
    <div className="position-chart-wrap">
      <button className="position-chart-header" onClick={() => setExpanded((v) => !v)}>
        <span>RACE POSITIONS</span>
        <span className="position-chart-chevron">{expanded ? '▲' : '▼'}</span>
      </button>
      {!expanded && null}
      {expanded && <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        className="position-chart-svg"
        onClick={handleClick}
        style={{ cursor: 'crosshair', display: 'block' }}
      >
        {/* Chart background */}
        <rect x={PL} y={PT} width={chartW} height={chartH} fill="#080d14" rx={2} />

        {/* Horizontal grid lines + Y labels */}
        {yLabels.map((pos) => (
          <g key={pos}>
            <line x1={PL} y1={cy(pos)} x2={PL + chartW} y2={cy(pos)} stroke="#ffffff0f" strokeWidth={1} />
            <text x={PL - 4} y={cy(pos) + 3.5} fill="#3a4a5a" fontSize={7.5} fontFamily="monospace" textAnchor="end">
              P{pos}
            </text>
          </g>
        ))}

        {/* Vertical lap ticks + X labels */}
        {xLabels.map((lap) => (
          <g key={lap}>
            <line x1={cx(lap)} y1={PT} x2={cx(lap)} y2={PT + chartH} stroke="#ffffff08" strokeWidth={1} />
            <text x={cx(lap)} y={H - 5} fill="#3a4a5a" fontSize={7.5} fontFamily="monospace" textAnchor="middle">
              {lap}
            </text>
          </g>
        ))}

        {/* Driver position lines */}
        {sortedDrivers.map((driver) => {
          const positions = lapPositions[driver]
          if (!positions || positions.length === 0) return null
          const isActive = activeDrivers.has(driver)
          const isHighlighted = driver === highlightedDriver
          const col = driverColor(driver)
          const points = positions
            .map((pos, i) => `${cx(i + 1).toFixed(1)},${cy(pos).toFixed(1)}`)
            .join(' ')
          return (
            <polyline
              key={driver}
              points={points}
              fill="none"
              stroke={col}
              strokeWidth={isHighlighted ? 2.5 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isHighlighted ? 1 : isActive ? 0.75 : 0.2}
            />
          )
        })}

        {/* Driver name at end of line (highlighted only) */}
        {highlightedDriver && lapPositions[highlightedDriver] && (() => {
          const positions = lapPositions[highlightedDriver]
          const lastPos = positions[positions.length - 1]
          const lastX = cx(positions.length)
          const lastY = cy(lastPos)
          const col = driverColor(highlightedDriver)
          return (
            <text x={lastX + 3} y={lastY + 3.5} fill={col} fontSize={8}
              fontFamily="monospace" fontWeight="bold">
              {highlightedDriver}
            </text>
          )
        })()}

        {/* Progress line */}
        <line
          x1={progressX} y1={PT}
          x2={progressX} y2={PT + chartH}
          stroke="#ffffff" strokeWidth={1.5} strokeOpacity={0.5}
        />
        <circle cx={progressX} cy={PT} r={3} fill="#ffffff" opacity={0.6} />
      </svg>}
    </div>
  )
}
