import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import html2canvas from 'html2canvas'
import type { TelemetryPoint } from '../types'
import { interpolatePositionAtTime, interpolateInputsAtTime } from '../lib/miniSectors'
import { driverColor } from '../lib/teamColors'
import { loadTrackData, CIRCUIT_TRACK_PREFIX } from '../lib/paceData'
import type { TrackData } from '../lib/paceData'
import { detectClipZones } from '../lib/clipDetection'
import type { BattleGapEntry } from '../lib/battleGaps'
import type { SafetyCarPeriod, PitStopInfo } from '../lib/csvLoader'
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
  battleGaps?: BattleGapEntry[]
  lapBoundaries?: number[]
  totalLaps?: number
  onHighlight?: (driver: string | null) => void
  safetyCars?: (SafetyCarPeriod & { startP: number; endP: number })[]
  currentSC?: SafetyCarPeriod
  pitStops?: Record<string, PitStopInfo[]>
  overtakeMarkers?: number[]  // progress fractions where position changes occurred
  radioCallsWithProgress?: Array<{ driver: string; progress: number; url: string }>
  tunedDriver?: string | null
  onTuneDriver?: (driver: string | null) => void
  loading?: boolean
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
  battleGaps = [],
  lapBoundaries = [],
  totalLaps = 0,
  onHighlight,
  safetyCars = [],
  currentSC,
  pitStops,
  overtakeMarkers,
  radioCallsWithProgress,
  tunedDriver,
  onTuneDriver,
  loading = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef       = useRef<number | null>(null)
  const lastTimeRef  = useRef<number | null>(null)
  const progressRef  = useRef(0)
  const [playSpeed,        setPlaySpeed]        = useState(1)
  const [showHUD,          setShowHUD]          = useState(false)
  const [showSatellite,    setShowSatellite]    = useState(false)
  const [satCamDriver,     setSatCamDriver]     = useState<string | null>(null)
  const [trackData,        setTrackData]        = useState<TrackData | null>(null)
  const [showClip,         setShowClip]         = useState(false)
  const [showClipTip,      setShowClipTip]      = useState(false)
  const [showSpeedWarn,    setShowSpeedWarn]    = useState(false)
  const [radioEnabled,     setRadioEnabled]     = useState(false)
  const [activeRadioCall,  setActiveRadioCall]  = useState<{ driver: string; url: string } | null>(null)
  const speedWarnTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const lastRadioIdxRef = useRef(-1)
  const prevProgressRef = useRef(0)

  // Auto-set play speed for full race vs single lap
  useEffect(() => {
    setPlaySpeed(totalLaps > 0 ? 10 : 1)
  }, [totalLaps])

  // Stop audio when paused or radio toggled off
  useEffect(() => {
    if (!playing || !radioEnabled) {
      audioRef.current?.pause()
      if (!radioEnabled) setActiveRadioCall(null)
    }
  }, [playing, radioEnabled])

  // Reset radio index when session/circuit changes
  useEffect(() => {
    lastRadioIdxRef.current = -1
    prevProgressRef.current = 0
    audioRef.current?.pause()
    setActiveRadioCall(null)
  }, [radioCallsWithProgress])

  // Auto-play team radio synchronized to replay progress
  useEffect(() => {
    if (!radioCallsWithProgress?.length || !radioEnabled || !playing) {
      prevProgressRef.current = progress
      return
    }

    const prevP = prevProgressRef.current
    prevProgressRef.current = progress
    const jump = progress - prevP

    // Large jump (scrub) — reposition index without playing
    if (Math.abs(jump) > 0.05 || jump < 0) {
      let newIdx = -1
      for (let i = radioCallsWithProgress.length - 1; i >= 0; i--) {
        if (radioCallsWithProgress[i].progress <= progress) { newIdx = i; break }
      }
      lastRadioIdxRef.current = newIdx
      audioRef.current?.pause()
      if (jump < 0) setActiveRadioCall(null)
      return
    }

    // Normal forward playback — find all newly passed calls
    let callToPlay: { driver: string; url: string } | null = null
    for (let i = lastRadioIdxRef.current + 1; i < radioCallsWithProgress.length; i++) {
      const call = radioCallsWithProgress[i]
      if (call.progress > progress) break
      lastRadioIdxRef.current = i
      if (!tunedDriver || tunedDriver === call.driver) callToPlay = call
    }

    if (callToPlay) {
      audioRef.current?.pause()
      const audio = new Audio(callToPlay.url)
      audio.volume = 0.75
      audio.play().catch(() => {})
      audio.addEventListener('ended', () => setActiveRadioCall(null), { once: true })
      audioRef.current = audio
      setActiveRadioCall(callToPlay)
    }
  }, [progress, radioCallsWithProgress, radioEnabled, playing, tunedDriver])

  const handleScreenshot = useCallback(async () => {
    const el = containerRef.current
    if (!el) return
    const canvas = await html2canvas(el, {
      backgroundColor: '#080d14',
      scale: 2,
      useCORS: true,
      logging: false,
    })
    const link = document.createElement('a')
    link.download = `f1vis-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  function handleSpeedSelect(s: number) {
    setPlaySpeed(s)
    if (totalLaps > 0 && s >= 20) {
      setShowSpeedWarn(true)
      if (speedWarnTimer.current) clearTimeout(speedWarnTimer.current)
      speedWarnTimer.current = setTimeout(() => setShowSpeedWarn(false), 4000)
    } else {
      setShowSpeedWarn(false)
    }
  }

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
    // Pick the driver with the most GPS-valid points (some sessions lack X/Y)
    const gpsCount = (tel: typeof entries[0]) => tel.filter(p => isFinite(p.x) && isFinite(p.y)).length
    const ref = entries.reduce((best, cur) => gpsCount(cur) > gpsCount(best) ? cur : best)
    // For full race (multiple laps), only use first lap to avoid drawing all laps as overlapping paths
    const maxRelDist = totalLaps > 1 ? 1.05 / totalLaps : 1
    return ref
      .filter(p => isFinite(p.x) && isFinite(p.y) && p.relDist <= maxRelDist)
      .map(p => ({ x: p.x, y: p.y }))
  }, [driverTelemetry, totalLaps])

  // Pit lane path — collected from sustained low-speed sections (>15 s < 80 km/h)
  // across all drivers. Slow corners take 2-5 s; pit stops take 20-30 s, so 15 s
  // cleanly separates them. Multiple drivers trace the same physical pit lane,
  // so the overlapping segments visually merge into one clear path.
  const pitLaneSegments = useMemo(() => {
    if (totalLaps === 0) return [] as { x: number; y: number }[][]
    const segs: { x: number; y: number }[][] = []
    for (const tel of Object.values(driverTelemetry)) {
      let segStart = -1
      let segStartTime = 0
      for (let i = 0; i < tel.length; i++) {
        const pt = tel[i]
        const isSlow = pt.speed > 0 && pt.speed < 80
        if (isSlow && segStart === -1) { segStart = i; segStartTime = pt.time }
        else if (!isSlow && segStart !== -1) {
          if (tel[i - 1].time - segStartTime >= 15) {
            const seg = tel.slice(segStart, i)
              .filter(p => isFinite(p.x) && isFinite(p.y))
              .map(p => ({ x: p.x, y: p.y }))
            if (seg.length > 5) segs.push(seg)
          }
          segStart = -1
        }
      }
      if (segStart !== -1 && (tel.at(-1)?.time ?? 0) - segStartTime >= 15) {
        const seg = tel.slice(segStart)
          .filter(p => isFinite(p.x) && isFinite(p.y))
          .map(p => ({ x: p.x, y: p.y }))
        if (seg.length > 5) segs.push(seg)
      }
    }
    return segs
  }, [driverTelemetry, totalLaps])

  // Last relDist per driver — used for retired-driver detection in full race
  const driverLastRelDist = useMemo(() => {
    if (totalLaps === 0) return {} as Record<string, number>
    const out: Record<string, number> = {}
    for (const [d, tel] of Object.entries(driverTelemetry)) {
      out[d] = tel.at(-1)?.relDist ?? 0
    }
    return out
  }, [driverTelemetry, totalLaps])

  const transform = useMemo(() => buildTransform(allPoints), [allPoints])

  // poleDriver = fastest; refLapDuration = slowest (animation runs until all finish)
  const { poleDriver, refLapDuration } = useMemo(() => {
    let pole: string | null = null
    let bestTime = Infinity
    let maxTime = 0
    for (const [driver, tel] of Object.entries(driverTelemetry)) {
      const t = tel.at(-1)?.time ?? Infinity
      if (t < bestTime) { bestTime = t; pole = driver }
      if (isFinite(t) && t > maxTime) maxTime = t
    }
    return { poleDriver: pole, refLapDuration: maxTime > 0 ? maxTime : 90 }
  }, [driverTelemetry])

  // Clip zones per driver — computed once per session load
  const clipZones = useMemo(() => {
    if (!showClip) return {}
    const out: Record<string, ReturnType<typeof detectClipZones>> = {}
    for (const [driver, tel] of Object.entries(driverTelemetry)) {
      const zones = detectClipZones(tel)
      if (zones.length > 0) out[driver] = zones
    }
    return out
  }, [driverTelemetry, showClip])

  // Keep progressRef in sync so the RAF tick can read the current value
  useEffect(() => { progressRef.current = progress }, [progress])

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
      const next = progressRef.current + (dt * playSpeed) / refLapDuration
      if (next >= 1) {
        progressRef.current = 1
        onProgressChange(1)
        onPlayPause()   // pause — everyone has crossed the line
        return
      }
      progressRef.current = next
      onProgressChange(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing, refLapDuration, playSpeed, onProgressChange, onPlayPause])

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
    <div className="track-map-container" ref={containerRef}>
      {showSatellite ? (
        <SatelliteView
          circuitId={circuitId}
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

          {/* Pit lane (full race only) — drawn below the racing line */}
          {totalLaps > 0 && pitLaneSegments.length > 0 && pitLaneSegments.map((seg, i) => {
            const pts = seg.map(p => {
              const { x, y } = transform.apply(p)
              return `${x.toFixed(1)},${y.toFixed(1)}`
            }).join(' ')
            return (
              <polyline key={`pit${i}`} points={pts} fill="none"
                stroke="#ffffff" strokeWidth={6}
                strokeOpacity={0.08}
                strokeLinecap="round" strokeLinejoin="round" />
            )
          })}
          {totalLaps > 0 && pitLaneSegments.length > 0 && pitLaneSegments.map((seg, i) => {
            const pts = seg.map(p => {
              const { x, y } = transform.apply(p)
              return `${x.toFixed(1)},${y.toFixed(1)}`
            }).join(' ')
            return (
              <polyline key={`pitl${i}`} points={pts} fill="none"
                stroke="#aaccff" strokeWidth={1.5}
                strokeOpacity={0.35}
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="4 3" />
            )
          })}

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
            const col = driverColor(driver)
            const isFullRace = totalLaps > 0

            // Retired: driver's data ended significantly before race end
            const lastRD = isFullRace ? (driverLastRelDist[driver] ?? 1) : 1
            const isRetired = isFullRace && progress > lastRD + 1 / totalLaps && lastRD * totalLaps < totalLaps - 3

            // Pitting: sustained low speed over a 10-second window.
            // Corners are briefly slow (1-3s); pit lane takes 15-25s at limiter speed.
            // Requiring 75% of points in a ±5s window below 80 km/h eliminates false positives.
            let isPitting = false
            if (isFullRace && !isRetired && progress > 0.015) {
              let lo = 0, hi = telemetry.length - 1
              while (lo < hi - 1) {
                const m = (lo + hi) >> 1
                if (telemetry[m].time < targetTime) lo = m; else hi = m
              }
              const wStart = targetTime - 5, wEnd = targetTime + 5
              let slowPts = 0, totalPts = 0
              for (let k = Math.max(0, lo - 25); k < Math.min(telemetry.length, lo + 25); k++) {
                const pt = telemetry[k]
                if (pt.time >= wStart && pt.time <= wEnd) {
                  totalPts++
                  if (pt.speed < 80) slowPts++
                }
              }
              isPitting = totalPts >= 4 && slowPts / totalPts >= 0.75
            }

            const dotR = isHighlighted ? 8 : (isFullRace ? 6 : 5)

            return (
              <g key={driver} style={{ cursor: 'pointer' }}
                onMouseEnter={() => onHighlight?.(driver)}
                onMouseLeave={() => onHighlight?.(null)}>
                {/* Enlarged invisible hit target */}
                <circle cx={pos.x} cy={pos.y} r={dotR + 8} fill="transparent" />
                {/* Main dot */}
                <circle
                  cx={pos.x} cy={pos.y} r={dotR}
                  fill={col}
                  stroke={isHighlighted ? '#ffffff' : isRetired ? '#444' : 'transparent'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  opacity={isRetired ? 0.3 : 1}
                />
                {/* Status badge: PIT Xs or OUT */}
                {(isPitting || isRetired) && !isHighlighted && (() => {
                  let label = isRetired ? 'OUT' : 'PIT'
                  if (isPitting && pitStops) {
                    const currentLap = Math.floor(progress * totalLaps) + 1
                    const stop = (pitStops[driver] ?? []).find(s => s.lap === currentLap || s.lap === currentLap - 1)
                    if (stop) label = `PIT ${stop.dur.toFixed(1)}s`
                  }
                  return (
                    <text x={pos.x} y={pos.y - dotR - 3}
                      fill={isRetired ? '#666' : '#f0c040'}
                      fontSize={8} fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      {label}
                    </text>
                  )
                })()}
                {/* Driver code label */}
                {isHighlighted ? (
                  <g>
                    <rect x={pos.x + dotR + 2} y={pos.y - 9} width={28} height={13}
                      rx={2} fill="#050c14ee" stroke={col} strokeWidth={1} />
                    <text x={pos.x + dotR + 16} y={pos.y + 2}
                      fill="#fff" fontSize={10} fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      {driver}
                    </text>
                  </g>
                ) : (isFullRace && !isRetired && !isPitting) ? (
                  <text x={pos.x} y={pos.y - dotR - 2}
                    fill={col} fontSize={8} fontFamily="monospace" fontWeight="bold"
                    textAnchor="middle" opacity={0.9}>
                    {driver}
                  </text>
                ) : null}
              </g>
            )
          })}

          {/* Battle gap labels — F1 TV style */}
          {battleGaps.length >= 2 && battleGaps.map(({ driver, gap, position }) => {
            const tel = driverTelemetry[driver]
            if (!tel) return null
            const raw = interpolatePositionAtTime(tel, targetTime)
            if (!raw) return null
            const pos = transform.apply(raw)
            const col = driverColor(driver)
            const isLeader = position === 1
            const gapText = isLeader ? 'LEAD' : gap > 0 ? `+${gap.toFixed(3)}` : `−${Math.abs(gap).toFixed(3)}`
            const gapColor = isLeader ? '#f0c040' : gap > 1 ? '#ff5252' : gap > 0.3 ? '#f0c040' : '#00e676'
            const labelW = 90
            const labelH = 24
            const lx = pos.x + 12
            const ly = pos.y - 28

            return (
              <g key={`bl-${driver}`} className="battle-gap-label">
                {/* connector line from dot to label */}
                <line
                  x1={pos.x} y1={pos.y}
                  x2={lx} y2={ly + labelH / 2}
                  stroke={col} strokeWidth={1.5} opacity={0.6}
                />
                {/* label background */}
                <rect
                  x={lx} y={ly}
                  width={labelW} height={labelH}
                  rx={4} ry={4}
                  fill="#050c14f0"
                  stroke={col}
                  strokeWidth={1.5}
                />
                {/* position badge */}
                <rect
                  x={lx} y={ly}
                  width={18} height={labelH}
                  rx={4} ry={4}
                  fill={col + '33'}
                />
                <text
                  x={lx + 9} y={ly + 16}
                  fill={col}
                  fontSize={10}
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  P{position}
                </text>
                {/* driver code */}
                <text
                  x={lx + 22} y={ly + 16}
                  fill={col}
                  fontSize={11}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {driver}
                </text>
                {/* gap value */}
                <text
                  x={lx + labelW - 5} y={ly + 16}
                  fill={gapColor}
                  fontSize={11}
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  {gapText}
                </text>
              </g>
            )
          })}

          {/* Clip zones — battery depletion markers */}
          {showClip && Object.entries(clipZones).map(([driver, zones]) => {
            if (!activeDrivers.has(driver)) return null
            return zones.map((zone, zi) => {
              const pts = zone.points.map(p => {
                const { x, y } = transform.apply(p)
                return `${x.toFixed(1)},${y.toFixed(1)}`
              }).join(' ')
              return (
                <polyline
                  key={`clip-${driver}-${zi}`}
                  points={pts}
                  fill="none"
                  stroke="#ff9800"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.85}
                />
              )
            })
          })}

          {!hasData && (
            <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" fill="#555" fontSize={16}>
              {loading ? 'Loading telemetry…' : 'No data available for this session'}
            </text>
          )}
        </svg>
      )}

      {/* Clip zones tooltip (first-time) */}
      {showClipTip && (
        <div className="clip-tip-overlay" onClick={() => setShowClipTip(false)}>
          <div className="clip-tip-box">
            <span className="clip-tip-icon">🔋</span>
            <div>
              <strong>Battery clip zones</strong>
              <p>Orange sections = full throttle but speed dropping. This is where the driver's ERS battery runs out of charge mid-straight, losing the electric power boost.</p>
              <span className="clip-tip-dismiss">Click to dismiss</span>
            </div>
          </div>
        </div>
      )}

      {/* Safety car / red flag badge */}
      {totalLaps > 0 && currentSC && (
        <div className={`sc-badge sc-badge-${currentSC.type.toLowerCase()}`}>
          {currentSC.type === 'RED' ? '🔴 RED FLAG' : currentSC.type === 'VSC' ? 'VIRTUAL SC' : '🟡 SAFETY CAR'}
        </div>
      )}

      {/* Chequered flag badge when race ends */}
      {totalLaps > 0 && !currentSC && progress >= 0.999 && (
        <div className="sc-badge sc-badge-finish">🏁 RACE ENDED</div>
      )}

      {/* Inputs HUD overlay */}
      {showHUD && hudInputs && hudDriver && (
        <div className="hud-overlay">
          <InputsHUD inputs={hudInputs} driver={hudDriver} progress={progress} />
        </div>
      )}

      {/* High-speed warning */}
      {showSpeedWarn && (
        <div className="speed-warn-toast">
          ⚠️ At high speeds, live positions and gaps may be less accurate
        </div>
      )}

      {/* Playback controls */}
      <div className="playback-bar">
        <button className="play-btn" onClick={onPlayPause}>{playing ? '⏸' : '▶'}</button>

        {/* Lap counter for full-race mode */}
        {totalLaps > 0 && (
          <span className="lap-counter">
            L{Math.min(totalLaps, Math.floor(progress * totalLaps) + 1)}/{totalLaps}
          </span>
        )}

        <div className="progress-slider-wrap">
          <input
            type="range" min={0} max={1000}
            value={Math.round(progress * 1000)}
            onChange={(e) => onProgressChange(parseInt(e.target.value) / 1000)}
            className="progress-slider"
          />
          {/* Safety car period bands */}
          {safetyCars.length > 0 && (
            <div className="sc-bands" aria-hidden>
              {safetyCars.map((sc, i) => (
                <div
                  key={i}
                  className={`sc-band sc-band-${sc.type.toLowerCase()}`}
                  style={{ left: `${sc.startP * 100}%`, width: `${(sc.endP - sc.startP) * 100}%` }}
                />
              ))}
            </div>
          )}
          {/* Lap boundary tick marks */}
          {lapBoundaries.length > 1 && (
            <div className="lap-ticks" aria-hidden>
              {lapBoundaries.slice(1).map((b, i) => (
                <div
                  key={i}
                  className="lap-tick"
                  style={{ left: `${b * 100}%` }}
                />
              ))}
            </div>
          )}
          {/* Position-change markers */}
          {overtakeMarkers && overtakeMarkers.length > 0 && (
            <div className="overtake-marks" aria-hidden>
              {overtakeMarkers.map((p, i) => (
                <div key={i} className="overtake-mark" style={{ left: `${p * 100}%` }} />
              ))}
            </div>
          )}
          {/* Team radio markers */}
          {radioCallsWithProgress && radioCallsWithProgress.length > 0 && radioEnabled && (
            <div className="radio-marks" aria-hidden>
              {radioCallsWithProgress.map((r, i) => (
                <div
                  key={i}
                  className="radio-mark"
                  style={{
                    left: `${r.progress * 100}%`,
                    borderColor: driverColor(r.driver),
                    opacity: !tunedDriver || tunedDriver === r.driver ? 0.85 : 0.2,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="speed-btns">
          {(totalLaps > 0 ? [1, 5, 10, 20, 30, 60] : [0.25, 0.5, 1, 3, 5, 10]).map((s) => (
            <button key={s} className={`speed-btn ${playSpeed === s ? 'active' : ''}`} onClick={() => handleSpeedSelect(s)}>
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
        <button
          className="speed-btn screenshot-btn"
          onClick={handleScreenshot}
          title="Save screenshot as PNG"
        >
          📷
        </button>
        {radioCallsWithProgress && radioCallsWithProgress.length > 0 && (
          <>
            <button
              className={`speed-btn ${radioEnabled ? 'active' : ''}`}
              onClick={() => setRadioEnabled(v => !v)}
              title={radioEnabled ? 'Mute team radio' : 'Enable team radio'}
            >
              📻
            </button>
            {radioEnabled && activeRadioCall && (
              <div
                className={`radio-now-playing ${tunedDriver === activeRadioCall.driver ? 'radio-locked' : ''}`}
                onClick={() => onTuneDriver?.(tunedDriver === activeRadioCall.driver ? null : activeRadioCall.driver)}
                title={tunedDriver === activeRadioCall.driver ? 'Click to disconnect' : `Click to lock onto ${activeRadioCall.driver}`}
              >
                <span
                  className="radio-driver-dot"
                  style={{ background: driverColor(activeRadioCall.driver) }}
                />
                <span className="radio-driver-name">{activeRadioCall.driver}</span>
                <span className="radio-wave-icon">📻</span>
              </div>
            )}
            {radioEnabled && tunedDriver && !activeRadioCall && (
              <div
                className="radio-now-playing radio-locked radio-standby"
                onClick={() => onTuneDriver?.(null)}
                title="Click to disconnect"
              >
                <span
                  className="radio-driver-dot"
                  style={{ background: driverColor(tunedDriver) }}
                />
                <span className="radio-driver-name">{tunedDriver}</span>
                <span className="radio-wave-icon">🔒</span>
              </div>
            )}
          </>
        )}
        {totalLaps === 0 && (
          <button
            className={`speed-btn ${showClip ? 'active clip-btn' : ''}`}
            onClick={() => {
              const next = !showClip
              setShowClip(next)
              if (next && !localStorage.getItem('f1vis_clip_seen')) {
                setShowClipTip(true)
                localStorage.setItem('f1vis_clip_seen', '1')
                setTimeout(() => setShowClipTip(false), 5000)
              }
            }}
            title="Highlight battery clip zones (full throttle + speed drop)"
          >
            CLIP
          </button>
        )}
      </div>
    </div>
  )
}
