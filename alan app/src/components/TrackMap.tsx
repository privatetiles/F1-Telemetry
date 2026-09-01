import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
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
import Icon from './Icon'

const SVG_W = 900
const SVG_H = 600
const PAD = 40

const TRACK_COLOR_BASE   = '#cccccc'
const TRACK_COLOR_YELLOW = '#ffcc00'
const TRACK_COLOR_RED    = '#ff4444'

export interface RaceControlMessage {
  t:        number
  category: string
  flag:     string | null
  scope:    string | null
  sector:   number | null
  status:   string | null
  msg:      string
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

function catmullRomPath(pts: { x: number; y: number }[], closed = false): string {
  if (pts.length < 2) return ''
  const n = pts.length
  const ps: { x: number; y: number }[] = closed
    ? [pts[n - 1], ...pts, pts[0], pts[1]]
    : [{ x: 2 * pts[0].x - pts[1].x, y: 2 * pts[0].y - pts[1].y },
       ...pts,
       { x: 2 * pts[n - 1].x - pts[n - 2].x, y: 2 * pts[n - 1].y - pts[n - 2].y }]
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < ps.length - 2; i++) {
    const [p0, p1, p2, p3] = [ps[i - 1], ps[i], ps[i + 1], ps[i + 2]]
    d += ` C ${(p1.x + (p2.x - p0.x) / 6).toFixed(1)},${(p1.y + (p2.y - p0.y) / 6).toFixed(1)}`
       + ` ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)},${(p2.y - (p3.y - p1.y) / 6).toFixed(1)}`
       + ` ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  if (closed) d += ' Z'
  return d
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
  battleGaps?: BattleGapEntry[]
  lapBoundaries?: number[]
  totalLaps?: number
  onHighlight?: (driver: string | null) => void
  safetyCars?: (SafetyCarPeriod & { startP: number; endP: number })[]
  currentSC?: SafetyCarPeriod
  pitStops?: Record<string, PitStopInfo[]>
  standingRestartLaps?: Set<number>
  overtakeMarkers?: number[]  // progress fractions where position changes occurred
  radioCallsWithProgress?: Array<{ driver: string; progress: number; url: string; text?: string }>
  tunedDriver?: string | null
  onTuneDriver?: (driver: string | null) => void
  onActiveRadioChange?: (call: { driver: string; url: string; text?: string } | null) => void
  raceControlMessages?: RaceControlMessage[]
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
  battleGaps = [],
  lapBoundaries = [],
  totalLaps = 0,
  onHighlight,
  safetyCars = [],
  currentSC,
  pitStops,
  standingRestartLaps,
  overtakeMarkers,
  radioCallsWithProgress,
  tunedDriver,
  onTuneDriver,
  onActiveRadioChange,
  raceControlMessages,
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
  const [activeRadioCall,  setActiveRadioCall]  = useState<{ driver: string; url: string; text?: string } | null>(null)
  const [trackZoom,        setTrackZoom]        = useState(1)
  const [trackPan,         setTrackPan]         = useState({ x: 0, y: 0 })
  const speedWarnTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const lastRadioIdxRef = useRef(-1)
  const prevProgressRef = useRef(0)
  const trackDragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    panX: number
    panY: number
    zoom: number
  } | null>(null)

  // poleDriver = fastest; refLapDuration = slowest (animation runs until all finish)
  // Declared early — used by radio useEffects below before the main useMemo block.
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

  // Reset radio index when session/circuit changes; auto-enable if this race has radio
  useEffect(() => {
    lastRadioIdxRef.current = -1
    prevProgressRef.current = 0
    audioRef.current?.pause()
    setActiveRadioCall(null)
    if (radioCallsWithProgress && radioCallsWithProgress.length > 0) setRadioEnabled(true)
  }, [radioCallsWithProgress])

  // Sync active radio call up to parent
  useEffect(() => {
    onActiveRadioChange?.(activeRadioCall ?? null)
  }, [activeRadioCall, onActiveRadioChange])

  // Auto-play team radio synchronized to replay progress
  useEffect(() => {
    if (!radioCallsWithProgress?.length || !radioEnabled || !playing) {
      prevProgressRef.current = progress
      return
    }

    const prevP = prevProgressRef.current
    prevProgressRef.current = progress
    const jump = progress - prevP

    // Threshold: max legitimate progress change in 3 frames at current speed.
    // Anything beyond this is a user scrub, not continuous playback.
    // refLapDuration > 0 guard: single-lap sessions have their own refLap computed inside TrackMap.
    const scrubThreshold = refLapDuration > 0
      ? (playSpeed * (1 / 20)) / refLapDuration   // 3-frame window at current speed
      : 0.005

    const isScrub = jump < 0 || jump > scrubThreshold

    if (isScrub) {
      // Reposition the index to wherever we landed — no audio on scrub
      let newIdx = -1
      for (let i = radioCallsWithProgress.length - 1; i >= 0; i--) {
        if (radioCallsWithProgress[i].progress <= progress) { newIdx = i; break }
      }
      lastRadioIdxRef.current = newIdx
      audioRef.current?.pause()
      setActiveRadioCall(null)
      return
    }

    // High speed: don't play audio — clips would be hopelessly out of sync
    if (playSpeed > 10) {
      // Still advance the index so we're in the right place if speed drops
      for (let i = lastRadioIdxRef.current + 1; i < radioCallsWithProgress.length; i++) {
        if (radioCallsWithProgress[i].progress > progress) break
        lastRadioIdxRef.current = i
      }
      audioRef.current?.pause()
      setActiveRadioCall(null)
      return
    }

    // Normal forward playback at ≤10× — find all newly passed calls, play the latest match
    let callToPlay: { driver: string; url: string; text?: string } | null = null
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
  }, [progress, radioCallsWithProgress, radioEnabled, playing, tunedDriver, playSpeed, refLapDuration])

  // Radio navigation — filtered to tuned driver (or all when not tuned).
  // Exclude post-race calls (progress > 1) — they can't be reached via the slider.
  const navCalls = useMemo(() => {
    if (!radioCallsWithProgress?.length || !radioEnabled) return []
    const reachable = radioCallsWithProgress.filter(r => r.progress <= 1)
    return tunedDriver
      ? reachable.filter(r => r.driver === tunedDriver)
      : reachable
  }, [radioCallsWithProgress, radioEnabled, tunedDriver])

  const currentNavIdx = useMemo(() => {
    let idx = -1
    for (let i = 0; i < navCalls.length; i++) {
      if (navCalls[i].progress <= progress) idx = i
      else break
    }
    return idx
  }, [navCalls, progress])

  const goToPrevRadio = useCallback(() => {
    if (navCalls.length === 0 || refLapDuration <= 0) return
    const leadIn = 3 / refLapDuration   // seek 3 race-seconds before the call
    // Find last call that is far enough before current position
    const cutoff = progress - leadIn - 0.001
    let targetIdx = -1
    for (let i = navCalls.length - 1; i >= 0; i--) {
      if (navCalls[i].progress < cutoff) { targetIdx = i; break }
    }
    if (targetIdx >= 0) {
      const p = Math.max(0, navCalls[targetIdx].progress - leadIn)
      progressRef.current = p
      onProgressChange(p)
    }
  }, [navCalls, progress, refLapDuration, onProgressChange])

  const goToNextRadio = useCallback(() => {
    if (navCalls.length === 0 || refLapDuration <= 0) return
    const leadIn = 3 / refLapDuration
    // Find first call strictly after current position
    let targetIdx = -1
    for (let i = 0; i < navCalls.length; i++) {
      if (navCalls[i].progress > progress + 0.001) { targetIdx = i; break }
    }
    if (targetIdx >= 0) {
      const p = Math.max(0, navCalls[targetIdx].progress - leadIn)
      progressRef.current = p
      onProgressChange(p)
    }
  }, [navCalls, progress, refLapDuration, onProgressChange])

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
    const entries = Object.entries(driverTelemetry)
    if (entries.length === 0) return []

    if (totalLaps <= 1) {
      // Single-lap session: use everything
      const [, ref] = entries.reduce((best, cur) => {
        const count = (tel: TelemetryPoint[]) => tel.filter(p => isFinite(p.x) && isFinite(p.y)).length
        return count(cur[1]) > count(best[1]) ? cur : best
      })
      return ref.filter(p => isFinite(p.x) && isFinite(p.y)).map(p => ({ x: p.x, y: p.y }))
    }

    // For full races, lap 1 and sometimes lap 2 start from grid positions (standing
    // starts or red-flag restarts), which are laterally offset from the racing line and
    // cause the main straight to appear doubled. Try laps 3, 2, 1 in order.
    //
    // We use an exact 1-lap window (n/total → (n+1)/total) with no buffer past the
    // finish line — avoiding the overlap that produces the second parallel line.
    const gpsCount = ([, tel]: [string, TelemetryPoint[]]) =>
      tel.filter(p => isFinite(p.x) && isFinite(p.y)).length

    for (const lapN of [3, 2, 1]) {
      if (lapN >= totalLaps) continue
      // Skip standing-restart laps (red-flag restarts) — they start from grid boxes which
      // are laterally offset from the racing line, causing the main straight to appear doubled.
      if (standingRestartLaps?.has(lapN)) continue
      const minRel = (lapN - 1) / totalLaps
      const maxRel = lapN / totalLaps
      // Exclude drivers who pitted on any lap up through lapN — their GPS in that
      // range includes the pit lane and would corrupt the circuit bounding box.
      const pitters = new Set(
        Object.entries(pitStops ?? {})
          .filter(([, stops]) => stops.some(s => s.lap <= lapN))
          .map(([d]) => d)
      )
      const eligible = entries.filter(([d]) => !pitters.has(d))
      const pool = eligible.length > 0 ? eligible : entries
      const [, ref] = pool.reduce((best, cur) => gpsCount(cur) > gpsCount(best) ? cur : best)
      const pts = ref
        .filter(p => isFinite(p.x) && isFinite(p.y) && p.relDist >= minRel && p.relDist <= maxRel)
      if (pts.length < 10) continue
      return pts.map(p => ({ x: p.x, y: p.y }))
    }
    return []
  }, [driverTelemetry, totalLaps, pitStops, standingRestartLaps])

  // Pit lane path — hybrid detection: use pitStops timestamps as a narrow search window,
  // then speed-filter (< 80 km/h) within that window to find the actual pit lane traversal.
  // This avoids the safety-car false positive (SC sections are outside any pit stop window)
  // that breaks pure speed-based detection at circuits like Monaco 2026.
  const pitLaneSegments = useMemo(() => {
    if (totalLaps === 0 || !pitStops || Object.keys(pitStops).length === 0) return [] as { x: number; y: number }[][]
    let bestSeg: { x: number; y: number }[] = []
    for (const [driver, stops] of Object.entries(pitStops)) {
      const tel = driverTelemetry[driver]
      if (!tel || tel.length === 0) continue
      for (const stop of stops) {
        // 5-second buffer on each side of the known pit window to include pit entry/exit
        const inWindow = tel.filter(p =>
          p.time >= stop.in - 5 && p.time <= stop.out + 5 &&
          p.speed > 0 && p.speed < 80 &&
          isFinite(p.x) && isFinite(p.y)
        )
        if (inWindow.length > bestSeg.length) bestSeg = inWindow.map(p => ({ x: p.x, y: p.y }))
      }
    }
    return bestSeg.length > 5 ? [bestSeg] : []
  }, [driverTelemetry, pitStops, totalLaps])

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

  // Current flag state derived from race control messages
  const currentFlagState = useMemo(() => {
    const empty = { trackState: 'green' as const, yellowSectors: new Set<number>() }
    if (!raceControlMessages || raceControlMessages.length === 0) return empty

    const t = progress * refLapDuration
    let trackState: 'green' | 'yellow' | 'red' | 'sc' | 'vsc' = 'green'
    const yellowSectors = new Set<number>()

    for (const msg of raceControlMessages) {
      if (msg.t > t) break
      if (msg.category === 'SafetyCar') {
        if (msg.status === 'DEPLOYED') {
          trackState = msg.msg.includes('VSC') ? 'vsc' : 'sc'
          yellowSectors.clear()
        }
        // ENDING: state persists until TRACK CLEAR
      } else if (msg.category === 'Flag') {
        if (msg.flag === 'CLEAR' && msg.scope === 'Track') {
          trackState = 'green'
          yellowSectors.clear()
        } else if (msg.flag === 'RED') {
          trackState = 'red'
          yellowSectors.clear()
        } else if ((msg.flag === 'YELLOW' || msg.flag === 'DOUBLE YELLOW') && msg.scope === 'Sector' && msg.sector) {
          yellowSectors.add(msg.sector)
        } else if (msg.flag === 'CLEAR' && msg.scope === 'Sector' && msg.sector) {
          yellowSectors.delete(msg.sector)
        }
      } else if (msg.category === 'Other' && msg.msg?.includes('RED FLAG')) {
        trackState = 'red'
        yellowSectors.clear()
      }
    }
    return { trackState, yellowSectors }
  }, [raceControlMessages, progress, refLapDuration])

  // Recent notable race control messages for the event ticker overlay
  const rcTicker = useMemo(() => {
    if (!raceControlMessages || !totalLaps) return [] as { t: number; msg: string; kind: 'red' | 'yellow' | 'info'; age: number }[]
    const t = progress * refLapDuration
    const WINDOW = 90
    type Item = { t: number; msg: string; kind: 'red' | 'yellow' | 'info'; age: number }
    const items: Item[] = []
    for (const m of raceControlMessages) {
      if (m.t > t) break
      const s = m.msg
      let entry: { msg: string; kind: 'red' | 'yellow' | 'info' } | null = null
      if (/RED FLAG|RACE SUSPENDED/.test(s)) {
        entry = { msg: 'RED FLAG — RACE SUSPENDED', kind: 'red' }
      } else if (/SAFETY CAR LIGHTS ON/.test(s)) {
        entry = { msg: 'SAFETY CAR DEPLOYED', kind: 'yellow' }
      } else if (/SAFETY CAR IN THIS LAP/.test(s)) {
        entry = { msg: 'SAFETY CAR COMING IN', kind: 'yellow' }
      } else if (/STANDING START/.test(s)) {
        entry = { msg: 'STANDING START', kind: 'info' }
      } else if (/EXTRA FORMATION LAP/.test(s)) {
        entry = { msg: 'EXTRA FORMATION LAP', kind: 'info' }
      } else if (/RACE WILL RESUME/.test(s)) {
        const timeMatch = s.match(/AT (.+)$/)
        entry = { msg: timeMatch ? `RACE RESUMES AT ${timeMatch[1]}` : 'RACE RESUMES', kind: 'info' }
      } else if (/^OVERTAKE ENABLED/.test(s)) {
        entry = { msg: 'OVERTAKE ENABLED', kind: 'info' }
      } else if (m.flag === 'CHEQUERED') {
        entry = { msg: 'CHEQUERED FLAG', kind: 'info' }
      } else if (/FIA STEWARDS:.*DRIVE THROUGH PENALTY FOR CAR/.test(s)) {
        const match = s.match(/CAR \d+ \((\w+)\)/)
        const drv = match?.[1] ?? ''
        entry = { msg: `DRIVE THROUGH PENALTY — ${drv}`, kind: 'red' }
      } else if (/^(TURN \d+ )?INCIDENT INVOLVING CAR/.test(s) && /NOTED/.test(s)) {
        const match = s.match(/CAR \d+ \((\w+)\)/)
        const drv = match?.[1] ?? ''
        const tMatch = s.match(/TURN (\d+)/)
        const turn = tMatch ? ` T${tMatch[1]}` : ''
        entry = { msg: `INCIDENT${turn} — ${drv}`, kind: 'yellow' }
      }
      if (entry) items.push({ ...entry, t: m.t, age: t - m.t })
    }
    return items.filter(i => i.age <= WINDOW).slice(-2)
  }, [raceControlMessages, totalLaps, progress, refLapDuration])

  // Max sector number for relDist mapping (e.g. circuit has 20 sectors → sector k → [k-1/20, k/20])
  const maxSector = useMemo(() => {
    if (!raceControlMessages) return 20
    return Math.max(20, ...raceControlMessages
      .filter(m => m.sector != null)
      .map(m => m.sector as number))
  }, [raceControlMessages])

  // Cumulative arc-length relDist [0,1] for each trackData segment (for sector yellow mapping)
  const segmentRelDistRanges = useMemo(() => {
    if (!trackData || trackData.segments.length === 0) return [] as { start: number; end: number }[]
    const segLengths = trackData.segments.map(seg => {
      let len = 0
      for (let i = 1; i < seg.points.length; i++) {
        const dx = seg.points[i].x - seg.points[i - 1].x
        const dy = seg.points[i].y - seg.points[i - 1].y
        len += Math.sqrt(dx * dx + dy * dy)
      }
      return len
    })
    const totalLen = segLengths.reduce((a, b) => a + b, 0) || 1
    let cum = 0
    return segLengths.map(l => {
      const start = cum / totalLen
      cum += l
      return { start, end: cum / totalLen }
    })
  }, [trackData])

  // Returns the appropriate track color for a segment given the current flag state
  const getSegmentColor = useCallback((segIdx: number): string => {
    const { trackState, yellowSectors } = currentFlagState
    if (trackState === 'sc' || trackState === 'vsc') return TRACK_COLOR_YELLOW
    if (trackState === 'red') return TRACK_COLOR_RED
    if (yellowSectors.size > 0 && segIdx < segmentRelDistRanges.length) {
      const { start, end } = segmentRelDistRanges[segIdx]
      for (const sector of yellowSectors) {
        const s0 = (sector - 1) / maxSector
        const s1 = sector / maxSector
        if (start < s1 && end > s0) return TRACK_COLOR_YELLOW
      }
    }
    return TRACK_COLOR_BASE
  }, [currentFlagState, segmentRelDistRanges, maxSector])

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

  const updateTrackZoom = useCallback((requestedZoom: number) => {
    const nextZoom = Math.max(1, Math.min(4, Math.round(requestedZoom * 2) / 2))
    const maxPanX = (SVG_W - SVG_W / nextZoom) / 2
    const maxPanY = (SVG_H - SVG_H / nextZoom) / 2

    setTrackZoom(nextZoom)
    setTrackPan((current) => nextZoom === 1
      ? { x: 0, y: 0 }
      : {
          x: Math.max(-maxPanX, Math.min(maxPanX, current.x)),
          y: Math.max(-maxPanY, Math.min(maxPanY, current.y)),
        })
  }, [])

  const handleTrackPointerDown = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (trackZoom <= 1) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    trackDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: trackPan.x,
      panY: trackPan.y,
      zoom: trackZoom,
    }
  }, [trackPan, trackZoom])

  const handleTrackPointerMove = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = trackDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const viewWidth = SVG_W / drag.zoom
    const viewHeight = SVG_H / drag.zoom
    const dx = (event.clientX - drag.startX) * viewWidth / rect.width
    const dy = (event.clientY - drag.startY) * viewHeight / rect.height
    const maxPanX = (SVG_W - viewWidth) / 2
    const maxPanY = (SVG_H - viewHeight) / 2
    setTrackPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, drag.panX - dx)),
      y: Math.max(-maxPanY, Math.min(maxPanY, drag.panY - dy)),
    })
  }, [])

  const handleTrackPointerEnd = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (trackDragRef.current?.pointerId !== event.pointerId) return
    trackDragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const handleTrackWheel = useCallback((event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    updateTrackZoom(trackZoom + (event.deltaY < 0 ? 0.5 : -0.5))
  }, [trackZoom, updateTrackZoom])

  const trackViewWidth = SVG_W / trackZoom
  const trackViewHeight = SVG_H / trackZoom
  const trackViewBox = [
    (SVG_W - trackViewWidth) / 2 + trackPan.x,
    (SVG_H - trackViewHeight) / 2 + trackPan.y,
    trackViewWidth,
    trackViewHeight,
  ].join(' ')

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
        <svg
          width={SVG_W}
          height={SVG_H}
          viewBox={trackViewBox}
          className={`track-svg ${trackZoom > 1 ? 'zoomed' : ''}`}
          shapeRendering="geometricPrecision"
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={handleTrackPointerEnd}
          onPointerCancel={handleTrackPointerEnd}
          onWheel={handleTrackWheel}
          onDoubleClick={() => updateTrackZoom(trackZoom + 0.5)}
        >

          {/* Pit lane (full race only) — drawn below the racing line */}
          {totalLaps > 0 && pitLaneSegments.length > 0 && pitLaneSegments.map((seg, i) => {
            const pts = seg.map(p => transform.apply(p))
            return (
              <path key={`pit${i}`} d={catmullRomPath(pts, false)} fill="none"
                stroke="#ffffff" strokeWidth={6}
                strokeOpacity={0.08}
                strokeLinecap="round" strokeLinejoin="round" />
            )
          })}
          {totalLaps > 0 && pitLaneSegments.length > 0 && pitLaneSegments.map((seg, i) => {
            const pts = seg.map(p => transform.apply(p))
            return (
              <path key={`pitl${i}`} d={catmullRomPath(pts, false)} fill="none"
                stroke="#aaccff" strokeWidth={1.5}
                strokeOpacity={0.35}
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="4 3" />
            )
          })}

          {/* Track with race-condition coloring (white default → yellow/red under caution) */}
          {hasData && trackData && (() => {
            const shadow = trackData.segments.map((run, i) => {
              const pts = run.points.map(p => transform.apply(p))
              return <path key={`sh${i}`} d={catmullRomPath(pts, false)} fill="none"
                stroke="#00000080" strokeWidth={14}
                strokeLinecap="round" strokeLinejoin="round" />
            })
            const colored = trackData.segments.map((run, i) => {
              const pts = run.points.map(p => transform.apply(p))
              return (
                <path key={`seg${i}`} d={catmullRomPath(pts, false)} fill="none"
                  stroke={getSegmentColor(i)}
                  strokeWidth={4}
                  strokeLinecap="round" strokeLinejoin="round" />
              )
            })
            return <>{shadow}{colored}</>
          })()}

          {/* Fallback plain track when no 3-class data */}
          {hasData && !trackData && (() => {
            const { trackState } = currentFlagState
            const fallbackColor = trackState === 'red' ? TRACK_COLOR_RED
              : (trackState === 'sc' || trackState === 'vsc') ? TRACK_COLOR_YELLOW
              : TRACK_COLOR_BASE
            const d = catmullRomPath(transformedPoints, true)
            return (
              <>
                <path d={d} fill="none"
                  stroke="#00000080" strokeWidth={18}
                  strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none"
                  stroke={fallbackColor} strokeWidth={4}
                  strokeLinecap="round" strokeLinejoin="round" />
              </>
            )
          })()}

          {/* Race control flag badge (top-left of SVG) */}
          {hasData && raceControlMessages && (() => {
            const { trackState, yellowSectors } = currentFlagState
            if (trackState === 'green' && yellowSectors.size === 0) return null
            const isYellow = trackState === 'sc' || trackState === 'vsc' || yellowSectors.size > 0
            const bgColor   = isYellow ? '#ffcc00' : '#ff4444'
            const textColor = isYellow ? '#000000' : '#ffffff'
            const label     = trackState === 'sc' ? 'SC' : trackState === 'vsc' ? 'VSC'
              : trackState === 'red' ? 'RED FLAG'
              : yellowSectors.size > 0 ? `YELLOW S${[...yellowSectors].sort((a,b)=>a-b).join(',')}`
              : 'YELLOW'
            const w = Math.max(50, label.length * 7 + 16)
            return (
              <g>
                <rect x={10} y={10} width={w} height={22} rx={4} fill={bgColor} fillOpacity={0.92} />
                <text x={10 + w / 2} y={25} textAnchor="middle"
                  fill={textColor} fontSize={11} fontWeight="bold" fontFamily="monospace">
                  {label}
                </text>
              </g>
            )
          })()}

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
              const pts = zone.points.map(p => transform.apply(p))
              return (
                <path
                  key={`clip-${driver}-${zi}`}
                  d={catmullRomPath(pts, false)}
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

      {!showSatellite && hasData && (
        <div className="track-zoom-controls" role="group" aria-label="Track zoom controls">
          <button
            type="button"
            className="track-zoom-btn"
            onClick={() => updateTrackZoom(trackZoom - 0.5)}
            disabled={trackZoom <= 1}
            aria-label="Zoom out from track"
            title="Zoom out"
          >
            <Icon name="minus" size={15} />
          </button>
          <span className="track-zoom-value" aria-live="polite">{Math.round(trackZoom * 100)}%</span>
          <button
            type="button"
            className="track-zoom-btn"
            onClick={() => updateTrackZoom(trackZoom + 0.5)}
            disabled={trackZoom >= 4}
            aria-label="Zoom in on track"
            title="Zoom in"
          >
            <Icon name="plus" size={15} />
          </button>
          <button
            type="button"
            className="track-zoom-btn track-zoom-reset"
            onClick={() => updateTrackZoom(1)}
            disabled={trackZoom === 1 && trackPan.x === 0 && trackPan.y === 0}
            aria-label="Reset track zoom"
            title="Reset zoom"
          >
            <Icon name="reset" size={14} />
          </button>
        </div>
      )}

      {/* Clip zones tooltip (first-time) */}
      {showClipTip && (
        <div className="clip-tip-overlay" onClick={() => setShowClipTip(false)}>
          <div className="clip-tip-box">
            <span className="clip-tip-icon"><Icon name="battery" size={22} /></span>
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
          {currentSC.type === 'RED' ? 'RED FLAG' : currentSC.type === 'VSC' ? 'VIRTUAL SAFETY CAR' : 'SAFETY CAR'}
        </div>
      )}

      {/* Chequered flag badge when race ends */}
      {totalLaps > 0 && !currentSC && progress >= 0.999 && (
        <div className="sc-badge sc-badge-finish">RACE ENDED</div>
      )}

      {/* Inputs HUD overlay */}
      {showHUD && hudInputs && hudDriver && (
        <div className="hud-overlay">
          <InputsHUD inputs={hudInputs} driver={hudDriver} progress={progress} />
        </div>
      )}

      {/* Race control event ticker */}
      {rcTicker.length > 0 && (
        <div className="rc-ticker">
          {rcTicker.map((item) => (
            <div
              key={item.t}
              className={`rc-ticker-item rc-ticker-${item.kind}`}
              style={{ opacity: Math.max(0.45, 1 - item.age / 90) }}
            >
              {item.kind === 'red' ? '● ' : item.kind === 'yellow' ? '● ' : '▸ '}{item.msg}
            </div>
          ))}
        </div>
      )}

      {/* High-speed warning */}
      {showSpeedWarn && (
        <div className="speed-warn-toast">
          At high speeds, live positions and gaps may be less accurate
        </div>
      )}

      {/* Playback controls */}
      <div className="playback-bar">
        <div className="playback-primary">
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
              aria-label="Race progress"
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
                      left: `${Math.min(r.progress, 1) * 100}%`,
                      borderColor: driverColor(r.driver),
                      opacity: !tunedDriver || tunedDriver === r.driver ? 0.85 : 0.2,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="playback-tools" aria-label="Playback tools">
          <label className="playback-speed">
          <span>Speed</span>
          <span className="playback-speed-select-wrap">
            <select
              value={playSpeed}
              onChange={(event) => handleSpeedSelect(Number(event.target.value))}
              aria-label="Playback speed"
            >
              {(totalLaps > 0 ? [1, 5, 10, 20, 30, 60] : [0.25, 0.5, 1, 3, 5, 10]).map((speed) => (
                <option key={speed} value={speed}>{speed}×</option>
              ))}
            </select>
            <Icon name="chevron-down" size={13} />
          </span>
        </label>
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
          aria-label="Save screenshot as PNG"
        >
          <Icon name="camera" size={14} />
        </button>
        {radioCallsWithProgress && radioCallsWithProgress.length > 0 && (
          <>
            <button
              className={`speed-btn ${radioEnabled ? 'active' : ''}`}
              onClick={() => {
                const next = !radioEnabled
                setRadioEnabled(next)
                if (next) onTuneDriver?.(null)   // reset driver lock when re-enabling
              }}
              title={radioEnabled ? 'Mute team radio' : 'Enable team radio'}
              aria-label={radioEnabled ? 'Mute team radio' : 'Enable team radio'}
            >
              <Icon name="radio" size={14} />
            </button>
            {radioEnabled && navCalls.length > 0 && (
              <div className="radio-nav">
                {tunedDriver && (
                  <span className="radio-nav-driver" style={{ color: driverColor(tunedDriver) }}>
                    {tunedDriver}
                  </span>
                )}
                <button
                  className="speed-btn radio-nav-btn"
                  onClick={goToPrevRadio}
                  disabled={currentNavIdx <= 0}
                  title="Previous radio message"
                  aria-label="Previous radio message"
                ><Icon name="arrow-left" size={14} /></button>
                <span className="radio-nav-count">
                  {Math.max(0, currentNavIdx + 1)}/{navCalls.length}
                </span>
                <button
                  className="speed-btn radio-nav-btn"
                  onClick={goToNextRadio}
                  disabled={currentNavIdx >= navCalls.length - 1}
                  title="Next radio message"
                  aria-label="Next radio message"
                ><Icon name="arrow-right" size={14} /></button>
              </div>
            )}
            {radioEnabled && activeRadioCall && (
              <div
                className={`radio-now-playing ${tunedDriver === activeRadioCall.driver ? 'radio-locked' : ''}`}
                onClick={() => onTuneDriver?.(tunedDriver === activeRadioCall.driver ? null : activeRadioCall.driver)}
                title={tunedDriver === activeRadioCall.driver ? 'Click to disconnect' : `Click to lock onto ${activeRadioCall.driver}`}
              >
                <span className="radio-driver-dot" style={{ background: driverColor(activeRadioCall.driver) }} />
                <span className="radio-driver-name">{activeRadioCall.driver}</span>
                <span className="radio-wave-icon"><Icon name="radio" size={14} /></span>
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
                <span className="radio-wave-icon"><Icon name="lock" size={14} /></span>
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
    </div>
  )
}
