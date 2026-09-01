import Icon from './Icon'

export default function SocialsPage() {
  return (
    <div className="static-page">
      <h1>Community</h1>
      <div className="socials-card">
        <div className="socials-discord-icon"><Icon name="socials" size={34} /></div>
        <h2>Join the Discord</h2>
        <p>Chat about F1, share insights, report bugs, and suggest features with other fans.</p>
        <a
          className="socials-discord-btn"
          href="https://discord.gg/EkM8cCJeP"
          target="_blank"
          rel="noopener noreferrer"
        >
          Join Discord Server
        </a>
      </div>
    </div>
  )
}
