type AppView = 'telemetry' | 'standings' | 'calendar' | 'results' | 'drivers' | 'teams' | 'circuits' | 'pace' | 'pace2' | 'insights' | 'challenge' | 'privacy' | 'about' | 'disclaimer'

interface Props {
  active: AppView
  onNav: (v: AppView) => void
}

const NAV: { id: AppView; icon: string; label: string; title: string }[] = [
  { id: 'telemetry', icon: '🏁', label: 'Track',     title: 'Telemetry' },
  { id: 'standings', icon: '🏆', label: 'Standings', title: 'Standings' },
  { id: 'calendar',  icon: '🗓',  label: 'Calendar',  title: 'Calendar' },
  { id: 'results',   icon: '📋', label: 'Results',   title: 'Race Results' },
  { id: 'drivers',   icon: '👤', label: 'Drivers',   title: 'Drivers' },
  { id: 'teams',     icon: '🏎', label: 'Teams',     title: 'Teams' },
  { id: 'circuits',  icon: '🗺',  label: 'Circuits',  title: 'Circuits' },
  { id: 'pace',      icon: '📊', label: 'Pace',      title: 'Pace Analysis' },
  { id: 'pace2',     icon: '🔮', label: 'Predict',   title: 'Predictions' },
  { id: 'insights',   icon: '📝', label: 'Insights',  title: 'Race Insights' },
  { id: 'challenge',  icon: '🎯', label: 'Challenge', title: 'Daily Telemetry Challenge' },
]

export default function Sidebar({ active, onNav }: Props) {
  return (
    <nav className="sidebar">
      {NAV.map(({ id, icon, label, title }) => (
        <button
          key={id}
          className={`sidebar-btn ${active === id ? 'active' : ''}`}
          title={title}
          onClick={() => onNav(id)}
        >
          <span className="sidebar-icon">{icon}</span>
          <span className="sidebar-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}

export type { AppView }
