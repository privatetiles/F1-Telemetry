import { useEffect, useRef } from 'react'
import AdSlot from './components/AdSlot'
import './LandingPage.css'

interface Props {
  onEnter: () => void
}

const FEATURES = [
  {
    icon: '⏱',
    title: 'Real telemetry data',
    body: 'FastF1-sourced qualifying and race fastest laps for all 22 drivers, every round of the 2026 season.',
  },
  {
    icon: '🗺',
    title: 'Live track playback',
    body: 'Animate any lap on an accurate circuit outline. Watch steering, throttle, brake, and DRS update frame-by-frame.',
  },
  {
    icon: '📊',
    title: 'Three-class pace analysis',
    body: 'Track segments split into Slow Corners, Fast Corners, and Straights. See exactly where each team gains or loses time.',
  },
  {
    icon: '🔮',
    title: 'Season predictions',
    body: 'Pace projections for upcoming rounds, weighted by historical performance at circuit types matching the next venue.',
  },
]

export default function LandingPage({ onEnter }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Subtle animated particle grid
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let raf: number

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      const cols = Math.ceil(width  / 48)
      const rows = Math.ceil(height / 48)

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const x = c * 48
          const y = r * 48
          const wave = Math.sin((c + r) * 0.4 + frame * 0.018) * 0.5 + 0.5
          const alpha = wave * 0.12 + 0.02
          ctx.fillStyle = `rgba(225, 6, 0, ${alpha})`
          ctx.beginPath()
          ctx.arc(x, y, 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      frame++
      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="land-nav">
        <div className="land-logo">
          <span className="land-logo-f1">F1</span>
          <span className="land-logo-text">Telemetry</span>
        </div>
        <button className="land-nav-btn" onClick={onEnter}>Launch App</button>
      </nav>

      {/* Hero */}
      <section className="land-hero">
        <canvas ref={canvasRef} className="land-hero-canvas" />
        <div className="land-hero-body">
          <div className="land-eyebrow">2026 Season · Live Data</div>
          <h1 className="land-headline">
            Every lap.<br />Every driver.
          </h1>
          <p className="land-sub">
            Full telemetry from every 2026 F1 race weekend — qualifying and race fastest laps
            for the complete grid. Visualize inputs, compare pace, and see exactly
            where tenths are won and lost.
          </p>
          <button className="land-cta" onClick={onEnter}>
            Open Visualizer
            <svg className="land-cta-arrow" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="land-hint">No account needed · Free to use</p>
        </div>

        {/* Decorative sector bar */}
        <div className="land-sector-deco" aria-hidden>
          {Array.from({ length: 32 }, (_, i) => {
            const cats = ['slow', 'fast', 'str', 'fast', 'slow', 'str', 'fast', 'str']
            const cat = cats[i % cats.length]
            return <div key={i} className={`land-sector-cell land-sector-${cat}`} />
          })}
        </div>
      </section>

      {/* Stats bar */}
      <div className="land-stats">
        {[
          { num: '22', label: 'Drivers' },
          { num: '8+', label: 'Circuits' },
          { num: '3', label: 'Track classes' },
          { num: '2026', label: 'Season' },
        ].map(s => (
          <div key={s.label} className="land-stat">
            <span className="land-stat-num">{s.num}</span>
            <span className="land-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Ad */}
      <div className="land-ad-row">
        <AdSlot size="leaderboard" />
      </div>

      {/* Features */}
      <section className="land-features">
        <p className="land-features-label">What's inside</p>
        <div className="land-feature-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="land-feature-card">
              <span className="land-feature-icon">{f.icon}</span>
              <h3 className="land-feature-title">{f.title}</h3>
              <p className="land-feature-body">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="land-banner">
        <span className="land-banner-text">Ready to dig in?</span>
        <button className="land-cta land-cta-sm" onClick={onEnter}>
          Open Visualizer
          <svg className="land-cta-arrow" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      {/* Footer */}
      <footer className="land-footer">
        <span>Built with FastF1 · 2026 Formula 1 Season</span>
        <span className="land-footer-sep">·</span>
        <span>Data updates after each race weekend</span>
      </footer>
    </div>
  )
}
