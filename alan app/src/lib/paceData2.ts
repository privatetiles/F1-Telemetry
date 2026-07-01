import Papa from 'papaparse'

function parseCsv<T>(text: string): T[] {
  return Papa.parse<T>(text, { header: true, skipEmptyLines: true }).data
}

// ── Races ────────────────────────────────────────────────────────────────────

export interface Race2 {
  label: string          // display name: "Austria"
  fullName: string       // "Austria GP"
  eventKey: string       // "fastf1_2025_austrian_grand_prix"
  imgPrefix: string      // "08_austria_2025"
}

export const RACES2: Race2[] = [
  { label: 'Austria',  fullName: 'Austria GP',                       eventKey: 'fastf1_2025_austrian_grand_prix', imgPrefix: '08_austria_2025' },
  { label: 'Britain',  fullName: 'British GP / Silverstone',         eventKey: 'fastf1_2025_british_grand_prix',  imgPrefix: '10_silverstone_2025' },
  { label: 'Belgium',  fullName: 'Belgium GP / Spa-Francorchamps',   eventKey: 'fastf1_2025_belgian_grand_prix',  imgPrefix: '09_spa_francorchamps_2025' },
  { label: 'Hungary',  fullName: 'Hungary GP / Hungaroring',         eventKey: 'fastf1_2025_hungarian_grand_prix', imgPrefix: '11_hungaroring_2025' },
]

// ── Driver qualifying predictions ────────────────────────────────────────────

export interface DriverPrediction {
  race: string
  position: number
  driver: string
  driverNumber: number
  team: string
  predictedTime: string
  predictedSeconds: number
  gap: number
  poleTime: string
  poleSeconds: number
  teamDelta: number
}

export async function loadDriverPredictions(): Promise<DriverPrediction[]> {
  const res = await fetch('/pace2/predictions/qualifying_time_predictions/driver_qualifying_predictions/four_race_2026_driver_qualifying_predictions.csv')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  type Raw = {
    prediction_target_race: string
    predicted_position: string
    driver: string
    driver_number: string
    team: string
    predicted_qualifying_time: string
    predicted_qualifying_seconds: string
    gap_to_predicted_pole_seconds: string
    model_pole_time: string
    model_pole_seconds: string
    target_team_delta_pct_vs_mercedes: string
  }

  return parseCsv<Raw>(await res.text()).map(r => ({
    race:             r.prediction_target_race,
    position:         parseInt(r.predicted_position, 10),
    driver:           r.driver,
    driverNumber:     parseInt(r.driver_number, 10),
    team:             r.team,
    predictedTime:    r.predicted_qualifying_time,
    predictedSeconds: parseFloat(r.predicted_qualifying_seconds),
    gap:              parseFloat(r.gap_to_predicted_pole_seconds),
    poleTime:         r.model_pole_time,
    poleSeconds:      parseFloat(r.model_pole_seconds),
    teamDelta:        parseFloat(r.target_team_delta_pct_vs_mercedes),
  }))
}

// ── Team pace deltas ─────────────────────────────────────────────────────────

export interface TeamDelta2 {
  race: string
  team: string
  overall: number
  slow: number
  fast: number
  straight: number
  slowShare: number
  fastShare: number
  straightShare: number
}

export async function loadTeamDeltas2(): Promise<TeamDelta2[]> {
  const res = await fetch('/pace2/predictions/delta_predictions/four_race_2026_delta_predictions_from_new_maps.csv')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  type Raw = {
    prediction_target_race: string
    team: string
    predicted_overall_delta_pct_vs_mercedes: string
    predicted_slow_corners_delta_pct: string
    predicted_fast_corners_delta_pct: string
    predicted_straights_delta_pct: string
    target_slow_corners_time_share_pct: string
    target_fast_corners_time_share_pct: string
    target_straights_time_share_pct: string
  }

  return parseCsv<Raw>(await res.text()).map(r => ({
    race:         r.prediction_target_race,
    team:         r.team,
    overall:      parseFloat(r.predicted_overall_delta_pct_vs_mercedes),
    slow:         parseFloat(r.predicted_slow_corners_delta_pct),
    fast:         parseFloat(r.predicted_fast_corners_delta_pct),
    straight:     parseFloat(r.predicted_straights_delta_pct),
    slowShare:    parseFloat(r.target_slow_corners_time_share_pct),
    fastShare:    parseFloat(r.target_fast_corners_time_share_pct),
    straightShare: parseFloat(r.target_straights_time_share_pct),
  })).filter(r => isFinite(r.overall))
}

// ── Pole time predictions ────────────────────────────────────────────────────

export interface PolePrediction {
  race: string
  anchorEvent: string
  anchorPole: string
  anchorDriver: string
  anchorTeam: string
  predictedTime: string
  lowTime: string
  highTime: string
}

export async function loadPolePredictions(): Promise<PolePrediction[]> {
  const res = await fetch('/pace2/predictions/qualifying_time_predictions/four_race_2026_qualifying_time_predictions.csv')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  type Raw = {
    target_race: string
    anchor_2025_event: string
    anchor_2025_pole: string
    anchor_2025_driver: string
    anchor_2025_team: string
    predicted_2026_qualifying_time: string
    model_low_time: string
    model_high_time: string
  }

  return parseCsv<Raw>(await res.text()).map(r => ({
    race:          r.target_race,
    anchorEvent:   r.anchor_2025_event,
    anchorPole:    r.anchor_2025_pole,
    anchorDriver:  r.anchor_2025_driver,
    anchorTeam:    r.anchor_2025_team,
    predictedTime: r.predicted_2026_qualifying_time,
    lowTime:       r.model_low_time,
    highTime:      r.model_high_time,
  }))
}
