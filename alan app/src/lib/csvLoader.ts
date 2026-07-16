import Papa from 'papaparse'
import type { TelemetryPoint } from '../types'

interface RawTelemetryRow {
  Time_seconds?: string
  Time?: string
  Speed: string
  nGear: string
  Throttle: string
  Brake: string
  DRS: string
  X: string
  Y: string
  Distance: string
  RelativeDistance: string
}

// Parse pandas timedelta string: "0 days 00:00:00.037000" → seconds
function parseTimedelta(s: string): number {
  const m = s.match(/(\d+) days? (\d+):(\d+):(\d+)(?:\.(\d+))?/)
  if (!m) return NaN
  const frac = m[5] ? parseFloat('0.' + m[5]) : 0
  return parseInt(m[1], 10) * 86400 + parseInt(m[2], 10) * 3600 + parseInt(m[3], 10) * 60 + parseInt(m[4], 10) + frac
}

function parseTelemetryText(text: string): Promise<TelemetryPoint[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawTelemetryRow>(text, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const points: TelemetryPoint[] = results.data
          .map((row) => {
            const ts = parseFloat(row.Time_seconds ?? '')
            const time = isFinite(ts) ? ts : parseTimedelta(row.Time ?? '')
            return {
            time,
            speed: parseFloat(row.Speed),
            gear: parseInt(row.nGear, 10),
            throttle: parseFloat(row.Throttle),
            brake: row.Brake === 'True',
            drs: parseInt(row.DRS, 10),
            x: parseFloat(row.X),
            y: parseFloat(row.Y),
            distance: parseFloat(row.Distance),
            relDist: parseFloat(row.RelativeDistance),
          }
          })
          .filter(
            (p) =>
              isFinite(p.time) &&
              isFinite(p.speed) &&
              isFinite(p.distance) &&
              isFinite(p.relDist)
            // x/y may be NaN for sessions without GPS (e.g. Monaco race) — allowed
          )

        points.sort((a, b) => a.time - b.time)

        const mono: TelemetryPoint[] = []
        let maxDist = -Infinity
        for (const p of points) {
          if (p.distance >= maxDist) { mono.push(p); maxDist = p.distance }
        }

        const scaleEstimates: number[] = []
        for (let i = 1; i < mono.length; i++) {
          const dDist = mono[i].distance - mono[i - 1].distance
          if (dDist < 0.5) continue
          const dx = mono[i].x - mono[i - 1].x
          const dy = mono[i].y - mono[i - 1].y
          const xyDist = Math.sqrt(dx * dx + dy * dy)
          if (xyDist > 0) scaleEstimates.push(xyDist / dDist)
        }
        scaleEstimates.sort((a, b) => a - b)
        const xyPerMetre = scaleEstimates.length > 0
          ? scaleEstimates[Math.floor(scaleEstimates.length / 2)]
          : 1

        const clean: TelemetryPoint[] = mono.length > 0 ? [mono[0]] : []
        for (let i = 1; i < mono.length; i++) {
          const prev = clean[clean.length - 1]
          const curr = mono[i]
          const expectedXY = (curr.distance - prev.distance) * xyPerMetre
          const dx = curr.x - prev.x
          const dy = curr.y - prev.y
          const actualXY = Math.sqrt(dx * dx + dy * dy)
          if (actualXY <= Math.max(expectedXY * 4, xyPerMetre * 5)) {
            clean.push(curr)
          }
        }

        resolve(clean)
      },
      error(err: Error) {
        reject(err)
      },
    })
  })
}

export async function loadTelemetry(url: string): Promise<TelemetryPoint[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return parseTelemetryText(await res.text())
}

export async function loadTelemetryFromFile(file: File): Promise<TelemetryPoint[]> {
  return parseTelemetryText(await file.text())
}

export interface TelemetryLoadResult {
  data: Record<string, TelemetryPoint[]>
  dnf: Set<string>
}

// ── Full-race JSON loader ─────────────────────────────────────────────────────

interface FullRaceJson {
  laps: Record<string, Array<{ lap: number; t0: number | null; t1: number | null }>>
  drivers: Record<string, {
    t: number[]; x: number[]; y: number[]; v: number[]
    g: number[]; th: number[]; br: number[]; lap: number[]
  }>
}

export interface SafetyCarPeriod {
  type: 'SC' | 'VSC' | 'RED'
  start: number  // normalized seconds from race start
  end: number
}

export interface FullRaceResult {
  data: Record<string, TelemetryPoint[]>
  dnf: Set<string>
  totalLaps: number
  lapBoundaries: number[]  // progress (0→1) at start of each lap (index = lapNumber - 1)
  safetyCars: SafetyCarPeriod[]
}

export async function loadFullRaceTelemetry(url: string): Promise<FullRaceResult> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json: FullRaceJson = await res.json()

  // Determine total laps across all drivers
  let totalLaps = 0
  for (const entries of Object.values(json.laps)) {
    for (const e of entries) totalLaps = Math.max(totalLaps, e.lap)
  }
  if (totalLaps === 0) totalLaps = 1

  // Race start: min t0 of lap 1 (all drivers start together at lights-out)
  let raceStartTime = Infinity
  for (const entries of Object.values(json.laps)) {
    for (const e of entries) {
      if (e.lap === 1 && e.t0 != null) raceStartTime = Math.min(raceStartTime, e.t0)
    }
  }
  if (!isFinite(raceStartTime)) raceStartTime = 0

  // Race end: min t1 of the final lap (totalLaps) among drivers who completed it.
  // Using MIN (not max) gives the WINNER's crossing time.
  // Retired drivers have a "final lap" with t1 = session end — that's an outlier we exclude
  // by only looking at laps with a plausible duration (> 0 seconds).
  let raceEndTime = 0
  for (const entries of Object.values(json.laps)) {
    for (const e of entries) {
      if (e.lap === totalLaps && e.t0 != null && e.t1 != null && e.t1 > e.t0) {
        if (raceEndTime === 0 || e.t1 < raceEndTime) raceEndTime = e.t1
      }
    }
  }
  // 5-minute buffer after the winner crosses for lapped/backmarker drivers to finish
  const raceCutoff = raceEndTime > 0 ? raceEndTime + 300 : 0

  const data: Record<string, TelemetryPoint[]> = {}
  const dnf = new Set<string>()

  for (const [driver, cols] of Object.entries(json.drivers)) {
    const n = cols.t.length
    if (n === 0) { dnf.add(driver); continue }

    // Build lap timing lookup: lapNumber → { t0, t1 }
    const lapTiming = new Map<number, { t0: number; t1: number }>()
    for (const e of (json.laps[driver] ?? [])) {
      if (e.t0 != null && e.t1 != null) lapTiming.set(e.lap, { t0: e.t0, t1: e.t1 })
    }

    // Sorted array for time-based lap lookup — used when cols.lap[i] has no matching timing
    // (happens when Python assigns lap=0 to early-race points for drivers who retired on lap 1)
    const lapBoundsArr = Array.from(lapTiming.entries())
      .map(([lapNum, b]) => ({ lapNum, t0: b.t0, t1: b.t1 }))
      .sort((a, b) => a.t0 - b.t0)

    function findLapByTime(t: number): { lapNum: number; t0: number; t1: number } | null {
      let lo = 0, hi = lapBoundsArr.length - 1
      while (lo <= hi) {
        const m = (lo + hi) >> 1
        const entry = lapBoundsArr[m]
        if (t < entry.t0) hi = m - 1
        else if (t >= entry.t1) lo = m + 1
        else return entry
      }
      // t is past the last known lap — return the last entry (driver crossing the line)
      if (lo > 0 && lo >= lapBoundsArr.length) return lapBoundsArr[lapBoundsArr.length - 1]
      return null
    }

    const points: TelemetryPoint[] = []
    for (let i = 0; i < n; i++) {
      const t = cols.t[i]

      // Skip formation lap (pre-race) and cool-down lap (post-race)
      if (t < raceStartTime) continue
      if (raceCutoff > 0 && t > raceCutoff) continue

      let lap = cols.lap[i] || 1

      // Compute relative distance within lap → relDist across full race
      let timing = lapTiming.get(lap)
      if (!timing) {
        // cols.lap[i] is wrong (e.g. lap=0 for early-race retirees) — find by time
        const found = findLapByTime(t)
        if (found) { lap = found.lapNum; timing = found }
      }
      let lapFrac = 0
      if (timing && timing.t1 > timing.t0) {
        lapFrac = Math.max(0, Math.min(1, (t - timing.t0) / (timing.t1 - timing.t0)))
      }
      const relDist = ((lap - 1) + lapFrac) / totalLaps

      points.push({
        time:     t - raceStartTime,
        speed:    cols.v[i],
        gear:     cols.g[i],
        throttle: cols.th[i],
        brake:    cols.br[i] === 1,
        drs:      0,
        x:        cols.x[i],
        y:        cols.y[i],
        distance: relDist * totalLaps * 5000, // pseudo-distance, monotone by construction
        relDist,
      })
    }

    if (points.length === 0) { dnf.add(driver); continue }
    points.sort((a, b) => a.relDist - b.relDist)
    data[driver] = points
  }

  // Lap boundaries: progress value at the start of each lap
  const lapBoundaries = Array.from({ length: totalLaps }, (_, i) => i / totalLaps)

  // Safety car periods — normalize from raw session seconds to race-relative seconds
  const safetyCars: SafetyCarPeriod[] = ((json as any).safety_cars ?? [])
    .map((sc: { type: string; start: number; end: number }) => ({
      type: sc.type as SafetyCarPeriod['type'],
      start: sc.start - raceStartTime,
      end: sc.end - raceStartTime,
    }))
    .filter((sc: SafetyCarPeriod) => sc.end > sc.start && sc.start >= 0)

  return { data, dnf, totalLaps, lapBoundaries, safetyCars }
}

export async function loadAllDriverTelemetry(
  urls: Array<{ driver: string; url: string }>
): Promise<TelemetryLoadResult> {
  const settled = await Promise.all(
    urls.map(async ({ driver, url }) => {
      try {
        const data = await loadTelemetry(url)
        if (data.length === 0) throw new Error('no rows')
        return { driver, data, ok: true as const }
      } catch {
        return { driver, data: [] as TelemetryPoint[], ok: false as const }
      }
    })
  )

  const data: Record<string, TelemetryPoint[]> = {}
  const dnf = new Set<string>()

  for (const r of settled) {
    if (r.ok) data[r.driver] = r.data
    else dnf.add(r.driver)
  }

  return { data, dnf }
}
