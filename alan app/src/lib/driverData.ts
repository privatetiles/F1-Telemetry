export interface DriverInfo {
  firstName: string
  lastName: string
  number: number
  team: string
  flag: string
}

export const DRIVER_INFO: Record<string, DriverInfo> = {
  VER: { firstName: 'Max',       lastName: 'Verstappen', number: 1,  team: 'Red Bull Racing', flag: '🇳🇱' },
  LAW: { firstName: 'Liam',      lastName: 'Lawson',     number: 30, team: 'Red Bull Racing', flag: '🇳🇿' },
  NOR: { firstName: 'Lando',     lastName: 'Norris',     number: 4,  team: 'McLaren',          flag: '🇬🇧' },
  PIA: { firstName: 'Oscar',     lastName: 'Piastri',    number: 81, team: 'McLaren',          flag: '🇦🇺' },
  LEC: { firstName: 'Charles',   lastName: 'Leclerc',    number: 16, team: 'Ferrari',          flag: '🇲🇨' },
  SAI: { firstName: 'Carlos',    lastName: 'Sainz',      number: 55, team: 'Williams',         flag: '🇪🇸' },
  HAM: { firstName: 'Lewis',     lastName: 'Hamilton',   number: 44, team: 'Ferrari',          flag: '🇬🇧' },
  RUS: { firstName: 'George',    lastName: 'Russell',    number: 63, team: 'Mercedes',         flag: '🇬🇧' },
  ANT: { firstName: 'Kimi',      lastName: 'Antonelli',  number: 12, team: 'Mercedes',         flag: '🇮🇹' },
  BEA: { firstName: 'Oliver',    lastName: 'Bearman',    number: 87, team: 'Haas F1 Team',     flag: '🇬🇧' },
  ALO: { firstName: 'Fernando',  lastName: 'Alonso',     number: 14, team: 'Aston Martin',     flag: '🇪🇸' },
  STR: { firstName: 'Lance',     lastName: 'Stroll',     number: 18, team: 'Aston Martin',     flag: '🇨🇦' },
  LIN: { firstName: 'Arvid',     lastName: 'Lindblad',   number: 7,  team: 'Racing Bulls',     flag: '🇬🇧' },
  OCO: { firstName: 'Esteban',   lastName: 'Ocon',       number: 31, team: 'Haas F1 Team',     flag: '🇫🇷' },
  GAS: { firstName: 'Pierre',    lastName: 'Gasly',      number: 10, team: 'Alpine',           flag: '🇫🇷' },
  BOR: { firstName: 'Gabriel',   lastName: 'Bortoleto',  number: 5,  team: 'Audi',             flag: '🇧🇷' },
  ALB: { firstName: 'Alexander', lastName: 'Albon',      number: 23, team: 'Williams',         flag: '🇹🇭' },
  COL: { firstName: 'Franco',    lastName: 'Colapinto',  number: 43, team: 'Cadillac',         flag: '🇦🇷' },
  BOT: { firstName: 'Valtteri',  lastName: 'Bottas',     number: 77, team: 'Audi',             flag: '🇫🇮' },
  HUL: { firstName: 'Nico',      lastName: 'Hülkenberg', number: 27, team: 'Alpine',           flag: '🇩🇪' },
  HAD: { firstName: 'Isack',     lastName: 'Hadjar',     number: 6,  team: 'Racing Bulls',     flag: '🇫🇷' },
  PER: { firstName: 'Sergio',    lastName: 'Perez',      number: 11, team: 'Cadillac',         flag: '🇲🇽' },
}
