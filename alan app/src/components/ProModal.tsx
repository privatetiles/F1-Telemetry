import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  onClose: () => void
}

export default function ProModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        'https://btdwvnanskfdgiaiadwc.supabase.co/functions/v1/bright-task',
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ origin: window.location.origin }),
        },
      )
      const json = await res.json()
      console.log('Checkout response:', json)
      if (!json.url) { setLoading(false); return }
      window.location.href = json.url
    } catch (err) {
      console.error('Checkout error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div className="auth-modal pro-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>✕</button>
        <div className="pro-badge-hero">PRO</div>
        <div className="auth-title">Upgrade to F1vis Pro</div>
        <div className="auth-sub">$3 / month · cancel anytime</div>

        <ul className="pro-perks">
          <li>Ad-free experience</li>
          <li>Custom comment color</li>
          <li>⭐ Pro badge on comments</li>
          <li>Download telemetry as CSV</li>
        </ul>

        <button className="pro-upgrade-btn" onClick={handleUpgrade} disabled={loading}>
          {loading ? 'Redirecting…' : 'Upgrade now →'}
        </button>
      </div>
    </div>
  )
}
