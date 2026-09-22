import { useEffect, useState } from 'react'
import Icon from './Icon'

export type PreviewKind = 'predictions' | 'track' | 'pace' | 'calendar' | 'circuits' | 'standings' | 'results' | 'games' | 'discord' | 'about'

function CircuitOutline({ circuit, animated = false }: { circuit: string; animated?: boolean }) {
  const [path, setPath] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/track_outlines/${circuit}.json`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Circuit preview unavailable')
        return response.json() as Promise<{ points: { x: number; y: number }[] }>
      })
      .then(({ points }) => {
        if (!points?.length || controller.signal.aborted) return
        const minX = Math.min(...points.map(point => point.x))
        const minY = Math.min(...points.map(point => point.y))
        const width = Math.max(...points.map(point => point.x)) - minX
        const height = Math.max(...points.map(point => point.y)) - minY
        const scale = Math.min(190 / (width || 1), 145 / (height || 1))
        setPath(points.map((point, index) => {
          const x = (point.x - minX) * scale + (240 - width * scale) / 2
          const y = 175 - (point.y - minY) * scale - (175 - height * scale) / 2
          return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
        }).join(' ') + ' Z')
      })
      .catch(() => { /* Decorative preview: keep the section usable if its outline is unavailable. */ })
    return () => controller.abort()
  }, [circuit])

  if (!path) return <span className="home-outline-placeholder"><Icon name="track" size={64} /></span>
  return (
    <svg className="home-outline" viewBox="0 0 240 175" fill="none">
      <path d={path} stroke="#243342" strokeWidth="7" strokeLinejoin="round" />
      <path d={path} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {animated && <path className="home-lap-trace" d={path} pathLength="100" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 98" />}
    </svg>
  )
}

export default function HomePreview({ kind }: { kind: PreviewKind }) {
  return (
    <div className={`home-preview home-preview-${kind}`} aria-hidden="true">
      {kind === 'predictions' && <div className="home-mini-chart">
        <div className="home-preview-label">THE PACE PICTURE <span>↗</span></div>
        {[['Slow corners', 72, 55], ['Fast corners', 52, 77], ['Straights', 90, 69]].map(([label, first, second], i) => <div className={`home-chart-row home-chart-row-${i}`} key={label}><span>{label}</span><div><i style={{ width: `${first}%` }} /><i style={{ width: `${second}%` }} /></div></div>)}
        <div className="home-mini-caption">COMPARE. PROJECT. EXPLORE.</div>
      </div>}
      {kind === 'track' && <><div className="home-preview-label">LAP REPLAY <span>MONZA</span></div><CircuitOutline circuit="italian" animated /><div className="home-replay-controls"><span>▶</span><i /><span>↻</span></div></>}
      {kind === 'pace' && <div className="home-mini-chart">
        <div className="home-preview-label">PACE COMPARISON <Icon name="pace" size={12} /></div>
        <svg className="home-pace-chart" viewBox="0 0 200 135" fill="none">
          <path d="M0 25H200M0 60H200M0 95H200M40 10V120M100 10V120M160 10V120" stroke="#253141" strokeWidth="1" />
          <path d="M0 67L18 58L35 69L53 38L70 47L88 31L106 48L124 39L142 62L160 45L179 28L200 34" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M0 67L18 76L35 61L53 81L70 72L88 88L106 69L124 78L142 60L160 85L179 76L200 97" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
        <div className="home-mini-caption">SLOW CORNERS · FAST CORNERS · STRAIGHTS</div>
      </div>}
      {kind === 'calendar' && <div className="home-mini-calendar"><div className="home-calendar-binding"><i /><i /></div><div className="home-preview-label">RACE WEEKENDS <Icon name="calendar" size={12} /></div>{[['FRI', 'Practice'], ['SAT', 'Qualifying'], ['SUN', 'Grand Prix']].map(([day, session]) => <div className="home-calendar-row" key={day}><b>{day}</b><span>{session}</span><i /></div>)}</div>}
      {kind === 'circuits' && <div className="home-circuit-pair"><div><CircuitOutline circuit="british" /><span>SILVERSTONE</span></div><div><CircuitOutline circuit="japan" /><span>SUZUKA</span></div></div>}
      {kind === 'standings' && <><div className="home-preview-label">THE CHAMPIONSHIP CHASE</div><div className="home-podium"><div><span>02</span></div><div><Icon name="standings" size={27} /><span>01</span></div><div><span>03</span></div></div></>}
      {kind === 'results' && <div className="home-mini-results"><div className="home-checker" /><div className="home-preview-label">TO THE CHEQUERED FLAG</div>{[1, 2, 3].map(position => <div className="home-result-row" key={position}><b>0{position}</b><i /><span /></div>)}</div>}
      {kind === 'games' && <><div className="home-preview-label">CIRCUITS · TRIVIA · CHALLENGES</div><CircuitOutline circuit="austrian" /><div className="home-game-options">{['A', 'B', 'C', 'D'].map(letter => <span key={letter}>{letter}<i /></span>)}</div></>}
      {kind === 'discord' && <div className="home-chat"><div className="home-preview-label"><span className="home-online-dot" /> THE PADDOCK CHAT</div><div className="home-chat-message"><i /><span>Did you see that last lap?</span></div><div className="home-chat-message"><i /><span>Let’s look at the data.</span></div><div className="home-chat-typing"><i /><i /><i /></div></div>}
      {kind === 'about' && <div className="home-about-preview"><div className="home-about-mark">F1<span>vis.</span></div><div className="home-mini-caption">BUILT BY FANS. MADE FOR FANS.</div><div className="home-about-rule" /><span>Curiosity meets racing.</span></div>}
    </div>
  )
}
