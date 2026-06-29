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
              isFinite(p.x) &&
              isFinite(p.y) &&
              isFinite(p.distance) &&
              isFinite(p.relDist)
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
