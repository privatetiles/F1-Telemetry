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
  distractors: [ChallengeOption, ChallengeOption, ChallengeOption]
  hint: string
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'aus_q',
    circuitId: 'australia',
    sessionType: 'qualifying',
    driver: 'NOR',
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
    answer: 'Japanese GP',
    flag: '🇯🇵',
    distractors: [
      { name: 'Australian GP',         flag: '🇦🇺' },
      { name: 'Barcelona-Catalunya GP', flag: '🇪🇸' },
      { name: 'Austrian GP',           flag: '🇦🇹' },
    ],
    hint: 'Famously known for its figure-of-eight layout',
  },
  {
    id: 'mia_q',
    circuitId: 'miami',
    sessionType: 'qualifying',
    driver: 'NOR',
    answer: 'Miami GP',
    flag: '🇺🇸',
    distractors: [
      { name: 'Chinese GP',   flag: '🇨🇳' },
      { name: 'Canadian GP',  flag: '🇨🇦' },
      { name: 'Barcelona-Catalunya GP', flag: '🇪🇸' },
    ],
    hint: 'Hard Rock Stadium is at the center of this circuit',
  },
  {
    id: 'can_q',
    circuitId: 'canadian',
    sessionType: 'qualifying',
    driver: 'NOR',
    answer: 'Canadian GP',
    flag: '🇨🇦',
    distractors: [
      { name: 'Monaco GP',    flag: '🇲🇨' },
      { name: 'Miami GP',     flag: '🇺🇸' },
      { name: 'Austrian GP',  flag: '🇦🇹' },
    ],
    hint: 'Known as the "Wall of Champions" circuit',
  },
  {
    id: 'mon_q',
    circuitId: 'monaco',
    sessionType: 'qualifying',
    driver: 'LEC',
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
    answer: 'Barcelona-Catalunya GP',
    flag: '🇪🇸',
    distractors: [
      { name: 'Japanese GP',  flag: '🇯🇵' },
      { name: 'British GP',   flag: '🇬🇧' },
      { name: 'Austrian GP',  flag: '🇦🇹' },
    ],
    hint: 'Every team knows this circuit inside out — heavily used for pre-season testing',
  },
  {
    id: 'aut_q',
    circuitId: 'austrian',
    sessionType: 'qualifying',
    driver: 'NOR',
    answer: 'Austrian GP',
    flag: '🇦🇹',
    distractors: [
      { name: 'British GP',   flag: '🇬🇧' },
      { name: 'Barcelona-Catalunya GP', flag: '🇪🇸' },
      { name: 'Monaco GP',    flag: '🇲🇨' },
    ],
    hint: 'One of the shortest laps on the calendar — nestled in the Styrian mountains',
  },
  {
    id: 'gbr_q',
    circuitId: 'british',
    sessionType: 'qualifying',
    driver: 'ANT',
    answer: 'British GP',
    flag: '🇬🇧',
    distractors: [
      { name: 'Barcelona-Catalunya GP', flag: '🇪🇸' },
      { name: 'Japanese GP',  flag: '🇯🇵' },
      { name: 'Austrian GP',  flag: '🇦🇹' },
    ],
    hint: 'High-speed flowing corners — home of the oldest race on the calendar',
  },
]

// Seeded shuffle: same order for all users on the same day
export function shuffledOptions(challenge: Challenge, daySeed: number): ChallengeOption[] {
  const opts: ChallengeOption[] = [
    { name: challenge.answer, flag: challenge.flag },
    ...challenge.distractors,
  ]
  // Simple seeded Fisher-Yates
  const seed = (daySeed * 2654435761 + challenge.id.charCodeAt(0)) >>> 0
  const rand = (i: number) => ((seed * (i + 7) * 1664525 + 1013904223) >>> 0) / 0x100000000
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rand(i) * (i + 1))
    ;[opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return opts
}

export function getDayIndex(): number {
  // Days since epoch, consistent timezone-independent bucket
  return Math.floor(Date.now() / 86_400_000)
}

export function getTodaysChallenge(): { challenge: Challenge; dayIdx: number } {
  const dayIdx = getDayIndex()
  return { challenge: CHALLENGES[dayIdx % CHALLENGES.length], dayIdx }
}
