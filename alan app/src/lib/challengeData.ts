import type { SessionType } from '../types'

export type ChartType = 'speed' | 'gear' | 'throttle' | 'brakeThrottle'

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
  chartType: ChartType
  distractors: [ChallengeOption, ChallengeOption, ChallengeOption]
  hint: string
}

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  speed:         'Speed (km/h) across one lap',
  gear:          'Gear selection across one lap',
  throttle:      'Throttle application (%) across one lap',
  brakeThrottle: 'Throttle & braking across one lap',
}

export const CHART_TYPE_QUESTIONS: Record<ChartType, string> = {
  speed:         'Study the anonymous speed trace.',
  gear:          'Study the anonymous gear trace.',
  throttle:      'Study the anonymous throttle trace.',
  brakeThrottle: 'Study the anonymous throttle & brake trace.',
}

// Circuit shorthand options
const AUS = { name: 'Australian GP',          flag: '🇦🇺' }
const CHI = { name: 'Chinese GP',             flag: '🇨🇳' }
const JPN = { name: 'Japanese GP',            flag: '🇯🇵' }
const MIA = { name: 'Miami GP',               flag: '🇺🇸' }
const CAN = { name: 'Canadian GP',            flag: '🇨🇦' }
const MON = { name: 'Monaco GP',              flag: '🇲🇨' }
const BAR = { name: 'Barcelona-Catalunya GP', flag: '🇪🇸' }
const AUT = { name: 'Austrian GP',            flag: '🇦🇹' }
const GBR = { name: 'British GP',             flag: '🇬🇧' }

// 30-challenge rotating pool — cycles every 30 days.
// Day 0 = 2026-03-08. Today (2026-07-07) = day 121 = index 1.
export const CHALLENGES: Challenge[] = [
  // --- round 1 ---
  { id: 'aus_q_s',   circuitId: 'australia',          sessionType: 'qualifying',        driver: 'NOR', answer: 'Australian GP',          flag: '🇦🇺', chartType: 'speed',
    distractors: [MON, CAN, AUT], hint: 'A street circuit converted for F1 — tight chicanes with walls very close to the racing line' },
  { id: 'chi_q_g',   circuitId: 'china',              sessionType: 'qualifying',        driver: 'NOR', answer: 'Chinese GP',              flag: '🇨🇳', chartType: 'gear',
    distractors: [MIA, JPN, GBR], hint: 'One of the longest back straights on the calendar — huge speed differential lap to lap' },
  { id: 'jpn_q_t',   circuitId: 'japan',              sessionType: 'qualifying',        driver: 'NOR', answer: 'Japanese GP',             flag: '🇯🇵', chartType: 'throttle',
    distractors: [AUS, BAR, AUT], hint: 'Famously known for its figure-of-eight layout — the 130R is taken almost flat-out' },
  { id: 'mia_q_bt',  circuitId: 'miami',              sessionType: 'qualifying',        driver: 'NOR', answer: 'Miami GP',                flag: '🇺🇸', chartType: 'brakeThrottle',
    distractors: [CHI, CAN, BAR], hint: 'Hard Rock Stadium sits at the center — watch for the long straight followed by a hairpin complex' },
  { id: 'can_q_s',   circuitId: 'canadian',           sessionType: 'qualifying',        driver: 'NOR', answer: 'Canadian GP',             flag: '🇨🇦', chartType: 'speed',
    distractors: [MON, MIA, AUT], hint: 'Known as the "Wall of Champions" — a semi-street circuit on an island in the St. Lawrence River' },
  { id: 'mon_q_g',   circuitId: 'monaco',             sessionType: 'qualifying',        driver: 'LEC', answer: 'Monaco GP',               flag: '🇲🇨', chartType: 'gear',
    distractors: [AUS, CAN, GBR], hint: 'The slowest circuit on the calendar — you\'ll never go above 5th gear for most of the lap' },
  { id: 'bar_q_t',   circuitId: 'barcelona_catalunya',sessionType: 'qualifying',        driver: 'NOR', answer: 'Barcelona-Catalunya GP',  flag: '🇪🇸', chartType: 'throttle',
    distractors: [JPN, GBR, AUT], hint: 'Every team knows this circuit inside out — used heavily for pre-season testing' },
  { id: 'aut_q_bt',  circuitId: 'austrian',           sessionType: 'qualifying',        driver: 'NOR', answer: 'Austrian GP',             flag: '🇦🇹', chartType: 'brakeThrottle',
    distractors: [GBR, BAR, MON], hint: 'One of the shortest laps on the calendar — nestled in the Styrian mountains, Red Bull Ring' },
  { id: 'gbr_q_s',   circuitId: 'british',            sessionType: 'qualifying',        driver: 'ANT', answer: 'British GP',              flag: '🇬🇧', chartType: 'speed',
    distractors: [BAR, JPN, AUT], hint: 'High-speed flowing corners through Maggotts and Becketts — home of the oldest F1 race' },
  { id: 'aus_q_g',   circuitId: 'australia',          sessionType: 'qualifying',        driver: 'NOR', answer: 'Australian GP',          flag: '🇦🇺', chartType: 'gear',
    distractors: [MON, CHI, GBR], hint: 'A street circuit converted for F1 — tight chicanes with walls very close to the racing line' },

  // --- round 2 ---
  { id: 'chi_sq_t',  circuitId: 'china',              sessionType: 'sprint_qualifying', driver: 'NOR', answer: 'Chinese GP',              flag: '🇨🇳', chartType: 'throttle',
    distractors: [AUS, AUT, MIA], hint: 'One of the longest back straights on the calendar — huge speed differential lap to lap' },
  { id: 'jpn_q_bt',  circuitId: 'japan',              sessionType: 'qualifying',        driver: 'NOR', answer: 'Japanese GP',             flag: '🇯🇵', chartType: 'brakeThrottle',
    distractors: [CHI, BAR, CAN], hint: 'Famously known for its figure-of-eight layout — the 130R is taken almost flat-out' },
  { id: 'mia_q_s',   circuitId: 'miami',              sessionType: 'qualifying',        driver: 'NOR', answer: 'Miami GP',                flag: '🇺🇸', chartType: 'speed',
    distractors: [CAN, GBR, AUT], hint: 'Hard Rock Stadium sits at the center — watch for the long straight followed by a hairpin complex' },
  { id: 'can_q_g',   circuitId: 'canadian',           sessionType: 'qualifying',        driver: 'NOR', answer: 'Canadian GP',             flag: '🇨🇦', chartType: 'gear',
    distractors: [MON, MIA, BAR], hint: 'Known as the "Wall of Champions" — a semi-street circuit on an island in the St. Lawrence River' },
  { id: 'mon_q_t',   circuitId: 'monaco',             sessionType: 'qualifying',        driver: 'LEC', answer: 'Monaco GP',               flag: '🇲🇨', chartType: 'throttle',
    distractors: [AUS, CAN, CHI], hint: 'The slowest circuit on the calendar — you\'ll never go above 5th gear for most of the lap' },
  { id: 'bar_q_bt',  circuitId: 'barcelona_catalunya',sessionType: 'qualifying',        driver: 'NOR', answer: 'Barcelona-Catalunya GP',  flag: '🇪🇸', chartType: 'brakeThrottle',
    distractors: [JPN, AUT, MIA], hint: 'Every team knows this circuit inside out — used heavily for pre-season testing' },
  { id: 'aut_q_s',   circuitId: 'austrian',           sessionType: 'qualifying',        driver: 'NOR', answer: 'Austrian GP',             flag: '🇦🇹', chartType: 'speed',
    distractors: [MON, BAR, JPN], hint: 'One of the shortest laps on the calendar — nestled in the Styrian mountains, Red Bull Ring' },
  { id: 'gbr_q_g',   circuitId: 'british',            sessionType: 'qualifying',        driver: 'ANT', answer: 'British GP',              flag: '🇬🇧', chartType: 'gear',
    distractors: [CHI, BAR, MIA], hint: 'High-speed flowing corners through Maggotts and Becketts — home of the oldest F1 race' },
  { id: 'aus_q_t',   circuitId: 'australia',          sessionType: 'qualifying',        driver: 'NOR', answer: 'Australian GP',          flag: '🇦🇺', chartType: 'throttle',
    distractors: [MON, JPN, CAN], hint: 'A street circuit converted for F1 — tight chicanes with walls very close to the racing line' },
  { id: 'chi_q_bt',  circuitId: 'china',              sessionType: 'qualifying',        driver: 'NOR', answer: 'Chinese GP',              flag: '🇨🇳', chartType: 'brakeThrottle',
    distractors: [GBR, BAR, AUT], hint: 'One of the longest back straights on the calendar — huge speed differential lap to lap' },

  // --- round 3 ---
  { id: 'jpn_q_s',   circuitId: 'japan',              sessionType: 'qualifying',        driver: 'NOR', answer: 'Japanese GP',             flag: '🇯🇵', chartType: 'speed',
    distractors: [AUS, CHI, MON], hint: 'Famously known for its figure-of-eight layout — the 130R is taken almost flat-out' },
  { id: 'mia_sq_g',  circuitId: 'miami',              sessionType: 'sprint_qualifying', driver: 'NOR', answer: 'Miami GP',                flag: '🇺🇸', chartType: 'gear',
    distractors: [CHI, CAN, BAR], hint: 'Hard Rock Stadium sits at the center — watch for the long straight followed by a hairpin complex' },
  { id: 'can_q_t',   circuitId: 'canadian',           sessionType: 'qualifying',        driver: 'NOR', answer: 'Canadian GP',             flag: '🇨🇦', chartType: 'throttle',
    distractors: [MON, MIA, JPN], hint: 'Known as the "Wall of Champions" — a semi-street circuit on an island in the St. Lawrence River' },
  { id: 'mon_q_bt',  circuitId: 'monaco',             sessionType: 'qualifying',        driver: 'LEC', answer: 'Monaco GP',               flag: '🇲🇨', chartType: 'brakeThrottle',
    distractors: [AUS, CAN, AUT], hint: 'The slowest circuit on the calendar — you\'ll never go above 5th gear for most of the lap' },
  { id: 'bar_q_s',   circuitId: 'barcelona_catalunya',sessionType: 'qualifying',        driver: 'NOR', answer: 'Barcelona-Catalunya GP',  flag: '🇪🇸', chartType: 'speed',
    distractors: [JPN, GBR, CHI], hint: 'Every team knows this circuit inside out — used heavily for pre-season testing' },
  { id: 'aut_q_g',   circuitId: 'austrian',           sessionType: 'qualifying',        driver: 'NOR', answer: 'Austrian GP',             flag: '🇦🇹', chartType: 'gear',
    distractors: [MON, BAR, CAN], hint: 'One of the shortest laps on the calendar — nestled in the Styrian mountains, Red Bull Ring' },
  { id: 'gbr_q_t',   circuitId: 'british',            sessionType: 'qualifying',        driver: 'ANT', answer: 'British GP',              flag: '🇬🇧', chartType: 'throttle',
    distractors: [CHI, AUS, JPN], hint: 'High-speed flowing corners through Maggotts and Becketts — home of the oldest F1 race' },
  { id: 'aus_q_bt',  circuitId: 'australia',          sessionType: 'qualifying',        driver: 'NOR', answer: 'Australian GP',          flag: '🇦🇺', chartType: 'brakeThrottle',
    distractors: [MON, BAR, GBR], hint: 'A street circuit converted for F1 — tight chicanes with walls very close to the racing line' },
  { id: 'chi_sq_s',  circuitId: 'china',              sessionType: 'sprint_qualifying', driver: 'NOR', answer: 'Chinese GP',              flag: '🇨🇳', chartType: 'speed',
    distractors: [MIA, AUT, CAN], hint: 'One of the longest back straights on the calendar — huge speed differential lap to lap' },
  { id: 'mia_q_g',   circuitId: 'miami',              sessionType: 'qualifying',        driver: 'NOR', answer: 'Miami GP',                flag: '🇺🇸', chartType: 'gear',
    distractors: [AUS, MON, CHI], hint: 'Hard Rock Stadium sits at the center — watch for the long straight followed by a hairpin complex' },
]

// Season start = first race date
const BASE_DATE_MS = Date.parse('2026-03-08')

function utcDateStr(d = new Date()): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function challengeForOffset(dayOffset: number): Challenge {
  return CHALLENGES[Math.max(0, dayOffset) % CHALLENGES.length]
}

export function getChallengeForDate(dateStr: string): { challenge: Challenge; challengeId: string } {
  const dayOffset = Math.floor((Date.parse(dateStr) - BASE_DATE_MS) / 86400000)
  return { challenge: challengeForOffset(dayOffset), challengeId: dateStr }
}

export function getTodaysChallenge(): { challenge: Challenge; challengeId: string } {
  return getChallengeForDate(utcDateStr())
}

// Seeded shuffle: same option order for all users on a given day
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
