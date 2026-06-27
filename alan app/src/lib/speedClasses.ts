export type SpeedClass = 'straight' | 'ultra_fast' | 'fast' | 'medium' | 'slow' | 'hairpin'

export const SPEED_CLASSES: SpeedClass[] = ['straight', 'ultra_fast', 'fast', 'medium', 'slow', 'hairpin']

export const SPEED_CLASS_LABELS: Record<SpeedClass, string> = {
  straight:   'Straight / DRS',
  ultra_fast: 'Ultra-Fast Corner (200+ km/h)',
  fast:       'Fast Corner (160–200 km/h)',
  medium:     'Medium Corner (120–160 km/h)',
  slow:       'Slow Corner (80–120 km/h)',
  hairpin:    'Hairpin (<80 km/h)',
}

export const SPEED_CLASS_COLORS: Record<SpeedClass, string> = {
  straight:   '#e040fb',
  ultra_fast: '#40c4ff',
  fast:       '#00e676',
  medium:     '#ffd600',
  slow:       '#ff6d00',
  hairpin:    '#ff1744',
}

// Reference average speeds through each class (km/h).
// These are average speeds for the ENTIRE sector (braking + apex + exit) —
// not peak or minimum speed — because t = distance / avgSpeed requires the mean.
// Calibrated from multi-circuit F1 telemetry analysis.
export const SPEED_CLASS_DEFAULTS: Record<SpeedClass, number> = {
  straight:   285,
  ultra_fast: 228,
  fast:       183,
  medium:     146,
  slow:       104,
  hairpin:    71,
}

// Classify a mini-sector by the fastest driver's apex (minimum) speed.
// Straight is tested first: flat-out section regardless of instantaneous min speed.
export function classifyByApexSpeed(
  minSpeed: number,
  avgThrottle: number,
  brakePercent: number,
): SpeedClass {
  if (avgThrottle > 87 && brakePercent < 5) return 'straight'
  if (minSpeed >= 200) return 'ultra_fast'
  if (minSpeed >= 160) return 'fast'
  if (minSpeed >= 120) return 'medium'
  if (minSpeed >= 80)  return 'slow'
  return 'hairpin'
}
