import Papa from 'papaparse'

function parseCsv<T>(text: string): T[] {
  return Papa.parse<T>(text, { header: true, skipEmptyLines: true }).data
}

function fasterPositiveToSlowerPositive(delta: number): number {
  return (1 / (1 + delta / 100) - 1) * 100
}

// ── Races ────────────────────────────────────────────────────────────────────

export interface Race2 {
  label: string          // display name: "Austria"
  fullName: string       // "Austria GP"
  eventKey: string       // "fastf1_2025_austrian_grand_prix"
  imgPrefix: string      // "08_austria_2025"
}

export const RACES2: Race2[] = [
  { label: 'Austria',  fullName: 'Austria GP',                       eventKey: 'fastf1_2025_austrian_grand_prix',  imgPrefix: '08_austria_2025' },
  { label: 'Britain',  fullName: 'British GP / Silverstone',         eventKey: 'fastf1_2025_british_grand_prix',   imgPrefix: '10_silverstone_2025' },
  { label: 'Belgium',  fullName: 'Belgium GP / Spa-Francorchamps',   eventKey: 'fastf1_2025_belgian_grand_prix',   imgPrefix: '09_spa_francorchamps_2025' },
  { label: 'Hungary',  fullName: 'Hungary GP / Hungaroring',         eventKey: 'fastf1_2025_hungarian_grand_prix', imgPrefix: '11_hungaroring_2025' },
  { label: 'Dutch',    fullName: 'Dutch GP / Zandvoort',             eventKey: 'fastf1_2025_dutch_grand_prix',     imgPrefix: '12_zandvoort_2025' },
  { label: 'Italian',  fullName: 'Italian GP / Monza',               eventKey: 'fastf1_2025_italian_grand_prix',   imgPrefix: '13_monza_2025' },
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

const DRIVER_PRED_BASE = '/pace2/predictions/qualifying_time_predictions/driver_qualifying_predictions'

const DRIVER_PRED_CSVS = [
  `${DRIVER_PRED_BASE}/four_race_2026_driver_qualifying_predictions.csv`,
  `${DRIVER_PRED_BASE}/zandvoort_2026_driver_qualifying_predictions_recency_weighted.csv`,
  `${DRIVER_PRED_BASE}/monza_2026_driver_qualifying_predictions_recency_weighted.csv`,
]

type RawDriverPred = {
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

function parseDriverPredRows(text: string): DriverPrediction[] {
  return parseCsv<RawDriverPred>(text).map(r => ({
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
    teamDelta:        fasterPositiveToSlowerPositive(parseFloat(r.target_team_delta_pct_vs_mercedes)),
  }))
}

export async function loadDriverPredictions(): Promise<DriverPrediction[]> {
  const results = await Promise.all(
    DRIVER_PRED_CSVS.map(url =>
      fetch(url).then(r => r.ok ? r.text() : Promise.reject(`HTTP ${r.status} for ${url}`))
    )
  )
  return results.flatMap(parseDriverPredRows)
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

const TARGET_MIX_CSVS = [
  '/pace2/predictions/delta_predictions/four_race_2026_delta_predictions_from_new_maps.csv',
  '/pace2/predictions/delta_predictions/zandvoort_2026_team_delta_predictions_recency_weighted.csv',
  '/pace2/predictions/delta_predictions/monza_2026_team_delta_predictions_from_zandvoort_update.csv',
]

const TEAM_CATEGORY_INPUT_CSV = '/pace2/predictions/delta_predictions/team_category_delta_inputs_from_2026.csv'

type RawTeamDelta = {
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

type RawTeamCategoryInput = {
  team: string
  category: 'Slow corners' | 'Fast corners' | 'Straights'
  predicted_category_delta_pct_vs_mercedes: string
}

export async function loadTeamDeltas2(): Promise<TeamDelta2[]> {
  const [categoryInputText, targetMixTexts] = await Promise.all([
    fetch(TEAM_CATEGORY_INPUT_CSV).then(r =>
      r.ok ? r.text() : Promise.reject(`HTTP ${r.status} for ${TEAM_CATEGORY_INPUT_CSV}`)
    ),
    Promise.all(TARGET_MIX_CSVS.map(url =>
      fetch(url).then(r => r.ok ? r.text() : Promise.reject(`HTTP ${r.status} for ${url}`))
    )),
  ])

  const teamCategories = new Map<string, Partial<Record<RawTeamCategoryInput['category'], number>>>()
  for (const row of parseCsv<RawTeamCategoryInput>(categoryInputText)) {
    const value = parseFloat(row.predicted_category_delta_pct_vs_mercedes)
    if (!isFinite(value)) continue
    const categories = teamCategories.get(row.team) ?? {}
    categories[row.category] = value
    teamCategories.set(row.team, categories)
  }

  const targetMixes = new Map<string, RawTeamDelta>()
  for (const row of targetMixTexts.flatMap(text => parseCsv<RawTeamDelta>(text))) {
    if (!targetMixes.has(row.prediction_target_race)) {
      targetMixes.set(row.prediction_target_race, row)
    }
  }

  return [...targetMixes.values()].flatMap(mix => {
    const slowShare = parseFloat(mix.target_slow_corners_time_share_pct)
    const fastShare = parseFloat(mix.target_fast_corners_time_share_pct)
    const straightShare = parseFloat(mix.target_straights_time_share_pct)
    const totalShare = slowShare + fastShare + straightShare

    return [...teamCategories.entries()].flatMap(([team, categories]) => {
      const slow = categories['Slow corners']
      const fast = categories['Fast corners']
      const straight = categories.Straights
      if (slow === undefined || fast === undefined || straight === undefined || totalShare <= 0) return []

      return [{
        race: mix.prediction_target_race,
        team,
        overall: (slow * slowShare + fast * fastShare + straight * straightShare) / totalShare,
        slow,
        fast,
        straight,
        slowShare,
        fastShare,
        straightShare,
      }]
    })
  })
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
