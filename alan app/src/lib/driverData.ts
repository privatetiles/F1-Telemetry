export interface DriverInfo {
  firstName: string
  lastName: string
  number: number
  team: string
  flag: string
}

export const DRIVER_INFO: Record<string, DriverInfo> = {
  VER: { firstName: 'Max',       lastName: 'Verstappen', number: 33, team: 'Red Bull Racing', flag: '🇳🇱' },
  LAW: { firstName: 'Liam',      lastName: 'Lawson',     number: 30, team: 'Red Bull Racing', flag: '🇳🇿' },
  TSU: { firstName: 'Yuki',      lastName: 'Tsunoda',    number: 22, team: 'Racing Bulls',    flag: '🇯🇵' },
  NOR: { firstName: 'Lando',     lastName: 'Norris',     number: 1,  team: 'McLaren',         flag: '🇬🇧' },
  PIA: { firstName: 'Oscar',     lastName: 'Piastri',    number: 81, team: 'McLaren',         flag: '🇦🇺' },
  LEC: { firstName: 'Charles',   lastName: 'Leclerc',    number: 16, team: 'Ferrari',         flag: '🇲🇨' },
  SAI: { firstName: 'Carlos',    lastName: 'Sainz',      number: 55, team: 'Williams',        flag: '🇪🇸' },
  HAM: { firstName: 'Lewis',     lastName: 'Hamilton',   number: 44, team: 'Ferrari',         flag: '🇬🇧' },
  RUS: { firstName: 'George',    lastName: 'Russell',    number: 63, team: 'Mercedes',        flag: '🇬🇧' },
  ANT: { firstName: 'Kimi',      lastName: 'Antonelli',  number: 12, team: 'Mercedes',        flag: '🇮🇹' },
  BEA: { firstName: 'Oliver',    lastName: 'Bearman',    number: 87, team: 'Haas F1 Team',    flag: '🇬🇧' },
  ALO: { firstName: 'Fernando',  lastName: 'Alonso',     number: 14, team: 'Aston Martin',   flag: '🇪🇸' },
  STR: { firstName: 'Lance',     lastName: 'Stroll',     number: 18, team: 'Aston Martin',   flag: '🇨🇦' },
  LIN: { firstName: 'Arvid',     lastName: 'Lindblad',   number: 41, team: 'Racing Bulls',   flag: '🇬🇧' },
  OCO: { firstName: 'Esteban',   lastName: 'Ocon',       number: 31, team: 'Haas F1 Team',   flag: '🇫🇷' },
  HIR: { firstName: 'Ryō',      lastName: 'Hirakawa',   number: 8,  team: 'Haas F1 Team',   flag: '🇯🇵' },
  GAS: { firstName: 'Pierre',    lastName: 'Gasly',      number: 10, team: 'Alpine',          flag: '🇫🇷' },
  COL: { firstName: 'Franco',    lastName: 'Colapinto',  number: 43, team: 'Alpine',          flag: '🇦🇷' },
  BOR: { firstName: 'Gabriel',   lastName: 'Bortoleto',  number: 5,  team: 'Audi',            flag: '🇧🇷' },
  HUL: { firstName: 'Nico',      lastName: 'Hülkenberg', number: 27, team: 'Audi',            flag: '🇩🇪' },
  ALB: { firstName: 'Alexander', lastName: 'Albon',      number: 23, team: 'Williams',        flag: '🇹🇭' },
  BOT: { firstName: 'Valtteri',  lastName: 'Bottas',     number: 77, team: 'Cadillac',        flag: '🇫🇮' },
  PER: { firstName: 'Sergio',    lastName: 'Perez',      number: 11, team: 'Cadillac',        flag: '🇲🇽' },
  HAD: { firstName: 'Isack',     lastName: 'Hadjar',     number: 6,  team: 'Red Bull Racing', flag: '🇫🇷' },
}
