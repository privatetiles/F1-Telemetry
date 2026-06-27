import { useState, useMemo } from 'react'
import type { TelemetryPoint } from '../types'
import { interpolateInputs } from '../lib/miniSectors'
import { driverColor } from '../lib/teamColors'

const W = 900
const H = 530

const SPONSOR: Record<string, string> = {
  VER: 'ORACLE',     HAD: 'ORACLE',
  NOR: 'DELL',       PIA: 'DELL',
  LEC: 'HP',         HAM: 'HP',
  RUS: 'PETRONAS',   ANT: 'PETRONAS',
  ALO: 'ARAMCO',     STR: 'ARAMCO',
  ALB: 'DURACELL',   SAI: 'DURACELL',
  BEA: 'MONEYGRAM',  OCO: 'MONEYGRAM',
  HUL: 'AUDI',       BOR: 'AUDI',
  LAW: 'VISA',       LIN: 'VISA',
  GAS: 'BWT',        COL: 'BWT',
  BOT: 'CADILLAC',   PER: 'CADILLAC',
}

const NUM: Record<string, string> = {
  VER: '1',  HAD: '41', NOR: '4',  PIA: '81',
  LEC: '16', HAM: '44', RUS: '63', ANT: '87',
  ALO: '14', STR: '18', ALB: '23', SAI: '55',
  BEA: '87', OCO: '31', HUL: '27', BOR: '5',
  LAW: '30', LIN: '6',  GAS: '10', COL: '43',
  BOT: '77', PER: '11',
}

// ── Telemetry helpers ──────────────────────────────────────────────────────
function getPos(tel: TelemetryPoint[], progress: number): { x: number; y: number } | null {
  if (!tel?.length) return null
  if (progress <= tel[0].relDist) return { x: tel[0].x, y: tel[0].y }
  const last = tel[tel.length - 1]
  if (progress >= last.relDist) return { x: last.x, y: last.y }
  let lo = 0, hi = tel.length - 1
  while (lo < hi - 1) {
    const m = (lo + hi) >> 1
    if (tel[m].relDist < progress) lo = m; else hi = m
  }
  const p0 = tel[lo], p1 = tel[hi]
  const t = (progress - p0.relDist) / Math.max(p1.relDist - p0.relDist, 1e-9)
  return { x: p0.x + t * (p1.x - p0.x), y: p0.y + t * (p1.y - p0.y) }
}

// Signed lateral offset (metres) from the nearest segment on the reference path.
// Positive = left of direction of travel, negative = right.
function computeLateral(x: number, y: number, path: { x: number; y: number }[]): number {
  if (path.length < 2) return 0
  let minDist2 = Infinity
  let bestLat = 0
  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[i], p1 = path[i + 1]
    const dx = p1.x - p0.x, dy = p1.y - p0.y
    const len2 = dx * dx + dy * dy
    if (len2 < 1e-6) continue
    const t = Math.max(0, Math.min(1, ((x - p0.x) * dx + (y - p0.y) * dy) / len2))
    const projX = p0.x + t * dx, projY = p0.y + t * dy
    const dist2 = (x - projX) ** 2 + (y - projY) ** 2
    if (dist2 < minDist2) {
      minDist2 = dist2
      bestLat = (dx * (y - p0.y) - dy * (x - p0.x)) / Math.sqrt(len2)
    }
  }
  return bestLat
}

function getHeading(tel: TelemetryPoint[], progress: number): number {
  if (!tel || tel.length < 2) return 0
  let lo = 0, hi = tel.length - 1
  if (progress <= tel[0].relDist) { lo = 0; hi = 1 }
  else if (progress >= tel[hi].relDist) { lo = hi - 1 }
  else { while (lo < hi - 1) { const m = (lo + hi) >> 1; if (tel[m].relDist < progress) lo = m; else hi = m } }
  const p0 = tel[lo]
  const p1 = tel[Math.min(tel.length - 1, lo + 5)]
  return Math.atan2(-(p1.y - p0.y), p1.x - p0.x) * 180 / Math.PI
}

// ── Full-detail car body (used when car is large on screen) ─────────────────
// Car points right (+x = nose). Sheen gradient defined once in global SVG defs.
function CarBodyFull({ driver, color, braking, drsActive }: {
  driver: string; color: string; braking: boolean; drsActive: boolean
}) {
  const sponsor = SPONSOR[driver] ?? ''

  return (
    <g>
      {/* Drop shadow */}
      <ellipse cx={5} cy={8} rx={52} ry={18} fill="rgba(0,0,0,0.55)" />

      {/* ── REAR WING ── */}
      {/* Endplate caps */}
      <rect x={-44} y={-27} width={3.5} height={6}  rx={1} fill={color} opacity={0.75} />
      <rect x={-44} y={21}  width={3.5} height={6}  rx={1} fill={color} opacity={0.75} />
      {/* Main element */}
      <rect x={-45} y={-23} width={9} height={46} rx={1.5}
        fill="#0a0a14" stroke={drsActive ? '#00ff88' : color}
        strokeWidth={drsActive ? 1.8 : 0.8} />
      {/* Upper flap */}
      <rect x={-43} y={-21} width={5} height={42} rx={1} fill="#111118" />
      {/* Active aero glow */}
      {drsActive && (
        <rect x={-47} y={-25} width={13} height={50} rx={2}
          fill="none" stroke="#00ff88" strokeWidth={1.5} opacity={0.55} />
      )}

      {/* ── REAR BEAM WING ── */}
      <rect x={-34} y={-4.5} width={5} height={9} rx={1.5} fill="#0d0d12" opacity={0.85} />

      {/* ── REAR TYRES ── */}
      {[-18, 18].map((yOff) => (
        <g key={yOff}>
          {braking && <circle cx={-22} cy={yOff} r={12} fill="#ff4000" opacity={0.12} />}
          {/* Tyre carcass */}
          <ellipse cx={-22} cy={yOff} rx={8} ry={11.5} fill="#0d0d0d" stroke="#1e1e1e" strokeWidth={1.5} />
          {/* Sidewall ring */}
          <ellipse cx={-22} cy={yOff} rx={6.2} ry={9} fill="none" stroke="#181818" strokeWidth={1} />
          {/* Compound centre disc */}
          <ellipse cx={-22} cy={yOff} rx={4.5} ry={6.5}
            fill={braking ? '#ff5200' : '#161616'} />
          {/* Team colour compound band */}
          <ellipse cx={-22} cy={yOff} rx={4.5} ry={6.5}
            fill="none" stroke={color} strokeWidth={2.2} opacity={0.62} />
          {/* Hub */}
          <circle cx={-22} cy={yOff} r={1.8} fill="#0a0a0a" />
          {/* Suspension arm */}
          <line x1={-13} y1={yOff > 0 ? 9 : -9} x2={-21} y2={yOff}
            stroke="#15202e" strokeWidth={2.8} strokeLinecap="round" />
        </g>
      ))}

      {/* ── DIFFUSER ── */}
      <path d="M -28,-13 L -43,-19 L -43,19 L -28,13 Z"
        fill="#080e16" stroke="#0d1520" strokeWidth={0.8} />
      {/* Diffuser exit fins */}
      {[-8, -3, 0, 3, 8].map(y => (
        <line key={y} x1={-29} y1={y} x2={-41} y2={y * 1.25}
          stroke="#111a26" strokeWidth={0.7} />
      ))}

      {/* ── MAIN BODY ── */}
      <path d="M 30,-11 L -27,-12 Q -30,-10 -30,10 Q -27,12 30,11 Q 40,8 46,0 Q 40,-8 30,-11 Z"
        fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth={0.5} />

      {/* ── LEFT SIDEPOD ── */}
      <path d="M 16,-9 Q 0,-13 -16,-15 L -23,-12 L -23,-7 L 13,-8 Z" fill={color} />
      {/* Sidepod inlet */}
      <path d="M 14,-9.5 Q 7,-13 0,-13 Q -3,-11 -3,-9 L 12,-8.5 Z" fill="rgba(0,0,0,0.52)" />
      {/* Surface highlight */}
      <path d="M 14,-9 Q 6,-11.5 -1,-11.5 L -1,-10.5 Q 6,-10.5 13,-8.5 Z" fill="rgba(255,255,255,0.06)" />

      {/* ── RIGHT SIDEPOD ── */}
      <path d="M 16,9 Q 0,13 -16,15 L -23,12 L -23,7 L 13,8 Z" fill={color} />
      {/* Sidepod inlet */}
      <path d="M 14,9.5 Q 7,13 0,13 Q -3,11 -3,9 L 12,8.5 Z" fill="rgba(0,0,0,0.52)" />
      {/* Surface highlight */}
      <path d="M 14,9 Q 6,11.5 -1,11.5 L -1,10.5 Q 6,10.5 13,8.5 Z" fill="rgba(255,255,255,0.06)" />

      {/* ── SPONSOR ── */}
      {sponsor && (
        <>
          <text textAnchor="middle" x={-7} y={-5.5}
            fill="white" fontSize={3.2} fontFamily="monospace" fontWeight="700" opacity={0.85}>
            {sponsor}
          </text>
          <text textAnchor="middle" x={-7} y={8.5}
            fill="white" fontSize={3.2} fontFamily="monospace" fontWeight="700" opacity={0.85}>
            {sponsor}
          </text>
        </>
      )}

      {/* ── ENGINE COVER / AIRBOX ── */}
      <path d="M 3,-5 Q 10,-7 18,-5.5 L 18,5.5 Q 10,7 3,5 Z"
        fill={color} opacity={0.55} />
      <path d="M 3,-4 Q 10,-6 17,-4.5 L 17,4.5 Q 10,6 3,4 Z"
        fill="rgba(0,0,0,0.25)" />
      {/* Airbox opening */}
      <ellipse cx={17} cy={0} rx={2.5} ry={3.8}
        fill="rgba(0,0,0,0.72)" stroke="#0a1520" strokeWidth={0.5} />

      {/* ── SHEEN ── */}
      <path d="M 30,-11 L -27,-12 Q -30,-10 -30,10 Q -27,12 30,11 Q 40,8 46,0 Q 40,-8 30,-11 Z"
        fill="url(#car-sheen)" />

      {/* ── NOSE CONE ── */}
      <path d="M 30,-5.5 L 46,0 L 30,5.5 Z" fill={color} />
      <path d="M 30,-4 L 44,0 L 30,4 Z" fill="rgba(0,0,0,0.16)" />

      {/* ── FRONT WING ── */}
      {/* Endplates */}
      <path d="M 46,-23 L 53,-21 L 53,-14 L 47,-17 Z" fill={color} opacity={0.72} />
      <path d="M 46,23 L 53,21 L 53,14 L 47,17 Z" fill={color} opacity={0.72} />
      {/* Main element */}
      <rect x={47} y={-21} width={6} height={42} rx={1.5} fill={color} opacity={0.80} />
      {/* Second cascade element */}
      <rect x={45} y={-16} width={3} height={32} rx={1} fill={color} opacity={0.48} />
      {/* Centre section accent */}
      <rect x={47} y={-7} width={6} height={14} rx={1} fill={color} opacity={0.3} />

      {/* ── FRONT SUSPENSION ARMS ── */}
      {[-15, 15].map((yOff) => (
        <line key={yOff}
          x1={29} y1={yOff > 0 ? 9 : -9}
          x2={22} y2={yOff}
          stroke="#15202e" strokeWidth={2.2} strokeLinecap="round" />
      ))}

      {/* ── FRONT TYRES ── */}
      {[-15, 15].map((yOff) => (
        <g key={yOff}>
          <ellipse cx={22} cy={yOff} rx={5.5} ry={8} fill="#0d0d0d" stroke="#1e1e1e" strokeWidth={1.5} />
          <ellipse cx={22} cy={yOff} rx={4} ry={6} fill="none" stroke="#181818" strokeWidth={0.8} />
          {/* Compound band */}
          <ellipse cx={22} cy={yOff} rx={3} ry={4.5}
            fill="none" stroke={color} strokeWidth={1.8} opacity={0.62} />
          <ellipse cx={22} cy={yOff} rx={1.8} ry={2.8} fill="#141414" />
          <circle cx={22} cy={yOff} r={0.8} fill="#090909" />
        </g>
      ))}

      {/* ── COCKPIT ── */}
      <path d="M 5,-4.5 Q 14,-8 22,-5.5 L 22,5.5 Q 14,8 5,4.5 Z"
        fill="#04101e" stroke="rgba(255,255,255,0.10)" strokeWidth={0.5} />
      {/* Visor */}
      <path d="M 8,-3.5 Q 15,-6.5 21,-4.5 L 21,-0.5 Q 15,-1.5 8,-0.5 Z"
        fill="rgba(20,140,255,0.16)" />
      <path d="M 9,-3 Q 15,-5.2 20,-3.8 L 20,-1.5 Q 15,-2.5 9,-2 Z"
        fill="rgba(255,255,255,0.08)" />

      {/* ── HALO ── */}
      <path d="M 4,-2 Q 13,-14 22,-2"
        fill="none" stroke="rgba(210,210,210,0.92)" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 4,-2 Q 13,-13 22,-2"
        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={0.8} strokeLinecap="round" />
      {/* Central pillar */}
      <line x1={13} y1={-12} x2={13} y2={-5}
        stroke="rgba(200,200,200,0.72)" strokeWidth={2.2} strokeLinecap="round" />

      {/* ── DRIVER CODE ── */}
      <text textAnchor="middle" x={13} y={4.5}
        fill="rgba(255,255,255,0.95)" fontSize={6.5}
        fontFamily="monospace" fontWeight="900" letterSpacing="-0.5">
        {driver}
      </text>

      {/* ── BRAKE LIGHTS ── */}
      {braking && (
        <>
          <rect x={-36} y={-13} width={8} height={6} rx={1} fill="#ff2200" opacity={0.28} />
          <rect x={-36} y={7}   width={8} height={6} rx={1} fill="#ff2200" opacity={0.28} />
          <rect x={-36} y={-13} width={7} height={5} rx={1} fill="#ff1000" />
          <rect x={-36} y={7}   width={7} height={5} rx={1} fill="#ff1000" />
          <rect x={-35} y={-12} width={3} height={3} rx={0.5} fill="#ffcc00" opacity={0.78} />
          <rect x={-35} y={8}   width={3} height={3} rx={0.5} fill="#ffcc00" opacity={0.78} />
        </>
      )}
    </g>
  )
}

// ── LOD car body — only 5–7 elements, used when car is small on screen ──────
function CarBodyLOD({ driver, color, braking, drsActive }: {
  driver: string; color: string; braking: boolean; drsActive: boolean
}) {
  return (
    <g>
      <ellipse cx={2} cy={3} rx={28} ry={9} fill="rgba(0,0,0,0.45)" />
      {/* Body pill */}
      <rect x={-20} y={-7} width={42} height={14} rx={5}
        fill={color} stroke="rgba(255,255,255,0.22)" strokeWidth={0.7} />
      {/* DRS tint */}
      {drsActive && (
        <rect x={-20} y={-7} width={42} height={14} rx={5}
          fill="none" stroke="#00ff88" strokeWidth={1.2} opacity={0.7} />
      )}
      {/* Brake flash */}
      {braking && (
        <rect x={-22} y={-7} width={5} height={14} rx={2} fill="#ff1500" opacity={0.9} />
      )}
      {/* Driver code */}
      <text textAnchor="middle" x={2} y={4}
        fill="rgba(255,255,255,0.92)" fontSize={7}
        fontFamily="monospace" fontWeight="900">
        {driver}
      </text>
    </g>
  )
}

// ── Car labels — screen-space, never rotate ────────────────────────────────
// carScale drives focus ring size and chip/speed vertical offsets.
// lateral: signed metres from track centreline (+ = left, – = right of travel direction).
const TRACK_HALF_W = 7.5 // estimated track half-width in metres (typical F1 circuit)

function CarLabel({ driver, color, speed, focused, carScale, lateral }: {
  driver: string; color: string; speed: number; focused: boolean
  carScale: number; lateral: number
}) {
  const num = NUM[driver] ?? ''
  const ringR  = Math.round(18 + 34 * carScale)
  const chipY  = -(15 + 38 * carScale)
  const speedY =   15 + 32 * carScale
  const barY   = speedY + 14

  // Track-position bar: clamp lateral to ±TRACK_HALF_W, map to ±1
  const latFrac  = Math.max(-1, Math.min(1, lateral / TRACK_HALF_W))
  const absLat   = Math.abs(lateral)
  // Proximity colour: green → amber → red
  const proxCol  = absLat > TRACK_HALF_W * 0.85 ? '#ff2200'
    : absLat > TRACK_HALF_W * 0.65 ? '#ffaa00'
    : '#00cc55'

  return (
    <g>
      {/* Proximity warning ring — only shown near track limit */}
      {absLat > TRACK_HALF_W * 0.7 && (
        <circle cx={0} cy={0} r={ringR}
          fill="none" stroke={proxCol} strokeWidth={2} opacity={0.65} />
      )}

      {focused && (
        <>
          <circle cx={0} cy={0} r={ringR + 4} fill="none"
            stroke={color} strokeWidth={4} opacity={0.12} />
          <circle cx={0} cy={0} r={ringR} fill="none"
            stroke={color} strokeWidth={1.5} opacity={0.80} strokeDasharray="8,6" />
        </>
      )}

      {/* NUMBER CHIP */}
      <g transform={`translate(0,${chipY})`}>
        <rect x={-17} y={-10} width={34} height={19} rx={5}
          fill="rgba(0,0,0,0.55)" transform="translate(2,2)" />
        <rect x={-17} y={-10} width={34} height={19} rx={5} fill={color} />
        <rect x={-17} y={-10} width={34} height={19} rx={5} fill="rgba(0,0,0,0.22)" />
        <text textAnchor="middle" y={6}
          fill="white" fontSize={11} fontFamily="monospace" fontWeight="900">
          #{num}
        </text>
      </g>

      {/* SPEED BADGE */}
      <g transform={`translate(0,${speedY})`}>
        <rect x={-24} y={-9} width={48} height={16} rx={3}
          fill="rgba(5,12,24,0.82)" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
        <text textAnchor="middle" y={5}
          fill={color} fontSize={9.5} fontFamily="monospace" fontWeight="700">
          {Math.round(speed)}
          <tspan fontSize={6.5} fill="#5a7090"> km/h</tspan>
        </text>
      </g>

      {/* TRACK POSITION BAR
          Shows lateral position within track width.
          Centre = car on the racing line; edges = track limits.
          Dot colour telegraphs proximity to the curb. */}
      <g transform={`translate(0,${barY})`}>
        {/* Track width background */}
        <rect x={-20} y={-4} width={40} height={8} rx={3} fill="rgba(0,0,0,0.65)" />
        {/* Asphalt area */}
        <rect x={-18} y={-3} width={36} height={6} rx={2} fill="#111c28" />
        {/* Left curb tick */}
        <rect x={-18} y={-4} width={3} height={8} rx={1} fill="#882200" opacity={0.9} />
        {/* Right curb tick */}
        <rect x={15}  y={-4} width={3} height={8} rx={1} fill="#882200" opacity={0.9} />
        {/* Car position dot */}
        <circle cx={latFrac * 15} cy={0} r={3.5} fill={proxCol} />
        {/* Centreline mark */}
        <line x1={0} y1={-3} x2={0} y2={3} stroke="rgba(255,255,255,0.18)" strokeWidth={0.8} />
      </g>
    </g>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
interface Props {
  driverTelemetry: Record<string, TelemetryPoint[]>
  activeDrivers: Set<string>
  progress: number
  cameraDriver: string | null
  onCameraDriverChange: (d: string | null) => void
}

export default function SatelliteView({
  driverTelemetry, activeDrivers, progress, cameraDriver, onCameraDriverChange,
}: Props) {
  const [followHalfM, setFollowHalfM] = useState(120)
  const [headingUp,   setHeadingUp]   = useState(false)

  const trackPoints = useMemo(() => {
    const entries = Object.values(driverTelemetry)
    if (!entries.length) return []
    const ref = entries.reduce((a, b) => b.length > a.length ? b : a)
    return ref.map(p => ({ x: p.x, y: p.y }))
  }, [driverTelemetry])

  const carPositions = useMemo(() => {
    const out: Array<{ driver: string; x: number; y: number }> = []
    for (const driver of activeDrivers) {
      const p = getPos(driverTelemetry[driver], progress)
      if (p) out.push({ driver, x: p.x, y: p.y })
    }
    return out
  }, [activeDrivers, driverTelemetry, progress])

  const { camX, camY, zoom } = useMemo(() => {
    if (cameraDriver) {
      const tel = driverTelemetry[cameraDriver]
      if (tel) {
        const p = getPos(tel, progress)
        if (p) return { camX: p.x, camY: p.y, zoom: W / (followHalfM * 2) }
      }
    }

    if (carPositions.length === 0) return { camX: 0, camY: 0, zoom: W / (followHalfM * 2) }

    const xs = carPositions.map(p => p.x)
    const ys = carPositions.map(p => p.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
    const PAD = 60
    const neededHalf = Math.max((maxX - minX) / 2 + PAD, (maxY - minY) / 2 + PAD, 60)
    return { camX: cx, camY: cy, zoom: W / (Math.min(500, neededHalf) * 2) }
  }, [cameraDriver, driverTelemetry, carPositions, progress, followHalfM])

  // How much to scale the car body in screen pixels.
  // Cars are ~5.5 m long; our body art spans ~84 local units.
  // Multiply by zoom so cars grow/shrink with the viewport, capped at 1× (full art size).
  const carScale = Math.min(1, zoom * 0.2)
  // Below this threshold switch to a cheap LOD pill body
  const useLOD = carScale < 0.5

  const toSx = (wx: number) => (wx - camX) * zoom + W / 2
  const toSy = (wy: number) => -(wy - camY) * zoom + H / 2

  const trackPath = useMemo(() => {
    if (!trackPoints.length) return ''
    const pts = [...trackPoints, trackPoints[0]]
    return 'M ' + pts.map(({ x, y }) =>
      `${toSx(x).toFixed(1)},${toSy(y).toFixed(1)}`
    ).join(' L ')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackPoints, camX, camY, zoom])

  const trackPx = Math.max(8, zoom * 14)

  const cars = useMemo(() => {
    return carPositions.map(({ driver, x, y }) => {
      const tel = driverTelemetry[driver]
      return {
        driver,
        sx: toSx(x), sy: toSy(y),
        heading: tel ? getHeading(tel, progress) : 0,
        inputs:  tel ? interpolateInputs(tel, progress) : null,
        lateral: computeLateral(x, y, trackPoints),
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carPositions, camX, camY, zoom, driverTelemetry, progress, trackPoints])

  const sfScreen = useMemo(() => {
    if (!trackPoints.length) return null
    return { sx: toSx(trackPoints[0].x), sy: toSy(trackPoints[0].y) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackPoints, camX, camY, zoom])

  // Heading-up mode: rotate the entire scene so the followed car always points toward the top.
  // The followed car is always at screen centre (W/2, H/2) so we rotate around that point.
  // Car body heading H + scene rotation R = -90° (pointing up in SVG) → R = -90 - H
  const followedHeading = cameraDriver
    ? (cars.find(c => c.driver === cameraDriver)?.heading ?? 0)
    : 0
  const viewRotation = headingUp && cameraDriver !== null ? -90 - followedHeading : 0

  const isPack = cameraDriver === null
  const visibleM = isPack ? null : followHalfM * 2

  return (
    <div className="satellite-view">
      {/* ── Header ── */}
      <div className="sat-header">
        <span className="sat-badge">SAT</span>

        <div className="sat-follow-row">
          <span className="sat-follow-label">Follow</span>
          <button
            className={`sat-follow-btn ${isPack ? 'active' : ''}`}
            onClick={() => onCameraDriverChange(null)}
          >
            ALL
          </button>
          {Array.from(activeDrivers).filter(d => driverTelemetry[d]).map(d => (
            <button
              key={d}
              className="sat-follow-btn"
              style={cameraDriver === d
                ? { background: driverColor(d), color: '#fff', borderColor: driverColor(d) }
                : { borderColor: driverColor(d), color: driverColor(d) }
              }
              onClick={() => onCameraDriverChange(d === cameraDriver ? null : d)}
            >
              {d}
            </button>
          ))}
        </div>

        {!isPack && (
          <div className="sat-zoom-row">
            <button className="sat-zoom-btn" onClick={() => setFollowHalfM(z => Math.max(40, z - 20))}>+</button>
            <span className="sat-zoom-val">{visibleM}m</span>
            <button className="sat-zoom-btn" onClick={() => setFollowHalfM(z => Math.min(500, z + 20))}>−</button>
            <button
              className={`sat-zoom-btn ${headingUp ? 'active' : ''}`}
              onClick={() => setHeadingUp(v => !v)}
              title="Heading-up: followed car always faces top of screen"
            >
              ↑ HDG
            </button>
          </div>
        )}
      </div>

      {/* ── SVG viewport ── */}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="sat-svg">
        <defs>
          <clipPath id="sat-clip">
            <rect x={0} y={0} width={W} height={H} />
          </clipPath>
          <radialGradient id="sat-vig" cx="50%" cy="50%">
            <stop offset="52%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0,3,12,0.85)" />
          </radialGradient>
          {/* Shared top-down sheen used by all car bodies */}
          <linearGradient id="car-sheen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.26)" />
            <stop offset="42%"  stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.30)" />
          </linearGradient>
        </defs>

        <g clipPath="url(#sat-clip)">
          {/* Rotate entire scene around the viewport centre so the followed car faces up */}
          <g transform={`rotate(${viewRotation.toFixed(2)},${W / 2},${H / 2})`}>
          {/* ── TERRAIN + TRACK ── */}
          {trackPath && (() => {
            const curbW    = trackPx * 1.38           // width including curb strips
            const dashLen  = Math.max(5, trackPx * 0.30).toFixed(1)
            return (
            <>
              {/* Grass / environment base */}
              <path d={trackPath} fill="none" stroke="#0b1c09" strokeWidth={trackPx + 46}
                strokeLinecap="round" strokeLinejoin="round" />
              {/* Gravel / run-off strip */}
              <path d={trackPath} fill="none" stroke="#14180f" strokeWidth={trackPx + 16}
                strokeLinecap="round" strokeLinejoin="round" />
              {/* ── Curb stripes: red/white alternating ── */}
              <path d={trackPath} fill="none" stroke="#b81200" strokeWidth={curbW}
                strokeLinecap="butt" strokeLinejoin="round"
                strokeDasharray={`${dashLen},${dashLen}`} />
              <path d={trackPath} fill="none" stroke="#d8d8d0" strokeWidth={curbW}
                strokeLinecap="butt" strokeLinejoin="round"
                strokeDasharray={`${dashLen},${dashLen}`} strokeDashoffset={dashLen} />
              {/* Tarmac surface — covers the centre, leaving ~19% of curbW visible each side */}
              <path d={trackPath} fill="none" stroke="#1e2026" strokeWidth={trackPx}
                strokeLinecap="butt" strokeLinejoin="round" />
              {/* Racing-line groove */}
              <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={trackPx * 0.35}
                strokeLinecap="butt" strokeLinejoin="round" />
              {/* Centre-line dashes */}
              <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12,10" />
            </>
          )})()}

          {/* ── START / FINISH MARKER ── */}
          {sfScreen && (
            <g transform={`translate(${sfScreen.sx.toFixed(1)},${sfScreen.sy.toFixed(1)})`}>
              <circle r={trackPx / 2 + 2} fill="rgba(255,255,255,0.12)" />
              <circle r={4} fill="#ffffff" stroke="#e10600" strokeWidth={2.5} />
            </g>
          )}

          {/* ── CAR BODIES ── */}
          {cars.map(car => {
            const ghost = cameraDriver !== null && car.driver !== cameraDriver
            const col = driverColor(car.driver)
            const braking = car.inputs?.brake ?? false
            // 2026 active aero: telemetry DRS field is always 0 — simulate from speed+throttle
            const aeroActive = !braking
              && (car.inputs?.throttle ?? 0) > 90
              && (car.inputs?.speed ?? 0) > 265
            return (
              <g
                key={`body-${car.driver}`}
                transform={`translate(${car.sx.toFixed(1)},${car.sy.toFixed(1)}) rotate(${car.heading.toFixed(1)}) scale(${carScale})`}
                opacity={ghost ? 0.25 : 1}
                style={{ cursor: 'pointer' }}
                onClick={() => onCameraDriverChange(car.driver === cameraDriver ? null : car.driver)}
              >
                {useLOD ? (
                  <CarBodyLOD
                    driver={car.driver} color={col}
                    braking={braking}
                    drsActive={aeroActive}
                  />
                ) : (
                  <CarBodyFull
                    driver={car.driver} color={col}
                    braking={braking}
                    drsActive={aeroActive}
                  />
                )}
              </g>
            )
          })}

          {/* ── CAR LABELS ──
               Labels live inside the scene rotation group so they move with the track,
               but we counter-rotate each one by -viewRotation so text stays upright. */}
          {cars.map(car => {
            const ghost = cameraDriver !== null && car.driver !== cameraDriver
            return (
              <g
                key={`label-${car.driver}`}
                transform={`translate(${car.sx.toFixed(1)},${car.sy.toFixed(1)}) rotate(${(-viewRotation).toFixed(2)})`}
                opacity={ghost ? 0.25 : 1}
                style={{ cursor: 'pointer' }}
                onClick={() => onCameraDriverChange(car.driver === cameraDriver ? null : car.driver)}
              >
                <CarLabel
                  driver={car.driver}
                  color={driverColor(car.driver)}
                  speed={car.inputs?.speed ?? 0}
                  focused={car.driver === cameraDriver}
                  carScale={carScale}
                  lateral={car.lateral}
                />
              </g>
            )
          })}
          </g>{/* end scene rotation group */}
        </g>

        <rect x={0} y={0} width={W} height={H} fill="url(#sat-vig)" pointerEvents="none" />

        {!trackPath && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fill="#334" fontSize={16}>
            Loading telemetry…
          </text>
        )}
      </svg>
    </div>
  )
}
