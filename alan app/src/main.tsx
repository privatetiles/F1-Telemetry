import { StrictMode, useState, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import LandingPage from './LandingPage'
import App from './App.tsx'
import AboutPage from './components/AboutPage'
import PrivacyPage from './components/PrivacyPage'
import DisclaimerPage from './components/DisclaimerPage'

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
  const [inApp, setInApp] = useState(false)

  const StaticPage = STATIC_PAGES[path]
  if (StaticPage) return <StaticPage />
  if (inApp) return <App />
  return <LandingPage onEnter={() => setInApp(true)} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
    <Analytics />
  </StrictMode>,
)
