import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import { PACE_MAPS } from '../src/lib/paceMaps.ts'

const publicFile = path => new URL(`../public${path}`, import.meta.url)

test('all circuits have uniform track data and concise year-labelled telemetry maps', async () => {
  assert.deepEqual(PACE_MAPS.slice(7).map(m => m.code), ['AUT', 'GBR', 'BEL', 'HUN', 'NED', 'ITA', 'MAD', 'AZE', 'SEP', 'SIN'])
  assert.equal(new Set(PACE_MAPS.map(m => m.code)).size, PACE_MAPS.length)
  for (const map of PACE_MAPS) {
    assert.equal(map.year, map.code === 'SIN' ? 2025 : 2026)
    assert.match(map.source, /^\w+ Grand Prix \| 202[56]$/)
    const svg = await readFile(publicFile(map.telemetry), 'utf8')
    assert.match(svg, /viewBox="0 0 1400 1000"/)
    const labels = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1])
    assert.equal(labels.length, 0)
    const track = JSON.parse(await readFile(publicFile(`/pace/track_data/${map.trackPrefix}_track.json`), 'utf8'))
    assert.ok(track.speedScale.min < track.speedScale.max)
    assert.ok(track.speedScale.colors.length > 20)
    assert.ok(track.segments.length > 3)
    for (const run of track.segments) {
      assert.ok(['Slow corners', 'Fast corners', 'Straights'].includes(run.category))
      assert.ok(run.points.length >= 2)
      assert.ok(run.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)))
    }
  }
})

test('local public assets and manifests contain no delta graphs', async () => {
  const files = await readdir(publicFile('/'), { recursive: true })
  assert.deepEqual(files.filter(path => path.includes('delta_graph')), [])
  for (const scope of ['pace', 'pace2']) {
    assert.doesNotMatch(await readFile(publicFile(`/${scope}/manifest.csv`), 'utf8'), /delta_graph/)
  }
})

test('replacement maps retain telemetry source years, hashes and approved boundaries', async () => {
  const report = JSON.parse(await readFile(publicFile('/pace/provenance/standardized_maps.json'), 'utf8'))
  assert.equal(report.pace_csv_unchanged, true)
  assert.equal(report.maps.length, PACE_MAPS.length)
  for (const map of report.maps.filter(m => ['austria_2026', 'silverstone_2026', 'spa_2026', 'hungaroring_2026', 'zandvoort_2026', 'monza_2026'].includes(m.prefix))) {
    assert.equal(map.year, 2026)
    assert.ok(map.sources.length > 1)
    for (const source of map.sources) {
      assert.match(source.path, /FastF1 Data\/2026\//)
      assert.match(source.sha256, /^[a-f0-9]{64}$/)
    }
  }
  const singapore = report.maps.find(m => m.prefix === 'singapore_2025')
  for (const [start, end] of [[1080, 1250], [2260, 2600], [3140, 3510]]) {
    assert.ok(singapore.class_boundaries.some(s => s.category === 'Straights' && s.start_distance_m <= start && s.end_distance_m >= end))
  }
  const sepang = report.maps.find(m => m.prefix === 'sepang_2026')
  const track = JSON.parse(await readFile(publicFile('/pace/track_data/sepang_2026_track.json'), 'utf8'))
  assert.deepEqual(track.segments.map(s => s.category), sepang.class_boundaries.map(s => s.category))
})
