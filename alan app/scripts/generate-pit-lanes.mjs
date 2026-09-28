import { existsSync, readdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { extractPitLane } from '../src/lib/pitLane.ts'

const root = fileURLToPath(new URL('../public/data/FastF1 Data/', import.meta.url))
let available = 0, unavailable = 0
for (const event of readdirSync(root).sort()) {
  const race = join(root, event, 'race')
  const input = join(race, 'telemetry_full_race.json')
  if (!existsSync(input) && !existsSync(`${input}.gz`)) continue
  const raw = JSON.parse(existsSync(input)
    ? readFileSync(input, 'utf8')
    : gunzipSync(readFileSync(`${input}.gz`)).toString('utf8'))
  const starts = Object.values(raw.laps).flatMap(laps =>
    laps.filter(lap => lap.lap === 1 && Number.isFinite(lap.t0)).map(lap => lap.t0))
  const start = starts.length ? Math.min(...starts) : 0
  const telemetry = Object.fromEntries(Object.entries(raw.drivers).map(([driver, cols]) => [driver,
    cols.t.map((time, i) => ({ time: time - start, x: cols.x[i], y: cols.y[i], speed: cols.v[i] })),
  ]))
  const lane = extractPitLane(telemetry, raw.pit_stops ?? {})
  const result = lane ?? { x: [], y: [], source: null }
  // Atomic replacement also keeps hard-linked source/snapshot assets untouched.
  const output = join(race, 'pit_lane.json')
  writeFileSync(`${output}.tmp`, JSON.stringify(result) + '\n')
  renameSync(`${output}.tmp`, output)
  if (lane) available++; else unavailable++
  console.log(`${event}: ${lane ? `${lane.source.driver} lap ${lane.source.lap}, ${lane.x.length} points` : 'unavailable (no complete valid traversal)'}`)
}
console.log(`Pit lanes: ${available} validated, ${unavailable} unavailable.`)
