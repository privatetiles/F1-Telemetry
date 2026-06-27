export interface TelemetryPoint {
  time: number        // seconds from lap start
  speed: number       // km/h
  gear: number
  throttle: number    // 0-100
  brake: boolean
  drs: number
  x: number           // track coordinate
  y: number
  distance: number    // cumulative metres
  relDist: number     // 0-1 across the lap
}

export interface MiniSectorStats {
  driver: string
  timeSpent: number     // seconds
  avgSpeed: number      // km/h
  minSpeed: number
  entrySpeed: number
  exitSpeed: number
  brakePercent: number
  avgThrottle: number   // 0-100
  deltaVsFastest: number  // seconds (positive = slower than fastest in this sector)
}

export type SegmentType = 'full_throttle' | 'high_speed_corner' | 'low_speed_corner' | 'acceleration' | 'deceleration'

export interface ProcessedMiniSector {
  idx: number
  relStart: number
  relEnd: number
  points: Array<{ x: number; y: number }>  // raw track coords for SVG
  driverStats: Record<string, MiniSectorStats>
  fastestTime: number
  avgSpeedRef: number      // avg speed of reference driver
  avgThrottleRef: number   // avg throttle 0-100, reference driver
  avgBrakeRef: number      // brake application %, reference driver
}

export type SessionType = 'qualifying' | 'race' | 'sprint_qualifying' | 'sprint_race'

export interface CircuitSession {
  type: SessionType
  label: string
  drivers: string[]
}

export interface CircuitConfig {
  id: string
  name: string
  flag: string
  raceDate: string    // ISO YYYY-MM-DD race Sunday
  hasData: boolean
  hasPrediction?: boolean
  sessions: CircuitSession[]
}

export type ColorMode = 'speed' | 'delta'
