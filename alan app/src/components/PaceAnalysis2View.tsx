import { useState, useEffect, useMemo } from 'react'
import { TEAM_COLORS, loadTrackData } from '../lib/paceData'
import type { TrackData } from '../lib/paceData'
import { PACE_MAPS } from '../lib/paceMaps'
import PaceTelemetryMap from './PaceTelemetryMap'
import { TrackSVG } from './PaceAnalysisView'
import {
  RACES2, loadDriverPredictions, loadTeamDeltas2, loadPolePredictions,
} from '../lib/paceData2'
import type { DriverPrediction, TeamDelta2, PolePrediction, Race2 } from '../lib/paceData2'

// ── Helpers ──────────────────────────────────────────────────────────────────

function Delta({ v, dim }: { v: number; dim?: boolean }) {
  if (!isFinite(v)) return <span style={{ color: '#445', fontFamily: 'monospace', fontSize: 11 }}>—</span>
  const gap = v
  const color = dim ? '#445'
    : gap <= 0.05 ? '#e8eaf0'
    : gap <= 1    ? '#f0c040'
    : gap <= 2.5  ? '#ff8800'
    :               '#cc3333'
  const s = gap <= 0 ? `-${Math.abs(gap).toFixed(2)}` : `+${gap.toFixed(2)}`
  return <span style={{ color, fontFamily: 'monospace', fontSize: 11 }}>{s}</span>
}

function posColor(i: number) {
  return i === 0 ? '#f0c040' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#556'
}

// ── Qualifying grid ───────────────────────────────────────────────────────────

function QualifyingGrid({ drivers, pole }: { drivers: DriverPrediction[]; pole: PolePrediction | null }) {
  return (
    <div className="pa2-section">
      <div className="pa2-section-title">Predicted Qualifying Order</div>
      {pole && (
        <div className="pa2-pole-info">
          Predicted pole <span style={{ color: '#f0c040', fontFamily: 'monospace' }}>{pole.predictedTime}</span>
          {pole.lowTime && pole.highTime && <span className="pa2-pole-range"> · range {pole.lowTime} – {pole.highTime}</span>}
        </div>
      )}

      <div className="pa2-grid-head">
        <span className="pa2-col-pos">P</span>
        <span className="pa2-col-num">#</span>
        <span className="pa2-col-driver">DRV</span>
        <span className="pa2-col-team">Team</span>
        <span className="pa2-col-time">Time</span>
        <span className="pa2-col-gap">Gap</span>
        <span className="pa2-col-delta">vs MER%</span>
      </div>

      {drivers.map((d, i) => {
        const col = TEAM_COLORS[d.team] ?? '#778'
        return (
          <div key={d.driver} className="pa2-grid-row">
            <span className="pa2-col-pos" style={{ color: posColor(i) }}>{i + 1}</span>
            <span className="pa2-col-num" style={{ color: '#556' }}>{d.driverNumber}</span>
            <span className="pa2-col-driver" style={{ color: col, fontWeight: 700 }}>{d.driver}</span>
            <span className="pa2-col-team">
              <span className="pa2-team-dot" style={{ background: col }} />
              {d.team}
            </span>
            <span className="pa2-col-time" style={{ fontFamily: 'monospace', color: '#dde' }}>
              {d.predictedTime}
            </span>
            <span className="pa2-col-gap" style={{ fontFamily: 'monospace', color: i === 0 ? '#f0c040' : '#778' }}>
              {i === 0 ? 'POLE' : `+${d.gap.toFixed(3)}`}
            </span>
            <span className="pa2-col-delta"><Delta v={d.teamDelta} /></span>
          </div>
        )
      })}
    </div>
  )
}

// ── Team pace table ───────────────────────────────────────────────────────────

function TeamPaceTable({ deltas }: { deltas: TeamDelta2[] }) {
  const sorted = [...deltas].sort((a, b) => a.overall - b.overall)
  const maxAbs = Math.max(...sorted.map(t => Math.abs(t.overall)), 0.1)

  return (
    <div className="pa2-section">
      <div className="pa2-section-title">Team Pace vs Mercedes</div>

      <div className="pa2-pace-head">
        <span style={{ width: 24 }}>P</span>
        <span style={{ flex: 1 }}>Team</span>
        <span style={{ width: 56, textAlign: 'right' }}>Overall</span>
        <span style={{ width: 46, textAlign: 'right', color: '#e74c3c' }}>Slow</span>
        <span style={{ width: 46, textAlign: 'right', color: '#27ae60' }}>Fast</span>
        <span style={{ width: 46, textAlign: 'right', color: '#8899aa' }}>Str</span>
        <span style={{ width: 80 }} />
      </div>

      {sorted.map((t, i) => {
        const col = TEAM_COLORS[t.team] ?? '#778'
        const barW = (Math.abs(t.overall) / maxAbs) * 100
        return (
          <div key={t.team} className="pa2-pace-row">
            <span style={{ width: 24, color: posColor(i), fontWeight: 700, fontSize: 12 }}>{i + 1}</span>
            <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ccd' }}>
              <span className="pa2-team-dot" style={{ background: col }} />
              {t.team}
            </span>
            <span style={{ width: 56, textAlign: 'right' }}><Delta v={t.overall} /></span>
            <span style={{ width: 46, textAlign: 'right' }}><Delta v={t.slow} dim /></span>
            <span style={{ width: 46, textAlign: 'right' }}><Delta v={t.fast} dim /></span>
            <span style={{ width: 46, textAlign: 'right' }}><Delta v={t.straight} dim /></span>
            <span style={{ width: 80, position: 'relative', height: 6, background: '#111820', borderRadius: 3, overflow: 'hidden', alignSelf: 'center' }}>
              <span style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${barW}%`, background: col + 'aa', borderRadius: 3 }} />
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Maps section ──────────────────────────────────────────────────────────────

type MapMode = 'telemetry' | 'three_class'

function MapsSection({ race }: { race: Race2 }) {
  const [mode, setMode] = useState<MapMode>('three_class')
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const [telemetryData, setTelemetryData] = useState<{ prefix: string; data: TrackData } | null>(null)
  const map = PACE_MAPS.find(map => map.code === race.mapCode)!

  useEffect(() => {
    let cancelled = false
    setFailedUrl(null)
    loadTrackData(map.trackPrefix)
      .then(data => { if (!cancelled) setTelemetryData({ prefix: map.trackPrefix, data }) })
      .catch(() => { if (!cancelled) setFailedUrl(map.telemetry) })
    return () => { cancelled = true }
  }, [map.trackPrefix, map.telemetry])

  return (
    <div className="pa2-section">
      <div className="pa2-section-title">Circuit Maps</div>
      <div className="pa2-map-tabs">
        {(['three_class', 'telemetry'] as MapMode[]).map(m => (
          <button
            key={m}
            className={`pa2-map-tab ${mode === m ? 'active' : ''}`}
            onClick={() => setMode(m)}
          >
            {m === 'three_class' ? '3-Class Map' : 'Telemetry Map'}
          </button>
        ))}
      </div>
      <div className="pace-map-source">{map.source}</div>
      <div className="pa2-map-wrap">
        {failedUrl === map.telemetry ? <div role="status">Map unavailable</div>
          : telemetryData?.prefix !== map.trackPrefix ? <div role="status">Loading…</div>
          : mode === 'telemetry' ? (
            <PaceTelemetryMap imageUrl={map.telemetry} label={map.source} speedScale={telemetryData.data.speedScale} onError={() => setFailedUrl(map.telemetry)} />
          ) : <TrackSVG trackData={telemetryData.data} />}
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function PaceAnalysis2View() {
  const [selectedRace, setSelectedRace] = useState<Race2>(RACES2[0])
  const [drivers,  setDrivers]  = useState<DriverPrediction[] | null>(null)
  const [deltas,   setDeltas]   = useState<TeamDelta2[] | null>(null)
  const [poles,    setPoles]    = useState<PolePrediction[] | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    Promise.all([loadDriverPredictions(), loadTeamDeltas2(), loadPolePredictions()])
      .then(([d, t, p]) => { setDrivers(d); setDeltas(t); setPoles(p) })
      .catch(e => setError(String(e)))
  }, [])

  const raceDrivers = useMemo(
    () => (drivers ?? []).filter(d => d.race === selectedRace.fullName).sort((a, b) => a.position - b.position),
    [drivers, selectedRace]
  )
  const raceDeltas = useMemo(
    () => (deltas ?? []).filter(d => d.race === selectedRace.fullName),
    [deltas, selectedRace]
  )
  const racePole = useMemo(
    () => (poles ?? []).find(p => p.race === selectedRace.fullName) ?? null,
    [poles, selectedRace]
  )

  if (error) return <div className="pace-error">Failed to load Pace Analysis 2: {error}</div>
  if (!drivers) return <div className="pace-loading">Loading predictions…</div>

  return (
    <div className="pa2-view">
      <div className="pa2-header">
        <div className="pa2-title">
          <span className="pa2-title-label">Predictions</span>
          <span className="pa2-title-badge">2026 saved forecasts</span>
        </div>
        <div className="pa2-race-pills">
          {RACES2.map(r => (
            <button
              key={r.label}
              className={`pa2-race-pill ${selectedRace.label === r.label ? 'active' : ''}`}
              onClick={() => setSelectedRace(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pa2-body">
        <div className="pa2-col-left">
          <QualifyingGrid drivers={raceDrivers} pole={racePole} />
        </div>
        <div className="pa2-col-right">
          <TeamPaceTable deltas={raceDeltas} />
          <MapsSection race={selectedRace} />
        </div>
      </div>
    </div>
  )
}
