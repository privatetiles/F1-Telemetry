import Icon from './Icon'

export default function SocialsPage() {
  return (
    <div className="static-page">
      <h1>Community</h1>
      <div className="socials-grid">
        <div className="socials-card">
          <div className="socials-discord-icon"><Icon name="socials" size={34} /></div>
          <h2>Join the Discord</h2>
          <p>Chat about F1, share insights, report bugs, and suggest features with other fans.</p>
          <a
            className="socials-platform-btn socials-btn-discord"
            href="https://discord.gg/4ka3NK5SFA"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Discord Server
          </a>
        </div>

        <div className="socials-card">
          <div className="socials-platform-icon">📸</div>
          <h2>Instagram</h2>
          <p>Race highlights, telemetry visuals, and behind-the-scenes from the F1vis team.</p>
          <a
            className="socials-platform-btn socials-btn-instagram"
            href="https://www.instagram.com/f1vis/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Follow @f1vis
          </a>
        </div>

        <div className="socials-card">
          <div className="socials-platform-icon">🤖</div>
          <h2>Reddit</h2>
          <p>Posts, data deep-dives, and community discussions on r/formula1 and beyond.</p>
          <a
            className="socials-platform-btn socials-btn-reddit"
            href="https://www.reddit.com/user/F1vis/"
            target="_blank"
            rel="noopener noreferrer"
          >
            u/F1vis on Reddit
          </a>
        </div>
      </div>
    </div>
  )
}
