export default function AboutPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-content">
        <h1 className="privacy-h1">About F1 Telemetry Visualizer</h1>
        <p className="privacy-meta">A fan-made project — built for F1 fans, by an F1 fan</p>

        <h2 className="privacy-h2">What is this?</h2>
        <p>
          F1 Telemetry Visualizer (f1vis.app) is a free, open fan project that lets you explore
          Formula 1 telemetry data from the 2026 season. You can compare qualifying and race lap
          data, speed traces, driver inputs, mini-sector breakdowns, team pace predictions, standings,
          results, and more — all in one place, no login required.
        </p>

        <h2 className="privacy-h2">How is the data collected?</h2>
        <p>
          Telemetry data is sourced using the{' '}
          <a className="privacy-link" href="https://github.com/theOehrly/Fast-F1" target="_blank" rel="noopener noreferrer">
            FastF1
          </a>{' '}
          open-source Python library, which provides access to official F1 timing and telemetry feeds.
          Race results, standings, and schedule data are fetched from the{' '}
          <a className="privacy-link" href="https://jolpi.ca" target="_blank" rel="noopener noreferrer">
            Jolpica F1 API
          </a>
          , a community-maintained open data source.
        </p>
        <p>
          Pace predictions are generated using a custom delta-prediction model built on top of
          historical telemetry data across multiple circuits.
        </p>

        <h2 className="privacy-h2">Who made this?</h2>
        <p>
          This project was built independently as a passion project. It is not affiliated with,
          endorsed by, or connected to Formula One Management, the FIA, or any F1 constructor or driver.
        </p>

        <h2 className="privacy-h2">Is it free?</h2>
        <p>
          Yes — completely free, no account, no paywall. The site is supported by Google AdSense
          advertisements. If you enjoy the site, consider disabling your ad blocker to help keep
          it running.
        </p>

        <h2 className="privacy-h2">Contact</h2>
        <p>
          Questions, feedback, or data corrections: {' '}
          <a className="privacy-link" href="mailto:caichaochao@gmail.com">caichaochao@gmail.com</a>
        </p>
      </div>
    </div>
  )
}
