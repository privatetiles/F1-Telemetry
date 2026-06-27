import Papa from 'papaparse'

export type Category = 'Slow corners' | 'Fast corners' | 'Straights'
export const CATEGORIES: Category[] = ['Slow corners', 'Fast corners', 'Straights']
export const CAT_SHORT: Record<Category, string> = {
  'Slow corners': 'Slow',
  'Fast corners': 'Fast',
  'Straights':    'Straight',
}
export const CAT_COLOR: Record<Category, string> = {
  'Slow corners': '#a78bfa',
  'Fast corners': '#f97316',
  'Straights':    '#38bdf8',
}

export const TEAM_COLORS: Record<string, string> = {
  'Mercedes':        '#00d2be',
  'Ferrari':         '#e8002d',
  'McLaren':         '#ff8000',
  'Red Bull Racing': '#3671c6',
  'Alpine':          '#0093cc',
  'Racing Bulls':    '#6692ff',
  'Williams':        '#64c4ff',
  'Haas F1 Team':    '#b6babd',
  'Audi':            '#bb0000',
  'Aston Martin':    '#358c75',
  'Cadillac':        '#c0c8ff',
}

export const EVENTS = [
  'fastf1_2026_australia_grand_prix',
  'fastf1_2026_barcelona_grand_prix',
  'fastf1_2026_canadian_grand_prix',
  'fastf1_2026_china_grand_prix',
  'fastf1_2026_japan_grand_prix',
  'fastf1_2026_miami_grand_prix',
  'fastf1_2026_monaco_grand_prix',
] as const

export type EventKey = typeof EVENTS[number]
export const PREDICTION_EVENT = 'fastf1_2025_austrian_grand_prix'

export const EVENT_LABEL: Record<string, string> = {
  'fastf1_2026_australia_grand_prix': 'AUS',
  'fastf1_2026_barcelona_grand_prix': 'BAR',
  'fastf1_2026_canadian_grand_prix':  'CAN',
  'fastf1_2026_china_grand_prix':     'CHN',
  'fastf1_2026_japan_grand_prix':     'JPN',
  'fastf1_2026_miami_grand_prix':     'MIA',
  'fastf1_2026_monaco_grand_prix':    'MON',
  'fastf1_2025_austrian_grand_prix':  'AUT',
}

export const EVENT_MAP_PREFIX: Record<string, string> = {
  'fastf1_2026_australia_grand_prix': '01_australia_2026',
  'fastf1_2026_barcelona_grand_prix': '02_barcelona_2026',
  'fastf1_2026_canadian_grand_prix':  '03_canada_2026',
  'fastf1_2026_china_grand_prix':     '04_china_2026',
  'fastf1_2026_japan_grand_prix':     '05_japan_2026',
  'fastf1_2026_miami_grand_prix':     '06_miami_2026',
  'fastf1_2026_monaco_grand_prix':    '07_monaco_2026',
  'fastf1_2025_austrian_grand_prix':  '08_austria_2025',
}

// Mapping from circuit ID (dataIndex) to track JSON prefix for 3-class display
export const CIRCUIT_TRACK_PREFIX: Record<string, string> = {
  'australia':           '01_australia_2026',
  'barcelona_catalunya': '02_barcelona_2026',
  'canadian':            '03_canada_2026',
  'china':               '04_china_2026',
  'japan':               '05_japan_2026',
  'miami':               '06_miami_2026',
  'monaco':              '07_monaco_2026',
  'austrian':            '08_austria_2025',
}

// Track geometry data
export interface TrackRun {
  category: Category
  points: { x: number; y: number }[]
}

export interface TrackData {
  event: string
  segments: TrackRun[]
}

export interface CircuitPrediction {
  circuit: string
  race: string
  basedOn: string[]
  teams: PredictionEntry[]
}

export async function loadCircuitPrediction(circuitId: string): Promise<CircuitPrediction> {
  const res = await fetch(`/predictions/${circuitId}.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<CircuitPrediction>
}

export async function loadTrackData(prefix: string): Promise<TrackData> {
  const res = await fetch(`/pace/track_data/${prefix}_track.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<TrackData>
}

// deltaMap[event][team][category]
export type DeltaMap = Record<string, Record<string, Partial<Record<Category, { delta: number; timeWeight: number }>>>>

export interface PredictionEntry {
  team: string
  overall: number
  slow: number
  fast: number
  straight: number
  inputRaces: number
  note: string
}

function parseCsv<T>(text: string): T[] {
  return Papa.parse<T>(text, { header: true, skipEmptyLines: true }).data
}

export async function loadDeltaData(): Promise<DeltaMap> {
  const res = await fetch('/pace/delta_calculations/first_7_circuits_3class_delta_calculations.csv')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  type Raw = { event: string; team: string; category: string; weighted_speed_delta_vs_mercedes_pct: string; time_weight_seconds: string }
  const rows = parseCsv<Raw>(await res.text())

  const map: DeltaMap = {}
  for (const row of rows) {
    const delta = parseFloat(row.weighted_speed_delta_vs_mercedes_pct)
    const tw    = parseFloat(row.time_weight_seconds)
    if (!isFinite(delta) || !isFinite(tw)) continue
    if (!map[row.event]) map[row.event] = {}
    if (!map[row.event][row.team]) map[row.event][row.team] = {}
    map[row.event][row.team][row.category as Category] = { delta, timeWeight: tw }
  }
  return map
}

export async function loadPredictions(): Promise<PredictionEntry[]> {
  const res = await fetch('/pace/predictions/austria_predictions_from_first_7_circuits_3class.csv')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  type Raw = {
    team: string
    predicted_overall_delta_pct_vs_mercedes: string
    predicted_slow_corners_delta_pct: string
    predicted_fast_corners_delta_pct: string
    predicted_straights_delta_pct: string
    input_events_used: string
    note: string
  }

  return parseCsv<Raw>(await res.text())
    .map(r => ({
      team:       r.team,
      overall:    parseFloat(r.predicted_overall_delta_pct_vs_mercedes),
      slow:       parseFloat(r.predicted_slow_corners_delta_pct),
      fast:       parseFloat(r.predicted_fast_corners_delta_pct),
      straight:   parseFloat(r.predicted_straights_delta_pct),
      inputRaces: parseInt(r.input_events_used, 10),
      note:       r.note ?? '',
    }))
    .filter(r => isFinite(r.overall))
    .sort((a, b) => b.overall - a.overall)
}

// Weighted overall delta for a team at one event
export function computeOverall(catMap: Partial<Record<Category, { delta: number; timeWeight: number }>>): number {
  let num = 0, den = 0
  for (const cat of CATEGORIES) {
    const e = catMap[cat]
    if (e) { num += e.delta * e.timeWeight; den += e.timeWeight }
  }
  return den > 0 ? num / den : 0
}

// Map [0%, -6%] → color: green → amber → red
export function deltaColor(delta: number): string {
  if (delta >= 0) return '#00e676'
  const t = Math.min(1, Math.abs(delta) / 6)
  if (t < 0.4) {
    const x = t / 0.4
    return `rgb(${Math.round(30 + 225 * x)},${Math.round(230 - 30 * x)},0)`
  }
  const x = (t - 0.4) / 0.6
  return `rgb(255,${Math.round(200 - 200 * x)},0)`
}
