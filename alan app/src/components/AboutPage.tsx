import LegalPage from './LegalPage'
import Icon from './Icon'
import './AboutPage.css'

export default function AboutPage() {
  return (
    <LegalPage title="About Us" docTitle="About Us" canonicalPath="/about/" className="about-page">
      <div className="about-profiles">
        <article className="about-profile" aria-labelledby="about-alan">
          <h2 id="about-alan">Alan</h2>
          <div className="about-photo-placeholder">Picture of Alan</div>
          <div className="about-bio">
            <p>Alan is an 8<sup>th</sup> grader.</p>
            <p>He mainly manages the website.</p>
            <p>He has been watching F1 for 2 years and supports Charles Leclerc.</p>
            <p>His other hobbies include driving cars.</p>
          </div>
        </article>
        <article className="about-profile" aria-labelledby="about-keji">
          <h2 id="about-keji">Keji</h2>
          <div className="about-photo-placeholder">Picture of Keji</div>
          <div className="about-bio">
            <p>Keji is a 10<sup>th</sup> grader.</p>
            <p>He mainly manages the predictions and socials.</p>
            <p>He has been watching F1 for 8 years and supports Charles Leclerc.</p>
            <p>His other hobbies include washing cars.</p>
          </div>
        </article>
      </div>
      <a className="about-home-link" href="/#home"><Icon name="arrow-left" size={16} /> Back to homepage</a>
    </LegalPage>
  )
}
