import type { TrackData } from '../lib/paceData'

export default function PaceTelemetryMap({ imageUrl, label, speedScale, onError }: {
  imageUrl: string
  label: string
  speedScale: TrackData['speedScale']
  onError: () => void
}) {
  return (
    <div className="pace-telemetry-map">
      {speedScale && (
        <div className="pace-speed-scale" aria-label="Speed color scale">
          <div className="pace-speed-gradient" style={{ background: `linear-gradient(to right, ${speedScale.colors.join(',')})` }} />
          <div className="pace-speed-labels">
            <span>{speedScale.min.toFixed(0)} km/h</span>
            <span>{speedScale.max.toFixed(0)} km/h</span>
          </div>
        </div>
      )}
      <img key={imageUrl} src={imageUrl} alt={`${label} telemetry`} className="pace-map-img" onError={onError} />
    </div>
  )
}
