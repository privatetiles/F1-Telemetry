import type { TelemetryPoint, ProcessedMiniSector, MiniSectorStats } from '../types'

const NUM_SECTORS = 25

export function computeMiniSectors(
  driverTelemetry: Record<string, TelemetryPoint[]>,
  numSectors = NUM_SECTORS
): ProcessedMiniSector[] {
  const drivers = Object.keys(driverTelemetry)
  if (drivers.length === 0) return []

  // Reference driver = longest total distance (most complete lap coverage).
  // Using most-data-points would pick a driver whose telemetry may end early
  // (e.g. BOT ends at 5191m vs the full ~5241m circuit), causing the last
  // sectors to span a shorter physical window than the rest of the field.
  const refDriver = drivers.reduce((best, d) => {
    const dDist  = driverTelemetry[d].at(-1)?.distance  ?? 0
    const bDist  = driverTelemetry[best].at(-1)?.distance ?? 0
    return dDist > bDist ? d : best
  })
  const refData = driverTelemetry[refDriver]

  // ── Use actual DISTANCE (metres) for sector boundaries ──────────────────────
  // RelativeDistance is each driver's own GPS-measured distance / their own
  // total lap distance, so relDist=0.88 maps to completely different physical
  // track positions across drivers (BOT vs NOR differ by ~50m of total lap
  // distance, which shifts sector boundaries by hundreds of metres of XY space).
  // Using the raw Distance column tied to the reference driver's total ensures
  // every driver is compared over exactly the same metres of circuit.
  const refTotalDist = refData[refData.length - 1].distance

  return Array.from({ length: numSectors }, (_, i) => {
    const distStart = (i / numSectors) * refTotalDist
    const distEnd   = ((i + 1) / numSectors) * refTotalDist

    // SVG path points from reference driver in this distance slice
    const sectorRows = refData.filter((p) => p.distance >= distStart && p.distance < distEnd)
    const bridgePoint = i < numSectors - 1
      ? refData.find((p) => p.distance >= distEnd)
      : null
    const sectorPoints = [
      ...sectorRows.map((p) => ({ x: p.x, y: p.y })),
      ...(bridgePoint ? [{ x: bridgePoint.x, y: bridgePoint.y }] : []),
    ]

    // relStart / relEnd for the animation (use reference driver's actual relDist
    // at the distance boundaries so the progress slider stays consistent)
    const relStart = sectorRows.length > 0 ? sectorRows[0].relDist : i / numSectors
    const relEnd   = bridgePoint?.relDist ?? refData[refData.length - 1].relDist

    const driverStats: Record<string, MiniSectorStats> = {}
    let fastestTime = Infinity

    for (const driver of drivers) {
      const tel  = driverTelemetry[driver]

      // Skip if the driver's data ends before this sector finishes.
      // interpolateTimeByDist clamps to the last time, which would give an
      // artificially short (fast) reading for a truncated lap.
      // 20 m tolerance handles normal end-of-session data gaps without
      // excluding drivers who ran the full lap.
      const DATA_END_TOLERANCE = 20
      if (tel[tel.length - 1].distance < distEnd - DATA_END_TOLERANCE) continue

      const rows = tel.filter((p) => p.distance >= distStart && p.distance < distEnd)
      if (rows.length < 2) continue

      // Interpolate at exact distance boundaries — eliminates sampling-density bias
      const timeAtStart = interpolateTimeByDist(tel, distStart)
      const timeAtEnd   = interpolateTimeByDist(tel, distEnd)
      const timeSpent   = timeAtEnd - timeAtStart
      if (timeSpent <= 0) continue

      const speeds     = rows.map((r) => r.speed)
      const brakeCount = rows.filter((r) => r.brake).length
      const avgThrottle = rows.reduce((s, r) => s + r.throttle, 0) / rows.length

      driverStats[driver] = {
        driver,
        timeSpent,
        avgSpeed:    speeds.reduce((a, b) => a + b, 0) / speeds.length,
        minSpeed:    Math.min(...speeds),
        entrySpeed:  rows[0].speed,
        exitSpeed:   rows[rows.length - 1].speed,
        brakePercent: (brakeCount / rows.length) * 100,
        avgThrottle,
        deltaVsFastest: 0,
      }

      if (timeSpent < fastestTime) fastestTime = timeSpent
    }

    for (const stats of Object.values(driverStats)) {
      stats.deltaVsFastest = stats.timeSpent - fastestTime
    }

    const refStats      = driverStats[refDriver]
    const avgSpeedRef   = refStats?.avgSpeed    ?? 0
    const avgThrottleRef = refStats?.avgThrottle ?? 0
    const avgBrakeRef   = refStats?.brakePercent ?? 0

    return { idx: i, relStart, relEnd, points: sectorPoints, driverStats, fastestTime, avgSpeedRef, avgThrottleRef, avgBrakeRef }
  })
}

// ── Segment-based mini sectors (three-class track data) ─────────────────────

interface TrackSegment {
  category: string
  points: { x: number; y: number }[]
}

function matchSegmentsToDistances(
  segments: TrackSegment[],
  refTelemetry: TelemetryPoint[]
): Array<{ distStart: number; category: string }> {
  const result: Array<{ distStart: number; category: string }> = []
  let searchStart = 0

  for (const seg of segments) {
    const { x: sx, y: sy } = seg.points[0]
    let bestIdx = searchStart
    let bestDist2 = Infinity
    let lastImprovedIdx = searchStart

    for (let j = searchStart; j < refTelemetry.length; j++) {
      const dx = refTelemetry[j].x - sx
      const dy = refTelemetry[j].y - sy
      const d2 = dx * dx + dy * dy
      if (d2 < bestDist2) { bestDist2 = d2; bestIdx = j; lastImprovedIdx = j }
      // Stop once 500 m past the last improvement — avoids looping back on similar-looking sections
      if (refTelemetry[j].distance - refTelemetry[lastImprovedIdx].distance > 500) break
    }

    result.push({ distStart: refTelemetry[bestIdx].distance, category: seg.category })
    searchStart = Math.min(bestIdx + 3, refTelemetry.length - 1)
  }

  return result
}

export function computeMiniSectorsFromSegments(
  driverTelemetry: Record<string, TelemetryPoint[]>,
  segments: TrackSegment[]
): ProcessedMiniSector[] {
  const drivers = Object.keys(driverTelemetry)
  if (drivers.length === 0) return []
  if (segments.length === 0) return computeMiniSectors(driverTelemetry)

  const refDriver = drivers.reduce((best, d) => {
    const dDist = driverTelemetry[d].at(-1)?.distance ?? 0
    const bDist = driverTelemetry[best].at(-1)?.distance ?? 0
    return dDist > bDist ? d : best
  })
  const refData = driverTelemetry[refDriver]
  const refTotalDist = refData[refData.length - 1].distance

  const boundaries = matchSegmentsToDistances(segments, refData)
  if (boundaries.length < 2) return computeMiniSectors(driverTelemetry)

  const numSectors = boundaries.length

  return boundaries.map((b, i) => {
    const distStart = b.distStart
    const distEnd = i < numSectors - 1 ? boundaries[i + 1].distStart : refTotalDist

    const sectorRows = refData.filter(p => p.distance >= distStart && p.distance < distEnd)
    const bridgePoint = i < numSectors - 1 ? refData.find(p => p.distance >= distEnd) : null
    const sectorPoints = [
      ...sectorRows.map(p => ({ x: p.x, y: p.y })),
      ...(bridgePoint ? [{ x: bridgePoint.x, y: bridgePoint.y }] : []),
    ]

    const relStart = sectorRows.length > 0 ? sectorRows[0].relDist : distStart / refTotalDist
    const relEnd   = bridgePoint?.relDist ?? refData[refData.length - 1].relDist

    const driverStats: Record<string, MiniSectorStats> = {}
    let fastestTime = Infinity

    for (const driver of drivers) {
      const tel = driverTelemetry[driver]
      const DATA_END_TOLERANCE = 20
      if (tel[tel.length - 1].distance < distEnd - DATA_END_TOLERANCE) continue

      const rows = tel.filter(p => p.distance >= distStart && p.distance < distEnd)
      if (rows.length < 2) continue

      const timeAtStart = interpolateTimeByDist(tel, distStart)
      const timeAtEnd   = interpolateTimeByDist(tel, distEnd)
      const timeSpent   = timeAtEnd - timeAtStart
      if (timeSpent <= 0) continue

      const speeds      = rows.map(r => r.speed)
      const brakeCount  = rows.filter(r => r.brake).length
      const avgThrottle = rows.reduce((s, r) => s + r.throttle, 0) / rows.length

      driverStats[driver] = {
        driver, timeSpent,
        avgSpeed:     speeds.reduce((a, b) => a + b, 0) / speeds.length,
        minSpeed:     Math.min(...speeds),
        entrySpeed:   rows[0].speed,
        exitSpeed:    rows[rows.length - 1].speed,
        brakePercent: (brakeCount / rows.length) * 100,
        avgThrottle,
        deltaVsFastest: 0,
      }

      if (timeSpent < fastestTime) fastestTime = timeSpent
    }

    for (const stats of Object.values(driverStats)) {
      stats.deltaVsFastest = stats.timeSpent - fastestTime
    }

    const refStats = driverStats[refDriver]
    return {
      idx: i, relStart, relEnd, points: sectorPoints, driverStats, fastestTime,
      avgSpeedRef:    refStats?.avgSpeed    ?? 0,
      avgThrottleRef: refStats?.avgThrottle ?? 0,
      avgBrakeRef:    refStats?.brakePercent ?? 0,
      category:       b.category,
    }
  })
}

// Binary-search interpolation by cumulative distance (metres)
function interpolateTimeByDist(telemetry: TelemetryPoint[], targetDist: number): number {
  if (telemetry.length === 0) return 0
  if (targetDist <= telemetry[0].distance) return telemetry[0].time
  if (targetDist >= telemetry[telemetry.length - 1].distance) return telemetry[telemetry.length - 1].time

  let lo = 0, hi = telemetry.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (telemetry[mid].distance < targetDist) lo = mid
    else hi = mid
  }

  const p0 = telemetry[lo], p1 = telemetry[hi]
  const span = p1.distance - p0.distance
  if (span === 0) return p0.time
  return p0.time + ((targetDist - p0.distance) / span) * (p1.time - p0.time)
}

// Interpolate a driver's X,Y position at a given relDist progress
export function interpolatePosition(
  telemetry: TelemetryPoint[],
  progress: number
): { x: number; y: number } | null {
  if (telemetry.length === 0) return null

  if (progress <= telemetry[0].relDist) return { x: telemetry[0].x, y: telemetry[0].y }
  if (progress >= telemetry[telemetry.length - 1].relDist) {
    const last = telemetry[telemetry.length - 1]
    return { x: last.x, y: last.y }
  }

  let lo = 0, hi = telemetry.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (telemetry[mid].relDist < progress) lo = mid
    else hi = mid
  }

  const p0 = telemetry[lo], p1 = telemetry[hi]
  const span = p1.relDist - p0.relDist
  if (span === 0) return { x: p0.x, y: p0.y }
  const t = (progress - p0.relDist) / span
  return { x: p0.x + t * (p1.x - p0.x), y: p0.y + t * (p1.y - p0.y) }
}

// Interpolate x,y position at an exact elapsed-time value (seconds from lap start).
// This is the correct function to use when `progress` comes from time-based animation.
export function interpolatePositionAtTime(
  telemetry: TelemetryPoint[],
  targetSec: number,
): { x: number; y: number } | null {
  if (telemetry.length === 0) return null
  if (targetSec <= telemetry[0].time) return { x: telemetry[0].x, y: telemetry[0].y }
  if (targetSec >= telemetry[telemetry.length - 1].time) {
    const last = telemetry[telemetry.length - 1]
    return { x: last.x, y: last.y }
  }
  let lo = 0, hi = telemetry.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (telemetry[mid].time < targetSec) lo = mid; else hi = mid
  }
  const p0 = telemetry[lo], p1 = telemetry[hi]
  const span = p1.time - p0.time
  if (span === 0) return { x: p0.x, y: p0.y }
  const t = (targetSec - p0.time) / span
  return { x: p0.x + t * (p1.x - p0.x), y: p0.y + t * (p1.y - p0.y) }
}

// Interpolate driver inputs at an exact elapsed-time value (seconds from lap start).
export function interpolateInputsAtTime(
  telemetry: TelemetryPoint[],
  targetSec: number,
): DriverInputs | null {
  if (telemetry.length < 2) return null
  const clamp = (v: number) => Math.max(0, Math.min(1, v))
  let lo = 0, hi = telemetry.length - 1
  if (targetSec <= telemetry[0].time) { lo = 0; hi = 1 }
  else if (targetSec >= telemetry[hi].time) { lo = hi - 1 }
  else {
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1
      if (telemetry[mid].time < targetSec) lo = mid; else hi = mid
    }
  }
  const p0 = telemetry[lo], p1 = telemetry[hi]
  const span = p1.time - p0.time
  const t    = span === 0 ? 0 : clamp((targetSec - p0.time) / span)
  const throttle = p0.throttle + t * (p1.throttle - p0.throttle)
  const speed    = p0.speed    + t * (p1.speed    - p0.speed)
  const WIN  = 4
  const fwd1 = telemetry[Math.min(telemetry.length - 1, lo + WIN)]
  const fwd2 = telemetry[Math.min(telemetry.length - 1, lo + WIN * 2)]
  const dx1 = fwd1.x - p0.x, dy1 = fwd1.y - p0.y
  const dx2 = fwd2.x - fwd1.x, dy2 = fwd2.y - fwd1.y
  const a1 = Math.atan2(dy1, dx1)
  const a2 = Math.atan2(dy2, dx2)
  let dAngle = a2 - a1
  if (dAngle >  Math.PI) dAngle -= 2 * Math.PI
  if (dAngle < -Math.PI) dAngle += 2 * Math.PI
  const steeringDeg = Math.max(-180, Math.min(180, -dAngle * (180 / Math.PI) * 6.5))
  return { throttle, brake: p0.brake, drs: p0.drs, gear: p0.gear, speed, steeringDeg }
}

// Interpolate elapsed lap time at a given relDist (for animation progress)
export function interpolateTime(telemetry: TelemetryPoint[], progress: number): number {
  if (telemetry.length === 0) return 0
  if (progress <= telemetry[0].relDist) return telemetry[0].time
  if (progress >= telemetry[telemetry.length - 1].relDist)
    return telemetry[telemetry.length - 1].time

  let lo = 0, hi = telemetry.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (telemetry[mid].relDist < progress) lo = mid
    else hi = mid
  }

  const p0 = telemetry[lo], p1 = telemetry[hi]
  const span = p1.relDist - p0.relDist
  if (span === 0) return p0.time
  const t = (progress - p0.relDist) / span
  return p0.time + t * (p1.time - p0.time)
}

export interface DriverInputs {
  throttle: number      // 0-100
  brake: boolean
  drs: number           // 0 = off, >0 = active aero on
  gear: number
  speed: number
  steeringDeg: number   // estimated wheel rotation in degrees (±)
}

// Returns instantaneous driver inputs at the given relDist progress
export function interpolateInputs(telemetry: TelemetryPoint[], progress: number): DriverInputs | null {
  if (telemetry.length < 2) return null

  const clamp = (v: number) => Math.max(0, Math.min(1, v))
  let lo = 0, hi = telemetry.length - 1
  if (progress <= telemetry[0].relDist) { lo = 0; hi = 1 }
  else if (progress >= telemetry[hi].relDist) { lo = hi - 1 }
  else {
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1
      if (telemetry[mid].relDist < progress) lo = mid; else hi = mid
    }
  }

  const p0 = telemetry[lo], p1 = telemetry[hi]
  const span = p1.relDist - p0.relDist
  const t    = span === 0 ? 0 : clamp((progress - p0.relDist) / span)

  const throttle = p0.throttle + t * (p1.throttle - p0.throttle)
  const speed    = p0.speed    + t * (p1.speed    - p0.speed)

  // Forward-looking curvature × 6.5 (matches reference implementation scale)
  const WIN  = 4
  const fwd1 = telemetry[Math.min(telemetry.length - 1, lo + WIN)]
  const fwd2 = telemetry[Math.min(telemetry.length - 1, lo + WIN * 2)]
  const dx1 = fwd1.x - p0.x, dy1 = fwd1.y - p0.y
  const dx2 = fwd2.x - fwd1.x, dy2 = fwd2.y - fwd1.y
  const a1 = Math.atan2(dy1, dx1)
  const a2 = Math.atan2(dy2, dx2)
  let dAngle = a2 - a1
  if (dAngle >  Math.PI) dAngle -= 2 * Math.PI
  if (dAngle < -Math.PI) dAngle += 2 * Math.PI
  const steeringDeg = Math.max(-180, Math.min(180, -dAngle * (180 / Math.PI) * 6.5))

  return { throttle, brake: p0.brake, drs: p0.drs, gear: p0.gear, speed, steeringDeg }
}

// Colours a sector by what it represents physically on track:
//   Green  = full-throttle flat-out
//   Yellow = partial throttle / cornering exit
//   Orange = trail-braking / entry
//   Red    = heavy braking zone
export function characteristicColor(avgThrottle: number, brakePercent: number): string {
  if (brakePercent >= 35) {
    // Heavy braking — deep red
    const t = Math.min(1, (brakePercent - 35) / 40)
    return `rgb(${Math.round(220 + 35 * t)}, ${Math.round(20 * (1 - t))}, 0)`
  }
  if (brakePercent >= 12) {
    // Light / trail braking — orange
    const t = (brakePercent - 12) / 23
    return `rgb(255, ${Math.round(100 - 80 * t)}, 0)`
  }
  if (avgThrottle >= 75) {
    // Full throttle — bright green
    const t = Math.min(1, (avgThrottle - 75) / 25)
    return `rgb(${Math.round(20 * (1 - t))}, ${Math.round(200 + 55 * t)}, ${Math.round(60 * (1 - t))})`
  }
  // Partial throttle / apex coasting — yellow
  const t = avgThrottle / 75
  return `rgb(${Math.round(255 - 30 * t)}, ${Math.round(160 + 55 * t)}, 0)`
}

export function deltaToColor(delta: number, maxDelta: number): string {
  if (delta <= 0.001) return '#00e676'
  const t = Math.min(1, delta / Math.max(maxDelta, 0.001))
  const r = Math.round(255 * t)
  const g = Math.round(180 * (1 - t))
  return `rgb(${r},${g},0)`
}
