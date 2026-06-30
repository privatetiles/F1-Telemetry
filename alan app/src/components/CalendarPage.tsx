import { useEffect, useState } from 'react'
import { fetchSchedule } from '../lib/f1Api'
import type { Race } from '../lib/f1Api'

const COUNTRY_FLAG: Record<string, string> = {
  Australia: '🇦🇺', China: '🇨🇳', Japan: '🇯🇵', 'United States': '🇺🇸',
  Canada: '🇨🇦', Monaco: '🇲🇨', Spain: '🇪🇸', Austria: '🇦🇹',
  'United Kingdom': '🇬🇧', Belgium: '🇧🇪', Hungary: '🇭🇺', Netherlands: '🇳🇱',
  Italy: '🇮🇹', Azerbaijan: '🇦🇿', Singapore: '🇸🇬', Mexico: '🇲🇽',
  Brazil: '🇧🇷', 'United Arab Emirates': '🇦🇪', Qatar: '🇶🇦',
}

function raceStatus(dateStr: string): 'past' | 'upcoming' | 'next' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const race = new Date(dateStr)
  race.setHours(0, 0, 0, 0)
  return race < today ? 'past' : 'upcoming'
}

function countdown(dateStr: string): string {
  const now = new Date()
  const race = new Date(dateStr)
  const diffMs = race.getTime() - now.getTime()
  if (diffMs < 0) return ''
  const days = Math.floor(diffMs / 86400000)
  if (days === 0) return 'Today!'
  if (days === 1) return 'Tomorrow'
  return `${days} days`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  onSelectRound?: (round: number) => void
}

export default function CalendarPage({ onSelectRound }: Props) {
  const [races, setRaces]   = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)

  useEffect(() => {
    fetchSchedule()
      .then(setRaces)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading">Loading calendar…</div>
  if (error)   return <div className="page-error">Failed to load calendar</div>

  const today = new Date(); today.setHours(0,0,0,0)
  let nextFound = false

  return (
    <div className="calendar-page">
      <h2 className="page-title">2026 F1 Season Calendar</h2>
      <div className="cal-list">
        {races.map((race) => {
          const st  = raceStatus(race.date)
          const cd  = countdown(race.date)
          const flag = COUNTRY_FLAG[race.Circuit.Location.country] ?? '🏁'
          const isNext = st === 'upcoming' && !nextFound
          if (isNext) nextFound = true
          return (
            <div
              key={race.round}
              className={`cal-row ${st} ${isNext ? 'next-race' : ''}`}
              onClick={() => st === 'past' && onSelectRound?.(parseInt(race.round))}
              style={st === 'past' && onSelectRound ? { cursor: 'pointer' } : undefined}
            >
              <span className="cal-round">R{race.round}</span>
              <span className="cal-flag">{flag}</span>
              <div className="cal-info">
                <span className="cal-name">{race.raceName}</span>
                <span className="cal-circuit">{race.Circuit.circuitName} · {race.Circuit.Location.country}</span>
              </div>
              <div className="cal-right">
                <span className="cal-date">{formatDate(race.date)}</span>
                {st === 'past'
                  ? <span className="cal-done">Finished</span>
                  : <span className={`cal-cd ${isNext ? 'cal-cd-next' : ''}`}>{cd}</span>
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
