import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import Papa from 'papaparse'
import { CATEGORIES, EVENTS, EVENT_LABEL, computeOverall, loadDeltaData, loadPredictions } from '../src/lib/paceData.ts'

const AZE = 'fastf1_2026_azerbaijan_grand_prix_qualifying'
const deltasPath = 'pace2/delta_calculations/all_available_2026_3class_delta_calculations.csv'
const predictionsPath = 'pace2/predictions/delta_predictions/team_category_delta_inputs_from_2026.csv'
const readPublic = path => readFile(new URL(`../public/${path}`, import.meta.url), 'utf8')

async function readCsv(path) {
  const parsed = Papa.parse(await readPublic(path), { header: true, skipEmptyLines: true })
  assert.deepEqual(parsed.errors, [])
  return parsed.data
}

function close(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`)
}

test('the archived history retains the original AZE qualifying snapshot', async () => {
  const rows = await readCsv(deltasPath)
  const events = [...new Set(rows.map(row => row.event))]
  assert.equal(rows.length, 519)
  assert.equal(events.length, 16)
  assert.deepEqual(events.filter(event => event.includes('azerbaijan')), [AZE])
  assert.deepEqual(EVENTS.filter(event => event.includes('azerbaijan')), [])
  assert.equal(EVENT_LABEL[AZE], 'AZE')
  const baku = rows.filter(row => row.event === AZE)
  assert.equal(baku.length, 33)
  assert.deepEqual(baku, await readCsv('pace2/delta_calculations/baku_2026_qualifying_russell_only.csv'))
  assert.ok(baku.every(row => row.event_order === '15' && row.session === 'qualifying'
    && row.baseline_drivers === 'RUS' && row.quality_status === 'provisional_unresolved_baseline'))
  assert.equal(new Set(rows.map(row => `${row.event}|${row.team}|${row.category}`)).size, rows.length)
})

test('Baku provenance uses 21 drivers across all qualifying phases, with Russell alone for Mercedes', async () => {
  const laps = await readCsv('pace2/provenance/baku_2026_selected_qualifying_laps.csv')
  const segments = await readCsv('pace2/provenance/baku_2026_selected_driver_segments.csv')
  assert.equal(laps.length, 21)
  assert.equal(new Set(laps.map(row => row.driver)).size, 21)
  assert.ok(laps.every(row => row.driver !== 'ANT' && row.session === 'qualifying'
    && row.included_in_provisional_calibration === 'True'))
  assert.deepEqual(['Q1', 'Q2', 'Q3'].map(phase => laps.filter(row => row.qualifying_phase === phase).length), [6, 7, 8])
  const mercedes = laps.filter(row => row.team === 'Mercedes')
  assert.equal(mercedes.length, 1)
  assert.equal(mercedes[0].driver, 'RUS')
  assert.equal(mercedes[0].qualifying_phase, 'Q3')
  assert.equal(Number(mercedes[0].lap_number), 25)
  assert.equal(Number(mercedes[0].lap_time_seconds), 102.526)
  assert.equal(mercedes[0].passes_prior_quality_gate, 'False')
  for (const team of new Set(laps.map(row => row.team))) {
    assert.equal(laps.filter(row => row.team === team).length, team === 'Mercedes' ? 1 : 2)
  }
  assert.equal(segments.length, 399)
  assert.deepEqual([...new Set(segments.map(row => row.driver))].sort(), laps.map(row => row.driver).sort())
  for (const lap of laps) {
    const selected = segments.filter(row => row.driver === lap.driver)
    assert.equal(new Set(selected.map(row => row.segment_id)).size, 19)
    assert.ok(selected.every(row => row.event === AZE && row.team === lap.team && row.session === 'qualifying'))
  }
})

test('archived category predictions reproduce their original inputs', async () => {
  const rows = await readCsv(deltasPath)
  const predictions = await readCsv(predictionsPath)
  assert.equal(predictions.length, 33)
  assert.equal(new Set(predictions.map(row => `${row.team}|${row.category}`)).size, 33)
  assert.deepEqual([...new Set(rows.map(row => Number(row.event_order)))].sort((a, b) => a - b),
    Array.from({ length: 16 }, (_, i) => i + 1))
  for (const prediction of predictions) {
    const inputs = rows.filter(row => row.team === prediction.team && row.category === prediction.category
      && (row.calibration_included === 'True' || (row.event === 'fastf1_2026_bahrain_grand_prix_qualifying'
        && row.quality_status === 'screened_fastest_laps_only')))
    const weight = inputs.reduce((sum, row) => sum + Number(row.time_weight_seconds) * Number(row.event_order), 0)
    const weightedDelta = inputs.reduce((sum, row) => sum + Number(row.weighted_speed_delta_vs_mercedes_pct)
      * Number(row.time_weight_seconds) * Number(row.event_order), 0)
    close(Number(prediction.input_time_weight_seconds), weight)
    close(Number(prediction.predicted_category_delta_pct_vs_mercedes), weightedDelta / weight)
    assert.equal(Number(prediction.input_events_used), new Set(inputs.map(row => row.event)).size)
    assert.deepEqual(prediction.input_event_list.split(',').sort(), inputs.map(row => row.event).sort())
    assert.equal(inputs.filter(row => row.event === AZE).length, 1)
  }
})

test('production loaders display the approved positive-is-slower values and preserve exclusions', async t => {
  t.mock.method(globalThis, 'fetch', async path => new Response(await readPublic(path.replace(/^\//, ''))))
  const history = await loadDeltaData()
  const predictions = await loadPredictions()
  const expected = Object.fromEntries((await readCsv('pace2/delta_calculations/current_team_pace.csv'))
    .map(row => [row.team, Number(row.overall_pct)]))
  assert.equal(predictions.length, 11)
  assert.deepEqual(predictions.map(row => row.team), Object.keys(expected))
  for (const prediction of predictions) close(prediction.overall, expected[prediction.team], 1e-6)
  assert.ok(!history.fastf1_2026_hungarian_grand_prix)
  assert.ok(!history.fastf1_2026_dutch_grand_prix_qualifying?.Williams)
  assert.equal(history[AZE], undefined)
  assert.equal(Object.keys(history).length, 12)
  for (const event of Object.values(history)) {
    for (const category of CATEGORIES) assert.equal(event.Mercedes[category].delta, 0)
    assert.equal(computeOverall(event.Mercedes), 0)
  }
  assert.ok(predictions.find(row => row.team === 'Williams').overall > 0)
  assert.ok(predictions.find(row => row.team === 'Ferrari').overall < 0)
})

test('current calibration excludes ineligible sessions without renumbering recency weights', async () => {
  const rows = await readCsv('pace2/delta_calculations/active_2026_3class_deltas.csv')
  const calibration = await readCsv('pace2/delta_calculations/current_team_category_deltas.csv')
  assert.equal(rows.length, 390)
  assert.equal(new Set(rows.map(row => `${row.event}|${row.team}|${row.category}`)).size, rows.length)
  assert.deepEqual([...new Set(rows.map(row => Number(row.event_order)))].sort((a, b) => a - b),
    [1, 2, 3, 6, 7, 8, 9, 10, 11, 13, 14, 16])
  assert.deepEqual([...new Set(rows.map(row => row.event))].sort(), [...EVENTS].sort())
  assert.ok(rows.every(row => row.calibration_included === 'True'))
  assert.equal(calibration.length, 33)
  for (const category of calibration) {
    const inputs = rows.filter(row => row.team === category.team && row.category === category.category)
    const weight = inputs.reduce((sum, row) => sum + Number(row.time_weight_seconds) * Number(row.event_order), 0)
    const total = inputs.reduce((sum, row) => sum + Number(row.weighted_speed_delta_vs_mercedes_pct)
      * Number(row.time_weight_seconds) * Number(row.event_order), 0)
    close(Number(category.predicted_category_delta_pct_vs_mercedes), total / weight)
    close(Number(category.input_time_weight_seconds), weight)
    assert.equal(Number(category.input_events_used), inputs.length)
    assert.deepEqual(category.input_event_list.split(',').sort(), inputs.map(row => row.event).sort())
  }
})
