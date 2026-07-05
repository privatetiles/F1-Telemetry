import type { SessionType } from '../types'

export interface ChallengeOption {
  name: string
  flag: string
}

export interface Challenge {
  id: string
  circuitId: string
  sessionType: SessionType
  driver: string
  answer: string
  flag: string
  activeSince: string   // YYYY-MM-DD — challenge becomes active on this UTC date
  distractors: [ChallengeOption, ChallengeOption, ChallengeOption]
  hint: string
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'aus_q',
    circuitId: 'australia',
    sessionType: 'qualifying',
    driver: 'NOR',
    activeSince: '2026-03-08',
    answer: 'Australian GP',
    flag: '🇦🇺',
    distractors: [
      { name: 'Monaco GP',   flag: '🇲🇨' },
      { name: 'Canadian GP', flag: '🇨🇦' },
      { name: 'Austrian GP', flag: '🇦🇹' },
    ],
    hint: 'A street circuit converted for F1 racing',
  },
  {
    id: 'chi_q',
    circuitId: 'china',
    sessionType: 'qualifying',
    driver: 'NOR',
    activeSince: '2026-03-15',
    answer: 'Chinese GP',
    flag: '🇨🇳',
    distractors: [
      { name: 'Miami GP',    flag: '🇺🇸' },
      { name: 'Japanese GP', flag: '🇯🇵' },
      { name: 'British GP',  flag: '🇬🇧' },
    ],
    hint: 'This circuit has one of the longest back straights on the calendar',
  },
  {
    id: 'jpn_q',
    circuitId: 'japan',
    sessionType: 'qualifying',
    driver: 'NOR',
    activeSince: '2026-03-29',
    answer: 'Japanese GP',
    flag: '🇯🇵',
    distractors: [
      { name: 'Australian GP',          flag: '🇦🇺' },
      { name: 'Barcelona-Catalunya GP', flag: '🇪🇸' },
      { name: 'Austrian GP',            flag: '🇦🇹' },
    ],
    hint: 'Famously known for its figure-of-eight layout',
  },
  {
    id: 'mia_q',
    circuitId: 'miami',
    sessionType: 'qualifying',
    driver: 'NOR',
    activeSince: '2026-05-03',
    answer: 'Miami GP',
    flag: '🇺🇸',
    distractors: [
      { name: 'Chinese GP',             flag: '🇨🇳' },
      { name: 'Canadian GP',            flag: '🇨🇦' },
      { name: 'Barcelona-Catalunya GP', flag: '🇪🇸' },
    ],
    hint: 'Hard Rock Stadium is at the center of this circuit',
  },
  {
    id: 'can_q',
    circuitId: 'canadian',
    sessionType: 'qualifying',
    driver: 'NOR',
    activeSince: '2026-05-24',
    answer: 'Canadian GP',
    flag: '🇨🇦',
    distractors: [
      { name: 'Monaco GP',   flag: '🇲🇨' },
      { name: 'Miami GP',    flag: '🇺🇸' },
      { name: 'Austrian GP', flag: '🇦🇹' },
    ],
    hint: 'Known as the "Wall of Champions" circuit',
  },
  {
    id: 'mon_q',
    circuitId: 'monaco',
    sessionType: 'qualifying',
    driver: 'LEC',
    activeSince: '2026-06-07',
    answer: 'Monaco GP',
    flag: '🇲🇨',
    distractors: [
      { name: 'Australian GP', flag: '🇦🇺' },
      { name: 'Canadian GP',   flag: '🇨🇦' },
      { name: 'Singapore GP',  flag: '🇸🇬' },
    ],
    hint: 'The slowest circuit on the F1 calendar — impossible to overtake',
  },
  {
    id: 'bar_q',
    circuitId: 'barcelona_catalunya',
    sessionType: 'qualifying',
    driver: 'NOR',
    activeSince: '2026-06-14',
    answer: 'Barcelona-Catalunya GP',
    flag: '🇪🇸',
    distractors: [
      { name: 'Japanese GP', flag: '🇯🇵' },
      { name: 'British GP',  flag: '🇬🇧' },
      { name: 'Austrian GP', flag: '🇦🇹' },
    ],
    hint: 'Every team knows this circuit inside out — heavily used for pre-season testing',
  },
  {
    id: 'aut_q',
    circuitId: 'austrian',
    sessionType: 'qualifying',
    driver: 'NOR',
    activeSince: '2026-06-28',
    answer: 'Austrian GP',
    flag: '🇦🇹',
    distractors: [
      { name: 'British GP',             flag: '🇬🇧' },
      { name: 'Barcelona-Catalunya GP', flag: '🇪🇸' },
      { name: 'Monaco GP',              flag: '🇲🇨' },
    ],
    hint: 'One of the shortest laps on the calendar — nestled in the Styrian mountains',
  },
  {
    id: 'gbr_q',
    circuitId: 'british',
    sessionType: 'qualifying',
    driver: 'ANT',
    activeSince: '2026-07-05',
    answer: 'British GP',
    flag: '🇬🇧',
    distractors: [
      { name: 'Barcelona-Catalunya GP', flag: '🇪🇸' },
      { name: 'Japanese GP',            flag: '🇯🇵' },
      { name: 'Austrian GP',            flag: '🇦🇹' },
    ],
    hint: 'High-speed flowing corners — home of the oldest race on the calendar',
  },
]

function utcDateStr(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Seeded shuffle: same order for all users on the same challenge
export function shuffledOptions(challenge: Challenge, seed: number): ChallengeOption[] {
  const opts: ChallengeOption[] = [
    { name: challenge.answer, flag: challenge.flag },
    ...challenge.distractors,
  ]
  const s = (seed * 2654435761 + challenge.id.charCodeAt(0)) >>> 0
  const rand = (i: number) => ((s * (i + 7) * 1664525 + 1013904223) >>> 0) / 0x100000000
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rand(i) * (i + 1))
    ;[opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return opts
}

export function getTodaysChallenge(): { challenge: Challenge; challengeId: string } {
  const today = utcDateStr()
  // Find the most recent challenge whose activeSince <= today
  const active = [...CHALLENGES].reverse().find(c => c.activeSince <= today)
  const challenge = active ?? CHALLENGES[0]
  return { challenge, challengeId: challenge.id }
}
