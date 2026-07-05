import type { TelemetryPoint } from '../types'

export interface ClipSegment {
  points: { x: number; y: number }[]
  relStart: number
  relEnd: number
  duration: number  // seconds
  speedDrop: number // km/h lost during segment
}

const THROTTLE_THRESH = 94   // % — must be essentially full throttle
const DECEL_THRESH    = -2.5 // km/h per second — clipping deceleration threshold
const MIN_SPEED       = 180  // km/h — must be on a high-speed section (straight)
const MIN_DURATION    = 0.35 // seconds — sustained event, not sensor noise
const SMOOTH_WIN      = 4    // samples each side for speed smoothing

function smoothedSpeed(tel: TelemetryPoint[], i: number): number {
  let sum = 0, n = 0
  for (let j = Math.max(0, i - SMOOTH_WIN); j <= Math.min(tel.length - 1, i + SMOOTH_WIN); j++) {
    sum += tel[j].speed; n++
  }
  return sum / n
}

export function detectClipZones(tel: TelemetryPoint[]): ClipSegment[] {
  const zones: ClipSegment[] = []
  if (tel.length < SMOOTH_WIN * 3) return zones

  let inClip = false
  let clipStartIdx = 0
  let clipPoints: { x: number; y: number }[] = []
  let clipStartSpeed = 0

  for (let i = SMOOTH_WIN; i < tel.length - SMOOTH_WIN; i++) {
    const p = tel[i]
    const dt = p.time - tel[i - 1].time
    if (dt <= 0) continue

    const vs = smoothedSpeed(tel, i)
    const vsPrev = smoothedSpeed(tel, i - 1)
    const accel = (vs - vsPrev) / dt  // km/h per second

    const isClipping = (
      p.throttle >= THROTTLE_THRESH &&
      p.speed > MIN_SPEED &&
      accel < DECEL_THRESH
    )

    if (isClipping && !inClip) {
      inClip = true
      clipStartIdx = i
      clipPoints = [{ x: tel[i - 1].x, y: tel[i - 1].y }, { x: p.x, y: p.y }]
      clipStartSpeed = p.speed
    } else if (isClipping && inClip) {
      clipPoints.push({ x: p.x, y: p.y })
    } else if (!isClipping && inClip) {
      const duration = p.time - tel[clipStartIdx].time
      if (duration >= MIN_DURATION) {
        zones.push({
          points: clipPoints,
          relStart: tel[clipStartIdx].relDist,
          relEnd: p.relDist,
          duration,
          speedDrop: clipStartSpeed - p.speed,
        })
      }
      inClip = false
      clipPoints = []
    }
  }

  return zones
}
