export default function PrivacyPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-content">
        <h1 className="privacy-h1">Privacy Policy</h1>
        <p className="privacy-meta">Effective date: July 1, 2026 · Last updated: July 1, 2026</p>

        <p className="privacy-intro">
          This Privacy Policy describes how F1 Telemetry Visualizer ("we", "us", or "our"),
          operated at <strong>f1vis.app</strong>, collects, uses, and shares information when
          you visit our website. By using this site you agree to the practices described below.
        </p>

        <h2 className="privacy-h2">1. Information We Collect</h2>
        <p>We do not directly collect or store any personal information such as your name, email address, or payment details.</p>
        <p>However, third-party services we use may automatically collect the following data when you visit:</p>
        <ul className="privacy-list">
          <li><strong>IP address</strong> (anonymised by Google Analytics)</li>
          <li><strong>Browser type and version</strong></li>
          <li><strong>Operating system</strong></li>
          <li><strong>Pages visited and time spent</strong></li>
          <li><strong>Referring URL</strong></li>
          <li><strong>Country/region</strong></li>
          <li><strong>Cookies and similar tracking technologies</strong> used by Google Analytics and Google AdSense</li>
        </ul>

        <h2 className="privacy-h2">2. How We Use Information</h2>
        <p>The data collected through third-party services is used to:</p>
        <ul className="privacy-list">
          <li>Understand how visitors use the site (analytics)</li>
          <li>Display relevant advertisements (AdSense)</li>
          <li>Improve site performance and content</li>
        </ul>
        <p>We do not sell, trade, or rent any personal information to third parties.</p>

        <h2 className="privacy-h2">3. Cookies</h2>
        <p>
          This site uses cookies — small text files placed on your device. Cookies are used by
          Google Analytics to track sessions and by Google AdSense to serve personalised ads.
        </p>
        <p>You can control or disable cookies through your browser settings. Note that disabling
          cookies may affect some site functionality.</p>

        <h2 className="privacy-h2">4. Google Analytics</h2>
        <p>
          We use Google Analytics to collect anonymous usage statistics. Google Analytics collects
          data such as pages viewed, session duration, and general location (country level).
          IP addresses are anonymised before storage.
        </p>
        <p>
          You can opt out of Google Analytics tracking by installing the
          {' '}<a className="privacy-link" href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
            Google Analytics Opt-out Browser Add-on
          </a>.
        </p>
        <p>
          Google's privacy policy: {' '}
          <a className="privacy-link" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            policies.google.com/privacy
          </a>
        </p>

        <h2 className="privacy-h2">5. Google AdSense</h2>
        <p>
          We use Google AdSense to display advertisements. Google AdSense may use cookies and web
          beacons to serve ads based on your prior visits to this site or other sites on the internet.
        </p>
        <p>
          You can opt out of personalised advertising by visiting {' '}
          <a className="privacy-link" href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            google.com/settings/ads
          </a>
          {' '} or {' '}
          <a className="privacy-link" href="https://www.aboutads.info/" target="_blank" rel="noopener noreferrer">
            aboutads.info
          </a>.
        </p>

        <h2 className="privacy-h2">6. Your Rights (GDPR — EU/EEA Residents)</h2>
        <p>If you are located in the European Union or European Economic Area, you have the following rights under the General Data Protection Regulation (GDPR):</p>
        <ul className="privacy-list">
          <li><strong>Right of access</strong> — you may request a copy of data held about you</li>
          <li><strong>Right to rectification</strong> — you may request correction of inaccurate data</li>
          <li><strong>Right to erasure</strong> — you may request deletion of your data</li>
          <li><strong>Right to restrict processing</strong> — you may request we limit how your data is used</li>
          <li><strong>Right to data portability</strong> — you may request your data in a portable format</li>
          <li><strong>Right to object</strong> — you may object to processing of your data</li>
        </ul>
        <p>
          Since we do not directly store personal data, most requests should be directed to Google.
          For any requests, contact us at the email below.
        </p>

        <h2 className="privacy-h2">7. California Residents (CalOPPA &amp; CCPA)</h2>
        <p>
          Under the California Online Privacy Protection Act (CalOPPA), California residents may
          request information about the categories of personal information we collect and the
          purposes for which it is used. Under CCPA, California residents also have the right to
          know, delete, and opt out of the sale of personal information.
        </p>
        <p>
          We do not sell personal information. To exercise any of these rights, contact us at
          the email address below.
        </p>

        <h2 className="privacy-h2">8. Children's Privacy (COPPA)</h2>
        <p>
          This site is not directed at children under the age of 13. We do not knowingly collect
          personal information from children under 13. If you believe a child has provided personal
          information through this site, please contact us and we will take steps to remove it.
        </p>

        <h2 className="privacy-h2">9. Third-Party Links</h2>
        <p>
          This site may display links to external websites. We are not responsible for the privacy
          practices or content of those sites and encourage you to review their privacy policies.
        </p>

        <h2 className="privacy-h2">10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this page
          with an updated effective date. Continued use of the site after changes constitutes
          acceptance of the updated policy.
        </p>

        <h2 className="privacy-h2">11. Contact</h2>
        <p>
          If you have any questions about this Privacy Policy or wish to exercise your rights,
          please contact us at: <a className="privacy-link" href="mailto:caichaochao@gmail.com">caichaochao@gmail.com</a>
        </p>
      </div>
    </div>
  )
}
