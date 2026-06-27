import { useRef } from 'react'
import type { DriverInputs } from '../lib/miniSectors'
import { driverColor } from '../lib/teamColors'

interface Props {
  inputs: DriverInputs
  driver: string
  progress: number
}

export default function InputsHUD({ inputs, driver, progress }: Props) {
  const { throttle, brake, speed, gear, steeringDeg } = inputs
  const color = driverColor(driver)

  // 2026 active aero: telemetry DRS field is always 0 — simulate from speed + throttle
  const aeroActive = !brake && throttle > 90 && speed > 265

  // Spring-smoothed steering angle
  const smoothRef   = useRef(0)
  const lastTimeRef = useRef<number | null>(null)
  const prevProgRef = useRef(progress)

  const now = performance.now()
  const dt  = lastTimeRef.current !== null
    ? Math.min((now - lastTimeRef.current) / 1000, 0.05)
    : 0.016
  lastTimeRef.current = now

  if (progress < prevProgRef.current - 0.05) smoothRef.current = 0
  prevProgRef.current = progress

  smoothRef.current += (steeringDeg - smoothRef.current) * 12 * dt
  const displaySteering = smoothRef.current

  // Rim geometry — D-shape F1 wheel
  const RIM_R = 52
  const rimArc = `M -42,30 A ${RIM_R},${RIM_R} 0 1 1 42,30`

  return (
    <div className="inputs-hud">
      <div className="hud-label" style={{ color }}>{driver}</div>

      <div className="hud-main">
        {/* ── Brake bar ── */}
        <div className="hud-pedal-col">
          <div className="hud-pedal-track">
            <div className="hud-pedal-fill brake" style={{ height: `${brake ? 100 : 0}%` }} />
          </div>
          <span className="hud-pedal-label">BRK</span>
        </div>

        {/* ── Steering wheel ── */}
        <div className="hud-wheel-col">
          {/*
            viewBox: -72,-68 → +72,+46 (144 × 114 units)
            Rim top reaches ≈ y=-53; 12-o'clock marker goes to y=-66.
          */}
          <svg viewBox="-72 -68 144 114" width="180" height="143" className="hud-wheel-svg">
            <g style={{ transform: `rotate(${displaySteering}deg)`, transformOrigin: '0px 0px' }}>

              {/* ── PADDLE SHIFTERS (behind the wheel face) ── */}
              <rect x={-70} y={-6} width={16} height={10} rx={4}
                fill="#070f1a" stroke="#0e1e2e" strokeWidth={1} opacity={0.9} />
              <rect x={54}  y={-6} width={16} height={10} rx={4}
                fill="#070f1a" stroke="#0e1e2e" strokeWidth={1} opacity={0.9} />

              {/* ── RIM — three depth layers ── */}
              {/* Deep shadow */}
              <path d={rimArc} fill="none" stroke="#020810" strokeWidth={20} strokeLinecap="round" />
              {/* Outer rim body */}
              <path d={rimArc} fill="none" stroke="#141e2c" strokeWidth={14} strokeLinecap="round" />
              {/* Inner rim face */}
              <path d={rimArc} fill="none" stroke="#0d1824" strokeWidth={11} strokeLinecap="round" />
              {/* Team color outer stripe */}
              <path d={rimArc} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" opacity={0.88} />
              {/* Subtle inner highlight */}
              <path d={rimArc} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeLinecap="round" />

              {/* ── 12 O'CLOCK MARKER ── */}
              <rect x={-5.5} y={-65} width={11} height={18} rx={3} fill={color} />
              <rect x={-3.5} y={-63} width={7}  height={8}  rx={2} fill="rgba(255,255,255,0.22)" />

              {/* ── LEFT GRIP ── */}
              <rect x={-70} y={-24} width={32} height={56} rx={9}
                fill="#0c1820" stroke="#182838" strokeWidth={1.5} />
              {/* Rubber grip ridges */}
              {[-14, -6, 2, 10, 18].map(y => (
                <rect key={y} x={-66} y={y - 1.2} width={22} height={2.5} rx={1.2}
                  fill="#162234" />
              ))}
              {/* Thumb button */}
              <rect x={-62} y={-24} width={16} height={9} rx={3}
                fill="#132030" stroke="#223848" strokeWidth={0.8} />
              <circle cx={-56} cy={-19.5} r={2.5} fill="#1c3448" />

              {/* ── RIGHT GRIP ── */}
              <rect x={38} y={-24} width={32} height={56} rx={9}
                fill="#0c1820" stroke="#182838" strokeWidth={1.5} />
              {[-14, -6, 2, 10, 18].map(y => (
                <rect key={y} x={44} y={y - 1.2} width={22} height={2.5} rx={1.2}
                  fill="#162234" />
              ))}
              <rect x={46} y={-24} width={16} height={9} rx={3}
                fill="#132030" stroke="#223848" strokeWidth={0.8} />
              <circle cx={52} cy={-19.5} r={2.5} fill="#1c3448" />

              {/* ── FLAT BOTTOM BAR ── */}
              <rect x={-42} y={24} width={84} height={18} rx={6}
                fill="#0c1820" stroke="#182838" strokeWidth={1.5} />
              <line x1={0} y1={26} x2={0} y2={40} stroke="#182838" strokeWidth={1} />

              {/* ── SPOKES ── */}
              <rect x={-36} y={-1} width={12} height={9} rx={4} fill="#091520" />
              <rect x={24}  y={-1} width={12} height={9} rx={4} fill="#091520" />
              <rect x={-4.5} y={-63} width={9} height={40} rx={4} fill="#091520" />

              {/* ── CENTER PANEL ── */}
              <rect x={-27} y={-27} width={54} height={54} rx={7}
                fill="#050e18" stroke="#162232" strokeWidth={1.5} />

              {/* ─ Status LED strip ─ */}
              <rect x={-23} y={-24} width={46} height={10} rx={3} fill="#030810" />

              {/* AERO LED */}
              <circle cx={-16} cy={-19} r={3.3}
                fill={aeroActive ? '#00ff88' : '#041508'}
                style={aeroActive ? { filter: 'drop-shadow(0 0 4px #00ff88)' } : {}} />
              <text x={-16} y={-11.5} textAnchor="middle"
                fill={aeroActive ? '#00cc66' : '#0a2014'}
                fontSize={3} fontFamily="monospace" fontWeight="700">
                AERO
              </text>

              {/* BRK LED */}
              <circle cx={-6} cy={-19} r={3.3}
                fill={brake ? '#ff2200' : '#180404'}
                style={brake ? { filter: 'drop-shadow(0 0 4px #ff2200)' } : {}} />
              <text x={-6} y={-11.5} textAnchor="middle"
                fill={brake ? '#cc2200' : '#200808'}
                fontSize={3} fontFamily="monospace" fontWeight="700">
                BRK
              </text>

              {/* Blank dot */}
              <circle cx={5} cy={-19} r={3.3} fill="#0c1622" />

              {/* THR LED */}
              <circle cx={16} cy={-19} r={3.3}
                fill={throttle > 85 ? color : '#0c1622'}
                opacity={throttle > 85 ? Math.min(1, (throttle - 85) / 15 + 0.4) : 1} />
              <text x={16} y={-11.5} textAnchor="middle"
                fill={throttle > 85 ? color : '#0c1e2e'}
                fontSize={3} fontFamily="monospace" fontWeight="700">
                THR
              </text>

              {/* ─ Speed readout ─ */}
              <text textAnchor="middle" y={3} fill="#ccddf0"
                fontSize={17} fontFamily="monospace" fontWeight="700">
                {Math.round(speed)}
              </text>
              <text textAnchor="middle" y={10} fill="#2a4050"
                fontSize={5.5} fontFamily="monospace">
                km/h
              </text>

              {/* ─ Bottom button row ─ */}
              <rect x={-23} y={14} width={15} height={7} rx={2}
                fill="#0d1b28" stroke="#1e2e3e" strokeWidth={0.7} />
              <rect x={-6}  y={14} width={13} height={7} rx={2}
                fill={color} opacity={0.35} />

              {/* ─ Rotary dial (bottom-right of panel) ─ */}
              <circle cx={18} cy={18} r={6} fill="#0a1720" stroke="#1a2a3a" strokeWidth={1} />
              <circle cx={18} cy={18} r={3.5} fill="#07121e" />
              <rect x={17} y={12} width={2} height={4} rx={1} fill="#243848" />
            </g>
          </svg>

          {/* Gear indicator — outside the rotating group so it stays upright */}
          <div className="hud-gear" style={{ color }}>{gear > 0 ? gear : 'N'}</div>
        </div>

        {/* ── Throttle bar ── */}
        <div className="hud-pedal-col">
          <div className="hud-pedal-track">
            <div className="hud-pedal-fill throttle" style={{ height: `${Math.round(throttle)}%` }} />
          </div>
          <span className="hud-pedal-label">THR</span>
        </div>
      </div>

      {/* Active aero status row */}
      <div className={`hud-aero ${aeroActive ? 'active' : 'inactive'}`}>
        <span className="hud-aero-dot" />
        <span className="hud-aero-label">{aeroActive ? 'ACTIVE AERO ON' : 'AERO CLOSED'}</span>
      </div>

      {/* Pedal % text */}
      <div className="hud-inputs-text">
        <span style={{ color: '#ef5350' }}>BRK {brake ? '100' : '  0'}%</span>
        <span style={{ color: '#66bb6a' }}>THR {Math.round(throttle).toString().padStart(3, ' ')}%</span>
      </div>
    </div>
  )
}
