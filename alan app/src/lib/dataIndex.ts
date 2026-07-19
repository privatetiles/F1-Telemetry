import type { CircuitConfig, SessionType } from '../types'

export const FULL_GRID = [
  'VER','LAW','NOR','PIA','LEC','SAI','HAM','RUS','ANT','BEA',
  'ALO','STR','LIN','OCO','GAS','BOR','ALB','COL','BOT','HUL','HAD','PER',
]

const Q  = 'qualifying'        as SessionType
const R  = 'race'              as SessionType
const SQ = 'sprint_qualifying' as SessionType
const SR = 'sprint_race'       as SessionType

const FR = 'full_race' as SessionType

const SESSION_LABELS: Record<SessionType, string> = {
  qualifying:        'Fastest Lap (Qualifying)',
  race:              'Fastest Lap (Race)',
  sprint_qualifying: 'Fastest Lap (Sprint Qualifying)',
  sprint_race:       'Fastest Lap (Sprint Race)',
  full_race:         'Full Race',
}

const FR_SESSION  = { type: FR, label: SESSION_LABELS[FR], drivers: [] }

const stdSessions = [
  { type: Q,  label: SESSION_LABELS[Q],  drivers: FULL_GRID },
  { type: R,  label: SESSION_LABELS[R],  drivers: FULL_GRID },
]

const stdSessionsFull = [
  { type: Q,  label: SESSION_LABELS[Q],  drivers: FULL_GRID },
  { type: R,  label: SESSION_LABELS[R],  drivers: FULL_GRID },
  FR_SESSION,
]

const sprintSessions = [
  { type: SQ, label: SESSION_LABELS[SQ], drivers: FULL_GRID },
  { type: SR, label: SESSION_LABELS[SR], drivers: FULL_GRID },
  { type: Q,  label: SESSION_LABELS[Q],  drivers: FULL_GRID },
  { type: R,  label: SESSION_LABELS[R],  drivers: FULL_GRID },
]

const sprintSessionsFull = [
  { type: SQ, label: SESSION_LABELS[SQ], drivers: FULL_GRID },
  { type: SR, label: SESSION_LABELS[SR], drivers: FULL_GRID },
  { type: Q,  label: SESSION_LABELS[Q],  drivers: FULL_GRID },
  { type: R,  label: SESSION_LABELS[R],  drivers: FULL_GRID },
  FR_SESSION,
]

const fullRaceOnly = [FR_SESSION]

// 2026 calendar: 22 rounds (Bahrain + Saudi Arabia cancelled due to Middle East conflict).
// Emilia Romagna dropped; replaced by Barcelona-Catalunya (Jun) and Madrid (Sep).
// Sprint weekends: China, Miami, Canada, Britain, Netherlands, Singapore.
export const CIRCUITS: CircuitConfig[] = [
  // ── Historical full-race replays ──────────────────────────────────────────
  { id: 'abu_dhabi_2021',  name: '2021 Abu Dhabi GP',  flag: '🇦🇪', year: 2021, raceDate: '2021-12-12', hasData: true, sessions: fullRaceOnly },
  { id: 'austrian_2025',   name: '2025 Austrian GP',   flag: '🇦🇹', year: 2025, raceDate: '2025-06-29', hasData: true, sessions: fullRaceOnly },
  { id: 'brazilian_2021',  name: '2021 Brazilian GP',  flag: '🇧🇷', year: 2021, raceDate: '2021-11-14', hasData: true, sessions: fullRaceOnly },
  { id: 'japanese_2022',   name: '2022 Japanese GP',   flag: '🇯🇵', year: 2022, raceDate: '2022-10-09', hasData: true, sessions: fullRaceOnly },
  { id: 'las_vegas_2023',  name: '2023 Las Vegas GP',  flag: '🇺🇸', year: 2023, raceDate: '2023-11-18', hasData: true, sessions: fullRaceOnly },
  { id: 'german_2019',    name: '2019 German GP',    flag: '🇩🇪', year: 2019, raceDate: '2019-07-28', hasData: true, sessions: fullRaceOnly },
  { id: 'british_2021',   name: '2021 British GP',   flag: '🇬🇧', year: 2021, raceDate: '2021-07-18', hasData: true, sessions: fullRaceOnly },
  { id: 'italian_2021',   name: '2021 Italian GP',   flag: '🇮🇹', year: 2021, raceDate: '2021-09-12', hasData: true, sessions: fullRaceOnly },
  { id: 'belgian_2022',   name: '2022 Belgian GP',   flag: '🇧🇪', year: 2022, raceDate: '2022-08-28', hasData: true, sessions: fullRaceOnly },
  { id: 'monaco_2024',    name: '2024 Monaco GP',    flag: '🇲🇨', year: 2024, raceDate: '2024-05-26', hasData: true, sessions: fullRaceOnly },
  { id: 'bahrain_2020',   name: '2020 Bahrain GP',   flag: '🇧🇭', year: 2020, raceDate: '2020-11-29', hasData: true, sessions: fullRaceOnly },
  // ── 2026 season ──────────────────────────────────────────────────────────
  { id: 'australia',          name: 'Australian GP',           flag: '🇦🇺', raceDate: '2026-03-08', hasData: true,  sessions: stdSessionsFull    },
  { id: 'china',              name: 'Chinese GP',              flag: '🇨🇳', raceDate: '2026-03-15', hasData: true,  sessions: sprintSessionsFull },
  { id: 'japan',              name: 'Japanese GP',             flag: '🇯🇵', raceDate: '2026-03-29', hasData: true,  sessions: stdSessionsFull    },
  { id: 'miami',              name: 'Miami GP',                flag: '🇺🇸', raceDate: '2026-05-03', hasData: true,  sessions: sprintSessionsFull },
  { id: 'canadian',           name: 'Canadian GP',             flag: '🇨🇦', raceDate: '2026-05-24', hasData: true,  sessions: sprintSessionsFull },
  { id: 'monaco',             name: 'Monaco GP',               flag: '🇲🇨', raceDate: '2026-06-07', hasData: true,  sessions: stdSessionsFull    },
  { id: 'barcelona_catalunya',name: 'Barcelona-Catalunya GP',  flag: '🇪🇸', raceDate: '2026-06-14', hasData: true,  sessions: stdSessionsFull    },
  { id: 'austrian',           name: 'Austrian GP',             flag: '🇦🇹', raceDate: '2026-06-28', hasData: true,  sessions: stdSessionsFull    },
  { id: 'british',            name: 'British GP',              flag: '🇬🇧', raceDate: '2026-07-05', hasData: true,  sessions: sprintSessionsFull },
  { id: 'belgian',            name: 'Belgian GP',              flag: '🇧🇪', raceDate: '2026-07-19', hasData: true,  hasPrediction: true, sessions: stdSessionsFull },
  { id: 'hungarian',          name: 'Hungarian GP',            flag: '🇭🇺', raceDate: '2026-07-26', hasData: false, hasPrediction: true, sessions: stdSessions    },
  { id: 'dutch',              name: 'Dutch GP',                flag: '🇳🇱', raceDate: '2026-08-23', hasData: false, sessions: sprintSessions },
  { id: 'italian',            name: 'Italian GP',              flag: '🇮🇹', raceDate: '2026-09-06', hasData: false, sessions: stdSessions    },
  { id: 'madrid',             name: 'Spanish GP',              flag: '🇪🇸', raceDate: '2026-09-14', hasData: false, sessions: stdSessions    },
  { id: 'azerbaijan',         name: 'Azerbaijan GP',           flag: '🇦🇿', raceDate: '2026-09-26', hasData: false, sessions: stdSessions    },
  { id: 'singapore',          name: 'Singapore GP',            flag: '🇸🇬', raceDate: '2026-10-11', hasData: false, sessions: sprintSessions },
  { id: 'united_states',      name: 'United States GP',        flag: '🇺🇸', raceDate: '2026-10-25', hasData: false, sessions: stdSessions    },
  { id: 'mexican_city',       name: 'Mexico City GP',          flag: '🇲🇽', raceDate: '2026-11-01', hasData: false, sessions: stdSessions    },
  { id: 'sao_paulo',          name: 'São Paulo GP',            flag: '🇧🇷', raceDate: '2026-11-08', hasData: false, sessions: stdSessions    },
  { id: 'las_vegas',          name: 'Las Vegas GP',            flag: '🇺🇸', raceDate: '2026-11-21', hasData: false, sessions: stdSessions    },
  { id: 'qatar',              name: 'Qatar GP',                flag: '🇶🇦', raceDate: '2026-11-29', hasData: false, sessions: stdSessions    },
  { id: 'abu_dhabi',          name: 'Abu Dhabi GP',            flag: '🇦🇪', raceDate: '2026-12-06', hasData: false, sessions: stdSessions    },
]

const FOLDER_OVERRIDES: Record<string, string> = {
  barcelona_catalunya: 'barcelona',
  abu_dhabi_2021:      'abu_dhabi',
  austrian_2025:       'austrian',
  brazilian_2021:      'brazilian',
  japanese_2022:       'japanese',
  las_vegas_2023:      'las_vegas',
  german_2019:         'german',
  british_2021:        'british',
  italian_2021:        'italian',
  belgian_2022:        'belgian',
  monaco_2024:         'monaco',
  bahrain_2020:        'bahrain',
}

function circuitFolder(circuitId: string): string {
  return FOLDER_OVERRIDES[circuitId] ?? circuitId
}

export function telemetryUrl(circuitId: string, year: number, sessionType: SessionType, driver: string): string {
  return `/data/FastF1%20Data/fastf1_${year}_${circuitFolder(circuitId)}_grand_prix/${sessionType}/telemetry_fastest_laps/${driver}_fastest_lap_telemetry.csv`
}

export function fullRaceUrl(circuitId: string, year: number, sessionFolder = 'race'): string {
  return `/data/FastF1%20Data/fastf1_${year}_${circuitFolder(circuitId)}_grand_prix/${sessionFolder}/telemetry_full_race.json`
}
