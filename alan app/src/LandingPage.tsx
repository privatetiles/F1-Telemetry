import './LandingPage.css'
import Icon, { type IconName } from './components/Icon'

interface Props {
  onEnter: () => void
}

const FEATURES = [
  {
    icon: 'track' as IconName,
    title: 'Real telemetry data',
    body: 'FastF1-sourced qualifying and race fastest laps for all 22 drivers, every round of the 2026 season.',
  },
  {
    icon: 'circuits' as IconName,
    title: 'Live track playback',
    body: 'Animate any lap on an accurate circuit outline. Watch steering, throttle, brake, and DRS update frame-by-frame.',
  },
  {
    icon: 'pace' as IconName,
    title: 'Three-class pace analysis',
    body: 'Track segments split into Slow Corners, Fast Corners, and Straights. See exactly where each team gains or loses time.',
  },
  {
    icon: 'predict' as IconName,
    title: 'Season predictions',
    body: 'Pace projections for upcoming rounds, weighted by historical performance at circuit types matching the next venue.',
  },
]

export default function LandingPage({ onEnter }: Props) {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="land-nav">
        <div className="land-logo">
          <span className="land-logo-f1">F1</span>
          <span className="land-logo-text">Telemetry</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="land-hero">
        <div className="land-hero-body">
          <div className="land-eyebrow">2026 race data</div>
          <h1 className="land-headline">
            F1 telemetry,<br />made readable.
          </h1>
          <p className="land-sub">
            Replay races, compare drivers, and understand where the time was won.
            One focused workspace for track position, inputs, pace, and strategy.
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

      {/* Features */}
      <section className="land-features">
        <p className="land-features-label">What's inside</p>
        <div className="land-feature-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="land-feature-card">
              <span className="land-feature-icon"><Icon name={f.icon} size={20} /></span>
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
