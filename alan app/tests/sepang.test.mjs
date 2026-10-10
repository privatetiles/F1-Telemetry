import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import Papa from 'papaparse'
import { RACES2, loadDriverPredictions, loadTeamDeltas2, loadPolePredictions } from '../src/lib/paceData2.ts'
import { PACE_MAPS } from '../src/lib/paceMaps.ts'

const RACE = 'Sepang GP'
const BUNDLE = 'pace2/predictions/sepang_2026'
const readPublic = path => readFile(new URL(`../public/${path}`, import.meta.url), 'utf8')
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`)
async function csv(path) {
  const parsed = Papa.parse(await readPublic(path), { header: true, skipEmptyLines: true })
  assert.deepEqual(parsed.errors, [])
  return parsed.data
}
function mockPublic(t) {
  t.mock.method(globalThis, 'fetch', async path => new Response(await readPublic(path.replace(/^\//, ''))))
}

test('Sepang has a selectable race and both requested map assets', async () => {
  const race = RACES2.find(row => row.fullName === RACE)
  assert.equal(race.eventKey, 'fastf1_2026_bahrain_grand_prix')
  assert.equal(RACES2.filter(row => row.fullName === RACE).length, 1)
  const map = PACE_MAPS.find(row => row.code === race.mapCode)
  assert.match(await readPublic(map.telemetry.slice(1)), /<svg/)
  const track = JSON.parse(await readPublic(`pace/track_data/${map.trackPrefix}_track.json`))
  assert.ok(track.segments.length > 3)
  const metadata = JSON.parse(await readPublic(`${BUNDLE}/map_metadata.json`))
  assert.equal(metadata.driver, 'LEC')
  assert.equal(metadata.session, 'Practice 2')
  assert.deepEqual(metadata.speed_colors, ['#2563eb', '#0891b2', '#22c55e', '#eab308', '#f97316', '#dc2626'])
  assert.deepEqual(metadata.speed_scale_kph, [60, 330])
})

test('driver loader preserves all published times, gaps and positive-is-slower deltas', async t => {
  mockPublic(t)
  const all = await loadDriverPredictions()
  const drivers = all.filter(row => row.race === RACE)
  const source = await csv(`${BUNDLE}/qualifying_time_predictions.csv`)
  assert.equal(drivers.length, 22)
  assert.equal(new Set(drivers.map(row => row.driver)).size, 22)
  assert.equal(new Set(drivers.map(row => row.team)).size, 11)
  for (const expected of source) {
    const driver = drivers.find(row => row.driver === expected.driver)
    assert.equal(driver.position, Number(expected.predicted_rank))
    assert.equal(driver.predictedTime, expected.predicted_qualifying_time)
    close(driver.predictedSeconds, Number(expected.predicted_qualifying_seconds))
    close(driver.gap, Number(expected.gap_to_predicted_pole_seconds))
    close(driver.teamDelta, Number(expected.projected_team_pace_pct_vs_mercedes))
  }
  assert.equal(drivers[0].driver, 'ANT')
  assert.equal(drivers[0].predictedTime, '1:34.933')
  assert.ok(drivers.find(row => row.driver === 'BOT').teamDelta > 4)
  assert.ok(all.some(row => row.race === 'Italian GP / Monza'))
})

test('team loader uses the revised mix and published eleven-team snapshot', async t => {
  mockPublic(t)
  const teams = (await loadTeamDeltas2()).filter(row => row.race === RACE)
  const source = await csv(`${BUNDLE}/sepang_relative_pace_projection.csv`)
  const mix = await csv(`${BUNDLE}/practice_2_track_mix.csv`)
  assert.equal(teams.length, 11)
  for (const team of teams) {
    const expected = source.find(row => row.team === team.team)
    close(team.overall, Number(expected.projected_relative_pace_pct_vs_mercedes))
    close(team.slow, Number(expected['Slow corners']))
    close(team.fast, Number(expected['Fast corners']))
    close(team.straight, Number(expected.Straights))
    close(team.slowShare, Number(mix.find(row => row.category === 'Slow corners').time_share_pct))
    close(team.fastShare + team.slowShare + team.straightShare, 100)
  }
})

test('later calibration updates cannot silently rewrite the Sepang forecast snapshot', async t => {
  t.mock.method(globalThis, 'fetch', async path => {
    let text = await readPublic(path.replace(/^\//, ''))
    if (path.endsWith('team_category_delta_inputs_from_2026.csv')) {
      const rows = Papa.parse(text, { header: true, skipEmptyLines: true }).data
      for (const row of rows) row.predicted_category_delta_pct_vs_mercedes = '50'
      text = Papa.unparse(rows)
    }
    return new Response(text)
  })
  const teams = await loadTeamDeltas2()
  close(teams.find(row => row.race === RACE && row.team === 'Ferrari').overall, .10601584884166007)
  assert.notEqual(teams.find(row => row.race === 'Italian GP / Monza' && row.team === 'Ferrari').overall, 50)
})

test('Sepang pole metadata describes the dry FP2 anchor and does not invent a 2025 pole', async t => {
  mockPublic(t)
  const poles = await loadPolePredictions()
  const pole = poles.find(row => row.race === RACE)
  assert.equal(pole.predictedTime, '1:34.933')
  assert.equal(pole.lowTime, '')
  assert.equal(pole.highTime, '')
  const metadata = (await csv('pace2/predictions/qualifying_time_predictions/sepang_2026_pole_prediction.csv'))[0]
  assert.match(metadata.anchor_description, /FP2 medium laps/)
  assert.match(metadata.range_label, /rough/)
  assert.match(metadata.forecast_note, /Dry/)
  assert.match(metadata.forecast_note, /not a confidence interval/)
  assert.equal(pole.anchorPole, '')
  assert.equal(pole.anchorDriver, '')
  assert.ok(poles.some(row => row.race !== RACE && row.anchorPole))
})

test('map provenance retains full distance and the requested slow-corner exits', async () => {
  const segments = await csv(`${BUNDLE}/sepang_provisional_3class_segments.csv`)
  assert.equal(segments.length, 11)
  assert.equal(Number(segments[0].start_distance_m), 0)
  assert.equal(Number(segments.at(-1).end_distance_m), 5543)
  for (const [index, segment] of segments.entries()) {
    assert.ok(Number(segment.end_distance_m) > Number(segment.start_distance_m))
    if (index) assert.equal(segment.start_distance_m, segments[index - 1].end_distance_m)
    const previous = segments[(index + segments.length - 1) % segments.length]
    assert.ok(!(previous.category === 'Slow corners' && segment.category === 'Fast corners'
      && Number(segment.end_distance_m) - Number(segment.start_distance_m) <= 300))
  }
  for (const [distance, category] of [[2900, 'Fast corners'], [3800, 'Fast corners'], [3350, 'Slow corners'], [5400, 'Straights']]) {
    assert.equal(segments.find(row => Number(row.start_distance_m) <= distance && Number(row.end_distance_m) > distance).category, category)
  }
  const samples = await csv(`${BUNDLE}/map_reference_telemetry.csv`)
  assert.equal(Number(samples[0].Distance), 0)
  assert.equal(Number(samples.at(-1).Distance), 5543)
  assert.ok(samples.every(row => ['Distance', 'Time_seconds', 'Speed', 'X', 'Y'].every(key => Number.isFinite(Number(row[key])))))
})

test('published times reproduce the archived anchor and teammate calibration inputs', async () => {
  const anchor = await csv(`${BUNDLE}/anchor_calibration.csv`)
  const offsets = await csv(`${BUNDLE}/driver_offset_samples.csv`)
  const forecast = await csv(`${BUNDLE}/qualifying_time_predictions.csv`)
  const summary = JSON.parse(await readPublic(`${BUNDLE}/summary.json`))
  const projection = await csv(`${BUNDLE}/sepang_relative_pace_projection.csv`)
  assert.deepEqual(anchor.map(row => Number(row.round)), [3, 7, 8, 10, 11, 14])
  const expanded = anchor.flatMap(row => Array(Number(row.weight)).fill(
    Number(row.q3_mercedes_mean_seconds) / Number(row.fp2_mercedes_mean_seconds))).sort((a, b) => a - b)
  const ratio = expanded[Math.floor(expanded.length / 2)]
  const baseline = 98.04 * ratio
  close(baseline, summary.mercedes_mean_qualifying_baseline_seconds)
  assert.equal(summary.primary_team_model_includes_baku, true)
  for (const team of new Set(forecast.map(row => row.team))) {
    const pair = forecast.filter(row => row.team === team)
    assert.equal(pair.length, 2)
    const raw = pair.map(driver => {
      const samples = offsets.filter(row => row.team === team && row.driver === driver.driver)
      assert.ok(samples.length >= 3)
      return samples.reduce((sum, row) => sum + Number(row.offset_seconds) * Number(row.weight), 0)
        / samples.reduce((sum, row) => sum + Number(row.weight), 0)
    })
    const mean = (raw[0] + raw[1]) / 2
    const delta = Number(projection.find(row => row.team === team).projected_relative_pace_pct_vs_mercedes)
    for (let i = 0; i < 2; i++) close(Number(pair[i].predicted_qualifying_seconds), baseline * (1 + delta / 100) + raw[i] - mean)
  }
})
