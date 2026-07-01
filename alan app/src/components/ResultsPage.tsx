import { useEffect, useState } from 'react'
import { fetchAllResults, fetchRaceResult, CONSTRUCTOR_TEAM } from '../lib/f1Api'
import type { Race, RaceResult } from '../lib/f1Api'
import { TEAM_COLORS } from '../lib/paceData'

const COUNTRY_FLAG: Record<string, string> = {
  Australia: '🇦🇺', China: '🇨🇳', Japan: '🇯🇵', 'United States': '🇺🇸',
  Canada: '🇨🇦', Monaco: '🇲🇨', Spain: '🇪🇸', Austria: '🇦🇹',
  'United Kingdom': '🇬🇧', Belgium: '🇧🇪', Hungary: '🇭🇺', Netherlands: '🇳🇱',
  Italy: '🇮🇹', Azerbaijan: '🇦🇿', Singapore: '🇸🇬', Mexico: '🇲🇽',
  Brazil: '🇧🇷', 'United Arab Emirates': '🇦🇪', Qatar: '🇶🇦',
}

function posIcon(posText: string) {
  if (posText === '1') return '🥇'
  if (posText === '2') return '🥈'
  if (posText === '3') return '🥉'
  return null
}

function statusClass(status: string) {
  if (status === 'Finished') return ''
  if (status.startsWith('+')) return 'lapped'
  return 'dnf'
}

interface Props {
  initialRound?: number
}

export default function ResultsPage({ initialRound }: Props) {
  const [rounds, setRounds]     = useState<Race[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [detail, setDetail]     = useState<Race | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    fetchAllResults()
      .then((races) => {
        setRounds(races)
        const init = initialRound ?? (races.length > 0 ? parseInt(races[races.length - 1].round) : null)
        if (init) { setSelected(init); loadDetail(init) }
      })
      .finally(() => setLoadingList(false))
  }, [])

  function loadDetail(round: number) {
    setLoadingDetail(true)
    fetchRaceResult(round)
      .then(setDetail)
      .finally(() => setLoadingDetail(false))
  }

  function selectRound(round: number) {
    setSelected(round)
    loadDetail(round)
  }

  return (
    <div className="results-page">
      {/* Round list sidebar */}
      <aside className="results-list">
        <h3 className="results-list-title">2026 Races</h3>
        {loadingList
          ? <div className="page-loading-sm">Loading…</div>
          : rounds.map((r) => {
              const flag = COUNTRY_FLAG[r.Circuit.Location.country] ?? '🏁'
              return (
                <button
                  key={r.round}
                  className={`round-btn ${selected === parseInt(r.round) ? 'active' : ''}`}
                  onClick={() => selectRound(parseInt(r.round))}
                >
                  <span className="round-btn-num">R{r.round}</span>
                  <span className="round-btn-flag">{flag}</span>
                  <span className="round-btn-name">{r.raceName.replace(' Grand Prix', ' GP')}</span>
                </button>
              )
            })
        }
      </aside>

      {/* Results detail */}
      <div className="results-detail">
        {loadingDetail ? (
          <div className="page-loading">Loading results…</div>
        ) : !detail ? (
          <div className="page-empty">Select a race to view results</div>
        ) : (
          <>
            <h2 className="results-race-name">{detail.raceName}</h2>
            <p className="results-race-meta">{detail.Circuit.circuitName} · {detail.date}</p>
            <div className="results-table">
              <div className="res-head">
                <span className="rc-pos">P</span>
                <span className="rc-no">#</span>
                <span className="rc-driver">Driver</span>
                <span className="rc-team">Team</span>
                <span className="rc-grid">Grid</span>
                <span className="rc-time">Time / Status</span>
                <span className="rc-pts">PTS</span>
              </div>
              {(detail.Results ?? []).map((r: RaceResult) => {
                const teamName = CONSTRUCTOR_TEAM[r.Constructor.constructorId] ?? r.Constructor.name
                const color    = TEAM_COLORS[teamName] ?? '#445'
                const icon     = posIcon(r.positionText)
                const sc       = statusClass(r.status)
                const isFl     = r.FastestLap?.rank === '1'
                return (
                  <div key={r.Driver.code} className={`res-row ${sc}`}>
                    <span className="rc-pos">
                      {icon ?? <span style={{ color: '#778' }}>{r.positionText === 'R' ? 'DNF' : r.positionText === 'W' ? 'DNS' : r.positionText}</span>}
                    </span>
                    <span className="rc-no" style={{ color }}>{r.Driver.permanentNumber}</span>
                    <span className="rc-driver">
                      <span className="rc-code">{r.Driver.code}</span>
                      <span className="rc-name">{r.Driver.givenName} {r.Driver.familyName}</span>
                      {isFl && <span className="rc-fl" title="Fastest Lap">⚡</span>}
                    </span>
                    <span className="rc-team">
                      <span className="rc-dot" style={{ background: color }} />
                      {teamName}
                    </span>
                    <span className="rc-grid">{r.grid === '0' ? 'PL' : r.grid}</span>
                    <span className={`rc-time ${sc}`}>
                      {r.Time?.time ?? r.status}
                    </span>
                    <span className="rc-pts">{r.points}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
