import type { AppView } from '../components/Sidebar'

const APP_VIEWS: readonly AppView[] = ['telemetry', 'standings', 'calendar', 'results', 'drivers', 'teams', 'circuits', 'pace', 'pace2', 'insights', 'games', 'historicalraces', 'socials', 'changelog']

export type PageView = AppView | 'welcome' | 'home'

export function appViewFromHash(hash: string): AppView | null {
  const view = hash.replace(/^#\/?/, '')
  return APP_VIEWS.includes(view as AppView) ? view as AppView : null
}

export function pageFromHash(hash: string): PageView {
  const appView = appViewFromHash(hash)
  if (appView) return appView
  const anchor = hash.replace(/^#\/?/, '')
  return anchor === 'home' || anchor === 'explore' ? 'home' : 'welcome'
}
