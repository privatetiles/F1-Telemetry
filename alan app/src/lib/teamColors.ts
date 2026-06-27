// 2026 driver colors — official team base color for driver 1, distinct variant for driver 2
// Cross-team conflicts resolved: Audi shifted to crimson, Cadillac to charcoal/silver
export const DRIVER_COLORS: Record<string, string> = {
  // Red Bull Racing — royal blue / sky blue
  VER: '#3672C6',
  HAD: '#80AAEE',

  // McLaren — orange / amber
  NOR: '#F47600',
  PIA: '#FFAA44',

  // Ferrari — red / pink-red
  LEC: '#E8002D',
  HAM: '#FF5577',

  // Mercedes — teal / light teal
  RUS: '#00D7B6',
  ANT: '#6EFCE8',

  // Aston Martin — forest green / mint
  ALO: '#229971',
  STR: '#44BB99',

  // Williams — cobalt blue / periwinkle
  ALB: '#1868DB',
  SAI: '#5598EE',

  // Haas — silver / light silver
  BEA: '#8C8F92',
  OCO: '#C0C3C6',

  // Audi — crimson / rose (shifted from official #F50537 to clear Ferrari)
  HUL: '#C8001E',
  BOR: '#EE3355',

  // Racing Bulls — violet-blue / lavender
  LAW: '#6C98FF',
  LIN: '#A8C4FF',

  // Alpine — cyan / light cyan
  GAS: '#00A1E8',
  COL: '#44CCFF',

  // Cadillac — charcoal / mid grey (shifted dark to clear Haas silver)
  BOT: '#606060',
  PER: '#A0A0A0',
}

export function driverColor(driver: string): string {
  return DRIVER_COLORS[driver] ?? '#888888'
}
