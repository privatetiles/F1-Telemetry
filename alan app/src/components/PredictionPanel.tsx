import { useState } from 'react'
import type { CircuitConfig } from '../types'
import type { ProfileData, PredictedDriver } from '../lib/lapPredictor'
import type { CircuitLayout } from '../lib/circuitLayouts'
import { predictForCircuit, getEffectiveLayout } from '../lib/lapPredictor'
import { FULL_GRID } from '../lib/dataIndex'
import { driverColor } from '../lib/teamColors'
import { SPEED_CLASSES, SPEED_CLASS_LABELS, SPEED_CLASS_COLORS } from '../lib/speedClasses'

function fmtTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toFixed(3).padStart(6, '0')}`
}

interface Props {
  circuit: CircuitConfig
  circuitLayout: CircuitLayout
  driverProfiles: ProfileData | null
  profilesLoading: boolean
}

export default function PredictionPanel({ circuit, circuitLayout: propLayout, driverProfiles, profilesLoading }: Props) {
  const [showMethod, setShowMethod] = useState(false)

  // Use telemetry-derived layout for training circuits (more accurate than manual layout)
  const circuitLayout = getEffectiveLayout(circuit.id, driverProfiles) ?? propLayout

  const predictions: PredictedDriver[] | null = driverProfiles
    ? predictForCircuit(circuitLayout, driverProfiles, FULL_GRID)
    : null

  // Pre-compute which speed classes are present in this circuit
  const activeClasses = SPEED_CLASSES.filter((cls) =>
    circuitLayout.segments.some((s) => s.speedClass === cls)
  )

  // Total distance per speed class for the fingerprint bar
  const classDist = Object.fromEntries(
    SPEED_CLASSES.map((cls) => [
      cls,
      circuitLayout.segments
        .filter((s) => s.speedClass === cls)
        .reduce((a, s) => a + s.distance, 0),
    ])
  ) as Record<string, number>

  return (
    <div className="prediction-panel">
      <div className="pred-header">
        <div className="pred-title">
          <span className="pred-flag">{circuit.flag}</span>
          <span className="pred-name">{circuit.name}</span>
          <span className="pred-badge">Predicted Qualifying</span>
        </div>
        <button className="pred-method-btn" onClick={() => setShowMethod((v) => !v)}>
          {showMethod ? 'Hide' : 'How this works'}
        </button>
      </div>

      {showMethod && (
        <div className="pred-methodology">
          <h4>Methodology</h4>
          <ol>
            <li>Each qualifying lap is split into 100 mini-sectors (~50 m each).
              Each sector is classified by the fastest driver's <em>apex speed</em> (minimum speed
              through the sector) into one of six speed classes: Hairpin, Slow, Medium, Fast,
              Ultra-Fast, or Straight.</li>
            <li>For every driver, we record their <em>average sector speed</em> (km/h) — covering
              the full braking-apex-exit package — in each speed class across all five circuits
              with real data. These are averaged into a speed profile per driver per class.</li>
            <li>Each upcoming circuit is defined by its actual lap distance split into speed-class
              segments. A chicane of two 90° corners contributes twice the distance to the
              slow-corner pool; a 500 m straight contributes 500 m to the straight pool.</li>
            <li>Predicted time = <code>Σ (segmentDistance × 3.6 / driverAvgSpeed)</code> summed
              over all speed classes. Results are normalised so the fastest predicted driver
              exactly equals the baseline pole time.</li>
            <li>If a driver has no data for a speed class (e.g. no ultra-fast equivalent of
              Eau Rouge in the training data), the speed is extrapolated by scaling from the
              nearest measured class using the ratio of reference speeds between classes.</li>
          </ol>
          <p className="pred-caveat">
            Baseline pole times are estimated from 2024–2025 records adjusted for 2026 regulations.
            Circuit segment distances are physically derived from track maps and GPS data.
          </p>

          {/* Speed class key */}
          <div className="pred-seg-key">
            {activeClasses.map((cls) => (
              <span key={cls} className="pred-seg-chip" style={{ background: SPEED_CLASS_COLORS[cls] }}>
                {SPEED_CLASS_LABELS[cls]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Circuit speed-class fingerprint bar */}
      <div className="pred-fingerprint">
        <span className="pred-fp-label">Track profile — {circuitLayout.lapDistance.toLocaleString()} m lap</span>
        <div className="pred-fp-bar">
          {activeClasses.map((cls) => {
            const pct = classDist[cls] / circuitLayout.lapDistance * 100
            return (
              <div
                key={cls}
                className="pred-fp-seg"
                style={{ width: `${pct}%`, background: SPEED_CLASS_COLORS[cls] }}
                title={`${SPEED_CLASS_LABELS[cls]}: ${classDist[cls].toLocaleString()} m (${pct.toFixed(0)}%)`}
              />
            )
          })}
        </div>
        {driverProfiles?.derivedLayouts?.[circuit.id] && (
          <span className="pred-fp-notes" style={{ color: '#e10600' }}>
            Actual 2026 pole: {fmtTime(driverProfiles.derivedLayouts[circuit.id].poleTime)} (from qualifying telemetry)
          </span>
        )}
        {!driverProfiles?.derivedLayouts?.[circuit.id] && (
          <span className="pred-fp-notes">{circuitLayout.notes}</span>
        )}
      </div>

      {/* Qualifying prediction table */}
      {profilesLoading && (
        <div className="pred-loading">Analysing driver speed profiles…</div>
      )}

      {!profilesLoading && predictions && (
        <div className="pred-table">
          <div className="pred-table-head">
            <span className="pred-col-pos">P</span>
            <span className="pred-col-driver">Driver</span>
            <span className="pred-col-time">Predicted Time</span>
            <span className="pred-col-gap">Gap</span>
            <span className="pred-col-bar">Speed-class time split</span>
          </div>
          {predictions.map((row, i) => {
            const maxTime = Math.max(...activeClasses.map((cls) => row.speedClassTimes[cls] ?? 0))
            return (
              <div key={row.driver} className="pred-row" style={{ opacity: i < 3 ? 1 : 0.85 }}>
                <span className="pred-col-pos" style={{
                  color: i === 0 ? '#f0c040' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#445',
                }}>
                  {i + 1}
                </span>
                <span className="pred-col-driver" style={{ color: driverColor(row.driver) }}>
                  {row.driver}
                </span>
                <span className="pred-col-time">{fmtTime(row.predictedSeconds)}</span>
                <span className="pred-col-gap" style={{ color: row.gap < 0.001 ? '#f0c040' : '#667' }}>
                  {row.gap < 0.001 ? 'POLE' : `+${row.gap.toFixed(3)}`}
                </span>
                {/* Stacked bar: width = proportion of that class's time contribution vs all classes */}
                <div className="pred-col-bar">
                  {activeClasses.map((cls) => {
                    const t = row.speedClassTimes[cls] ?? 0
                    const pct = maxTime > 0 ? (t / row.predictedSeconds) * 100 : 0
                    return (
                      <div
                        key={cls}
                        className="pred-contrib-seg"
                        style={{ width: `${pct}%`, background: SPEED_CLASS_COLORS[cls], opacity: 0.85 }}
                        title={`${SPEED_CLASS_LABELS[cls]}: ${t.toFixed(3)}s`}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
