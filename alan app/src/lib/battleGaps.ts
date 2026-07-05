import type { TelemetryPoint } from '../types'

export interface BattleGapEntry {
  driver: string
  position: number
  gap: number           // seconds behind leader (0 = leader)
  gapToAhead: number | null
}

export function distanceAtTime(tel: TelemetryPoint[], t: number): number {
  if (tel.length === 0) return 0
  if (t <= tel[0].time) return tel[0].distance
  const last = tel[tel.length - 1]
  if (t >= last.time) return last.distance
  let lo = 0, hi = tel.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (tel[mid].time < t) lo = mid; else hi = mid
  }
  const a = tel[lo], b = tel[hi]
  const frac = (t - a.time) / (b.time - a.time)
  return a.distance + frac * (b.distance - a.distance)
}

export function timeAtDistance(tel: TelemetryPoint[], dist: number): number {
  if (tel.length === 0) return 0
  if (dist <= tel[0].distance) return tel[0].time
  const last = tel[tel.length - 1]
  if (dist >= last.distance) return last.time
  let lo = 0, hi = tel.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (tel[mid].distance < dist) lo = mid; else hi = mid
  }
  const a = tel[lo], b = tel[hi]
  if (b.distance === a.distance) return a.time
  const frac = (dist - a.distance) / (b.distance - a.distance)
  return a.time + frac * (b.time - a.time)
}

export function computeBattleGaps(
  battleDrivers: string[],
  driverTelemetry: Record<string, TelemetryPoint[]>,
  targetTime: number,
): BattleGapEntry[] {
  if (battleDrivers.length < 2) return []

  const positions = battleDrivers
    .filter((d) => driverTelemetry[d])
    .map((d) => ({ driver: d, dist: distanceAtTime(driverTelemetry[d], targetTime) }))
    .sort((a, b) => b.dist - a.dist)

  const leaderTel = driverTelemetry[positions[0]?.driver]
  if (!leaderTel) return []

  return positions.map((dp, i) => {
    const gap = i === 0 ? 0 : targetTime - timeAtDistance(leaderTel, dp.dist)
    const gapToAhead = i === 0 ? null
      : targetTime - timeAtDistance(driverTelemetry[positions[i - 1].driver], dp.dist)
    return { driver: dp.driver, position: i + 1, gap, gapToAhead }
  })
}
