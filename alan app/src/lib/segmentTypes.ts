import type { MiniSectorStats, ProcessedMiniSector, SegmentType } from '../types'

export const SEGMENT_TYPES: SegmentType[] = [
  'full_throttle', 'high_speed_corner', 'low_speed_corner', 'acceleration', 'deceleration',
]

export const SEGMENT_LABELS: Record<SegmentType, string> = {
  full_throttle:    'Full Throttle',
  high_speed_corner:'High Speed Corner',
  low_speed_corner: 'Low Speed Corner',
  acceleration:     'Acceleration Zone',
  deceleration:     'Deceleration Zone',
}

export const SEGMENT_COLORS: Record<SegmentType, string> = {
  full_throttle:     '#00e676',
  high_speed_corner: '#40c4ff',
  low_speed_corner:  '#ff5252',
  acceleration:      '#ffab40',
  deceleration:      '#e040fb',
}

export function classifySegment(stats: MiniSectorStats): SegmentType {
  const { avgSpeed, minSpeed, entrySpeed, exitSpeed, brakePercent, avgThrottle } = stats
  const speedRatio = minSpeed / Math.max(avgSpeed, 1)
  const speedGain  = exitSpeed - entrySpeed

  // Heavy braking into a corner — speed drops, driver's off throttle
  if (brakePercent > 35 && speedGain < -20) return 'deceleration'

  // Slow hairpin or chicane — significant minimum speed dip
  if (minSpeed < 115 && speedRatio < 0.78 && brakePercent > 10) return 'low_speed_corner'

  // Fast sweeper — high speed maintained but driver lifts
  if (avgSpeed > 170 && speedRatio < 0.92 && brakePercent > 3) return 'high_speed_corner'

  // Building speed out of a corner — throttle on, speed rising
  if (speedGain > 30 && brakePercent < 8 && avgThrottle > 70) return 'acceleration'

  return 'full_throttle'
}

// Pick the fastest driver's stats per sector for track-level classification
export function classifySectors(miniSectors: ProcessedMiniSector[]): SegmentType[] {
  return miniSectors.map((ms) => {
    let best: MiniSectorStats | undefined
    for (const s of Object.values(ms.driverStats)) {
      if (!best || s.deltaVsFastest < best.deltaVsFastest) best = s
    }
    return best ? classifySegment(best) : 'full_throttle'
  })
}
