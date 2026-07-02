export default function DisclaimerPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-content">
        <h1 className="privacy-h1">Trademark &amp; Legal Disclaimer</h1>
        <p className="privacy-meta">F1 Telemetry Visualizer — f1vis.app</p>

        <h2 className="privacy-h2">Fan-Made Project</h2>
        <p>
          F1 Telemetry Visualizer is an independent, fan-made website created for educational
          and entertainment purposes. It is not a commercial product and is not affiliated with,
          sponsored by, endorsed by, or connected in any way to Formula One Management (FOM),
          Formula One World Championship Limited, the Fédération Internationale de l'Automobile
          (FIA), or any Formula 1 constructor, team, or driver.
        </p>

        <h2 className="privacy-h2">Trademark Notice</h2>
        <p>
          The following are trademarks or registered trademarks of Formula One Licensing BV,
          used here solely for identification and reference purposes under nominative fair use:
        </p>
        <ul className="privacy-list">
          <li>FORMULA 1®</li>
          <li>F1®</li>
          <li>FIA FORMULA ONE WORLD CHAMPIONSHIP™</li>
          <li>FORMULA ONE™</li>
          <li>Grand Prix circuit and race names</li>
          <li>Team and constructor names</li>
        </ul>
        <p>
          Use of these marks does not imply any affiliation with or endorsement by the trademark
          owners. All trademarks remain the property of their respective owners.
        </p>

        <h2 className="privacy-h2">Data &amp; Telemetry</h2>
        <p>
          Telemetry and timing data is accessed via the FastF1 open-source Python library and
          the Jolpica community F1 API. This data is used for non-commercial, fan analysis
          purposes only. We do not claim ownership of any F1 timing, telemetry, or results data.
        </p>

        <h2 className="privacy-h2">No Warranty</h2>
        <p>
          This site is provided "as is" without warranty of any kind. Data may be incomplete,
          delayed, or inaccurate. We make no representations about the accuracy, reliability,
          or completeness of any information on this site. Use it at your own discretion.
        </p>

        <h2 className="privacy-h2">Copyright</h2>
        <p>
          The design, code, and custom analysis on this site are the original work of the site
          creator. Reproduction or redistribution of site content without permission is prohibited.
          If you believe any content on this site infringes your rights, please contact us at{' '}
          <a className="privacy-link" href="mailto:caichaochao@gmail.com">caichaochao@gmail.com</a>.
        </p>
      </div>
    </div>
  )
}
