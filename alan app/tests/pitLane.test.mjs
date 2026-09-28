import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { extractPitLane, validatePitLane, requestPitLane } from '../src/lib/pitLane.ts'

const visit = (speed = 80) => Array.from({ length: 21 }, (_, i) => ({
  time: 10 + i, speed, x: 2000 + i * 200, y: 1000,
}))
const stops = { NOR: [{ lap: 12, in: 10, out: 30, dur: 20 }] }

test('keeps a complete pit visit at exactly 80 km/h', () => {
  const lane = extractPitLane({ NOR: visit() }, stops)
  assert.ok(lane, 'the speed limiter must not erase the entire pit lane')
  assert.equal(lane.x.length, 21)
  assert.equal(lane.x[0], 2000)
  assert.equal(lane.x.at(-1), 6000)
})

test('rejects a visit with a distant coordinate jump instead of drawing across it', () => {
  const points = visit(60)
  points[10] = { ...points[10], x: -7447, y: -1830 }
  assert.equal(extractPitLane({ NOR: points }, stops), null)
})

test('rejects frozen coordinates while the car claims to be moving', () => {
  const points = visit(60).map(p => ({ ...p, x: -7447, y: -1830 }))
  assert.equal(extractPitLane({ NOR: points }, stops), null)
})

test('does not bridge a missing middle portion of a pit visit', () => {
  const points = visit(60).filter(p => p.time < 17 || p.time > 25)
  assert.equal(extractPitLane({ NOR: points }, stops), null)
})

test('retains stationary pit-stop samples without treating them as moving frozen GPS', () => {
  const points = visit().map((p, i) => i >= 9 && i <= 12 ? { ...p, x: 3800, speed: 0 } : p)
  assert.ok(extractPitLane({ NOR: points }, stops))
})

test('uses a single driver visit in timestamp order', () => {
  const lane = extractPitLane({ NOR: visit().reverse(), VER: visit(60) }, {
    ...stops, VER: [{ lap: 18, in: 10, out: 30 }],
  })
  assert.deepEqual(lane.source, { driver: 'NOR', lap: 12 })
  assert.equal(lane.x.length, 21)
  assert.equal(lane.x[0], 2000)
  assert.equal(lane.x.at(-1), 6000)
})

test('rejects concatenated visits and malformed saved geometry', () => {
  const x = visit().map(p => p.x), y = visit().map(p => p.y)
  assert.equal(validatePitLane({ x, y }).length, 21)
  for (const payload of [
    { x: [...x, ...x], y: [...y, ...y] },
    { x, y: [1] },
    { x: [null, ...x.slice(1)], y },
    { x: [Infinity, ...x.slice(1)], y },
    { x: x.map(() => -7447), y: y.map(() => -1830) },
    { x: [], y: [] }, null,
  ]) assert.deepEqual(validatePitLane(payload), [])
})

test('a late response from an old circuit cannot replace the new lane', async t => {
  const responses = new Map()
  t.mock.method(globalThis, 'fetch', url => new Promise(resolve => responses.set(url, resolve)))
  let visible = [{ x: 9999, y: 9999 }]
  const render = points => { visible = points }
  const cancelA = requestPitLane('/a', render)
  assert.deepEqual(visible, [])
  cancelA()
  const cancelB = requestPitLane('/b', render)
  const lane = { x: visit().map(p => p.x), y: visit().map(p => p.y) }
  responses.get('/b')(new Response(JSON.stringify(lane)))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(visible[0].x, 2000)
  responses.get('/a')(new Response(JSON.stringify({ x: lane.x.map(x => x + 500), y: lane.y })))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(visible[0].x, 2000)
  cancelB()
})

test('missing or invalid saved geometry safely clears the overlay', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('not found', { status: 404 }))
  let visible = [{ x: 9999, y: 9999 }]
  const cancel = requestPitLane('/missing', points => { visible = points })
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(visible, [])
  cancel()
})

test('generated lanes contain only ordered points from their documented single pit visit', () => {
  const root = new URL('../public/data/FastF1 Data/', import.meta.url)
  let verified = 0
  for (const event of readdirSync(root)) {
    const file = new URL(`${event}/race/pit_lane.json`, root)
    if (!existsSync(file)) continue
    const lane = JSON.parse(readFileSync(file, 'utf8'))
    if (!lane.source) { assert.deepEqual(lane.x, []); continue }
    const points = validatePitLane(lane)
    assert.ok(points.length >= 6, event)
    const telemetryFile = new URL(`${event}/race/telemetry_full_race.json`, root)
    const raw = JSON.parse(existsSync(telemetryFile)
      ? readFileSync(telemetryFile, 'utf8')
      : gunzipSync(readFileSync(new URL(`${event}/race/telemetry_full_race.json.gz`, root))).toString('utf8'))
    const start = Math.min(...Object.values(raw.laps).flatMap(laps =>
      laps.filter(lap => lap.lap === 1 && Number.isFinite(lap.t0)).map(lap => lap.t0)))
    const stop = raw.pit_stops[lane.source.driver].find(s => s.lap === lane.source.lap)
    const cols = raw.drivers[lane.source.driver]
    let lastIndex = -1
    for (const point of points) {
      const index = cols.t.findIndex((time, i) => i > lastIndex && time - start >= stop.in - 2
        && time - start <= stop.out + 2 && cols.x[i] === point.x && cols.y[i] === point.y)
      assert.ok(index > lastIndex, `${event}: point must belong to the same visit`)
      lastIndex = index
    }
    verified++
  }
  assert.ok(verified >= 3, 'generated data for affected circuits must be present')
  const hungary = JSON.parse(readFileSync(new URL('fastf1_2026_hungarian_grand_prix/race/pit_lane.json', root), 'utf8'))
  assert.deepEqual(hungary.x, [], 'corrupt Hungarian telemetry must not produce an overlay')
})
