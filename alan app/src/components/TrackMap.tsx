import { useMemo, useRef, useEffect, useState } from 'react'
import type { TelemetryPoint } from '../types'
import { interpolatePositionAtTime, interpolateInputsAtTime } from '../lib/miniSectors'
import { driverColor } from '../lib/teamColors'
import { loadTrackData, CIRCUIT_TRACK_PREFIX } from '../lib/paceData'
import type { TrackData } from '../lib/paceData'
import InputsHUD from './InputsHUD'
import SatelliteView from './SatelliteView'

const SVG_W = 900
const SVG_H = 600
const PAD = 40

const TRACK_COLOR: Record<string, string> = {
  'Slow corners': '#e74c3c',
  'Fast corners': '#27ae60',
  'Straights':    '#8899aa',
}

interface Transform {
  apply: (p: { x: number; y: number }) => { x: number; y: number }
}

function buildTransform(pts: { x: number; y: number }[]): Transform {
  if (pts.length === 0) return { apply: (p) => p }
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)]
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)]
  const trackW = maxX - minX || 1
  const trackH = maxY - minY || 1
  const scale = Math.min((SVG_W - PAD * 2) / trackW, (SVG_H - PAD * 2) / trackH)
  const ox = PAD + ((SVG_W - PAD * 2) - trackW * scale) / 2
  const oy = PAD + ((SVG_H - PAD * 2) - trackH * scale) / 2
  return {
    apply: (p) => ({
      x: ox + (p.x - minX) * scale,
      y: oy + (maxY - p.y) * scale,
    }),
  }
}

function pointsToPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return ''
  return 'M ' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
}

interface Props {
  circuitId: string
  driverTelemetry: Record<string, TelemetryPoint[]>
  activeDrivers: Set<string>
  highlightedDriver: string | null
  soloMode: boolean
  progress: number
  onProgressChange: (p: number | ((prev: number) => number)) => void
  playing: boolean
  onPlayPause: () => void
  bgImageUrl?: string
}

export default function TrackMap({
  circuitId,
  driverTelemetry,
  activeDrivers,
  highlightedDriver,
  soloMode,
  progress,
  onProgressChange,
  playing,
  onPlayPause,
  bgImageUrl,
}: Props) {
  const rafRef      = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const [playSpeed,      setPlaySpeed]      = useState(1)
  const [showHUD,        setShowHUD]        = useState(false)
  const [showSatellite,  setShowSatellite]  = useState(false)
  const [satCamDriver,   setSatCamDriver]   = useState<string | null>(null)
  const [trackData,      setTrackData]      = useState<TrackData | null>(null)

  // Load 3-class track data for this circuit
  useEffect(() => {
    setTrackData(null)
    const prefix = CIRCUIT_TRACK_PREFIX[circuitId]
    if (!prefix) return
    loadTrackData(prefix).then(setTrackData).catch(() => {})
  }, [circuitId])

  const allPoints = useMemo(() => {
    const entries = Object.values(driverTelemetry)
    if (entries.length === 0) return []
    const ref = entries.reduce((best, cur) => cur.length > best.length ? cur : best)
    return ref.map((p) => ({ x: p.x, y: p.y }))
  }, [driverTelemetry])

  const transform = useMemo(() => buildTransform(allPoints), [allPoints])

  // Fastest driver = reference for lap duration and animation speed
  const { poleDriver, refLapDuration } = useMemo(() => {
    let best: string | null = null
    let bestTime = Infinity
    for (const [driver, tel] of Object.entries(driverTelemetry)) {
      const t = tel.at(-1)?.time ?? Infinity
      if (t < bestTime) { bestTime = t; best = driver }
    }
    return { poleDriver: best, refLapDuration: bestTime === Infinity ? 90 : bestTime }
  }, [driverTelemetry])

  // Animation loop
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
      return
    }
    const tick = (now: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = now
      const dt = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now
      onProgressChange((prev: number) => {
        const next = prev + (dt * playSpeed) / refLapDuration
        return next >= 1 ? 0 : next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing, refLapDuration, playSpeed, onProgressChange])

  const focusDriver = soloMode
    ? (Array.from(activeDrivers)[0] ?? null)
    : highlightedDriver

  const hasData = allPoints.length > 0

  const hudDriver = focusDriver ?? poleDriver ?? (Array.from(activeDrivers)[0] ?? null)
  const targetTime = progress * refLapDuration
  const hudInputs = useMemo(() => {
    if (!showHUD || !hudDriver) return null
    const tel = driverTelemetry[hudDriver]
    if (!tel) return null
    return interpolateInputsAtTime(tel, progress * refLapDuration)
  }, [showHUD, hudDriver, driverTelemetry, progress, refLapDuration])

  const transformedPoints = useMemo(
    () => allPoints.map((p) => transform.apply(p)),
    [allPoints, transform]
  )

  return (
    <div className="track-map-container">
      {showSatellite ? (
        <SatelliteView
          driverTelemetry={driverTelemetry}
          activeDrivers={activeDrivers}
          progress={progress}
          cameraDriver={satCamDriver ?? focusDriver ?? poleDriver}
          onCameraDriverChange={setSatCamDriver}
        />
      ) : (
        <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="track-svg">

          {/* Optional dropped background image */}
          {bgImageUrl && (
            <image href={bgImageUrl} x={0} y={0} width={SVG_W} height={SVG_H}
              preserveAspectRatio="xMidYMid meet" opacity={0.35} />
          )}

          {/* 3-class colored track */}
          {hasData && trackData && (() => {
            const shadow = trackData.segments.map((run, i) => {
              const pts = run.points.map(p => {
                const { x, y } = transform.apply(p)
                return `${x.toFixed(1)},${y.toFixed(1)}`
              }).join(' ')
              return <polyline key={`sh${i}`} points={pts} fill="none"
                stroke="#00000060" strokeWidth={14}
                strokeLinecap="round" strokeLinejoin="round" />
            })
            const colored = (['Straights', 'Fast corners', 'Slow corners'] as const).flatMap(cat =>
              trackData.segments
                .map((run, i) => ({ run, i }))
                .filter(({ run }) => run.category === cat)
                .map(({ run, i }) => {
                  const pts = run.points.map(p => {
                    const { x, y } = transform.apply(p)
                    return `${x.toFixed(1)},${y.toFixed(1)}`
                  }).join(' ')
                  return (
                    <polyline key={`${cat}${i}`} points={pts} fill="none"
                      stroke={TRACK_COLOR[run.category] ?? '#667'}
                      strokeWidth={4}
                      strokeLinecap="round" strokeLinejoin="round" />
                  )
                })
            )
            return <>{shadow}{colored}</>
          })()}

          {/* Fallback plain track when no 3-class data */}
          {hasData && !trackData && (
            <>
              <path d={pointsToPath(transformedPoints)} fill="none"
                stroke="#ffffff18" strokeWidth={18}
                strokeLinecap="round" strokeLinejoin="round" />
              <path d={pointsToPath(transformedPoints)} fill="none"
                stroke="#e10600" strokeWidth={4}
                strokeLinecap="round" strokeLinejoin="round" />
              <path d={pointsToPath(transformedPoints)} fill="none"
                stroke="#ff6b6b" strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.6} />
            </>
          )}

          {/* Start/finish marker */}
          {hasData && (() => {
            const p = transformedPoints[0]
            return <circle cx={p.x} cy={p.y} r={5} fill="#ffffff" stroke="#e10600" strokeWidth={2} />
          })()}

          {/* Driver dots */}
          {Array.from(activeDrivers).map((driver) => {
            const telemetry = driverTelemetry[driver]
            if (!telemetry) return null
            const raw = interpolatePositionAtTime(telemetry, targetTime)
            if (!raw) return null
            const pos = transform.apply(raw)
            const isHighlighted = highlightedDriver === driver
            return (
              <g key={driver}>
                <circle
                  cx={pos.x} cy={pos.y}
                  r={isHighlighted ? 8 : 5}
                  fill={driverColor(driver)}
                  stroke={isHighlighted ? '#ffffff' : 'transparent'}
                  strokeWidth={2}
                />
                {isHighlighted && (
                  <text x={pos.x + 10} y={pos.y + 4} fill="#ffffff" fontSize={10} fontFamily="monospace" fontWeight="bold">
                    {driver}
                  </text>
                )}
              </g>
            )
          })}

          {!hasData && (
            <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" fill="#555" fontSize={16}>
              Loading telemetry…
            </text>
          )}
        </svg>
      )}

      {/* Inputs HUD overlay */}
      {showHUD && hudInputs && hudDriver && (
        <div className="hud-overlay">
          <InputsHUD inputs={hudInputs} driver={hudDriver} progress={progress} />
        </div>
      )}

      {/* Playback controls */}
      <div className="playback-bar">
        <button className="play-btn" onClick={onPlayPause}>{playing ? '⏸' : '▶'}</button>
        <input
          type="range" min={0} max={1000}
          value={Math.round(progress * 1000)}
          onChange={(e) => onProgressChange(parseInt(e.target.value) / 1000)}
          className="progress-slider"
        />
        <div className="speed-btns">
          {[0.25, 0.5, 1, 3, 5, 10].map((s) => (
            <button key={s} className={`speed-btn ${playSpeed === s ? 'active' : ''}`} onClick={() => setPlaySpeed(s)}>
              {s}×
            </button>
          ))}
        </div>
        <button
          className={`speed-btn ${showHUD ? 'active' : ''}`}
          onClick={() => setShowHUD((v) => !v)}
          title="Toggle driver inputs HUD"
        >
          HUD
        </button>
        <button
          className={`speed-btn ${showSatellite ? 'active' : ''}`}
          onClick={() => setShowSatellite((v) => !v)}
          title="Toggle satellite follow-cam view"
        >
          SAT
        </button>
      </div>
    </div>
  )
}
