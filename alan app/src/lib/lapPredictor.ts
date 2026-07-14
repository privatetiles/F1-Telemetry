import type { ProcessedMiniSector, MiniSectorStats } from '../types'
import type { CircuitLayout } from './circuitLayouts'
import type { SpeedClass } from './speedClasses'
import { SPEED_CLASSES, SPEED_CLASS_DEFAULTS, classifyByApexSpeed } from './speedClasses'
import CIRCUIT_LAYOUTS from './circuitLayouts'
import { CIRCUITS, telemetryUrl } from './dataIndex'
import { loadAllDriverTelemetry } from './csvLoader'
import { computeMiniSectors } from './miniSectors'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SpeedClassStats {
  avgSpeed: number   // km/h average sector speed (includes braking approach + apex + exit)
  samples:  number
}

// Flat (simple average across all training circuits) — used for Data Lab display
export type DriverSpeedProfiles = Record<string, Record<SpeedClass, SpeedClassStats>>

// Per-circuit, per-driver, per-class absolute speeds
type PerCircuitData = Record<string, Record<string, Record<SpeedClass, SpeedClassStats>>>

// Circuit layout derived directly from telemetry mini-sector classification.
// More accurate than manual layouts because it reflects actual track character.
export interface DerivedCircuitLayout {
  lapDistance: number                        // reference driver's actual GPS lap distance (m)
  classDistances: Record<SpeedClass, number> // metres per speed class (sector_count × lap_dist/100)
  poleTime: number                           // actual fastest lap time from qualifying telemetry (s)
}

export interface ProfileData {
  flat:                DriverSpeedProfiles
  perCircuit:          PerCircuitData
  // Field (grid-wide) average speed per training circuit per class
  fieldAvgPerCircuit:  Record<string, Record<SpeedClass, number>>
  // Cross-circuit field average per class (mean of fieldAvgPerCircuit across all training circuits)
  crossCircuitFieldAvg: Record<SpeedClass, number>
  // Per-class distances and actual pole time derived from telemetry — replaces manual layouts
  derivedLayouts:      Record<string, DerivedCircuitLayout>
  trainingCircuitIds:  string[]
}

export interface PredictedDriver {
  driver:           string
  predictedSeconds: number
  gap:              number   // relative to P1 (pole sitter)
  speedClassTimes:  Record<SpeedClass, number>
}

// ── Build profiles ────────────────────────────────────────────────────────────

export async function buildDriverSpeedProfiles(): Promise<ProfileData> {
  const rawSpeeds:     Record<string, Record<string, Record<SpeedClass, number[]>>> = {}
  const fieldRaw:      Record<string, Record<SpeedClass, number[]>> = {}
  const derivedLayouts: Record<string, DerivedCircuitLayout> = {}

  const dataCircuits = CIRCUITS.filter((c) => c.hasData)

  for (const circuit of dataCircuits) {
    const qualSession = circuit.sessions.find((s) => s.type === 'qualifying')
    if (!qualSession) continue

    const urls = qualSession.drivers.map((d) => ({
      driver: d,
      url: telemetryUrl(circuit.id, circuit.year ?? 2026, qualSession.type, d),
    }))

    const { data } = await loadAllDriverTelemetry(urls)
    if (Object.keys(data).length < 3) continue

    // Reference driver = most lap coverage (matches computeMiniSectors logic)
    const refDriver = Object.keys(data).reduce((best, d) =>
      (data[d].at(-1)?.distance ?? 0) > (data[best]?.at(-1)?.distance ?? 0) ? d : best
    )
    const lapDistance = data[refDriver]?.at(-1)?.distance ?? 0

    // Fastest driver = minimum total lap time (for pole time extraction)
    const fastestDriver = Object.keys(data).reduce((best, d) =>
      (data[d].at(-1)?.time ?? Infinity) < (data[best]?.at(-1)?.time ?? Infinity) ? d : best
    )
    const poleTime = data[fastestDriver]?.at(-1)?.time ?? 0

    const ms = computeMiniSectors(data, 100)
    ingestCircuit(ms, circuit.id, rawSpeeds, fieldRaw, lapDistance, poleTime, derivedLayouts, fastestDriver)
  }

  return aggregateProfiles(rawSpeeds, fieldRaw, derivedLayouts, dataCircuits.map((c) => c.id))
}

function ingestCircuit(
  miniSectors:    ProcessedMiniSector[],
  circuitId:      string,
  rawSpeeds:      Record<string, Record<string, Record<SpeedClass, number[]>>>,
  fieldRaw:       Record<string, Record<SpeedClass, number[]>>,
  lapDistance:    number,
  poleTime:       number,
  derivedLayouts: Record<string, DerivedCircuitLayout>,
  poleDriverName?: string,
) {
  if (!fieldRaw[circuitId]) {
    fieldRaw[circuitId] = Object.fromEntries(SPEED_CLASSES.map((c) => [c, []])) as unknown as Record<SpeedClass, number[]>
  }

  const sectorDist = lapDistance / miniSectors.length
  const classCounts = Object.fromEntries(SPEED_CLASSES.map((c) => [c, 0])) as Record<SpeedClass, number>

  for (const ms of miniSectors) {
    if (ms.fastestTime <= 0) continue

    // Classify by pole driver's telemetry — gives consistent sector classification
    // across all 100 mini-sectors. Fall back to fastest-in-sector if pole driver
    // has no data for this sector (e.g. data ends before lap completes).
    let ref: MiniSectorStats | undefined
    if (poleDriverName && ms.driverStats[poleDriverName]) {
      ref = ms.driverStats[poleDriverName]
    } else {
      for (const s of Object.values(ms.driverStats)) {
        if (!ref || s.deltaVsFastest < ref.deltaVsFastest) ref = s
      }
    }
    if (!ref) continue

    const cls = classifyByApexSpeed(ref.minSpeed, ref.avgThrottle, ref.brakePercent)
    classCounts[cls]++

    for (const [driver, stats] of Object.entries(ms.driverStats)) {
      if (!rawSpeeds[driver])             rawSpeeds[driver] = {}
      if (!rawSpeeds[driver][circuitId])  rawSpeeds[driver][circuitId] = Object.fromEntries(SPEED_CLASSES.map((c) => [c, []])) as unknown as Record<SpeedClass, number[]>
      rawSpeeds[driver][circuitId][cls].push(stats.avgSpeed)
      fieldRaw[circuitId][cls].push(stats.avgSpeed)
    }
  }

  // Derived layout: actual per-class distances from telemetry
  derivedLayouts[circuitId] = {
    lapDistance,
    poleTime,
    classDistances: Object.fromEntries(
      SPEED_CLASSES.map((cls) => [cls, classCounts[cls] * sectorDist])
    ) as Record<SpeedClass, number>,
  }
}

function aggregateProfiles(
  rawSpeeds:       Record<string, Record<string, Record<SpeedClass, number[]>>>,
  fieldRaw:        Record<string, Record<SpeedClass, number[]>>,
  derivedLayouts:  Record<string, DerivedCircuitLayout>,
  trainingCircuitIds: string[],
): ProfileData {
  // Field average (grid-wide) per circuit per class — harmonic mean of sector speeds.
  // Harmonic mean is required here because we later compute t = dist × 3.6 / speed.
  // Using arithmetic mean would underestimate time (Jensen's inequality) when there
  // is high within-class speed variance (e.g. short vs long straights in the same class).
  const fieldAvgPerCircuit: Record<string, Record<SpeedClass, number>> = {}
  for (const [cid, byClass] of Object.entries(fieldRaw)) {
    fieldAvgPerCircuit[cid] = {} as Record<SpeedClass, number>
    for (const cls of SPEED_CLASSES) {
      const v = byClass[cls]
      fieldAvgPerCircuit[cid][cls] = v.length > 0
        ? v.length / v.reduce((a, b) => a + 1 / b, 0)  // harmonic mean
        : SPEED_CLASS_DEFAULTS[cls]
    }
  }

  const perCircuit: PerCircuitData = {}
  const flatAccum: Record<string, Record<SpeedClass, number[]>> = {}

  for (const [driver, byCircuit] of Object.entries(rawSpeeds)) {
    perCircuit[driver] = {}
    if (!flatAccum[driver]) flatAccum[driver] = Object.fromEntries(SPEED_CLASSES.map((c) => [c, []])) as unknown as Record<SpeedClass, number[]>

    for (const [cid, byClass] of Object.entries(byCircuit)) {
      perCircuit[driver][cid] = {} as Record<SpeedClass, SpeedClassStats>
      for (const cls of SPEED_CLASSES) {
        const vals = byClass[cls]
        if (vals.length > 0) {
          // Harmonic mean matches the field average basis so ratios are consistent
          const avg = vals.length / vals.reduce((a, b) => a + 1 / b, 0)
          perCircuit[driver][cid][cls] = { avgSpeed: avg, samples: vals.length }
          flatAccum[driver][cls].push(...vals)
        } else {
          perCircuit[driver][cid][cls] = { avgSpeed: 0, samples: 0 }
        }
      }
    }
  }

  const flat: DriverSpeedProfiles = {}
  for (const [driver, byClass] of Object.entries(flatAccum)) {
    flat[driver] = {} as Record<SpeedClass, SpeedClassStats>
    for (const cls of SPEED_CLASSES) {
      const vals = byClass[cls]
      flat[driver][cls] = vals.length > 0
        ? { avgSpeed: vals.reduce((a, b) => a + b, 0) / vals.length, samples: vals.length }
        : { avgSpeed: 0, samples: 0 }
    }
  }

  // Cross-circuit average field speed per class
  const crossCircuitFieldAvg = Object.fromEntries(
    SPEED_CLASSES.map((cls) => {
      const vals = trainingCircuitIds
        .map((cid) => fieldAvgPerCircuit[cid]?.[cls])
        .filter((v): v is number => v !== undefined && v > 0)
      return [cls, vals.length > 0 ? vals.length / vals.reduce((a, b) => a + 1 / b, 0) : SPEED_CLASS_DEFAULTS[cls]]
    })
  ) as Record<SpeedClass, number>

  return { flat, perCircuit, fieldAvgPerCircuit, crossCircuitFieldAvg, derivedLayouts, trainingCircuitIds }
}

// ── Circuit similarity ────────────────────────────────────────────────────────

function circuitSimilarity(
  targetFrac: number[],
  trainFrac:  number[],
): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < targetFrac.length; i++) {
    dot += targetFrac[i] * trainFrac[i]
    na  += targetFrac[i] * targetFrac[i]
    nb  += trainFrac[i]  * trainFrac[i]
  }
  if (na === 0 || nb === 0) return 0
  const cos = dot / (Math.sqrt(na) * Math.sqrt(nb))
  return cos * cos
}

function layoutFrac(classDistances: Record<SpeedClass, number>, lapDistance: number): number[] {
  return SPEED_CLASSES.map((cls) => (classDistances[cls] ?? 0) / lapDistance)
}

// ── Get best available layout for a circuit ───────────────────────────────────

// Returns derived (telemetry-based) layout if available, else falls back to manual.
// Converts DerivedCircuitLayout to a CircuitLayout-compatible structure for prediction.
export function getEffectiveLayout(circuitId: string, profileData: ProfileData | null): CircuitLayout | null {
  const derived = profileData?.derivedLayouts?.[circuitId]
  if (derived) {
    return {
      lapDistance:     derived.lapDistance,
      baselineSeconds: derived.poleTime,
      notes:           'Derived from qualifying telemetry',
      segments:        SPEED_CLASSES
        .filter((cls) => (derived.classDistances[cls] ?? 0) > 0)
        .map((cls)  => ({ speedClass: cls, distance: derived.classDistances[cls] })),
    }
  }
  return CIRCUIT_LAYOUTS[circuitId] ?? null
}

// ── Predict qualifying times ──────────────────────────────────────────────────

export function predictForCircuit(
  layout:      CircuitLayout,
  profileData: ProfileData,
  drivers:     string[],
): PredictedDriver[] {
  // Fractions for target circuit speed-class distribution (for similarity)
  const targetFrac = layoutFrac(
    Object.fromEntries(
      SPEED_CLASSES.map((cls) => [
        cls,
        layout.segments.filter((s) => s.speedClass === cls).reduce((a, s) => a + s.distance, 0),
      ])
    ) as Record<SpeedClass, number>,
    layout.lapDistance,
  )

  // Cosine-squared similarity for each training circuit vs target
  const simWeights: Record<string, number> = {}
  for (const cid of profileData.trainingCircuitIds) {
    const derived = profileData.derivedLayouts[cid]
    if (derived) {
      const trainFrac = layoutFrac(derived.classDistances, derived.lapDistance)
      simWeights[cid] = circuitSimilarity(targetFrac, trainFrac)
    } else {
      const tl = CIRCUIT_LAYOUTS[cid]
      if (tl) {
        const cdist = Object.fromEntries(SPEED_CLASSES.map((cls) => [
          cls,
          tl.segments.filter((s) => s.speedClass === cls).reduce((a, s) => a + s.distance, 0),
        ])) as Record<SpeedClass, number>
        simWeights[cid] = circuitSimilarity(targetFrac, layoutFrac(cdist, tl.lapDistance))
      }
    }
  }

  const raw = drivers.map((driver) => {
    const speedClassTimes = Object.fromEntries(SPEED_CLASSES.map((c) => [c, 0])) as Record<SpeedClass, number>
    let totalTime = 0

    for (const seg of layout.segments) {
      const speed   = resolveSpeed(driver, seg.speedClass, profileData, simWeights)
      const segTime = seg.distance * 3.6 / speed
      totalTime += segTime
      speedClassTimes[seg.speedClass] += segTime
    }

    return { driver, rawTime: totalTime, speedClassTimes }
  })

  raw.sort((a, b) => a.rawTime - b.rawTime)
  const fastestTime = raw[0].rawTime

  // No baseline scaling — predicted time is the direct physics result: t = d × 3.6 / v
  return raw.map((r) => ({
    driver:           r.driver,
    predictedSeconds: Math.round(r.rawTime * 1000) / 1000,
    gap:              Math.round((r.rawTime - fastestTime) * 1000) / 1000,
    speedClassTimes:  Object.fromEntries(
      SPEED_CLASSES.map((c) => [c, Math.round(r.speedClassTimes[c] * 1000) / 1000])
    ) as Record<SpeedClass, number>,
  }))
}

// How many neutral "average-driver" samples to mix in alongside the real data.
// With fewer relevant samples → ratio pulled toward 1.0 (field average).
const PRIOR_SAMPLES = 25

function resolveSpeed(
  driver:      string,
  cls:         SpeedClass,
  data:        ProfileData,
  simWeights:  Record<string, number>,
): number {
  // Similarity-weighted actual field average as the physical reference speed.
  // Calibrated from real telemetry — not hardcoded thresholds.
  let weightedBase  = 0
  let totalSimW     = 0
  let weightedRatio = 0
  let effectiveW    = 0

  for (const [cid, simW] of Object.entries(simWeights)) {
    if (simW <= 0) continue
    const fAvg = data.fieldAvgPerCircuit[cid]?.[cls] ?? 0
    const stat = data.perCircuit[driver]?.[cid]?.[cls]

    if (fAvg > 0) {
      weightedBase += fAvg * simW
      totalSimW    += simW
    }

    if (stat && stat.samples >= 2 && fAvg > 0) {
      const ratio = stat.avgSpeed / fAvg
      const w     = stat.samples * simW
      weightedRatio += ratio * w
      effectiveW    += w
    }
  }

  const baseSpeed = totalSimW > 0
    ? weightedBase / totalSimW
    : SPEED_CLASS_DEFAULTS[cls]

  let finalRatio: number
  if (effectiveW > 0) {
    const rawRatio = weightedRatio / effectiveW
    finalRatio = (effectiveW * rawRatio + PRIOR_SAMPLES * 1.0) / (effectiveW + PRIOR_SAMPLES)
  } else {
    finalRatio = extrapolateRatio(driver, cls, data, simWeights)
  }

  return baseSpeed * finalRatio
}

function extrapolateRatio(
  driver:     string,
  cls:        SpeedClass,
  data:       ProfileData,
  simWeights: Record<string, number>,
): number {
  const targetIdx = SPEED_CLASSES.indexOf(cls)
  for (let offset = 1; offset < SPEED_CLASSES.length; offset++) {
    for (const dir of [-1, 1]) {
      const idx = targetIdx + dir * offset
      if (idx < 0 || idx >= SPEED_CLASSES.length) continue
      const nCls = SPEED_CLASSES[idx]

      let wRatio = 0, eW = 0
      for (const [cid, simW] of Object.entries(simWeights)) {
        const stat = data.perCircuit[driver]?.[cid]?.[nCls]
        const fAvg = data.fieldAvgPerCircuit[cid]?.[nCls] ?? SPEED_CLASS_DEFAULTS[nCls]
        if (stat && stat.samples >= 2 && fAvg > 0 && simW > 0) {
          const ratio = stat.avgSpeed / fAvg
          const w = stat.samples * simW
          wRatio += ratio * w
          eW     += w
        }
      }

      if (eW > 0) {
        const rawRatio = wRatio / eW
        return (eW * rawRatio + PRIOR_SAMPLES * 1.0) / (eW + PRIOR_SAMPLES)
      }
    }
  }
  return 1.0
}
