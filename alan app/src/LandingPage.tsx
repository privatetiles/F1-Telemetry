import type { CSSProperties } from 'react'
import './LandingPage.css'
import './Homepage.css'
import Icon, { type IconName } from './components/Icon'
import HomePreview, { type PreviewKind } from './components/HomePreview'

interface HomeSection {
  title: string
  description: string
  action: string
  href: string
  icon: IconName
  preview: PreviewKind
  accent: string
}

const SECTIONS: HomeSection[] = [
  { title: 'Track', description: 'Go beyond the broadcast. Replay laps, compare drivers, and follow every input around the circuit.', action: 'Open the visualizer', href: '#telemetry', icon: 'track', preview: 'track', accent: '#38bdf8' },
  { title: 'Predictions', description: 'Look ahead to the next lights out. Explore how circuit characteristics shape the pecking order.', action: 'Explore predictions', href: '#pace2', icon: 'predict', preview: 'predictions', accent: '#a78bfa' },
  { title: 'Games & Trivia', description: 'Identify circuits, test your F1 knowledge, and take on the daily challenge—all in one place.', action: 'Play games & trivia', href: '?game=circuit#games', icon: 'games', preview: 'games', accent: '#a78bfa' },
  { title: 'Pace Analysis', description: 'Compare team pace across slow corners, fast corners, and straights. See where time is won and lost.', action: 'Compare the pace', href: '#pace', icon: 'pace', preview: 'pace', accent: '#f97316' },
  { title: 'Calendar', description: 'Your season, at a glance. Find race weekends and jump straight into the action.', action: 'See the calendar', href: '#calendar', icon: 'calendar', preview: 'calendar', accent: '#ff615a' },
  { title: 'Circuits', description: 'From tight street circuits to flat-out classics. Get to know the tracks behind the racing.', action: 'Explore the circuits', href: '#circuits', icon: 'circuits', preview: 'circuits', accent: '#38bdf8' },
  { title: 'Standings', description: 'Follow the championship picture. See how the drivers and teams stack up across the season.', action: 'View the standings', href: '#standings', icon: 'standings', preview: 'standings', accent: '#facc15' },
  { title: 'Results', description: 'Every finish has a story. Explore race results, qualifying sessions, and the weekend in numbers.', action: 'Explore race results', href: '#results', icon: 'results', preview: 'results', accent: '#ff615a' },
  { title: 'Discord', description: 'Keep the conversation going. Share discoveries, debate the data, and meet other fans.', action: 'Join the conversation', href: 'https://discord.gg/EkM8cCJeP', icon: 'socials', preview: 'discord', accent: '#969cff' },
  { title: 'About Us', description: 'A fan-made project with a shared obsession. Discover the story behind the data and how it all works.', action: 'Get to know F1vis', href: '/about/', icon: 'teams', preview: 'about', accent: '#ff615a' },
]

export default function LandingPage() {
  return (
    <div className="landing homepage" id="home">
      <a className="home-skip" href="#explore">Skip to sections</a>
      <header className="home-nav">
        <a className="home-brand" href="#home" aria-label="F1vis home"><b>F1</b><span>vis.app</span></a>
        <nav className="home-nav-links" aria-label="Main navigation">
          <a href="#explore">Explore</a><a href="#calendar">Race calendar</a><a href="/about/">About</a>
        </nav>
        <a className="home-nav-cta" href="#telemetry">Open telemetry <Icon name="arrow-right" size={14} /></a>
      </header>

      <main>
        <section className="home-hero home-directory-intro" aria-labelledby="home-title">
          <div className="home-eyebrow"><span /> THE RACE. A CLOSER LOOK.</div>
          <h1 id="home-title">Every lap.<br className="home-mobile-break" /> <span>Every driver.</span></h1>
          <p className="home-intro">Explore 2026 race data, from qualifying to the chequered flag. Visualize inputs, compare pace, and see exactly where tenths are won and lost.</p>
          <div className="home-sector-rail" aria-hidden="true">
            {Array.from({ length: 42 }, (_, i) => <span key={i} className={`home-sector-${['slow', 'fast', 'straight', 'fast', 'straight', 'slow', 'straight'][i % 7]}`} />)}
          </div>
        </section>

        <section className="home-explore" id="explore" aria-labelledby="explore-title">
          <div className="home-section-heading">
            <div><p className="home-kicker">YOUR PADDOCK PASS</p><h2 id="explore-title">Pick your starting point.</h2></div>
            <span className="home-preview-note">Illustrative section previews</span>
          </div>
          <div className="home-grid">
            {SECTIONS.map((section, index) => {
              const external = section.href.startsWith('https://')
              return (
                <a key={section.title} className={`home-card home-card-${section.preview}`} href={section.href} style={{ '--card-accent': section.accent } as CSSProperties} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
                  <div className="home-card-content">
                    <div className="home-card-meta"><Icon name={section.icon} size={20} /><span>{String(index + 1).padStart(2, '0')}</span></div>
                    <h3>{section.title}</h3>
                    <p>{section.description}</p>
                    <span className="home-card-action">{section.action} <Icon name="arrow-right" size={14} />{external && <span className="home-sr-only"> (opens in a new tab)</span>}</span>
                  </div>
                  <HomePreview kind={section.preview} />
                </a>
              )
            })}
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-footer-top"><div className="home-footer-brand"><b>F1<span>vis.</span></b><span>For the love of the race.</span></div><nav aria-label="Footer navigation"><a href="/about/">About</a><a href="/privacy/">Privacy</a><a href="/disclaimer/">Disclaimer</a></nav></div>
        <p>A fan-made project, powered by FastF1. Not affiliated with Formula 1, the FIA, or any team.</p>
      </footer>
    </div>
  )
}
