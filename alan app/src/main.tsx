import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LandingPage from './LandingPage'
import App from './App.tsx'

function Root() {
  const [inApp, setInApp] = useState(false)
  if (inApp) return <App />
  return <LandingPage onEnter={() => setInApp(true)} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
