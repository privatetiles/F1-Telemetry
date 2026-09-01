import { useEffect, useState, useMemo } from 'react'
import type { CircuitConfig } from '../types'
import { loadTrackData, loadCircuitPrediction, CIRCUIT_TRACK_PREFIX, TEAM_COLORS } from '../lib/paceData'
import type { TrackData, CircuitPrediction, PredictionEntry } from '../lib/paceData'

const SVG_W = 900
const SVG_H = 600
const PAD   = 60

const TRACK_COLOR: Record<string, string> = {
  'Slow corners': '#e74c3c',
  'Fast corners': '#27ae60',
  'Straights':    '#8899aa',
}

// ── 3-class colored SVG ──────────────────────────────────────────────────────

function ColoredTrack({ trackData }: { trackData: TrackData }) {
  const transform = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const run of trackData.segments) {
      for (const p of run.points) {
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y
      }
    }
    const dX = maxX - minX || 1
    const dY = maxY - minY || 1
    const scale = Math.min((SVG_W - 2 * PAD) / dX, (SVG_H - 2 * PAD) / dY)
    const offX = (SVG_W - dX * scale) / 2 - minX * scale
    const offY = (SVG_H - dY * scale) / 2 - minY * scale
    return (x: number, y: number) => ({
      sx: x * scale + offX,
      sy: SVG_H - (y * scale + offY),
    })
  }, [trackData])

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="static-track-svg" style={{ width: '100%', height: '100%' }} shapeRendering="geometricPrecision">
      {(['Straights', 'Fast corners', 'Slow corners'] as const).flatMap(cat =>
        trackData.segments
          .map((run, i) => ({ run, i }))
          .filter(({ run }) => run.category === cat)
          .map(({ run, i }) => {
            const color = TRACK_COLOR[run.category] ?? '#667'
            const pts = run.points.map(p => {
              const { sx, sy } = transform(p.x, p.y)
              return { x: sx, y: sy }
            })
            return (
              <path
                key={i}
                d={catmullRomPath(pts, false)}
                fill="none"
                stroke={color}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          })
      )}
    </svg>
  )
}

// ── Plain outline fallback ───────────────────────────────────────────────────

interface TrackPoint { x: number; y: number; r: number }
interface TrackOutline { circuit: string; points: TrackPoint[]; error?: string }

function catmullRomPath(pts: { x: number; y: number }[], closed = false): string {
  if (pts.length < 2) return ''
  const n = pts.length
  const ps: { x: number; y: number }[] = closed
    ? [pts[n - 1], ...pts, pts[0], pts[1]]
    : [{ x: 2 * pts[0].x - pts[1].x, y: 2 * pts[0].y - pts[1].y },
       ...pts,
       { x: 2 * pts[n - 1].x - pts[n - 2].x, y: 2 * pts[n - 1].y - pts[n - 2].y }]
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < ps.length - 2; i++) {
    const [p0, p1, p2, p3] = [ps[i - 1], ps[i], ps[i + 1], ps[i + 2]]
    d += ` C ${(p1.x + (p2.x - p0.x) / 6).toFixed(1)},${(p1.y + (p2.y - p0.y) / 6).toFixed(1)}`
       + ` ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)},${(p2.y - (p3.y - p1.y) / 6).toFixed(1)}`
       + ` ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  if (closed) d += ' Z'
  return d
}

function buildPath(points: TrackPoint[]): string {
  if (points.length === 0) return ''
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const trackW = maxX - minX || 1
  const trackH = maxY - minY || 1
  const scale = Math.min((SVG_W - PAD * 2) / trackW, (SVG_H - PAD * 2) / trackH)
  const ox = PAD + ((SVG_W - PAD * 2) - trackW * scale) / 2
  const oy = PAD + ((SVG_H - PAD * 2) - trackH * scale) / 2
  const mapped = points.map(p => ({
    x: ox + (p.x - minX) * scale,
    y: oy + (maxY - p.y) * scale,
  }))
  return catmullRomPath(mapped, true)
}

function OutlineTrack({ outline }: { outline: TrackOutline }) {
  const path = buildPath(outline.points)
  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="static-track-svg" style={{ width: '100%', height: '100%' }} shapeRendering="geometricPrecision">
      <path d={path} fill="none" stroke="#ffffff18" strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" />
      <path d={path} fill="none" stroke="#e10600" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      <path d={path} fill="none" stroke="#ff6b6b" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" strokeOpacity={0.6} />
    </svg>
  )
}

// ── Prediction delta cell ─────────────────────────────────────────────────────

function Delta({ v }: { v: number }) {
  // v is speed % delta (negative = slower than Mercedes)
  // Display as gap: positive = slower (standard F1 convention)
  const gap = -v
  const color = gap <= 0.1 ? '#e8eaf0' : gap <= 1 ? '#f0c040' : gap <= 2.5 ? '#ff8800' : '#cc3333'
  const s = gap <= 0 ? `-${Math.abs(gap).toFixed(2)}` : `+${gap.toFixed(2)}`
  return <span style={{ color, fontFamily: 'monospace', fontSize: 11 }}>{s}</span>
}

// ── Prediction rankings panel ────────────────────────────────────────────────

function PredictionPanel({ prediction }: { prediction: CircuitPrediction }) {
  const maxAbs = Math.max(...prediction.teams.map(t => Math.abs(t.overall)), 0.1)

  return (
    <div className="pred-panel">
      <div className="pred-panel-meta">
        Based on {prediction.teams[0]?.inputRaces ?? '?'} races ·{' '}
        {prediction.basedOn.join(' · ')}
      </div>

      <div className="pred-panel-head">
        <span className="pred-panel-col-pos" />
        <span className="pred-panel-col-team">Team</span>
        <span className="pred-panel-col-bar" />
        <span className="pred-panel-col-num">vs MER</span>
        <span className="pred-panel-col-cat">SLO</span>
        <span className="pred-panel-col-cat">FST</span>
        <span className="pred-panel-col-cat">STR</span>
      </div>

      {prediction.teams.map((entry: PredictionEntry, i: number) => {
        const color = TEAM_COLORS[entry.team] ?? '#778'
        const barW  = (Math.abs(entry.overall) / maxAbs) * 100
        const posColor = i === 0 ? '#f0c040' : i < 3 ? '#aaa' : '#556'
        return (
          <div key={entry.team} className="pred-panel-row">
            <span className="pred-panel-col-pos" style={{ color: posColor }}>
              {i + 1}
            </span>
            <span className="pred-panel-col-team">
              <span className="pred-panel-dot" style={{ background: color }} />
              {entry.team}
            </span>
            <span className="pred-panel-col-bar">
              <span className="pred-panel-bar" style={{ width: `${barW}%`, background: color + 'aa' }} />
            </span>
            <span className="pred-panel-col-num">
              <Delta v={entry.overall} />
            </span>
            <span className="pred-panel-col-cat"><Delta v={entry.slow} /></span>
            <span className="pred-panel-col-cat"><Delta v={entry.fast} /></span>
            <span className="pred-panel-col-cat"><Delta v={entry.straight} /></span>
          </div>
        )
      })}

      <div className="pred-panel-legend">
        <span style={{ color: '#e74c3c' }}>● SLO</span>
        <span style={{ color: '#27ae60' }}>● FST</span>
        <span style={{ color: '#8899aa' }}>● STR</span>
        <span style={{ color: '#556', fontSize: 10 }}>+ = slower than Mercedes · − = faster</span>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  circuit: CircuitConfig
}

export default function StaticTrackMap({ circuit }: Props) {
  const [trackData,   setTrackData]   = useState<TrackData | null>(null)
  const [outline,     setOutline]     = useState<TrackOutline | null>(null)
  const [prediction,  setPrediction]  = useState<CircuitPrediction | null>(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    setLoading(true)
    setTrackData(null)
    setOutline(null)
    setPrediction(null)

    const prefix = CIRCUIT_TRACK_PREFIX[circuit.id]

    const trackPromise = prefix
      ? loadTrackData(prefix)
          .then(d => setTrackData(d))
          .catch(() =>
            fetch(`/track_outlines/${circuit.id}.json`)
              .then(r => r.json())
              .then((d: TrackOutline) => setOutline(d))
              .catch(() => setOutline({ circuit: circuit.id, points: [] }))
          )
      : fetch(`/track_outlines/${circuit.id}.json`)
          .then(r => r.json())
          .then((d: TrackOutline) => setOutline(d))
          .catch(() => setOutline({ circuit: circuit.id, points: [] }))

    const predPromise = circuit.hasPrediction
      ? loadCircuitPrediction(circuit.id).then(setPrediction).catch(() => {})
      : Promise.resolve()

    Promise.all([trackPromise, predPromise]).then(() => setLoading(false))
  }, [circuit.id, circuit.hasPrediction])

  const hasOutlinePoints = (outline?.points?.length ?? 0) > 0
  const isPredMode = !!prediction

  const trackEl = !loading && trackData ? (
    <ColoredTrack trackData={trackData} />
  ) : !loading && hasOutlinePoints && outline ? (
    <OutlineTrack outline={outline} />
  ) : !loading ? (
    <div className="static-track-loading">Track outline unavailable</div>
  ) : (
    <div className="static-track-loading">Loading track…</div>
  )

  // ── Prediction layout ──────────────────────────────────────────────────────
  if (isPredMode) {
    return (
      <div className="static-track-wrap prediction-mode">
        <div className="static-track-header" style={{ borderTop: '2px solid #c88600' }}>
          <div>
            <div className="static-track-name">{circuit.name}</div>
            <div className="static-track-badge" style={{ color: '#c88600' }}>
              Pace Prediction · {prediction.race}
            </div>
          </div>
          <span className="pred-mode-chip">PREDICTED</span>
        </div>

        <div className="pred-mode-body">
          <div className="pred-mode-track">
            {trackEl}
          </div>
          <div className="pred-mode-sidebar">
            <PredictionPanel prediction={prediction} />
          </div>
        </div>
      </div>
    )
  }

  // ── Standard layout ────────────────────────────────────────────────────────
  return (
    <div className="static-track-wrap">
      <div className="static-track-header">
        <div>
          <div className="static-track-name">{circuit.name}</div>
          <div className="static-track-badge">Track Map</div>
        </div>
      </div>

      <div className="static-track-svg-wrap">
        {trackEl}
      </div>

      <div className="static-track-footer">
        <span className="static-track-await">Data incoming — full telemetry visualization will appear here</span>
      </div>
    </div>
  )
}
