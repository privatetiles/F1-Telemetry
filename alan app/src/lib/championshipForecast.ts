import Papa from 'papaparse'

export const CHAMPIONSHIP_POSITIONS = ['P2', 'P3', 'P4', 'P5', 'P6'] as const
const CHAMPIONSHIP_ORDERS_URL = '/pace2/predictions/championship/championship_p2_p6_top_orders.csv'
const CHAMPIONSHIP_POINTS_URL = '/pace2/predictions/championship/championship_position_probabilities.csv'

type Position = typeof CHAMPIONSHIP_POSITIONS[number]
type RawDriver = Record<Position, string> & {
  driver: string
  name: string
  team: string
  points: string
  expected_final_points: string
  expected_points_gained: string
}
type RawOrder = Record<Position, string> & { probability: string }
export type ChampionshipDriver = Pick<RawDriver, 'driver' | 'name' | 'team'>

function csvRows<T>(text: string): T[] {
  const { data, errors } = Papa.parse<T>(text, { header: true, skipEmptyLines: true })
  if (errors.length || !data.length) throw new Error('Invalid championship forecast data')
  return data
}

function forecastNumber(value: string): number {
  const number = Number(value)
  if (!value?.trim() || !Number.isFinite(number) || number < 0) throw new Error('Invalid championship forecast value')
  return number
}

export function parseChampionshipForecast(pointsCsv: string, ordersCsv: string) {
  const allDrivers = csvRows<RawDriver>(pointsCsv)
  const drivers = allDrivers.map(row => ({
    driver: row.driver,
    name: row.name,
    team: row.team,
    points: forecastNumber(row.points),
    expectedFinalPoints: forecastNumber(row.expected_final_points),
    expectedPointsGained: forecastNumber(row.expected_points_gained),
    probabilities: CHAMPIONSHIP_POSITIONS.map(position => forecastNumber(row[position])),
  }))
  const byCode = new Map<string, ChampionshipDriver>(drivers.map(row => [row.driver, row]))
  const orders = csvRows<RawOrder>(ordersCsv).map(row => ({
    drivers: CHAMPIONSHIP_POSITIONS.map(position => {
      const driver = byCode.get(row[position])
      if (!driver) throw new Error('Unknown driver in championship order')
      return driver
    }),
    probability: forecastNumber(row.probability),
  })).sort((a, b) => b.probability - a.probability)
  return { drivers: drivers.filter(driver => driver.probabilities.some(probability => probability > 0)), orders }
}

export type ChampionshipForecast = ReturnType<typeof parseChampionshipForecast>

export async function loadChampionshipForecast(signal: AbortSignal): Promise<ChampionshipForecast> {
  const [points, orders] = await Promise.all([CHAMPIONSHIP_POINTS_URL, CHAMPIONSHIP_ORDERS_URL].map(async url => {
    const response = await fetch(url, { signal })
    if (!response.ok) throw new Error(`Failed to load championship forecast (${response.status})`)
    return response.text()
  }))
  return parseChampionshipForecast(points, orders)
}

export function championshipPercent(value: number): string {
  if (value === 0) return '0%'
  if (value < 0.0001) return '<0.01%'
  return `${(value * 100).toFixed(value < 0.001 ? 2 : 1)}%`
}
