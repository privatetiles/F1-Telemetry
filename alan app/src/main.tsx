import { StrictMode, useEffect, useState, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import * as Sentry from '@sentry/react'
import './index.css'
import LandingPage from './LandingPage'
import WelcomePage from './WelcomePage'
import App from './App.tsx'
import AboutPage from './components/AboutPage'
import PrivacyPage from './components/PrivacyPage'
import DisclaimerPage from './components/DisclaimerPage'
import { pageFromHash } from './lib/navigation'

Sentry.init({
  dsn: 'https://1e94ea4b0ff783a24003d0cea9c1cb1c@o4512037752995840.ingest.us.sentry.io/4512037762170880',
})

const STATIC_PAGES: Record<string, ComponentType> = {
  '/about': AboutPage,
  '/privacy': PrivacyPage,
  '/disclaimer': DisclaimerPage,
}

function Root() {
  // Static pages use real paths; the workspace keeps its existing hash routes.
  const path = window.location.pathname.replace(/\/+$/, '')
  const [view, setView] = useState(() => pageFromHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setView(pageFromHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (view === 'home' && !window.location.hash.endsWith('explore')) window.scrollTo(0, 0)
  }, [view])

  const StaticPage = STATIC_PAGES[path]
  if (StaticPage) return <StaticPage />
  if (view === 'welcome') return <WelcomePage />
  if (view === 'home') return <LandingPage />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
    <Analytics />
  </StrictMode>,
)
