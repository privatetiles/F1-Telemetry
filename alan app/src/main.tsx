import { StrictMode, useState, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import * as Sentry from '@sentry/react'
import './index.css'
import LandingPage from './LandingPage'
import App from './App.tsx'
import AboutPage from './components/AboutPage'
import PrivacyPage from './components/PrivacyPage'
import DisclaimerPage from './components/DisclaimerPage'

Sentry.init({
  dsn: 'https://1e94ea4b0ff783a24003d0cea9c1cb1c@o4512037752995840.ingest.us.sentry.io/4512037762170880',
})

const STATIC_PAGES: Record<string, ComponentType> = {
  '/about': AboutPage,
  '/privacy': PrivacyPage,
  '/disclaimer': DisclaimerPage,
}

function Root() {
  // Minimal path routing. Real paths (served as index.html via vercel.json
  // rewrites) get their own top-level page; everything else is the
  // landing page / visualizer toggle.
  const path = window.location.pathname.replace(/\/+$/, '')
  const [inApp, setInApp] = useState(() => sessionStorage.getItem('inApp') === '1')

  const StaticPage = STATIC_PAGES[path]
  if (StaticPage) return <StaticPage />
  if (inApp) return <App />
  return <LandingPage onEnter={() => { sessionStorage.setItem('inApp', '1'); setInApp(true) }} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
    <Analytics />
  </StrictMode>,
)
