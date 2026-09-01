import Icon, { type IconName } from './Icon'

type AppView = 'telemetry' | 'standings' | 'calendar' | 'results' | 'drivers' | 'teams' | 'circuits' | 'pace' | 'pace2' | 'insights' | 'games' | 'historicalraces' | 'socials' | 'changelog'

interface Props {
  active: AppView
  onNav: (v: AppView) => void
}

const NAV: Array<{ heading: string; items: Array<{ id: AppView; icon: IconName; label: string; title: string }> }> = [
  { heading: 'Race', items: [
    { id: 'telemetry', icon: 'track', label: 'Telemetry', title: 'Telemetry replay' },
    { id: 'results', icon: 'results', label: 'Results', title: 'Race results' },
    { id: 'standings', icon: 'standings', label: 'Standings', title: 'Championship standings' },
    { id: 'calendar', icon: 'calendar', label: 'Calendar', title: 'Race calendar' },
  ] },
  { heading: 'Explore', items: [
    { id: 'drivers', icon: 'drivers', label: 'Drivers', title: 'Drivers' },
    { id: 'teams', icon: 'teams', label: 'Teams', title: 'Teams' },
    { id: 'circuits', icon: 'circuits', label: 'Circuits', title: 'Circuits' },
    { id: 'insights', icon: 'insights', label: 'Insights', title: 'Race insights' },
    { id: 'games', icon: 'games', label: 'Games', title: 'F1 games' },
  ] },
  { heading: 'Analysis', items: [
    { id: 'pace', icon: 'pace', label: 'Pace analysis', title: 'Pace analysis' },
    { id: 'pace2', icon: 'predict', label: 'Predictions', title: 'Predictions' },
    { id: 'historicalraces', icon: 'classics', label: 'Classic races', title: 'Historic race replays' },
  ] },
  { heading: 'More', items: [
    { id: 'socials', icon: 'socials', label: 'Community', title: 'Community' },
    { id: 'changelog', icon: 'updates', label: 'Updates', title: 'Product updates' },
  ] },
]

export default function Sidebar({ active, onNav }: Props) {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      {NAV.map(({ heading, items }) => (
        <div className="sidebar-group" key={heading}>
          <span className="sidebar-heading">{heading}</span>
          {items.map(({ id, icon, label, title }) => (
            <button
              key={id}
              className={`sidebar-btn ${active === id ? 'active' : ''}`}
              title={title}
              onClick={() => onNav(id)}
              aria-current={active === id ? 'page' : undefined}
            >
              <span className="sidebar-icon"><Icon name={icon} size={18} /></span>
              <span className="sidebar-label">{label}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  )
}

export type { AppView }
