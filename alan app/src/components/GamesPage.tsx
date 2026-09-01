import { useState, useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { CIRCUIT_DATA } from '../lib/circuitData'
import DailyChallenge from './DailyChallenge'
import { supabase } from '../lib/supabase'

interface Props {
  authUser: User | null
  onSignIn?: () => void
}

type GameTab = 'circuit' | 'whoami' | 'trivia' | 'challenge' | 'leaderboard'

// ── Helpers ──────────────────────────────────────────────────────────────────

const CIRCUIT_KEYS = Object.keys(CIRCUIT_DATA)

function pickOptions(correct: string, all: string[], n = 4): string[] {
  const pool = all.filter(k => k !== correct)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return [correct, ...shuffled.slice(0, n - 1)].sort(() => Math.random() - 0.5)
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeCircuitRound() {
  const key = CIRCUIT_KEYS[Math.floor(Math.random() * CIRCUIT_KEYS.length)]
  return { key, options: pickOptions(key, CIRCUIT_KEYS) }
}

// ── Daily limit helpers ───────────────────────────────────────────────────────

const MAX_DAILY = 5
const DAILY_KEYS = { circuit: 'f1vis_daily_circuit', whoami: 'f1vis_daily_whoami' }
const FINAL_KEYS = { circuit: 'f1vis_final_circuit', whoami: 'f1vis_final_whoami' }

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getDailyPlays(game: 'circuit' | 'whoami'): number {
  try {
    const raw = localStorage.getItem(DAILY_KEYS[game])
    if (!raw) return 0
    const { date, count } = JSON.parse(raw)
    return date === getTodayStr() ? (count as number) : 0
  } catch { return 0 }
}

function incrementDailyPlays(game: 'circuit' | 'whoami'): number {
  const next = getDailyPlays(game) + 1
  localStorage.setItem(DAILY_KEYS[game], JSON.stringify({ date: getTodayStr(), count: next }))
  return next
}

function getDailyScore(game: 'circuit' | 'whoami'): number {
  try {
    const raw = localStorage.getItem(`f1vis_score_${game}`)
    if (!raw) return 0
    const { date, score } = JSON.parse(raw)
    return date === getTodayStr() ? (score as number) : 0
  } catch { return 0 }
}

function saveDailyScore(game: 'circuit' | 'whoami', score: number) {
  localStorage.setItem(`f1vis_score_${game}`, JSON.stringify({ date: getTodayStr(), score }))
}

function getDailyFinal(game: 'circuit' | 'whoami'): { score: number; maxScore: number } | null {
  try {
    const raw = localStorage.getItem(FINAL_KEYS[game])
    if (!raw) return null
    const { date, score, maxScore } = JSON.parse(raw)
    return date === getTodayStr() ? { score, maxScore } : null
  } catch { return null }
}

function saveDailyFinal(game: 'circuit' | 'whoami', score: number, maxScore: number) {
  localStorage.setItem(FINAL_KEYS[game], JSON.stringify({ date: getTodayStr(), score, maxScore }))
}

function timeUntilMidnight(): string {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const ms = midnight.getTime() - now.getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

async function submitScore(userId: string, displayName: string, gameType: 'circuit' | 'whoami', score: number, maxScore: number) {
  await supabase.from('game_scores').upsert(
    { user_id: userId, display_name: displayName, game_type: gameType, score, max_score: maxScore, date: getTodayStr() },
    { onConflict: 'user_id,game_type,date' },
  )
}

// ── Daily-over screen ─────────────────────────────────────────────────────────

interface DailyOverProps {
  gameType: 'circuit' | 'whoami'
  score: number
  maxScore: number
  authUser: User | null
  onSignIn?: () => void
  submitted: boolean
}

function DailyOverScreen({ gameType, score, maxScore, authUser, onSignIn, submitted }: DailyOverProps) {
  const label = gameType === 'circuit' ? 'Circuit ID' : 'Who Am I?'
  const pct = score / maxScore
  const msg =
    pct === 1 ? 'Perfect score!' :
    pct >= 0.8 ? 'Great session!' :
    pct >= 0.5 ? 'Solid effort!' : 'Keep practicing!'
  return (
    <div className="game-area">
      <div className="game-card game-finished">
        <p className="game-finish-headline">Today's {label} is complete</p>
        <p className="game-finish-score">
          {gameType === 'circuit' ? `${score} / ${maxScore} correct` : `${score} / ${maxScore} pts`}
        </p>
        <p className="game-finish-msg">{msg}</p>
        {submitted ? (
          <p className="daily-over-saved">✓ Score saved to leaderboard</p>
        ) : authUser ? (
          <p className="daily-over-saved">✓ Score saved</p>
        ) : (
          <button className="game-next-btn" onClick={onSignIn}>Sign in to save score</button>
        )}
        <p className="daily-over-reset">Resets in {timeUntilMidnight()}</p>
      </div>
    </div>
  )
}

// ── Driver puzzles ────────────────────────────────────────────────────────────

interface DriverPuzzle {
  answer: string
  clues: string[]
}

const DRIVER_PUZZLES: DriverPuzzle[] = [
  {
    answer: 'Lando Norris',
    clues: [
      'My race number is 4 and I am well known for streaming video games online between race weekends — something very few F1 drivers do publicly.',
      'I am British, born in the Bristol area in 1999, and I have raced for the same team since my very first Formula 1 season.',
      'In 2021 at the Russian Grand Prix, I was leading comfortably with a few laps to go when a late safety car cost me what should have been my first win.',
      'I finally broke my victory drought at the 2024 Miami Grand Prix, ending years of agonisingly close calls.',
    ],
  },
  {
    answer: 'Oscar Piastri',
    clues: [
      'I am the only driver in Formula 1 history to win the Formula 3 and Formula 2 championships in back-to-back seasons.',
      'I am Australian, from Melbourne, and I spent an entire year as a reserve driver in 2022 — champion, but not allowed to race.',
      'In the summer of 2022, a team publicly announced I would drive for them the next season. I publicly denied it the very same day.',
      'My race number is 81 and teammates describe me as unusually calm under pressure — some say I have a poker face behind the visor.',
    ],
  },
  {
    answer: 'Max Verstappen',
    clues: [
      'My father competed in Formula 1 in the 1990s and early 2000s and I carry exactly the same surname.',
      'I am Dutch and I became the youngest driver in Formula 1 history to start a race, aged 17 years and 166 days.',
      'I won my first Grand Prix at the 2016 Spanish GP on debut for my new team — the same race where two silver cars collided and retired on the opening lap.',
      'I won four consecutive World Championships from 2021 to 2024 and now carry the coveted number 1 on my car.',
    ],
  },
  {
    answer: 'Lewis Hamilton',
    clues: [
      'I hold the all-time records for both race wins and pole positions in Formula 1 — records that still stood entering the 2026 season.',
      'I was awarded a knighthood, making me Sir Lewis — an honour no other currently active Formula 1 driver holds.',
      'I spent over a decade at a Brackley-based team and won six of my seven championships with them before a move to Ferrari for 2025.',
      'I grew up in Stevenage, England, and was the first Black driver in the history of Formula 1.',
    ],
  },
  {
    answer: 'George Russell',
    clues: [
      'I earned the nickname "Mr. Saturday" early in my career for consistently out-qualifying my teammate despite driving the slowest car on the grid.',
      'I am British, won the Formula 2 championship in my debut season in 2018, then spent three years at a Grove-based team before being promoted to Mercedes.',
      'In 2020, I substituted for a seven-time world champion at the Bahrain Sakhir Grand Prix in a car I had never driven — and very nearly won.',
      'My race number is 63 and I took my maiden Grand Prix victory in Brazil in 2022.',
    ],
  },
  {
    answer: 'Charles Leclerc',
    clues: [
      'I was born in Monte Carlo — the city that hosts the most glamorous race on the calendar — and I have won the Monaco Grand Prix.',
      'I am the godson of Jules Bianchi, the talented French driver who inspired me and who tragically died following the 2014 Japanese Grand Prix.',
      'I drive for the team with the prancing horse emblem and have been their lead driver since 2019, when I won on my debut for them in Bahrain.',
      'My race number is 16 and I was teammates with Kimi Räikkönen in my first Ferrari season before Sebastian Vettel joined the following year.',
    ],
  },
  {
    answer: 'Fernando Alonso',
    clues: [
      'I ended Michael Schumacher\'s run of five consecutive World Championships in 2005, becoming the youngest Formula 1 champion in history at the time — aged just 24.',
      'I am Spanish, from Oviedo in Asturias, and I am the oldest driver still competing on the 2026 Formula 1 grid.',
      'I won the 24 Hours of Le Mans twice with Porsche and have attempted the Indianapolis 500 multiple times in pursuit of motorsport\'s Triple Crown.',
      'I currently race for a British team that competes in dark British Racing Green and is best known for making some of the world\'s most celebrated grand touring cars.',
    ],
  },
  {
    answer: 'Kimi Antonelli',
    clues: [
      'I was born in Bologna, Italy in 2006 — making me one of the youngest drivers in Formula 1 history when I made my debut.',
      'I was signed to a manufacturer\'s driver academy at just 13 years old, years before I had any major junior title to my name.',
      'I made my Formula 1 debut in 2025 at the team based in Brackley, replacing a driver who had won six consecutive World Championships with them.',
      'My full name is Andrea Kimi Antonelli — the middle name a tribute paid to a Finnish world champion who inspired my family.',
    ],
  },
  {
    answer: 'Carlos Sainz',
    clues: [
      'My father is a two-time World Rally Championship winner who shares my first name and surname exactly — we are a family of motorsport champions.',
      'I am Spanish, and I won my first Formula 1 Grand Prix at Silverstone in 2022 — just days after being discharged from hospital following emergency appendix surgery.',
      'I have raced for six different Formula 1 teams, including Red Bull\'s junior team, Renault, McLaren, and Ferrari, before my current seat.',
      'My race number is 55 and I currently drive for a Grove-based team whose car is predominantly white.',
    ],
  },
  {
    answer: 'Sergio Pérez',
    clues: [
      'I am Mexican, from Guadalajara, and I am by far the most successful Mexican driver in the history of Formula 1.',
      'My nickname is "Checo" and I drove for the same team through three different name changes — Force India, Racing Point, and Aston Martin — before joining a championship-winning outfit.',
      'I won my first Formula 1 Grand Prix at the 2020 Sakhir Grand Prix in Bahrain in dramatic fashion, running low on fuel on the final lap.',
      'I drove alongside Max Verstappen at Red Bull Racing and was instrumental in helping the team win the Constructors\' Championship.',
    ],
  },
  {
    answer: 'Pierre Gasly',
    clues: [
      'I produced one of the biggest shock results in recent Formula 1 history when I won the 2020 Italian Grand Prix at Monza, starting from tenth on the grid for a small team.',
      'I am French, from Rouen, and I was promoted to a top team mid-season but sent back down after struggling — a demotion that ultimately made me a stronger driver.',
      'My race number is 10 and I now drive for the team that positions itself as the French national team of Formula 1, with blue, white, and red on the livery.',
      'I am known for a passionate and emotional driving style — the opposite of calm — and my celebrations after surprising results have become iconic.',
    ],
  },
  {
    answer: 'Lance Stroll',
    clues: [
      'My father is the owner and chairman of the team I drive for — a fact that has defined my place in the Formula 1 paddock since my debut.',
      'I am Canadian, from Montreal — the city that hosts the Grand Prix at the circuit named after one of racing\'s all-time greatest heroes.',
      'I was the youngest Canadian ever to compete in Formula 1 when I debuted at Williams in 2017 aged just 18.',
      'I took a stunning pole position in wet qualifying at the 2017 Azerbaijan Grand Prix — one of the most surprising qualifying results of that decade.',
    ],
  },
  {
    answer: 'Nico Hülkenberg',
    clues: [
      'I am German and I hold the record for the most Formula 1 race starts without ever finishing on the podium — a record that followed me throughout my career.',
      'Despite never reaching the podium in Formula 1, I won the 24 Hours of Le Mans outright in 2015 driving for the Porsche factory team.',
      'My nickname is "The Hulk" — a reference to my surname and a physicality that stands out even by F1 standards.',
      'I have raced for Williams, Sauber, Force India, Renault, Racing Point, and Haas — one of the most widely-travelled drivers of the modern era.',
    ],
  },
  {
    answer: 'Yuki Tsunoda',
    clues: [
      'I am Japanese, from Sagamihara, and I was the first Japanese driver to score a Formula 1 championship point in over a decade when I debuted in 2021.',
      'My team radio messages have become famous among fans for their colourful language and raw emotion — clips of my reactions go viral regularly on social media.',
      'At 159 centimetres, I am one of the shortest drivers on the Formula 1 grid — a fact that gives me a measurable weight advantage in the car.',
      'My race number is 22 and I drive for the Red Bull junior programme\'s sister team, which has gone through three name changes since I joined.',
    ],
  },
  {
    answer: 'Valtteri Bottas',
    clues: [
      'I am Finnish, from Nastola, and I was once described by my team principal as "the perfect wingman" — a compliment I found double-edged.',
      'I spent five seasons at Mercedes alongside Lewis Hamilton, winning ten Grands Prix and two Constructors\' Championships as a team player.',
      'I am known in the paddock for an extremely calm, self-deprecating personality and for a famous social media post after a difficult qualifying session that became a fan favourite.',
      'My race number is 77 and I now drive for the Sauber team, which is transitioning into a new identity for the 2026 regulations.',
    ],
  },
]

function normalizeGuess(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function checkAnswer(input: string, answer: string): boolean {
  const norm = normalizeGuess(input)
  const full = normalizeGuess(answer)
  const lastName = normalizeGuess(answer.split(' ').slice(1).join(' '))
  return norm === full || (lastName.length > 2 && norm === lastName)
}

function makeDriverPuzzle() {
  const idx = Math.floor(Math.random() * DRIVER_PUZZLES.length)
  return { puzzle: DRIVER_PUZZLES[idx], cluesShown: 1 }
}

// ── Trivia questions ──────────────────────────────────────────────────────────

interface TriviaQ {
  q: string
  options: string[]
  answer: string
  fact: string
}

const TRIVIA_BANK: TriviaQ[] = [
  {
    q: 'Which driver holds the record for the most Formula 1 World Championship titles?',
    options: ['Ayrton Senna', 'Michael Schumacher', 'Lewis Hamilton', 'Sebastian Vettel'],
    answer: 'Lewis Hamilton',
    fact: 'Lewis Hamilton and Michael Schumacher share the record with 7 championships each.',
  },
  {
    q: 'What is the name of the famous flat-out high-speed corner at Suzuka?',
    options: ['Maggotts', 'Eau Rouge', '130R', 'Pouhon'],
    answer: '130R',
    fact: '130R is named after its 130-metre radius. Taking it flat requires extraordinary aerodynamic trust.',
  },
  {
    q: 'Which country hosted the first ever Formula 1 World Championship race in 1950?',
    options: ['Italy', 'France', 'Germany', 'Great Britain'],
    answer: 'Great Britain',
    fact: 'The 1950 British Grand Prix at Silverstone was Round 1 of the first FIA World Championship.',
  },
  {
    q: 'What does DRS stand for in Formula 1?',
    options: ['Dynamic Racing System', 'Drag Reduction System', 'Drive Regulation Switch', 'Downforce Removal Segment'],
    answer: 'Drag Reduction System',
    fact: 'DRS opens a flap in the rear wing to cut drag. It was introduced in 2011 to aid overtaking.',
  },
  {
    q: 'At which circuit is the famous "Wall of Champions" located?',
    options: ['Monaco', 'Spa-Francorchamps', 'Monza', 'Circuit Gilles Villeneuve'],
    answer: 'Circuit Gilles Villeneuve',
    fact: 'The concrete barrier at the final chicane in Montreal has caught Schumacher, Hill, Villeneuve, and many other champions.',
  },
  {
    q: 'Which team has won the most F1 Constructors\' Championships in history?',
    options: ['McLaren', 'Ferrari', 'Mercedes', 'Red Bull'],
    answer: 'Ferrari',
    fact: 'Ferrari has won 16 Constructors\' Championships — more than any other team in Formula 1 history.',
  },
  {
    q: 'In which year did the V6 turbo-hybrid power unit era begin in Formula 1?',
    options: ['2010', '2012', '2014', '2016'],
    answer: '2014',
    fact: 'The 1.6L V6 turbo-hybrid era started in 2014. Mercedes dominated the opening years of the new regulations.',
  },
  {
    q: 'Which circuit has the lowest average race speed on the Formula 1 calendar?',
    options: ['Singapore', 'Monaco', 'Baku', 'Budapest'],
    answer: 'Monaco',
    fact: 'Monaco averages under 160 km/h — the slowest permanent venue — due to its narrow, winding street layout.',
  },
  {
    q: 'Who was the youngest Formula 1 World Champion at the time of their first title?',
    options: ['Fernando Alonso', 'Kimi Räikkönen', 'Sebastian Vettel', 'Max Verstappen'],
    answer: 'Sebastian Vettel',
    fact: 'Vettel won his first title in 2010 aged 23. He went on to win three more in a row.',
  },
  {
    q: 'Which team set the record for the fastest officially-timed F1 pitstop?',
    options: ['McLaren', 'Mercedes', 'Red Bull Racing', 'Ferrari'],
    answer: 'Red Bull Racing',
    fact: 'Red Bull Racing set a 1.82-second pitstop at the 2019 Brazilian Grand Prix — the Guinness World Record for the fastest officially timed stop in Formula 1 history.',
  },
  {
    q: 'Which circuit is nicknamed "The Temple of Speed"?',
    options: ['Spa-Francorchamps', 'Monza', 'Silverstone', 'Interlagos'],
    answer: 'Monza',
    fact: 'Monza\'s long straights and banked history allow top speeds approaching 380 km/h with low-downforce setups.',
  },
  {
    q: 'What colour flag signals the end of a Formula 1 race?',
    options: ['Red flag', 'Yellow flag', 'Blue flag', 'Chequered flag'],
    answer: 'Chequered flag',
    fact: 'The chequered flag has ended races since the earliest days of motor sport in the early 1900s.',
  },
  {
    q: 'Which Silverstone complex is one of the most demanding sequences of corners in Formula 1?',
    options: ['The Esses', 'Maggotts-Becketts-Chapel', 'Village-Loop-Aintree', 'Stowe-Vale-Club'],
    answer: 'Maggotts-Becketts-Chapel',
    fact: 'Drivers sustain over 4G laterally through Maggotts-Becketts-Chapel for more than three consecutive seconds.',
  },
  {
    q: 'How many points does a Formula 1 race winner receive under current regulations?',
    options: ['10', '20', '25', '30'],
    answer: '25',
    fact: 'The current 25-point system for a win was introduced in 2010, replacing the previous maximum of 10.',
  },
  {
    q: 'What does "pole position" mean in Formula 1?',
    options: ['First pit lane exit', 'Fastest lap in qualifying', 'Front row inside line', 'P1 on the starting grid'],
    answer: 'P1 on the starting grid',
    fact: 'The name "pole position" originates from the pole marking the first position at early American oval circuits.',
  },
]

// ── Circuit ID game ───────────────────────────────────────────────────────────

function CircuitGame({ authUser, onSignIn }: { authUser: User | null; onSignIn?: () => void }) {
  const [round, setRound]       = useState<{ key: string; options: string[] }>(makeCircuitRound)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore]       = useState(() => getDailyScore('circuit'))
  const [playsUsed, setPlaysUsed] = useState(() => getDailyPlays('circuit'))
  const [dayOver, setDayOver]   = useState(() => getDailyPlays('circuit') >= MAX_DAILY)
  const [finalScore, setFinalScore] = useState(() => getDailyFinal('circuit'))
  const [submitted, setSubmitted] = useState(false)
  const scoreRef = useRef(getDailyScore('circuit'))

  const data = CIRCUIT_DATA[round.key]
  const playsLeft = MAX_DAILY - playsUsed

  if (dayOver) {
    return <DailyOverScreen
      gameType="circuit"
      score={finalScore?.score ?? score}
      maxScore={finalScore?.maxScore ?? MAX_DAILY}
      authUser={authUser}
      onSignIn={onSignIn}
      submitted={submitted}
    />
  }

  function guess(key: string) {
    if (selected !== null) return
    setSelected(key)
    const isCorrect = key === round.key
    if (isCorrect) {
      scoreRef.current += 1
      setScore(scoreRef.current)
      saveDailyScore('circuit', scoreRef.current)
    }

    const newPlays = incrementDailyPlays('circuit')
    setPlaysUsed(newPlays)

    if (newPlays >= MAX_DAILY) {
      const fs = { score: scoreRef.current, maxScore: MAX_DAILY }
      setFinalScore(fs)
      saveDailyFinal('circuit', fs.score, fs.maxScore)
      if (authUser) {
        void submitScore(authUser.id, authUser.email?.split('@')[0] ?? 'Player', 'circuit', fs.score, fs.maxScore)
        setSubmitted(true)
      }
    }
  }

  function next() {
    if (playsUsed >= MAX_DAILY) { setDayOver(true); return }
    setRound(makeCircuitRound())
    setSelected(null)
  }

  return (
    <div className="game-area">
      <div className="game-score">{score} correct · {playsLeft} play{playsLeft !== 1 ? 's' : ''} left today</div>
      <div className="game-card">
        <div className="circuit-clue-box">
          <div className="circuit-clue-stats">
            <span>Direction: {data.direction}</span>
            <span>↩ {data.corners} corners</span>
            <span>Length: {data.length}</span>
            <span>Top speed: {data.topSpeed}</span>
            <span>DRS zones: {data.drsZones}</span>
            <span>Laps: {data.laps}</span>
            <span>Downforce: {data.downforceLevel}</span>
            <span>Type: {data.circuitType}</span>
            <span>First GP: {data.firstGP}</span>
          </div>
        </div>
        <p className="game-prompt">Which circuit is this?</p>
        <div className="game-options">
          {round.options.map(key => {
            let cls = 'game-opt'
            if (selected !== null) {
              if (key === round.key) cls += ' correct'
              else if (key === selected) cls += ' wrong'
              else cls += ' dim'
            }
            return (
              <button key={key} className={cls} onClick={() => guess(key)}>
                {CIRCUIT_DATA[key].fullName}
              </button>
            )
          })}
        </div>
        {selected !== null && (
          <div className="game-result">
            {selected === round.key
              ? <span className="game-correct-msg">✓ Correct!</span>
              : <span className="game-wrong-msg">✗ {CIRCUIT_DATA[round.key].fullName}</span>
            }
            <button className="game-next-btn" onClick={next}>
              {playsUsed >= MAX_DAILY ? 'See Results →' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Who Am I? game ────────────────────────────────────────────────────────────

const MAX_CLUES = 4
const PTS_BY_CLUES = [4, 3, 2, 1]
const WHOAMI_BEST_KEY = 'f1vis_whoami_best'

function WhoAmIGame({ authUser, onSignIn }: { authUser: User | null; onSignIn?: () => void }) {
  const [state, setState] = useState<{ puzzle: DriverPuzzle; cluesShown: number }>(makeDriverPuzzle)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [score, setScore] = useState(() => getDailyScore('whoami'))
  const scoreRef = useRef(getDailyScore('whoami'))

  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(() => {
    const saved = parseInt(localStorage.getItem(WHOAMI_BEST_KEY) ?? '0', 10)
    return isNaN(saved) ? 0 : saved
  })
  const [playsUsed, setPlaysUsed]   = useState(() => getDailyPlays('whoami'))
  const [dayOver, setDayOver]       = useState(() => getDailyPlays('whoami') >= MAX_DAILY)
  const [finalScore, setFinalScore] = useState(() => getDailyFinal('whoami'))
  const [submitted, setSubmitted]   = useState(false)

  const { puzzle, cluesShown } = state
  const pts = PTS_BY_CLUES[cluesShown - 1] ?? 1
  const done = result !== null
  const playsLeft = MAX_DAILY - playsUsed
  const WHOAMI_MAX = MAX_DAILY * 4

  if (dayOver) {
    return <DailyOverScreen
      gameType="whoami"
      score={finalScore?.score ?? score}
      maxScore={finalScore?.maxScore ?? WHOAMI_MAX}
      authUser={authUser}
      onSignIn={onSignIn}
      submitted={submitted}
    />
  }

  function finishPlay(newScore: number) {
    const newPlays = incrementDailyPlays('whoami')
    setPlaysUsed(newPlays)
    if (newPlays >= MAX_DAILY) {
      const fs = { score: newScore, maxScore: WHOAMI_MAX }
      setFinalScore(fs)
      saveDailyFinal('whoami', fs.score, fs.maxScore)
      if (authUser) {
        void submitScore(authUser.id, authUser.email?.split('@')[0] ?? 'Player', 'whoami', fs.score, fs.maxScore)
        setSubmitted(true)
      }
    }
  }

  function submit() {
    if (done || !input.trim()) return
    const isCorrect = checkAnswer(input, puzzle.answer)
    setResult(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) {
      scoreRef.current += pts
      setScore(scoreRef.current)
      saveDailyScore('whoami', scoreRef.current)
      setStreak(s => {
        const next = s + 1
        setBestStreak(b => {
          const newBest = Math.max(b, next)
          localStorage.setItem(WHOAMI_BEST_KEY, String(newBest))
          return newBest
        })
        return next
      })
    } else {
      setStreak(0)
    }
    finishPlay(scoreRef.current)
  }

  function showNextClue() {
    if (cluesShown >= MAX_CLUES || done) return
    setState(s => ({ ...s, cluesShown: s.cluesShown + 1 }))
  }

  function giveUp() {
    if (done) return
    setResult('wrong')
    setStreak(0)
    finishPlay(scoreRef.current)
  }

  function next() {
    if (playsUsed >= MAX_DAILY) { setDayOver(true); return }
    setState(makeDriverPuzzle())
    setInput('')
    setResult(null)
  }

  return (
    <div className="game-area">
      <div className="whoami-stats-row">
        <span className="game-score">{score} pts · {playsLeft} play{playsLeft !== 1 ? 's' : ''} left today</span>
        <span className="whoami-streak">
          {streak > 0 && <span className="whoami-streak-fire">{streak} streak</span>}
          {bestStreak > 0 && <span className="whoami-streak-best">Best: {bestStreak}</span>}
        </span>
      </div>
      <div className="game-card">
        <div className="whoami-pts-hint">
          Guess with {cluesShown} clue{cluesShown > 1 ? 's' : ''} → <strong>{pts} pt{pts > 1 ? 's' : ''}</strong>
        </div>
        <div className="whoami-clues">
          {puzzle.clues.slice(0, cluesShown).map((clue, i) => (
            <div key={i} className="whoami-clue">
              <span className="whoami-clue-num">{i + 1}</span>
              <span>{clue}</span>
            </div>
          ))}
        </div>
        {!done ? (
          <>
            <div className="whoami-input">
              <input
                type="text"
                placeholder="Driver name…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
              />
              <button className="game-clue-btn" onClick={submit} disabled={!input.trim()}>Guess</button>
            </div>
            <div className="whoami-controls">
              {cluesShown < MAX_CLUES && (
                <button className="game-clue-btn" onClick={showNextClue}>
                  Show clue {cluesShown + 1}
                </button>
              )}
              <button className="game-giveup-btn" onClick={giveUp}>Give up</button>
            </div>
          </>
        ) : (
          <div className="game-result">
            {result === 'correct'
              ? <span className="game-correct-msg">✓ Correct! +{pts} pts{streak > 1 ? ` · ${streak} streak` : ''}</span>
              : <span className="game-wrong-msg">✗ It was {puzzle.answer}</span>
            }
            <button className="game-next-btn" onClick={next}>
              {playsUsed >= MAX_DAILY ? 'See Results →' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── F1 Trivia game ────────────────────────────────────────────────────────────

function TriviaGame() {
  const [questions] = useState<TriviaQ[]>(() => shuffleArr(TRIVIA_BANK))
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const q = questions[qIdx]
  const isLast = qIdx + 1 >= questions.length

  function pick(opt: string) {
    if (selected !== null) return
    setSelected(opt)
    if (opt === q.answer) setScore(s => s + 1)
  }

  function next() {
    if (isLast) {
      setFinished(true)
    } else {
      setQIdx(i => i + 1)
      setSelected(null)
    }
  }

  function restart() {
    setQIdx(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const pct = score / questions.length
    return (
      <div className="game-area">
        <div className="game-card game-finished">
          <p className="game-finish-headline">Quiz complete!</p>
          <p className="game-finish-score">{score} / {questions.length}</p>
          <p className="game-finish-msg">
            {pct === 1 ? 'Perfect score — you really know your F1!' :
             pct >= 0.8 ? 'Excellent — you\'re a serious fan.' :
             pct >= 0.5 ? 'Solid effort. Keep watching!' :
             'Keep watching the races — you\'ll get there!'}
          </p>
          <button className="game-next-btn" onClick={restart}>Play again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-area">
      <div className="game-q-num">Q {qIdx + 1} / {questions.length} · {score} pts</div>
      <div className="game-card">
        <p className="game-prompt">{q.q}</p>
        <div className="game-options">
          {q.options.map(opt => {
            let cls = 'game-opt'
            if (selected !== null) {
              if (opt === q.answer) cls += ' correct'
              else if (opt === selected) cls += ' wrong'
              else cls += ' dim'
            }
            return (
              <button key={opt} className={cls} onClick={() => pick(opt)}>{opt}</button>
            )
          })}
        </div>
        {selected !== null && (
          <div className="game-result">
            {selected === q.answer
              ? <span className="game-correct-msg">✓ Correct!</span>
              : <span className="game-wrong-msg">✗ {q.answer}</span>
            }
            <p className="game-fact">{q.fact}</p>
            <button className="game-next-btn" onClick={next}>
              {isLast ? 'See results' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

type LbGame   = 'circuit' | 'whoami'
type LbPeriod = 'today' | 'alltime'

interface ScoreRow {
  display_name: string
  score: number
  max_score: number
  date?: string
}

function Leaderboard() {
  const [game, setGame]     = useState<LbGame>('circuit')
  const [period, setPeriod] = useState<LbPeriod>('today')
  const [rows, setRows]     = useState<ScoreRow[]>([])
  const [loading, setLoading] = useState(true)
  const [lbError, setLbError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setLbError(null)
    const run = async () => {
      const base = supabase
        .from('game_scores')
        .select('display_name, score, max_score, date')
        .eq('game_type', game)
        .order('score', { ascending: false })
        .limit(10)
      const { data, error } = period === 'today'
        ? await base.eq('date', getTodayStr())
        : await base
      if (error) { setLbError(error.message); setLoading(false); return }
      setRows(data ?? [])
      setLoading(false)
    }
    void run()
  }, [game, period])

  const medals = ['1', '2', '3']

  return (
    <div className="game-area">
      <div className="lb-filters">
        <div className="lb-filter-row">
          {(['circuit', 'whoami'] as LbGame[]).map(g => (
            <button key={g} className={`lb-pill ${game === g ? 'active' : ''}`} onClick={() => setGame(g)}>
              {g === 'circuit' ? 'Circuit ID' : 'Who Am I?'}
            </button>
          ))}
        </div>
        <div className="lb-filter-row">
          {(['today', 'alltime'] as LbPeriod[]).map(p => (
            <button key={p} className={`lb-pill ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {p === 'today' ? 'Today' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="lb-empty">Loading…</div>
      ) : lbError ? (
        <div className="lb-empty" style={{ color: '#f66' }}>Error: {lbError}</div>
      ) : rows.length === 0 ? (
        <div className="lb-empty">No scores yet — be the first!</div>
      ) : (
        <div className="lb-table">
          {rows.map((row, i) => (
            <div key={i} className={`lb-row${i === 0 ? ' lb-row-gold' : i === 1 ? ' lb-row-silver' : i === 2 ? ' lb-row-bronze' : ''}`}>
              <span className="lb-rank">{medals[i] ?? i + 1}</span>
              <span className="lb-name">{row.display_name}</span>
              <span className="lb-score">
                {game === 'circuit' ? `${row.score} / ${row.max_score}` : `${row.score} pts`}
              </span>
              {period === 'alltime' && row.date && (
                <span className="lb-date">{row.date}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GamesPage({ authUser, onSignIn }: Props) {
  const [tab, setTab] = useState<GameTab>('circuit')

  return (
    <div className="games-page">
      <div className="games-header">
        <h1 className="games-title">F1 Games</h1>
        <p className="games-sub">5 plays per day on Circuit ID and Who Am I? — scores go to the leaderboard</p>
      </div>

      <div className="games-tab-bar">
        <button
          className={`games-tab ${tab === 'circuit' ? 'active' : ''}`}
          onClick={() => setTab('circuit')}
        >
          Circuit ID
        </button>
        <button
          className={`games-tab ${tab === 'whoami' ? 'active' : ''}`}
          onClick={() => setTab('whoami')}
        >
          Who Am I?
        </button>
        <button
          className={`games-tab ${tab === 'trivia' ? 'active' : ''}`}
          onClick={() => setTab('trivia')}
        >
          F1 Trivia
        </button>
        <button
          className={`games-tab ${tab === 'challenge' ? 'active' : ''}`}
          onClick={() => setTab('challenge')}
        >
          Daily Challenge
        </button>
        <button
          className={`games-tab ${tab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setTab('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      <div className="games-content">
        {tab === 'circuit' && <CircuitGame authUser={authUser} onSignIn={onSignIn} />}
        {tab === 'whoami' && <WhoAmIGame authUser={authUser} onSignIn={onSignIn} />}
        {tab === 'trivia' && <TriviaGame />}
        {tab === 'challenge' && <DailyChallenge />}
        {tab === 'leaderboard' && <Leaderboard />}
      </div>

      {!authUser && (
        <div className="games-save-bar">
          <span><strong>Sign in to save your progress</strong> and track high scores</span>
          {onSignIn && (
            <button className="games-save-signin" onClick={onSignIn}>Sign in</button>
          )}
        </div>
      )}
    </div>
  )
}
