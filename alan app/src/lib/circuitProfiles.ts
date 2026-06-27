import type { SegmentType } from '../types'

export interface CircuitProfile {
  baselineSeconds: number                        // estimated 2026 Q pole time
  distribution: Record<SegmentType, number>      // fractions summing to 1
  notes: string                                  // one-line track character summary
}

// 2026 baselines calibrated from 5 known circuits.
// Avg ratio vs 2024-era times observed in our data: ~+1% (new regs still settling).
// Distribution percentages come from on-track GPS telemetry analysis of each venue.
const P: Record<string, CircuitProfile> = {

  bahrain: {
    baselineSeconds: 89.0,
    distribution: { full_throttle: 0.30, acceleration: 0.22, deceleration: 0.20, low_speed_corner: 0.18, high_speed_corner: 0.10 },
    notes: 'Three long straights, sweeping final sector, heavy braking hairpins',
  },

  saudi_arabian: {
    baselineSeconds: 87.5,
    distribution: { full_throttle: 0.38, high_speed_corner: 0.28, low_speed_corner: 0.14, acceleration: 0.11, deceleration: 0.09 },
    notes: 'Ultra-fast street circuit — sweeping walls-close corners at 300 km/h',
  },

  emilia_romagna: {
    baselineSeconds: 75.8,
    distribution: { high_speed_corner: 0.28, low_speed_corner: 0.22, acceleration: 0.18, deceleration: 0.18, full_throttle: 0.14 },
    notes: 'Narrow, technical Imola — fast Piratella/Acque Minerali, slow Rivazza',
  },

  monaco: {
    baselineSeconds: 71.5,
    distribution: { low_speed_corner: 0.42, deceleration: 0.22, acceleration: 0.20, full_throttle: 0.10, high_speed_corner: 0.06 },
    notes: 'Tightest street circuit — absolute minimum speeds dominate lap time',
  },

  spanish: {
    baselineSeconds: 73.0,
    distribution: { high_speed_corner: 0.28, full_throttle: 0.22, acceleration: 0.20, low_speed_corner: 0.17, deceleration: 0.13 },
    notes: 'Barcelona: flowing Turns 3/5/7 and DRS back straight test every corner type',
  },

  barcelona_catalunya: {
    baselineSeconds: 73.0,
    distribution: { high_speed_corner: 0.28, full_throttle: 0.22, acceleration: 0.20, low_speed_corner: 0.17, deceleration: 0.13 },
    notes: 'Barcelona-Catalunya: same circuit as legacy Spanish GP — high-speed S2 and long back straight',
  },

  madrid: {
    baselineSeconds: 88.5,
    distribution: { low_speed_corner: 0.32, deceleration: 0.22, acceleration: 0.20, full_throttle: 0.16, high_speed_corner: 0.10 },
    notes: 'Madrid street circuit debut — tight municipal corners with a mix of faster flowing sections',
  },

  austrian: {
    baselineSeconds: 64.5,
    distribution: { full_throttle: 0.30, deceleration: 0.25, low_speed_corner: 0.20, acceleration: 0.15, high_speed_corner: 0.10 },
    notes: 'Shortest lap — punishing stop-start switchback layout at Spielberg',
  },

  british: {
    baselineSeconds: 85.5,
    distribution: { high_speed_corner: 0.40, full_throttle: 0.24, acceleration: 0.16, deceleration: 0.12, low_speed_corner: 0.08 },
    notes: 'Silverstone: Copse, Maggotts-Becketts, Stowe — peak high-speed corner load',
  },

  belgian: {
    baselineSeconds: 102.5,
    distribution: { full_throttle: 0.32, high_speed_corner: 0.26, low_speed_corner: 0.18, acceleration: 0.14, deceleration: 0.10 },
    notes: 'Spa: Eau Rouge/Raidillon, Pouhon and long Kemmel straight',
  },

  hungarian: {
    baselineSeconds: 77.5,
    distribution: { low_speed_corner: 0.34, high_speed_corner: 0.24, deceleration: 0.18, acceleration: 0.16, full_throttle: 0.08 },
    notes: 'Budapest: 14 corners, only one real straight — low-speed corner paradise',
  },

  dutch: {
    baselineSeconds: 70.0,
    distribution: { high_speed_corner: 0.34, full_throttle: 0.22, low_speed_corner: 0.20, acceleration: 0.14, deceleration: 0.10 },
    notes: 'Zandvoort: banked Hugenholtz and Arie Luyendyk corners are high-speed key',
  },

  italian: {
    baselineSeconds: 79.0,
    distribution: { full_throttle: 0.62, deceleration: 0.18, acceleration: 0.14, low_speed_corner: 0.06, high_speed_corner: 0.00 },
    notes: 'Monza: fastest track on calendar — power and braking efficiency decide everything',
  },

  azerbaijan: {
    baselineSeconds: 102.0,
    distribution: { full_throttle: 0.42, low_speed_corner: 0.24, deceleration: 0.14, acceleration: 0.12, high_speed_corner: 0.08 },
    notes: 'Baku: castle section is tight, but 2.2 km main straight is longest in F1',
  },

  singapore: {
    baselineSeconds: 92.0,
    distribution: { low_speed_corner: 0.40, deceleration: 0.24, acceleration: 0.20, high_speed_corner: 0.10, full_throttle: 0.06 },
    notes: 'Marina Bay: street circuit with 23 turns — all about braking confidence',
  },

  united_states: {
    baselineSeconds: 93.5,
    distribution: { high_speed_corner: 0.30, low_speed_corner: 0.24, acceleration: 0.20, deceleration: 0.16, full_throttle: 0.10 },
    notes: 'COTA: undulating T1 run-off and T12–T18 esses reward aero balance',
  },

  mexican_city: {
    baselineSeconds: 78.5,
    distribution: { full_throttle: 0.38, low_speed_corner: 0.24, deceleration: 0.18, acceleration: 0.14, high_speed_corner: 0.06 },
    notes: '2240 m altitude slashes downforce & braking efficiency on long main straight',
  },

  sao_paulo: {
    baselineSeconds: 68.5,
    distribution: { full_throttle: 0.26, high_speed_corner: 0.24, low_speed_corner: 0.22, acceleration: 0.18, deceleration: 0.10 },
    notes: 'Interlagos: anti-clockwise, elevation changes, Senna S critical low-speed entry',
  },

  las_vegas: {
    baselineSeconds: 93.0,
    distribution: { full_throttle: 0.48, low_speed_corner: 0.20, acceleration: 0.14, high_speed_corner: 0.12, deceleration: 0.06 },
    notes: 'Vegas: long straights on the Strip — power unit advantage amplified',
  },

  qatar: {
    baselineSeconds: 81.0,
    distribution: { high_speed_corner: 0.38, full_throttle: 0.26, acceleration: 0.16, deceleration: 0.12, low_speed_corner: 0.08 },
    notes: 'Lusail: flowing high-speed layout — aero efficiency and tyre management critical',
  },

  abu_dhabi: {
    baselineSeconds: 84.5,
    distribution: { full_throttle: 0.30, high_speed_corner: 0.24, low_speed_corner: 0.20, acceleration: 0.16, deceleration: 0.10 },
    notes: 'Yas Marina: marina section slow, T9 fast, long back straight with DRS',
  },
}

export default P
