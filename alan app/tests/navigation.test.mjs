import assert from 'node:assert/strict'
import test from 'node:test'
import { appViewFromHash, pageFromHash } from '../src/lib/navigation.ts'

test('the welcome screen is separate from the homepage', () => {
  assert.equal(pageFromHash(''), 'welcome')
  assert.equal(pageFromHash('#home'), 'home')
  assert.equal(pageFromHash('#/home'), 'home')
  assert.equal(pageFromHash('#explore'), 'home')
  assert.equal(pageFromHash('#/explore'), 'home')
  assert.equal(pageFromHash('#unknown'), 'welcome')
  assert.equal(appViewFromHash('#home'), null)
})

test('all existing workspace deep links still resolve', () => {
  const views = ['telemetry', 'standings', 'calendar', 'results', 'drivers', 'teams', 'circuits', 'pace', 'pace2', 'insights', 'games', 'historicalraces', 'socials', 'changelog']
  for (const view of views) {
    assert.equal(pageFromHash(`#${view}`), view)
    assert.equal(pageFromHash(`#/${view}`), view)
    assert.equal(appViewFromHash(`#${view}`), view)
  }
})

test('the entry flow and back-navigation routes stay distinct', () => {
  const history = ['', '#home', '#calendar', '#home', '']
  assert.deepEqual(history.map(pageFromHash), ['welcome', 'home', 'calendar', 'home', 'welcome'])
})
