export interface PitLanePoint { x: number; y: number }
interface PitSample extends PitLanePoint { time: number; speed: number }
interface PitVisit { lap: number; in: number; out: number }

export interface PitLaneData {
  x: number[]
  y: number[]
  source: { driver: string; lap: number } | null
}

// FastF1 coordinates are tenths of a metre. Never bridge a 100 m sample gap.
const MAX_STEP = 1000
const MIN_LENGTH = 1000
const MAX_LENGTH = 18000

export function validatePitLane(data: unknown): PitLanePoint[] {
  if (!data || typeof data !== 'object' || !('x' in data) || !('y' in data)) return []
  const { x, y } = data
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 6) return []
  const points: PitLanePoint[] = []
  let length = 0
  for (let i = 0; i < x.length; i++) {
    if (!Number.isFinite(x[i]) || !Number.isFinite(y[i])) return []
    const point = { x: x[i] as number, y: y[i] as number }
    const prev = points.at(-1)
    if (prev) {
      const step = Math.hypot(point.x - prev.x, point.y - prev.y)
      if (step > MAX_STEP) return []
      if (step < 1) continue
      length += step
    }
    points.push(point)
  }
  if (points.length < 6 || length < MIN_LENGTH || length > MAX_LENGTH) return []
  const first = points[0], last = points[points.length - 1]
  // Repeated traversals and backwards jumps must not become a single lane.
  if (length > 3 * Math.hypot(last.x - first.x, last.y - first.y)) return []
  return points
}

export function extractPitLane(
  telemetry: Record<string, PitSample[]>,
  pitStops: Record<string, PitVisit[]>,
): PitLaneData | null {
  let best: PitLaneData | null = null
  let bestScore = Infinity
  for (const [driver, stops] of Object.entries(pitStops)) {
    const samples = telemetry[driver]
    if (!samples?.length) continue
    for (const stop of stops) {
      const duration = stop.out - stop.in
      if (!Number.isFinite(duration) || duration < 8 || duration > 90) continue
      // Keep the complete visit, including entry, the stationary stop, and exit.
      const visit = samples.filter(p => p.time >= stop.in - 2 && p.time <= stop.out + 2)
        .sort((a, b) => a.time - b.time)
      if (visit.length < 6 || visit[0].time > stop.in + 3 || visit.at(-1)!.time < stop.out - 3) continue
      const core = visit.filter(p => p.time >= stop.in && p.time <= stop.out)
      if (core.filter(p => p.speed >= 0 && p.speed <= 85).length < Math.max(5, core.length / 2)) continue

      let valid = true, maxStep = 0, maxGap = 0, frozenSince = visit[0].time
      for (let i = 1; i < visit.length; i++) {
        const prev = visit[i - 1], point = visit[i]
        const dt = point.time - prev.time
        const step = Math.hypot(point.x - prev.x, point.y - prev.y)
        if (dt <= 0 || dt > 5 || !Number.isFinite(step) || step > MAX_STEP || step / dt > MAX_STEP) {
          valid = false
          break
        }
        if (step >= 1 || point.speed < 15 || prev.speed < 15) frozenSince = point.time
        if (point.time - frozenSince > 3) { valid = false; break }
        maxStep = Math.max(maxStep, step)
        maxGap = Math.max(maxGap, dt)
      }
      if (!valid) continue
      const points = validatePitLane({ x: visit.map(p => p.x), y: visit.map(p => p.y) })
      if (!points.length) continue
      // Prefer well-sampled visits, not the largest pile of points from many visits.
      const score = maxStep + maxGap * 100
      if (score >= bestScore) continue
      bestScore = score
      best = { x: points.map(p => p.x), y: points.map(p => p.y), source: { driver, lap: stop.lap } }
    }
  }
  return best
}

export function requestPitLane(url: string, onResult: (points: PitLanePoint[]) => void): () => void {
  const controller = new AbortController()
  onResult([])
  void fetch(url, { signal: controller.signal })
    .then(async response => response.ok ? validatePitLane(await response.json()) : [])
    .then(points => { if (!controller.signal.aborted) onResult(points) })
    .catch(() => { if (!controller.signal.aborted) onResult([]) })
  return () => controller.abort()
}
