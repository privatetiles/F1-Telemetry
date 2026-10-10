import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import Papa from 'papaparse'
import { EVENTS, EVENT_LABEL, loadDeltaData, loadPredictions, computeOverall } from '../src/lib/paceData.ts'

test('Sepang exclusions and recency calibration are represented without removing Alpine overall', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async path => new Response(await readFile(new URL(`../public${path}`, import.meta.url), 'utf8'))
  try {
    const event = 'fastf1_2026_bahrain_grand_prix_qualifying'
    assert.ok(EVENTS.includes(event))
    assert.equal(EVENT_LABEL[event], 'SEP')
    const deltas = await loadDeltaData()
    assert.equal(Object.keys(deltas[event]).length, 10)
    assert.equal(deltas[event].Alpine, undefined)
    assert.ok(Math.abs(computeOverall(deltas[event].Cadillac) - 3.062) < .001)
    assert.equal(computeOverall(deltas[event].Mercedes), 0)
    const predictions = await loadPredictions()
    assert.equal(predictions.length, 11)
    assert.ok(predictions.some(p => p.team === 'Alpine'))
    const raw = await readFile(new URL('../public/pace2/delta_calculations/all_available_2026_3class_delta_calculations.csv', import.meta.url), 'utf8')
    const rows = Papa.parse(raw, { header: true, skipEmptyLines: true }).data
    for (const prediction of predictions) {
      const inputs = rows.filter(r => r.team === prediction.team)
      const total = inputs.reduce((sum, r) => sum + Number(r.time_weight_seconds) * Number(r.event_order), 0)
      const expected = inputs.reduce((sum, r) => sum + Number(r.weighted_speed_delta_vs_mercedes_pct) * Number(r.time_weight_seconds) * Number(r.event_order), 0) / total
      assert.ok(Math.abs(prediction.overall - expected) < 1e-10)
    }
    const metadata = JSON.parse(await readFile(new URL('../public/pace2/provenance/calibration_metadata.json', import.meta.url), 'utf8'))
    assert.deepEqual(metadata.sepang_excluded_drivers, ['BOT', 'COL', 'GAS'])
    assert.equal(metadata.sepang_alternate_laps_used, false)
  } finally {
    globalThis.fetch = originalFetch
  }
})
