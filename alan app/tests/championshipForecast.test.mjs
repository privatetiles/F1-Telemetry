import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { championshipPercent, parseChampionshipForecast } from '../src/lib/championshipForecast.ts'

test('the published forecast has the points columns and the top six P2–P6 orders', async () => {
  const asset = name => readFile(new URL(`../public/pace2/predictions/championship/${name}.csv`, import.meta.url), 'utf8')
  const [driversCsv, ordersCsv] = await Promise.all([
    asset('championship_position_probabilities'), asset('championship_p2_p6_top_orders'),
  ])
  const { drivers, orders } = parseChampionshipForecast(driversCsv, ordersCsv)

  assert.deepEqual(drivers.map(driver => driver.driver), ['VER', 'HAM', 'RUS', 'NOR', 'LEC'])
  assert.deepEqual(drivers.map(driver => driver.team), ['Red Bull Racing', 'Ferrari', 'Mercedes', 'McLaren', 'Ferrari'])
  assert.deepEqual([drivers[0].points, drivers[0].expectedFinalPoints, drivers[0].expectedPointsGained], [304, 333, 29])
  assert.equal(championshipPercent(drivers[1].probabilities[1]), '40.4%')
  assert.equal(orders.length, 6)
  assert.deepEqual(orders[0].drivers.map(driver => driver.name), ['Max Verstappen', 'Lewis Hamilton', 'George Russell', 'Lando Norris', 'Charles Leclerc'])
  assert.equal(championshipPercent(orders[0].probability), '13.4%')
  assert.equal(championshipPercent(orders.reduce((sum, order) => sum + order.probability, 0)), '61.9%')
  assert.ok(orders.every((order, index) => index === 0 || orders[index - 1].probability >= order.probability))
})
