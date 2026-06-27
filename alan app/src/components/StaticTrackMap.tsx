import { useEffect, useState, useMemo } from 'react'
import type { CircuitConfig } from '../types'
import { loadTrackData, CIRCUIT_TRACK_PREFIX } from '../lib/paceData'
import type { TrackData } from '../lib/paceData'

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
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="static-track-svg" style={{ width: '100%', height: '100%' }}>
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

  const tx = (x: number) => ox + (x - minX) * scale
  const ty = (y: number) => oy + (maxY - y) * scale

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${tx(p.x).toFixed(1)},${ty(p.y).toFixed(1)}`)
    .join(' ')
  return d + ' Z'
}

function OutlineTrack({ outline }: { outline: TrackOutline }) {
  const path = buildPath(outline.points)
  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="static-track-svg" style={{ width: '100%', height: '100%' }}>
      <path d={path} fill="none" stroke="#ffffff18" strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" />
      <path d={path} fill="none" stroke="#e10600" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      <path d={path} fill="none" stroke="#ff6b6b" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" strokeOpacity={0.6} />
    </svg>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  circuit: CircuitConfig
}

export default function StaticTrackMap({ circuit }: Props) {
  const [trackData, setTrackData]   = useState<TrackData | null>(null)
  const [outline, setOutline]       = useState<TrackOutline | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    setLoading(true)
    setTrackData(null)
    setOutline(null)

    const prefix = CIRCUIT_TRACK_PREFIX[circuit.id]
    if (prefix) {
      loadTrackData(prefix)
        .then(data => { setTrackData(data); setLoading(false) })
        .catch(() => {
          fetch(`/track_outlines/${circuit.id}.json`)
            .then(r => r.json())
            .then((data: TrackOutline) => { setOutline(data); setLoading(false) })
            .catch(() => { setOutline({ circuit: circuit.id, points: [] }); setLoading(false) })
        })
    } else {
      fetch(`/track_outlines/${circuit.id}.json`)
        .then(r => r.json())
        .then((data: TrackOutline) => { setOutline(data); setLoading(false) })
        .catch(() => { setOutline({ circuit: circuit.id, points: [] }); setLoading(false) })
    }
  }, [circuit.id])

  const hasOutlinePoints = (outline?.points?.length ?? 0) > 0

  return (
    <div className="static-track-wrap">
      <div className="static-track-header">
        <span className="static-track-flag">{circuit.flag}</span>
        <div>
          <div className="static-track-name">{circuit.name}</div>
          <div className="static-track-badge">Track Map</div>
        </div>
      </div>

      <div className="static-track-svg-wrap">
        {loading && (
          <div className="static-track-loading">Loading track…</div>
        )}
        {!loading && trackData && (
          <ColoredTrack trackData={trackData} />
        )}
        {!loading && !trackData && hasOutlinePoints && outline && (
          <OutlineTrack outline={outline} />
        )}
        {!loading && !trackData && !hasOutlinePoints && (
          <div className="static-track-loading">Track outline unavailable</div>
        )}
      </div>

      <div className="static-track-footer">
        <span className="static-track-await">Data incoming — full telemetry visualization will appear here</span>
      </div>
    </div>
  )
}
