import type { SpeedClass } from './speedClasses'

export interface SpeedSegment {
  speedClass: SpeedClass
  distance: number   // metres in the lap for this speed class
}

export interface CircuitLayout {
  lapDistance: number      // total lap metres
  baselineSeconds: number  // estimated 2026 Q pole time (seconds)
  segments: SpeedSegment[]
  notes: string
}

// Helper — segments must sum to lapDistance exactly (checked at build time via assertion)
function lay(
  lapDistance: number,
  baselineSeconds: number,
  segs: [SpeedClass, number][],
  notes: string,
): CircuitLayout {
  const sum = segs.reduce((acc, [, d]) => acc + d, 0)
  if (sum !== lapDistance) {
    console.warn(`Circuit layout segment mismatch: expected ${lapDistance}m, got ${sum}m`)
  }
  return {
    lapDistance,
    baselineSeconds,
    segments: segs.map(([speedClass, distance]) => ({ speedClass, distance })),
    notes,
  }
}

// All 22 circuits on the 2026 calendar.
// Segment distances represent the total metres of track where each speed class dominates,
// including the braking approach and acceleration exit (the full corner package).
// This means t = segmentDistance × 3.6 / driverAvgSpeed gives the correct time contribution.
// Circuits with real telemetry (hasData: true) also have layouts so the Data Lab can show all.
const CIRCUIT_LAYOUTS: Record<string, CircuitLayout> = {

  // ─────── Round 1 — Australia ──────────────────────────────────────────────
  australia: lay(5278, 78.518, [
    ['straight',  1400],
    ['fast',       900],
    ['medium',     900],
    ['slow',      1100],
    ['hairpin',    978],
  ], 'Albert Park: flowing park circuit, long back straight, quick chicanes and tight hairpins'),

  // ─────── Round 2 — China ──────────────────────────────────────────────────
  china: lay(5451, 92.064, [
    ['straight',  1550],
    ['fast',       700],
    ['medium',     700],
    ['slow',      1200],
    ['hairpin',   1301],
  ], 'Shanghai: long Kemmel-like back straight into heavy braking hairpins; T1 outer sweeper'),

  // ─────── Round 3 — Japan ──────────────────────────────────────────────────
  japan: lay(5807, 88.778, [
    ['straight',   1100],
    ['ultra_fast', 1200],
    ['fast',       1000],
    ['medium',      900],
    ['slow',        800],
    ['hairpin',     807],
  ], 'Suzuka: figure-of-8, 130R and Esses at 240+ km/h define driver character; heavy Spoon braking'),

  // ─────── Round 4 — Miami ──────────────────────────────────────────────────
  miami: lay(5412, 87.798, [
    ['straight',  1450],
    ['fast',       850],
    ['medium',    1100],
    ['slow',      1200],
    ['hairpin',    812],
  ], 'Miami: three long straights connected by medium and slow 90-degree junctions'),

  // ─────── Round 5 — Canada ─────────────────────────────────────────────────
  canadian: lay(4361, 72.578, [
    ['straight',  1250],
    ['fast',       350],
    ['medium',     500],
    ['slow',       900],
    ['hairpin',   1361],
  ], 'Île Notre-Dame: stop-go, pit-wall-close, Casino sweeper; enormous hairpin section T8–T10'),

  // ─────── Round 6 — Monaco ─────────────────────────────────────────────────
  monaco: lay(3337, 71.5, [
    ['straight',  1000],
    ['fast',       250],
    ['medium',     450],
    ['slow',       950],
    ['hairpin',    687],
  ], 'Monaco: tightest street circuit, minimum apex speeds dominate; tunnel straight is the only respite'),

  // ─────── Round 7 — Barcelona-Catalunya ────────────────────────────────────
  barcelona_catalunya: lay(4657, 73.0, [
    ['straight',   1100],
    ['ultra_fast',  700],
    ['fast',        900],
    ['medium',      900],
    ['slow',        700],
    ['hairpin',     357],
  ], 'Barcelona-Catalunya: long back straight + high-speed Campsa T9; same layout as legacy Spanish GP'),

  // ─────── Round 8 — Austria ────────────────────────────────────────────────
  austrian: lay(4318, 64.5, [
    ['straight',  800],
    ['fast',      600],
    ['medium',   1100],
    ['slow',     1200],
    ['hairpin',   618],
  ], 'Red Bull Ring: shortest lap, brutal stop-start with consecutive slow hairpins'),

  // ─────── Round 9 — Britain ────────────────────────────────────────────────
  british: lay(5891, 85.5, [
    ['straight',   1100],
    ['ultra_fast', 1800],
    ['fast',       1100],
    ['medium',      900],
    ['slow',        500],
    ['hairpin',     491],
  ], 'Silverstone: Copse at 280 km/h, Maggotts-Becketts complex; highest ultra-fast corner load on calendar'),

  // ─────── Round 10 — Belgium ───────────────────────────────────────────────
  belgian: lay(7004, 102.5, [
    ['straight',   1800],
    ['ultra_fast', 1700],
    ['fast',       1400],
    ['medium',      900],
    ['slow',        700],
    ['hairpin',     504],
  ], 'Spa-Francorchamps: Eau Rouge/Raidillon and Blanchimont at 300+ km/h; longest lap on calendar'),

  // ─────── Round 11 — Hungary ───────────────────────────────────────────────
  hungarian: lay(4381, 77.5, [
    ['straight',  600],
    ['fast',      700],
    ['medium',   1300],
    ['slow',     1100],
    ['hairpin',   681],
  ], 'Budapest: 14 turns, single short straight — low-speed character rewards mechanical grip'),

  // ─────── Round 12 — Netherlands ───────────────────────────────────────────
  dutch: lay(4259, 70.0, [
    ['straight',   800],
    ['ultra_fast', 700],
    ['fast',      1000],
    ['medium',     900],
    ['slow',       600],
    ['hairpin',    259],
  ], 'Zandvoort: Hugenholtz and Arie Luyendyk banked corners at 210+ km/h; tight Tarzan hairpin'),

  // ─────── Round 13 — Italy ─────────────────────────────────────────────────
  italian: lay(5793, 79.0, [
    ['straight',  3200],
    ['fast',      1200],
    ['medium',     400],
    ['slow',       600],
    ['hairpin',    393],
  ], 'Monza: 62 % of lap at full throttle, three DRS zones — power unit and braking efficiency above all'),

  // ─────── Round 14 — Madrid ────────────────────────────────────────────────
  madrid: lay(5500, 88.5, [
    ['straight',  1100],
    ['fast',       500],
    ['medium',    1200],
    ['slow',      1700],
    ['hairpin',   1000],
  ], 'Madrid street circuit debut — dense municipal layout, heavy braking into tight 90-degree complexes'),

  // ─────── Round 15 — Azerbaijan ────────────────────────────────────────────
  azerbaijan: lay(6003, 102.0, [
    ['straight',  2200],
    ['fast',       500],
    ['medium',     700],
    ['slow',      1300],
    ['hairpin',   1303],
  ], 'Baku: 2.2 km main straight (longest in F1) + narrow castle-section hairpins — two circuits in one'),

  // ─────── Round 16 — Singapore ─────────────────────────────────────────────
  singapore: lay(4940, 92.0, [
    ['straight',  700],
    ['fast',      300],
    ['medium',    800],
    ['slow',     2000],
    ['hairpin',  1140],
  ], 'Marina Bay: 23 turns under floodlights, longest F1 night race — braking confidence and tyre management'),

  // ─────── Round 17 — United States ─────────────────────────────────────────
  united_states: lay(5513, 93.5, [
    ['straight',   1150],
    ['ultra_fast',  700],
    ['fast',       1350],
    ['medium',     1000],
    ['slow',        800],
    ['hairpin',     513],
  ], 'COTA: blind T1 crest and flowing S2 esses reward aero balance across all speed classes'),

  // ─────── Round 18 — Mexico City ───────────────────────────────────────────
  mexican_city: lay(4304, 78.5, [
    ['straight',   1250],
    ['ultra_fast',  600],
    ['fast',        700],
    ['medium',      800],
    ['slow',        600],
    ['hairpin',     354],
  ], '2240 m altitude: reduced downforce and braking efficiency; stadium esses at 210+ km/h'),

  // ─────── Round 19 — São Paulo ─────────────────────────────────────────────
  sao_paulo: lay(4309, 68.5, [
    ['straight',  900],
    ['fast',      900],
    ['medium',    900],
    ['slow',      900],
    ['hairpin',   709],
  ], 'Interlagos: anti-clockwise, severe elevation changes — Senna S demands perfect entry'),

  // ─────── Round 20 — Las Vegas ─────────────────────────────────────────────
  las_vegas: lay(6201, 93.0, [
    ['straight',  3200],
    ['fast',       700],
    ['medium',     900],
    ['slow',      1000],
    ['hairpin',    401],
  ], 'Las Vegas Strip: 52 % straight — DRS advantage is decisive; T12–T14 chicane is the lone challenge'),

  // ─────── Round 21 — Qatar ─────────────────────────────────────────────────
  qatar: lay(5380, 81.0, [
    ['straight',   1000],
    ['ultra_fast', 1300],
    ['fast',       1600],
    ['medium',      900],
    ['slow',        300],
    ['hairpin',     280],
  ], 'Lusail: flowing high-speed layout with ultra-fast sweepers in S1 — aero efficiency and tyre endurance'),

  // ─────── Round 22 — Abu Dhabi ─────────────────────────────────────────────
  abu_dhabi: lay(5281, 84.5, [
    ['straight',   1300],
    ['ultra_fast',  450],
    ['fast',        850],
    ['medium',     1200],
    ['slow',        900],
    ['hairpin',     581],
  ], 'Yas Marina: varied layout — marina hotel complex, T8-T9 high-speed sweeper, short main straight'),

}

export default CIRCUIT_LAYOUTS
