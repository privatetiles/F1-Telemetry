import './LandingPage.css'
import './WelcomePage.css'
import Icon from './components/Icon'

export default function WelcomePage() {
  return (
    <div className="landing welcome-page">
      <header className="land-nav">
        <a className="land-logo" href="/" aria-label="F1vis welcome">
          <span className="land-logo-f1">F1</span>
          <span className="land-logo-text">Telemetry</span>
        </a>
        <a className="welcome-about" href="/about/">About Us</a>
      </header>
      <main className="land-hero">
        <div className="land-hero-body">
          <div className="land-eyebrow">2026 race data</div>
          <h1 className="land-headline">F1 telemetry,<br />made readable.</h1>
          <p className="land-sub">
            Replay races, compare drivers, and understand where the time was won.
            One focused workspace for track position, inputs, pace, and strategy.
          </p>
          <a className="land-cta" href="#home">
            Open Visualizer <Icon name="arrow-right" size={18} />
          </a>
          <p className="land-hint">No account needed · Free to use</p>
        </div>
        <div className="land-sector-deco" aria-hidden="true">
          {Array.from({ length: 32 }, (_, index) => {
            const category = ['slow', 'fast', 'str', 'fast', 'slow', 'str', 'fast', 'str'][index % 8]
            return <div key={index} className={`land-sector-cell land-sector-${category}`} />
          })}
        </div>
      </main>
    </div>
  )
}
