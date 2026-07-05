import type { CircuitConfig, SessionType } from '../types'

export const FULL_GRID = [
  'VER','LAW','NOR','PIA','LEC','SAI','HAM','RUS','ANT','BEA',
  'ALO','STR','LIN','OCO','GAS','BOR','ALB','COL','BOT','HUL','HAD','PER',
]

const Q  = 'qualifying'        as SessionType
const R  = 'race'              as SessionType
const SQ = 'sprint_qualifying' as SessionType
const SR = 'sprint_race'       as SessionType

const SESSION_LABELS: Record<SessionType, string> = {
  qualifying:        'Qualifying',
  race:              'Race',
  sprint_qualifying: 'Sprint Qualifying',
  sprint_race:       'Sprint Race',
}

const stdSessions = [
  { type: Q, label: SESSION_LABELS[Q], drivers: FULL_GRID },
  { type: R, label: SESSION_LABELS[R], drivers: FULL_GRID },
]

const sprintSessions = [
  { type: SQ, label: SESSION_LABELS[SQ], drivers: FULL_GRID },
  { type: SR, label: SESSION_LABELS[SR], drivers: FULL_GRID },
  { type: Q,  label: SESSION_LABELS[Q],  drivers: FULL_GRID },
  { type: R,  label: SESSION_LABELS[R],  drivers: FULL_GRID },
]

// 2026 calendar: 22 rounds (Bahrain + Saudi Arabia cancelled due to Middle East conflict).
// Emilia Romagna dropped; replaced by Barcelona-Catalunya (Jun) and Madrid (Sep).
// Sprint weekends: China, Miami, Canada, Britain, Netherlands, Singapore.
export const CIRCUITS: CircuitConfig[] = [
  { id: 'australia',          name: 'Australian GP',           flag: '🇦🇺', raceDate: '2026-03-08', hasData: true,  sessions: stdSessions    },
  { id: 'china',              name: 'Chinese GP',              flag: '🇨🇳', raceDate: '2026-03-15', hasData: true,  sessions: sprintSessions },
  { id: 'japan',              name: 'Japanese GP',             flag: '🇯🇵', raceDate: '2026-03-29', hasData: true,  sessions: stdSessions    },
  { id: 'miami',              name: 'Miami GP',                flag: '🇺🇸', raceDate: '2026-05-03', hasData: true,  sessions: sprintSessions },
  { id: 'canadian',           name: 'Canadian GP',             flag: '🇨🇦', raceDate: '2026-05-24', hasData: true,  sessions: sprintSessions },
  { id: 'monaco',             name: 'Monaco GP',               flag: '🇲🇨', raceDate: '2026-06-07', hasData: true,  sessions: stdSessions    },
  { id: 'barcelona_catalunya',name: 'Barcelona-Catalunya GP',  flag: '🇪🇸', raceDate: '2026-06-14', hasData: true,  sessions: stdSessions    },
  { id: 'austrian',           name: 'Austrian GP',             flag: '🇦🇹', raceDate: '2026-06-28', hasData: true,  sessions: stdSessions    },
  { id: 'british',            name: 'British GP',              flag: '🇬🇧', raceDate: '2026-07-05', hasData: true,  hasPrediction: true, sessions: sprintSessions },
  { id: 'belgian',            name: 'Belgian GP',              flag: '🇧🇪', raceDate: '2026-07-19', hasData: false, hasPrediction: true, sessions: stdSessions    },
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
}

export function telemetryUrl(circuitId: string, sessionType: SessionType, driver: string): string {
  const folder = FOLDER_OVERRIDES[circuitId] ?? circuitId
  return `/data/FastF1%20Data/fastf1_2026_${folder}_grand_prix/${sessionType}/telemetry_fastest_laps/${driver}_fastest_lap_telemetry.csv`
}
