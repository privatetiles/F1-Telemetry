export interface CircuitData {
  fullName: string
  locality: string
  country: string
  length: string
  laps: number
  lapRecord: string
  lapRecordHolder: string
  lapRecordYear: number
  drsZones: number
}

export const CIRCUIT_DATA: Record<string, CircuitData> = {
  australia: {
    fullName: 'Albert Park Grand Prix Circuit',
    locality: 'Melbourne', country: 'Australia',
    length: '5.278 km', laps: 58,
    lapRecord: '1:19.813', lapRecordHolder: 'Charles Leclerc', lapRecordYear: 2022,
    drsZones: 4,
  },
  china: {
    fullName: 'Shanghai International Circuit',
    locality: 'Shanghai', country: 'China',
    length: '5.451 km', laps: 56,
    lapRecord: '1:32.238', lapRecordHolder: 'Michael Schumacher', lapRecordYear: 2004,
    drsZones: 2,
  },
  japan: {
    fullName: 'Suzuka International Racing Course',
    locality: 'Suzuka', country: 'Japan',
    length: '5.807 km', laps: 53,
    lapRecord: '1:30.983', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2019,
    drsZones: 1,
  },
  miami: {
    fullName: 'Miami International Autodrome',
    locality: 'Miami', country: 'United States',
    length: '5.412 km', laps: 57,
    lapRecord: '1:29.708', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2023,
    drsZones: 3,
  },
  canadian: {
    fullName: 'Circuit Gilles Villeneuve',
    locality: 'Montréal', country: 'Canada',
    length: '4.361 km', laps: 70,
    lapRecord: '1:13.078', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2019,
    drsZones: 2,
  },
  monaco: {
    fullName: 'Circuit de Monaco',
    locality: 'Monte Carlo', country: 'Monaco',
    length: '3.337 km', laps: 78,
    lapRecord: '1:12.909', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2021,
    drsZones: 1,
  },
  barcelona_catalunya: {
    fullName: 'Circuit de Barcelona-Catalunya',
    locality: 'Barcelona', country: 'Spain',
    length: '4.675 km', laps: 66,
    lapRecord: '1:16.330', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2023,
    drsZones: 2,
  },
  austrian: {
    fullName: 'Red Bull Ring',
    locality: 'Spielberg', country: 'Austria',
    length: '4.318 km', laps: 71,
    lapRecord: '1:05.619', lapRecordHolder: 'Carlos Sainz', lapRecordYear: 2020,
    drsZones: 3,
  },
  british: {
    fullName: 'Silverstone Circuit',
    locality: 'Silverstone', country: 'United Kingdom',
    length: '5.891 km', laps: 52,
    lapRecord: '1:27.097', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2020,
    drsZones: 2,
  },
  belgian: {
    fullName: 'Circuit de Spa-Francorchamps',
    locality: 'Stavelot', country: 'Belgium',
    length: '7.004 km', laps: 44,
    lapRecord: '1:46.286', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2018,
    drsZones: 2,
  },
  hungarian: {
    fullName: 'Hungaroring',
    locality: 'Budapest', country: 'Hungary',
    length: '4.381 km', laps: 70,
    lapRecord: '1:16.627', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2020,
    drsZones: 1,
  },
  dutch: {
    fullName: 'Circuit Zandvoort',
    locality: 'Zandvoort', country: 'Netherlands',
    length: '4.259 km', laps: 72,
    lapRecord: '1:11.097', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2021,
    drsZones: 2,
  },
  italian: {
    fullName: 'Autodromo Nazionale Monza',
    locality: 'Monza', country: 'Italy',
    length: '5.793 km', laps: 53,
    lapRecord: '1:21.046', lapRecordHolder: 'Rubens Barrichello', lapRecordYear: 2004,
    drsZones: 2,
  },
  madrid: {
    fullName: 'Madrid Street Circuit',
    locality: 'Madrid', country: 'Spain',
    length: '5.500 km', laps: 55,
    lapRecord: '—', lapRecordHolder: '—', lapRecordYear: 2026,
    drsZones: 3,
  },
  azerbaijan: {
    fullName: 'Baku City Circuit',
    locality: 'Baku', country: 'Azerbaijan',
    length: '6.003 km', laps: 51,
    lapRecord: '1:43.009', lapRecordHolder: 'Charles Leclerc', lapRecordYear: 2019,
    drsZones: 2,
  },
  singapore: {
    fullName: 'Marina Bay Street Circuit',
    locality: 'Singapore', country: 'Singapore',
    length: '4.940 km', laps: 61,
    lapRecord: '1:35.867', lapRecordHolder: 'Kevin Magnussen', lapRecordYear: 2023,
    drsZones: 3,
  },
  united_states: {
    fullName: 'Circuit of the Americas',
    locality: 'Austin', country: 'United States',
    length: '5.513 km', laps: 56,
    lapRecord: '1:36.169', lapRecordHolder: 'Charles Leclerc', lapRecordYear: 2019,
    drsZones: 3,
  },
  mexican_city: {
    fullName: 'Autodromo Hermanos Rodriguez',
    locality: 'Mexico City', country: 'Mexico',
    length: '4.304 km', laps: 71,
    lapRecord: '1:17.774', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2021,
    drsZones: 3,
  },
  sao_paulo: {
    fullName: 'Autodromo Jose Carlos Pace',
    locality: 'São Paulo', country: 'Brazil',
    length: '4.309 km', laps: 71,
    lapRecord: '1:10.540', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2018,
    drsZones: 2,
  },
  las_vegas: {
    fullName: 'Las Vegas Strip Circuit',
    locality: 'Las Vegas', country: 'United States',
    length: '6.201 km', laps: 50,
    lapRecord: '1:35.490', lapRecordHolder: 'Oscar Piastri', lapRecordYear: 2023,
    drsZones: 2,
  },
  qatar: {
    fullName: 'Losail International Circuit',
    locality: 'Lusail', country: 'Qatar',
    length: '5.380 km', laps: 57,
    lapRecord: '1:24.319', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2023,
    drsZones: 2,
  },
  abu_dhabi: {
    fullName: 'Yas Marina Circuit',
    locality: 'Abu Dhabi', country: 'UAE',
    length: '5.281 km', laps: 58,
    lapRecord: '1:26.103', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2021,
    drsZones: 2,
  },
}
