import type { CircuitConfig } from '../types'
import type { ProfileData } from '../lib/lapPredictor'
import type { CircuitLayout } from '../lib/circuitLayouts'
import type { SpeedClass } from '../lib/speedClasses'
import { predictForCircuit, getEffectiveLayout } from '../lib/lapPredictor'
import { SPEED_CLASSES, SPEED_CLASS_LABELS, SPEED_CLASS_COLORS, SPEED_CLASS_DEFAULTS } from '../lib/speedClasses'
import CIRCUIT_LAYOUTS from '../lib/circuitLayouts'
import { CIRCUITS, FULL_GRID } from '../lib/dataIndex'
import { driverColor } from '../lib/teamColors'

interface Props {
  circuit: CircuitConfig
  driverProfiles: ProfileData | null
  profilesLoading: boolean
}

function fmt1(n: number) { return n.toFixed(1) }
function fmt3(n: number) { return n.toFixed(3) }

function fmtTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toFixed(3).padStart(6, '0')}`
}

// Heat-map colour for a cell: green = fast (high speed or low time), red = slow
function heatColor(value: number, min: number, max: number, invert = false): string {
  const span = max - min || 1
  let t = (value - min) / span
  if (invert) t = 1 - t
  t = Math.max(0, Math.min(1, t))
  const r = Math.round(200 * t + 30 * (1 - t))
  const g = Math.round(180 * (1 - t) + 30 * t)
  return `rgba(${r},${g},30,0.28)`
}

export default function DataLabPanel({ circuit, driverProfiles, profilesLoading }: Props) {
  const layout: CircuitLayout | null = getEffectiveLayout(circuit.id, driverProfiles) ?? CIRCUIT_LAYOUTS[circuit.id] ?? null
  const flatProfiles = driverProfiles?.flat ?? null
  const predictions = layout && driverProfiles
    ? predictForCircuit(layout, driverProfiles, FULL_GRID)
    : null

  // Actual measured field averages (from telemetry) — used for driver ratio display
  const fieldAvgFlat: Record<string, number> = {}
  if (driverProfiles) {
    for (const cls of SPEED_CLASSES) {
      fieldAvgFlat[cls] = driverProfiles.crossCircuitFieldAvg[cls] ?? SPEED_CLASS_DEFAULTS[cls]
    }
  }

  // Per speed class: min/max across all drivers (for heat-map scaling)
  const colRanges = SPEED_CLASSES.map((cls) => {
    if (!flatProfiles) return { min: 0, max: 1 }
    const vals = Object.values(flatProfiles)
      .map((dp) => dp[cls]?.avgSpeed ?? 0)
      .filter((v) => v > 0)
    return { min: Math.min(...vals), max: Math.max(...vals) }
  })

  return (
    <div className="data-lab">

      {/* ── Section 1: Driver Speed Profiles ─────────────────────────────── */}
      <div className="lab-section">
        <div className="lab-section-title">
          Driver Speed Profiles — avg sector speed (km/h) and field-relative ratio per class
          <span className="lab-dim" style={{ marginLeft: 8 }}>
            Green = above field avg · Red = below · Ratio removes car-package advantage
          </span>
        </div>

        {profilesLoading && <div className="lab-loading">Building profiles from telemetry…</div>}

        {!profilesLoading && flatProfiles && driverProfiles && (
          <div className="lab-scroll-x">
            <table className="lab-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Driver</th>
                  {SPEED_CLASSES.map((cls) => (
                    <th key={cls} style={{ color: SPEED_CLASS_COLORS[cls] }}>
                      {cls.replace('_', ' ').toUpperCase()}
                    </th>
                  ))}
                  <th>Samples</th>
                </tr>
              </thead>
              <tbody>
                {FULL_GRID.map((driver) => {
                  const dp = flatProfiles[driver]
                  const totalSamples = dp
                    ? SPEED_CLASSES.reduce((s, c) => s + (dp[c]?.samples ?? 0), 0)
                    : 0

                  return (
                    <tr key={driver}>
                      <td style={{ color: driverColor(driver), fontWeight: 700 }}>{driver}</td>
                      {SPEED_CLASSES.map((cls, ci) => {
                        const stat = dp?.[cls]
                        const speed = stat?.samples >= 2 ? stat.avgSpeed : 0
                        const fieldAvg = fieldAvgFlat[cls] || SPEED_CLASS_DEFAULTS[cls]
                        const ratio = speed > 0 ? speed / fieldAvg : 1
                        const ratioPct = (ratio - 1) * 100
                        const bg = speed > 0
                          ? heatColor(speed, colRanges[ci].min, colRanges[ci].max)
                          : 'transparent'
                        return (
                          <td key={cls} style={{ background: bg }}>
                            {speed > 0
                              ? (
                                <span>
                                  {fmt1(speed)}
                                  <span className="lab-dim"> ·</span>
                                  <span style={{ color: ratioPct >= 0 ? '#00e676' : '#ff5252', fontSize: 9 }}>
                                    {ratioPct >= 0 ? '+' : ''}{ratioPct.toFixed(1)}%
                                  </span>
                                  <span className="lab-dim"> ({stat!.samples})</span>
                                </span>
                              )
                              : <span className="lab-dim">—</span>
                            }
                          </td>
                        )
                      })}
                      <td className="lab-dim">{totalSamples}</td>
                    </tr>
                  )
                })}
                {/* Field average row */}
                <tr className="lab-defaults-row">
                  <td style={{ color: '#778' }}>Field avg (measured)</td>
                  {SPEED_CLASSES.map((cls) => (
                    <td key={cls} style={{ color: '#778' }}>{fmt1(fieldAvgFlat[cls] ?? SPEED_CLASS_DEFAULTS[cls])}</td>
                  ))}
                  <td style={{ color: '#334' }}>—</td>
                </tr>
                <tr className="lab-defaults-row">
                  <td style={{ color: '#445' }}>Defaults (thresholds)</td>
                  {SPEED_CLASSES.map((cls) => (
                    <td key={cls} style={{ color: '#445' }}>{SPEED_CLASS_DEFAULTS[cls]}</td>
                  ))}
                  <td style={{ color: '#334' }}>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 2: All Circuit Segment Breakdown ─────────────────────── */}
      <div className="lab-section">
        <div className="lab-section-title">Circuit Segment Analysis — metres per speed class</div>
        <div className="lab-scroll-x">
          <table className="lab-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Circuit</th>
                <th>Lap (m)</th>
                <th>Pole Time</th>
                {SPEED_CLASSES.map((cls) => (
                  <th key={cls} style={{ color: SPEED_CLASS_COLORS[cls] }}>
                    {cls.replace('_', ' ').toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CIRCUITS.map((c) => {
                // Prefer telemetry-derived layout for training circuits
                const derived = driverProfiles?.derivedLayouts?.[c.id]
                const lo = CIRCUIT_LAYOUTS[c.id]
                if (!lo && !derived) return null
                const lapDist = derived?.lapDistance ?? lo!.lapDistance
                const poleT = derived?.poleTime ?? lo?.baselineSeconds ?? 0
                const distMap = Object.fromEntries(SPEED_CLASSES.map((cls) => [cls, 0])) as Record<string, number>
                if (derived) {
                  for (const cls of SPEED_CLASSES) distMap[cls] = derived.classDistances[cls] ?? 0
                } else {
                  for (const seg of lo!.segments) distMap[seg.speedClass] += seg.distance
                }
                const isSelected = c.id === circuit.id
                return (
                  <tr key={c.id} style={{ opacity: isSelected ? 1 : 0.7, fontWeight: isSelected ? 700 : 400 }}>
                    <td style={{ color: isSelected ? '#ddd' : '#778' }}>
                      {c.flag} {c.name}
                      {derived && <span className="lab-dim" style={{ fontSize: 9, marginLeft: 4 }}>telemetry</span>}
                    </td>
                    <td>{Math.round(lapDist).toLocaleString()}</td>
                    <td style={{ color: poleT > 0 ? '#e10600' : '#445' }}>{poleT > 0 ? fmtTime(poleT) : '—'}</td>
                    {SPEED_CLASSES.map((cls) => {
                      const d = distMap[cls]
                      const pct = (d / lapDist * 100).toFixed(0)
                      return (
                        <td key={cls}>
                          {d > 0
                            ? <span>{Math.round(d).toLocaleString()}m <span className="lab-dim">{pct}%</span></span>
                            : <span className="lab-dim">—</span>
                          }
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Circuit Similarity & Training Data ───────────────── */}
      {driverProfiles && layout && (
        <div className="lab-section">
          <div className="lab-section-title">
            Circuit Similarity — how training data maps to {circuit.flag} {circuit.name}
            <span className="lab-dim" style={{ marginLeft: 8 }}>
              Cosine² of speed-class distributions · higher = more relevant
            </span>
          </div>
          <div className="lab-scroll-x">
            <table className="lab-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Training Circuit</th>
                  <th>Similarity</th>
                  <th>Weight Bar</th>
                  {SPEED_CLASSES.map((cls) => (
                    <th key={cls} style={{ color: SPEED_CLASS_COLORS[cls], fontSize: 10 }}>
                      {cls.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const targetFrac = SPEED_CLASSES.map((cls) => {
                    const d = layout.segments.filter((s) => s.speedClass === cls).reduce((a, s) => a + s.distance, 0)
                    return d / layout.lapDistance
                  })
                  const rows = driverProfiles.trainingCircuitIds.map((cid) => {
                    // Use derived layout (telemetry-based) if available, else fall back to manual
                    const derived = driverProfiles.derivedLayouts[cid]
                    const lapDist = derived?.lapDistance ?? CIRCUIT_LAYOUTS[cid]?.lapDistance ?? 1
                    const trainFrac = SPEED_CLASSES.map((cls) => {
                      const d = derived
                        ? (derived.classDistances[cls] ?? 0)
                        : (CIRCUIT_LAYOUTS[cid]?.segments.filter((s) => s.speedClass === cls).reduce((a, s) => a + s.distance, 0) ?? 0)
                      return d / lapDist
                    })
                    let dot = 0, na = 0, nb = 0
                    for (let i = 0; i < targetFrac.length; i++) {
                      dot += targetFrac[i] * trainFrac[i]
                      na += targetFrac[i] * targetFrac[i]
                      nb += trainFrac[i] * trainFrac[i]
                    }
                    const sim = na === 0 || nb === 0 ? 0 : (dot / (Math.sqrt(na) * Math.sqrt(nb))) ** 2
                    return { cid, sim, frac: trainFrac, derived, lapDist }
                  }).filter(Boolean).sort((a, b) => b!.sim - a!.sim)
                  const maxSim = rows[0]?.sim ?? 1
                  return rows.map((r) => {
                    if (!r) return null
                    const circ = CIRCUITS.find((c) => c.id === r.cid)
                    return (
                      <tr key={r.cid}>
                        <td style={{ color: '#ddd' }}>
                          {circ?.flag} {circ?.name ?? r.cid}
                          {r.derived && <span className="lab-dim" style={{ marginLeft: 4 }}>({fmtTime(r.derived.poleTime)} actual pole)</span>}
                        </td>
                        <td style={{ fontFamily: 'monospace', color: r.sim > 0.85 ? '#00e676' : r.sim > 0.65 ? '#ffd600' : '#ff6d00' }}>
                          {(r.sim * 100).toFixed(1)}%
                        </td>
                        <td>
                          <div style={{ width: 120, height: 8, background: '#223', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${(r.sim / maxSim) * 100}%`, height: '100%', background: r.sim > 0.85 ? '#00e676' : r.sim > 0.65 ? '#ffd600' : '#ff6d00' }} />
                          </div>
                        </td>
                        {SPEED_CLASSES.map((cls, i) => (
                          <td key={cls} style={{ fontSize: 11, color: '#889' }}>
                            {(r.frac[i] * 100).toFixed(0)}%
                          </td>
                        ))}
                      </tr>
                    )
                  })
                })()}
                {/* Target row */}
                <tr style={{ borderTop: '1px solid #334' }}>
                  <td style={{ color: '#e10600', fontWeight: 700 }}>{circuit.flag} {circuit.name} (target)</td>
                  <td style={{ color: '#556' }}>—</td>
                  <td />
                  {SPEED_CLASSES.map((cls) => {
                    const d = layout.segments.filter((s) => s.speedClass === cls).reduce((a, s) => a + s.distance, 0)
                    return (
                      <td key={cls} style={{ fontSize: 11, color: SPEED_CLASS_COLORS[cls], fontWeight: 700 }}>
                        {d > 0 ? `${(d / layout.lapDistance * 100).toFixed(0)}%` : '—'}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Section 4: Predicted Qualifying Detail ───────────────────────── */}
      <div className="lab-section">
        <div className="lab-section-title">
          Predicted Qualifying Results — {circuit.flag} {circuit.name}
          {driverProfiles?.derivedLayouts?.[circuit.id]
            ? <span className="lab-dim"> · actual pole {fmtTime(driverProfiles.derivedLayouts[circuit.id].poleTime)} (telemetry)</span>
            : layout && layout.baselineSeconds > 0
              ? <span className="lab-dim"> · est. baseline {fmtTime(layout.baselineSeconds)}</span>
              : null
          }
        </div>

        {!layout && <div className="lab-loading">No circuit layout defined for {circuit.name}</div>}
        {profilesLoading && <div className="lab-loading">Building profiles…</div>}

        {!profilesLoading && predictions && layout && (
          <>
            {/* Speed class legend */}
            <div className="lab-cls-legend">
              {SPEED_CLASSES.map((cls) => {
                const distMap = layout.segments.reduce((acc, seg) => {
                  acc[seg.speedClass] = (acc[seg.speedClass] ?? 0) + seg.distance
                  return acc
                }, {} as Record<SpeedClass, number>)
                const d = distMap[cls] ?? 0
                if (d === 0) return null
                return (
                  <span key={cls} className="lab-cls-chip" style={{ borderColor: SPEED_CLASS_COLORS[cls], color: SPEED_CLASS_COLORS[cls] }}>
                    {SPEED_CLASS_LABELS[cls]}: {d.toLocaleString()}m ({(d / layout.lapDistance * 100).toFixed(0)}%)
                  </span>
                )
              })}
            </div>

            <div className="lab-scroll-x">
              <table className="lab-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', width: 28 }}>P</th>
                    <th style={{ textAlign: 'left' }}>Driver</th>
                    <th>Predicted Time</th>
                    <th>Gap</th>
                    {SPEED_CLASSES.filter((cls) => {
                      const d = layout.segments.filter((s) => s.speedClass === cls).reduce((a, s) => a + s.distance, 0)
                      return d > 0
                    }).map((cls) => (
                      <th key={cls} style={{ color: SPEED_CLASS_COLORS[cls] }}>
                        {cls.replace(/_/g, ' ')} (s)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((row, i) => {
                    const activeClasses = SPEED_CLASSES.filter((cls) =>
                      layout.segments.some((s) => s.speedClass === cls)
                    )
                    const maxGap = predictions[predictions.length - 1].gap || 1
                    return (
                      <tr key={row.driver}>
                        <td style={{
                          color: i === 0 ? '#f0c040' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#445',
                          fontWeight: 700,
                        }}>
                          {i + 1}
                        </td>
                        <td style={{ color: driverColor(row.driver), fontWeight: 700 }}>{row.driver}</td>
                        <td style={{ color: '#ccd', fontFamily: 'monospace' }}>{fmtTime(row.predictedSeconds)}</td>
                        <td style={{ color: row.gap < 0.001 ? '#f0c040' : '#778', fontFamily: 'monospace' }}>
                          {row.gap < 0.001 ? 'POLE' : `+${fmt3(row.gap)}`}
                        </td>
                        {activeClasses.map((cls) => {
                          const t = row.speedClassTimes[cls] ?? 0
                          const refTime = predictions[0].speedClassTimes[cls] ?? 0
                          const diff = t - refTime
                          const bg = diff < 0.001
                            ? 'rgba(0,230,118,0.15)'
                            : heatColor(row.gap, 0, maxGap, true)
                          return (
                            <td key={cls} style={{ fontFamily: 'monospace', background: bg }}>
                              {fmt3(t)}
                              {diff >= 0.001 && (
                                <span className="lab-dim"> +{fmt3(diff)}</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
