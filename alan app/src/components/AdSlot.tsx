import { useEffect, useState, useRef } from 'react'

const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'avi'])

function ext(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function AdMedia({ file, className }: { file: string; className: string }) {
  const isVideo = VIDEO_EXTS.has(ext(file))
  const src = `/ads/${encodeURIComponent(file)}`

  if (isVideo) {
    return (
      <video
        className={className}
        src={src}
        autoPlay
        loop
        muted
        playsInline
      />
    )
  }
  return <img className={className} src={src} alt="Advertisement" />
}

interface Props {
  size: 'panel' | 'leaderboard' | 'rectangle'
}

export default function AdSlot({ size }: Props) {
  const [files, setFiles]   = useState<string[]>([])
  const [idx, setIdx]       = useState(0)
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/ads/manifest.json')
      .then(r => r.ok ? r.json() as Promise<string[]> : Promise.resolve([]))
      .then(list => { setFiles(list); setIdx(0) })
      .catch(() => {})
  }, [])

  // Rotate through multiple ads every 20 s
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (files.length > 1) {
      timerRef.current = setInterval(
        () => setIdx(i => (i + 1) % files.length),
        20_000
      )
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [files.length])

  const file = files[idx] ?? null

  return (
    <div className={`ad-slot ad-slot-${size}`}>
      <span className="ad-label">Advertisement</span>
      <div className="ad-box">
        {file && <AdMedia file={file} className="ad-media" />}
      </div>
    </div>
  )
}
