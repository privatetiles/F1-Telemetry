import { useState, useEffect, useMemo } from 'react'
import {
  CATEGORIES, CAT_SHORT, CAT_COLOR, TEAM_COLORS, EVENTS, EVENT_LABEL,
  EVENT_MAP_PREFIX, PREDICTION_EVENT,
  loadDeltaData, loadPredictions, loadTrackData, computeOverall, deltaColor,
} from '../lib/paceData'
import type { DeltaMap, PredictionEntry, Category, TrackData } from '../lib/paceData'

// ── Delta % display ─────────────────────────────────────────────────────────

function DeltaPct({ v, dim = false }: { v: number; dim?: boolean }) {
  const color = v >= 0 ? '#00e676' : v > -1 ? '#c8d800' : v > -2 ? '#ffab00' : '#f44336'
  const s = v >= 0 ? `+${v.toFixed(3)}%` : `${v.toFixed(3)}%`
  return <span style={{ color: dim ? '#445' : color, fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{s}</span>
}

// ── Austria Prediction Table ─────────────────────────────────────────────────

function PredictionTable({ predictions }: { predictions: PredictionEntry[] }) {
  const maxAbs = Math.max(...predictions.map(p => Math.abs(p.overall)), 0.01)

  return (
    <div className="pace-section">
      <div className="pace-section-title">Austria GP — Predicted pace vs Mercedes</div>
      <div className="pace-section-sub">Time-weighted speed delta across 3 track categories · 7 input races</div>

      <div className="pace-pred-table">
        <div className="pace-pred-head">
          <span style={{ width: 24 }}>P</span>
          <span style={{ width: 150 }}>Team</span>
          <span style={{ width: 90, textAlign: 'right' }}>Overall</span>
          <span style={{ width: 90, textAlign: 'right', color: CAT_COLOR['Slow corners'] }}>Slow</span>
          <span style={{ width: 90, textAlign: 'right', color: CAT_COLOR['Fast corners'] }}>Fast</span>
          <span style={{ width: 90, textAlign: 'right', color: CAT_COLOR['Straights'] }}>Straight</span>
          <span style={{ flex: 1 }}></span>
        </div>

        {predictions.map((p, i) => {
          const barW = (Math.abs(p.overall) / maxAbs) * 100
          const col = TEAM_COLORS[p.team] ?? '#778'
          return (
            <div key={p.team} className="pace-pred-row">
              <span className="pace-pred-pos" style={{
                color: i === 0 ? '#f0c040' : i < 3 ? '#c0c0c0' : '#445',
              }}>{i + 1}</span>
              <span className="pace-pred-team">
                <span className="pace-team-dot" style={{ background: col }} />
                {p.team}
              </span>
              <span style={{ width: 90, textAlign: 'right' }}><DeltaPct v={p.overall} /></span>
              <span style={{ width: 90, textAlign: 'right' }}><DeltaPct v={p.slow} dim /></span>
              <span style={{ width: 90, textAlign: 'right' }}><DeltaPct v={p.fast} dim /></span>
              <span style={{ width: 90, textAlign: 'right' }}><DeltaPct v={p.straight} dim /></span>
              <div className="pace-pred-bar-wrap">
                <div className="pace-pred-bar" style={{ width: `${barW}%`, background: col, opacity: 0.75 }} />
                {p.note && <span className="pace-pred-note">{p.note}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Circuit History Grid ─────────────────────────────────────────────────────

function CircuitHistory({ deltaMap, predictions }: { deltaMap: DeltaMap; predictions: PredictionEntry[] }) {
  const [cat, setCat] = useState<Category | 'Overall'>('Overall')

  const teams = predictions.map(p => p.team)

  return (
    <div className="pace-section">
      <div className="pace-section-title">Circuit history — speed delta by race</div>

      <div className="pace-cat-pills">
        {(['Overall', ...CATEGORIES] as const).map(c => (
          <button
            key={c}
            className={`pace-cat-pill ${cat === c ? 'active' : ''}`}
            style={cat === c && c !== 'Overall' ? { background: CAT_COLOR[c as Category], borderColor: CAT_COLOR[c as Category], color: '#000' } : {}}
            onClick={() => setCat(c as Category | 'Overall')}
          >
            {c === 'Overall' ? 'Overall' : CAT_SHORT[c]}
          </button>
        ))}
      </div>

      <div className="pace-grid-wrap">
        {/* Header row */}
        <div className="pace-grid-row pace-grid-header">
          <div className="pace-grid-team-label" />
          {EVENTS.map(ev => (
            <div key={ev} className="pace-grid-cell-head">{EVENT_LABEL[ev]}</div>
          ))}
        </div>

        {teams.map(team => (
          <div key={team} className="pace-grid-row">
            <div className="pace-grid-team-label">
              <span className="pace-team-dot" style={{ background: TEAM_COLORS[team] ?? '#778' }} />
              {team}
            </div>
            {EVENTS.map(ev => {
              const catMap = deltaMap[ev]?.[team] ?? {}
              const delta = cat === 'Overall'
                ? computeOverall(catMap)
                : (catMap[cat]?.delta ?? NaN)
              const bg = isFinite(delta) ? deltaColor(delta) : '#1a2030'
              const text = isFinite(delta) ? delta.toFixed(2) : '—'
              return (
                <div
                  key={ev}
                  className="pace-grid-cell"
                  style={{ background: bg }}
                  title={`${team} @ ${EVENT_LABEL[ev]}: ${text}%`}
                >
                  {text}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SVG Track Map ────────────────────────────────────────────────────────────

const TRACK_COLOR: Record<string, string> = {
  'Slow corners': '#e74c3c',
  'Fast corners': '#27ae60',
  'Straights':    '#8899aa',
}

const SVG_W = 800
const SVG_H = 600
const PAD   = 40

function TrackSVG({ trackData }: { trackData: TrackData }) {
  const { viewBox, transform } = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const run of trackData.segments) {
      for (const p of run.points) {
        if (p.x < minX) minX = p.x
        if (p.x > maxX) maxX = p.x
        if (p.y < minY) minY = p.y
        if (p.y > maxY) maxY = p.y
      }
    }
    const dX = maxX - minX || 1
    const dY = maxY - minY || 1
    const scale = Math.min((SVG_W - 2 * PAD) / dX, (SVG_H - 2 * PAD) / dY)
    const offX = (SVG_W - dX * scale) / 2 - minX * scale
    const offY = (SVG_H - dY * scale) / 2 - minY * scale
    return {
      viewBox: `0 0 ${SVG_W} ${SVG_H}`,
      transform: (x: number, y: number) => ({
        sx: x * scale + offX,
        // flip Y so north is up (SVG y grows down)
        sy: SVG_H - (y * scale + offY),
      }),
    }
  }, [trackData])

  return (
    <svg viewBox={viewBox} className="pace-track-svg" style={{ width: '100%', maxHeight: 500 }}>
      {/* Render straights first so colored segments draw on top */}
      {(['Straights', 'Fast corners', 'Slow corners'] as const).flatMap(cat =>
        trackData.segments
          .map((run, i) => ({ run, i }))
          .filter(({ run }) => run.category === cat)
          .map(({ run, i }) => {
            const color = TRACK_COLOR[run.category] ?? '#667'
            const pts = run.points.map(p => {
              const { sx, sy } = transform(p.x, p.y)
              return `${sx.toFixed(1)},${sy.toFixed(1)}`
            }).join(' ')
            return (
              <polyline
                key={i}
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          })
      )}
    </svg>
  )
}

// ── Map Viewer ───────────────────────────────────────────────────────────────

type MapType = 'track' | 'telemetry' | 'delta'

const MAP_LABELS: Record<MapType, string> = {
  track:     '3-Class Track',
  telemetry: 'Telemetry Map',
  delta:     'Delta Graph',
}

const ALL_MAP_EVENTS = [...EVENTS, PREDICTION_EVENT] as const

function MapViewer() {
  const [event, setEvent] = useState<string>(EVENTS[0])
  const [mapType, setMapType] = useState<MapType>('track')
  const [trackData, setTrackData] = useState<TrackData | null>(null)
  const [trackError, setTrackError] = useState(false)

  const prefix = EVENT_MAP_PREFIX[event]
  const hasGraph = event !== PREDICTION_EVENT
  const effectiveType: MapType = (mapType === 'delta' && !hasGraph) ? 'track' : mapType

  useEffect(() => {
    if (effectiveType !== 'track') return
    setTrackData(null)
    setTrackError(false)
    loadTrackData(prefix)
      .then(setTrackData)
      .catch(() => setTrackError(true))
  }, [event, effectiveType, prefix])

  const imgUrl = effectiveType === 'telemetry'
    ? `/pace/telemetry_maps/${prefix}_telemetry_map.png`
    : `/pace/delta_graphs/${prefix}_delta_graph.png`

  return (
    <div className="pace-section">
      <div className="pace-section-title">Circuit maps</div>

      <div className="pace-map-controls">
        <div className="pace-cat-pills">
          {ALL_MAP_EVENTS.map(ev => (
            <button
              key={ev}
              className={`pace-cat-pill ${event === ev ? 'active' : ''}`}
              onClick={() => setEvent(ev)}
            >
              {EVENT_LABEL[ev]}
            </button>
          ))}
        </div>
        <div className="pace-cat-pills">
          {(Object.keys(MAP_LABELS) as MapType[]).map(t => (
            <button
              key={t}
              className={`pace-cat-pill ${effectiveType === t ? 'active' : ''}`}
              onClick={() => setMapType(t)}
              disabled={t === 'delta' && !hasGraph}
            >
              {MAP_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Category legend for 3-class track */}
      {effectiveType === 'track' && (
        <div className="pace-cat-pills" style={{ marginBottom: 8 }}>
          {CATEGORIES.map(c => {
            const col = TRACK_COLOR[c] ?? '#667'
            return (
              <span key={c} className="pace-cat-pill" style={{
                background: col + '22',
                borderColor: col,
                color: col,
                cursor: 'default',
                fontSize: 11,
              }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: col, marginRight: 4, verticalAlign: 'middle' }} />
                {CAT_SHORT[c]}
              </span>
            )
          })}
        </div>
      )}

      <div className="pace-map-img-wrap">
        {effectiveType === 'track' ? (
          trackError ? (
            <div style={{ color: '#667', padding: 40, textAlign: 'center' }}>Track data unavailable</div>
          ) : trackData ? (
            <TrackSVG trackData={trackData} />
          ) : (
            <div style={{ color: '#667', padding: 40, textAlign: 'center' }}>Loading…</div>
          )
        ) : (
          <img
            key={imgUrl}
            src={imgUrl}
            alt={`${EVENT_LABEL[event]} ${MAP_LABELS[effectiveType]}`}
            className="pace-map-img"
          />
        )}
      </div>
    </div>
  )
}

// ── Main view ────────────────────────────────────────────────────────────────

export default function PaceAnalysisView() {
  const [deltaMap, setDeltaMap]       = useState<DeltaMap | null>(null)
  const [predictions, setPredictions] = useState<PredictionEntry[] | null>(null)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    Promise.all([loadDeltaData(), loadPredictions()])
      .then(([dm, pr]) => { setDeltaMap(dm); setPredictions(pr) })
      .catch(e => setError(String(e)))
  }, [])

  if (error) return <div className="pace-error">Failed to load pace data: {error}</div>
  if (!deltaMap || !predictions) return <div className="pace-loading">Loading pace analysis…</div>

  return (
    <div className="pace-view">
      <PredictionTable predictions={predictions} />
      <CircuitHistory deltaMap={deltaMap} predictions={predictions} />
      <MapViewer />
    </div>
  )
}
