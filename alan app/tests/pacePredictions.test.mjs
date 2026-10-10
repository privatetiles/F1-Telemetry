import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import Papa from 'papaparse'
import { RACES2, loadDriverPredictions, loadTeamDeltas2, loadPolePredictions } from '../src/lib/paceData2.ts'
import { PACE_MAPS } from '../src/lib/paceMaps.ts'

const csv = async path => Papa.parse(await readFile(new URL(path, import.meta.url), 'utf8'), { header: true, skipEmptyLines: true }).data
const slowerPositive = value => (1 / (1 + Number(value) / 100) - 1) * 100

test('eight saved forecasts retain complete grids, team snapshots and pole summaries without latest calibration', async () => {
  const originalFetch = globalThis.fetch
  const requested = []
  globalThis.fetch = async path => {
    requested.push(path)
    return new Response(await readFile(new URL(`../public${path}`, import.meta.url), 'utf8'))
  }
  try {
    const drivers = await loadDriverPredictions()
    const teams = await loadTeamDeltas2()
    const poles = await loadPolePredictions()
    assert.deepEqual(RACES2.map(r => r.label), ['Austria', 'Britain', 'Belgium', 'Hungary', 'Dutch', 'Italy', 'Sepang', 'Singapore'])
    assert.equal(drivers.length, 176)
    assert.equal(teams.length, 88)
    assert.equal(poles.length, 8)
    assert.ok(requested.every(path => !path.includes('team_category_delta_inputs_from_2026')))
    for (const race of RACES2) {
      const map = PACE_MAPS.find(m => m.code === race.mapCode)
      assert.ok(map)
      assert.equal(map.year, race.label === 'Singapore' ? 2025 : 2026)
      assert.match(await readFile(new URL(`../public${map.telemetry}`, import.meta.url), 'utf8'), /<svg/)
      const track = JSON.parse(await readFile(new URL(`../public/pace/track_data/${map.trackPrefix}_track.json`, import.meta.url), 'utf8'))
      assert.ok(track.speedScale.min < track.speedScale.max)
      const grid = drivers.filter(d => d.race === race.fullName)
      assert.equal(grid.length, 22)
      assert.equal(new Set(grid.map(d => d.driver)).size, 22)
      assert.deepEqual(grid.map(d => d.position).sort((a, b) => a - b), Array.from({ length: 22 }, (_, i) => i + 1))
      assert.equal(teams.filter(t => t.race === race.fullName).length, 11)
      assert.equal(poles.filter(p => p.race === race.fullName).length, 1)
      assert.ok(grid.every(d => Number.isFinite(d.teamDelta) && Number.isFinite(d.predictedSeconds)))
    }
    const dutch = drivers.filter(d => d.race === 'Dutch GP / Zandvoort')
    assert.equal(dutch.filter(d => d.team === 'Williams').length, 2)
    assert.equal(dutch.find(d => d.driver === 'LAW').team, 'Red Bull Racing')
    assert.equal(dutch.find(d => d.driver === 'TSU').team, 'Racing Bulls')
    assert.ok(!dutch.some(d => d.driver === 'HAD'))
    assert.equal(drivers.find(d => d.race === 'Singapore GP' && d.driver === 'HAD').team, 'Red Bull Racing')

    const legacyFiles = [
      'four_race_2026_delta_predictions_from_new_maps.csv',
      'zandvoort_2026_team_delta_predictions_recency_weighted.csv',
      'monza_2026_team_delta_predictions_from_zandvoort_update.csv',
    ]
    for (const file of legacyFiles) {
      const original = await csv(`../public/pace2/predictions/delta_predictions/${file}`)
      for (const row of original) {
        const actual = teams.find(t => t.race === row.prediction_target_race && t.team === row.team)
        assert.equal(actual.overall, slowerPositive(row.predicted_overall_delta_pct_vs_mercedes))
        assert.equal(actual.slow, slowerPositive(row.predicted_slow_corners_delta_pct))
        assert.equal(actual.fast, slowerPositive(row.predicted_fast_corners_delta_pct))
        assert.equal(actual.straight, slowerPositive(row.predicted_straights_delta_pct))
      }
    }
    for (const [race, file] of [
      ['Sepang GP', 'sepang_2026/qualifying_time_predictions.csv'],
      ['Singapore GP', 'singapore_2026/driver_qualifying_predictions.csv'],
    ]) {
      for (const row of await csv(`../public/pace2/predictions/${file}`)) {
        const actual = drivers.find(d => d.race === race && d.driver === row.driver)
        assert.equal(actual.predictedSeconds, Number(row.predicted_qualifying_seconds))
        assert.equal(actual.predictedTime, row.predicted_qualifying_time)
        assert.equal(actual.gap, Number(row.gap_to_predicted_pole_seconds))
        assert.equal(actual.teamDelta, Number(row.projected_team_pace_pct_vs_mercedes))
        assert.ok(Math.abs(actual.teamDelta - teams.find(t => t.race === race && t.team === row.team).overall) < 1e-10)
      }
    }
    assert.equal(poles.find(p => p.race === 'Sepang GP').predictedTime, '1:34.933')
    assert.equal(poles.find(p => p.race === 'Singapore GP').predictedTime, '1:32.526')
    assert.equal(poles.find(p => p.race === 'Sepang GP').anchorDriver, '')
    assert.equal(poles.find(p => p.race === 'Singapore GP').lowTime, '')
  } finally {
    globalThis.fetch = originalFetch
  }
})
