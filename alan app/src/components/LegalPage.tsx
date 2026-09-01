import { useEffect, type ReactNode } from 'react'
import '../LandingPage.css'

interface Props {
  /** Heading shown as the page <h1>. */
  title: string
  /** Small line under the heading (dates, tagline). */
  meta?: string
  /** Browser tab title; defaults to `title`. */
  docTitle?: string
  /** Absolute path this page lives at, e.g. '/about/'. Used for canonical/og tags. */
  canonicalPath: string
  children: ReactNode
}

/**
 * Shared shell for the standalone static pages (About, Privacy, Disclaimer).
 * Uses the landing-page chrome (nav + footer) rather than the visualizer UI,
 * and patches the per-page SEO tags while mounted.
 */
export default function LegalPage({ title, meta, docTitle, canonicalPath, children }: Props) {
  useEffect(() => {
    const url = `https://f1vis.app${canonicalPath}`

    const prevTitle = document.title
    document.title = `${docTitle ?? title} — F1 Telemetry Visualizer`

    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const prevCanonical = canonical?.getAttribute('href') ?? null
    canonical?.setAttribute('href', url)

    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
    const prevOgUrl = ogUrl?.getAttribute('content') ?? null
    ogUrl?.setAttribute('content', url)

    return () => {
      document.title = prevTitle
      if (canonical && prevCanonical) canonical.setAttribute('href', prevCanonical)
      if (ogUrl && prevOgUrl) ogUrl.setAttribute('content', prevOgUrl)
    }
  }, [title, docTitle, canonicalPath])

  return (
    <div className="landing">
      <nav className="land-nav">
        <a className="land-logo" href="/">
          <span className="land-logo-f1">F1</span>
          <span className="land-logo-text">Telemetry</span>
        </a>
        <a className="land-nav-btn" href="/">Open Visualizer</a>
      </nav>

      <section className="land-legal">
        <div className="land-legal-body">
          <h1 className="land-legal-title">{title}</h1>
          {meta && <p className="land-legal-meta">{meta}</p>}
          {children}
        </div>
      </section>

      <footer className="land-footer">
        <span>Built with FastF1 · 2026 Formula 1 Season</span>
        <span className="land-footer-sep">·</span>
        <span>Not affiliated with Formula 1 or the FIA</span>
      </footer>
    </div>
  )
}
