export interface PaceMap {
  code: string
  source: string
  year: number
  trackPrefix: string
  telemetry: string
}

function map(code: string, prefix: string, name: string, year = 2026): PaceMap {
  return {
    code, source: `${name} Grand Prix | ${year}`, year,
    trackPrefix: prefix,
    telemetry: `/pace/telemetry_maps/${prefix}_telemetry_map.svg`,
  }
}

// Map provenance is independent of the season/session used for pace calibration.
export const PACE_MAPS: PaceMap[] = [
  map('AUS', '01_australia_2026', 'Australian'),
  map('CHN', '04_china_2026', 'Chinese'),
  map('JPN', '05_japan_2026', 'Japanese'),
  map('MIA', '06_miami_2026', 'Miami'),
  map('MON', '07_monaco_2026', 'Monaco'),
  map('BAR', '02_barcelona_2026', 'Barcelona'),
  map('CAN', '03_canada_2026', 'Canadian'),
  map('AUT', 'austria_2026', 'Austrian'),
  map('GBR', 'silverstone_2026', 'British'),
  map('BEL', 'spa_2026', 'Belgian'),
  map('HUN', 'hungaroring_2026', 'Hungarian'),
  map('NED', 'zandvoort_2026', 'Dutch'),
  map('ITA', 'monza_2026', 'Italian'),
  map('MAD', 'madrid_2026', 'Madrid'),
  map('AZE', 'baku_2026', 'Azerbaijan'),
  map('SEP', 'sepang_2026', 'Sepang'),
  map('SIN', 'singapore_2025', 'Singapore', 2025),
]
