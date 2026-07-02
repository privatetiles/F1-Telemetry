const BASE = 'https://api.jolpi.ca/ergast/f1'

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const CONSTRUCTOR_TEAM: Record<string, string> = {
  red_bull:     'Red Bull Racing',
  mercedes:     'Mercedes',
  ferrari:      'Ferrari',
  mclaren:      'McLaren',
  alpine:       'Alpine',
  rb:           'Racing Bulls',
  williams:     'Williams',
  haas:         'Haas F1 Team',
  audi:         'Audi',
  aston_martin: 'Aston Martin',
  cadillac:     'Cadillac',
}

export interface DriverStanding {
  position: string
  points: string
  wins: string
  Driver: {
    code: string
    givenName: string
    familyName: string
    permanentNumber: string
    nationality: string
  }
  Constructors: Array<{ constructorId: string; name: string }>
}

export interface ConstructorStanding {
  position: string
  points: string
  wins: string
  Constructor: { constructorId: string; name: string }
}

export interface RaceResult {
  position: string
  positionText: string
  points: string
  grid: string
  laps: string
  status: string
  Driver: { code: string; givenName: string; familyName: string; permanentNumber: string }
  Constructor: { constructorId: string; name: string }
  Time?: { time: string }
  FastestLap?: { rank: string; lap: string; Time: { time: string } }
}

export interface Race {
  round: string
  raceName: string
  date: string
  time?: string
  Circuit: {
    circuitId: string
    circuitName: string
    Location: { locality: string; country: string }
  }
  Results?: RaceResult[]
}

export async function fetchDriverStandings(): Promise<DriverStanding[]> {
  const d = await get('/2026/driverStandings.json')
  return d.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []
}

export async function fetchConstructorStandings(): Promise<ConstructorStanding[]> {
  const d = await get('/2026/constructorStandings.json')
  return d.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []
}

export async function fetchSchedule(): Promise<Race[]> {
  const d = await get('/2026.json?limit=30')
  return d.MRData?.RaceTable?.Races ?? []
}

export async function fetchAllResults(): Promise<Race[]> {
  const d = await get('/2026/results.json?limit=500')
  return d.MRData?.RaceTable?.Races ?? []
}

export async function fetchRaceResult(round: number): Promise<Race | null> {
  const d = await get(`/2026/${round}/results.json`)
  return d.MRData?.RaceTable?.Races?.[0] ?? null
}

export async function fetchDriverStandingsByRound(round: number): Promise<DriverStanding[]> {
  const d = await get(`/2026/${round}/driverStandings.json`)
  return d.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []
}
