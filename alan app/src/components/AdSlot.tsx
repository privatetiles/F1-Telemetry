interface Props {
  size: 'panel' | 'leaderboard'
}

export default function AdSlot({ size }: Props) {
  return (
    <div className={`ad-slot ad-slot-${size}`}>
      <span className="ad-label">Advertisement</span>
      <div className="ad-box" />
    </div>
  )
}
