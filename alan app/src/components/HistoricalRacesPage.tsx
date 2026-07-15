import { CIRCUITS } from '../lib/dataIndex'
import type { CircuitConfig } from '../types'

interface Battle {
  circuitId: string | null
  year: number
  flag: string
  name: string
  subtitle: string
  description: string
  highlight: string
  tags: string[]
}

const BATTLES: Battle[] = [
  {
    circuitId: 'abu_dhabi_2021',
    year: 2021,
    flag: '🇦🇪',
    name: 'Abu Dhabi Grand Prix',
    subtitle: 'The Title Decider',
    description: 'Hamilton and Verstappen arrived at Yas Marina equal on points. With five laps to go, Hamilton was cruising to victory and the title. Then a safety car. Then a controversial restart that unlapped only the cars between them. Verstappen — on fresh softs — attacked on Lap 58, passed Hamilton into Turn 5, and took the Championship on the final corner of the season.',
    highlight: 'Title decided on the last lap',
    tags: ['Title Fight', 'Controversy', 'Last Lap'],
  },
  {
    circuitId: 'austrian_2025',
    year: 2025,
    flag: '🇦🇹',
    name: 'Austrian Grand Prix',
    subtitle: 'Red Bull Ring Carnage',
    description: 'The 2025 season\'s most chaotic race. Multiple retirements, a mid-race safety car, and a furious last-stint battle at the Red Bull Ring produced unpredictable strategic swings and a nail-biting finale in the new ground-effect hybrid era.',
    highlight: 'Non-stop action at home of Red Bull',
    tags: ['2025 Season', 'Strategy', 'Retirements'],
  },
  {
    circuitId: 'brazilian_2021',
    year: 2021,
    flag: '🇧🇷',
    name: 'Brazilian Grand Prix',
    subtitle: 'Parc Fermé Controversy',
    description: 'Verstappen disqualified from qualifying for inspecting Hamilton\'s rear wing. Hamilton given two grid penalties. He drove from P10 twice in 24 hours to win on Sunday — the most relentless display of raw pace in that entire title fight.',
    highlight: 'Hamilton from P10 to the win',
    tags: ['Penalties', 'Fightback', '2021 Season'],
  },
  {
    circuitId: 'japanese_2022',
    year: 2022,
    flag: '🇯🇵',
    name: 'Japanese Grand Prix',
    subtitle: 'Championship Chaos at Suzuka',
    description: 'Rain, crashes, a tractor on track, and a disputed podium. Verstappen won his second Drivers\' Championship in bizarre circumstances — the result was only confirmed hours after the chequered flag due to a points-adjustment controversy involving Leclerc.',
    highlight: 'Title decided under investigation',
    tags: ['Wet Race', 'Controversy', 'Championship'],
  },
  {
    circuitId: 'las_vegas_2023',
    year: 2023,
    flag: '🇺🇸',
    name: 'Las Vegas Grand Prix',
    subtitle: 'The Strip at Night',
    description: 'F1\'s first Las Vegas race since 1982 did not disappoint. A drain cover ended Sainz\'s race in practice, the start was delayed by two hours, and Leclerc vs Verstappen lit up the Strip. One of the most-watched F1 races in American television history.',
    highlight: 'Leclerc vs Verstappen under the lights',
    tags: ['Night Race', 'Street Circuit', 'Drama'],
  },
]

interface Props {
  onWatchReplay: (circuit: CircuitConfig) => void
}

export default function HistoricalRacesPage({ onWatchReplay }: Props) {
  return (
    <div className="historical-page">
      <div className="historical-header">
        <h1 className="historical-title">
          <span className="historical-hash">#</span>historicalraces
        </h1>
        <p className="historical-subtitle">
          Full-race telemetry replays of the most iconic battles in recent F1 history.
        </p>
      </div>

      <div className="historical-grid">
        {BATTLES.map((battle) => {
          const circuit = battle.circuitId
            ? CIRCUITS.find(c => c.id === battle.circuitId) ?? null
            : null
          const available = circuit !== null

          return (
            <div key={`${battle.year}-${battle.flag}`} className={`battle-card ${available ? '' : 'battle-card-locked'}`}>
              <div className="battle-card-header">
                <span className="battle-year">{battle.year}</span>
                <span className="battle-flag">{battle.flag}</span>
                {!available && <span className="battle-coming-soon">Coming Soon</span>}
              </div>

              <div className="battle-card-body">
                <div className="battle-name">{battle.name}</div>
                <div className="battle-subtitle-text">{battle.subtitle}</div>
                <p className="battle-description">{battle.description}</p>

                <div className="battle-highlight">
                  <span className="battle-highlight-icon">⚡</span>
                  {battle.highlight}
                </div>

                <div className="battle-tags">
                  {battle.tags.map(tag => (
                    <span key={tag} className="battle-tag">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="battle-card-footer">
                {available ? (
                  <button
                    className="battle-watch-btn"
                    onClick={() => circuit && onWatchReplay(circuit)}
                  >
                    ▶ Watch Full Race Replay
                  </button>
                ) : (
                  <button className="battle-watch-btn battle-watch-locked" disabled>
                    Data coming soon
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
