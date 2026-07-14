import { useState, useEffect, useMemo } from 'react'
import type { TelemetryPoint } from '../types'
import { loadTelemetry } from '../lib/csvLoader'
import { telemetryUrl } from '../lib/dataIndex'
import {
  shuffledOptions, getTodaysChallenge, getChallengeForDate,
  CHART_TYPE_LABELS, CHART_TYPE_QUESTIONS,
  type ChartType,
} from '../lib/challengeData'

const STREAK_KEY = 'f1vis_ch_streak'
const ANSWER_KEY = (dateStr: string) => `f1vis_ch_${dateStr}`

const SVG_W = 560
const SVG_H = 140
const PAD   = { top: 12, bottom: 24, left: 40, right: 12 }

// ── Chart renderer ─────────────────────────────────────────────────────────────

function TelemetryChart({ telemetry, chartType, revealed }: {
  telemetry: TelemetryPoint[]
  chartType: ChartType
  revealed: boolean
}) {
  if (telemetry.length === 0) return (
    <div className="ch-trace-placeholder">
      <div className="ch-trace-scanning">Loading telemetry…</div>
    </div>
  )

  const step = Math.max(1, Math.floor(telemetry.length / 400))
  const pts  = telemetry.filter((_, i) => i % step === 0)

  const maxDist = pts[pts.length - 1].distance
  const plotW   = SVG_W - PAD.left - PAD.right
  const plotH   = SVG_H - PAD.top - PAD.bottom
  const plotBot = PAD.top + plotH

  const toX = (d: number) => PAD.left + (d / maxDist) * plotW

  // ── Speed ───────────────────────────────────────────────────────────────────
  if (chartType === 'speed') {
    const minS = Math.min(...pts.map(p => p.speed))
    const maxS = Math.max(...pts.map(p => p.speed))
    const rng  = maxS - minS || 1
    const toY  = (s: number) => PAD.top + plotH - ((s - minS) / rng) * plotH
    const path = pts.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${toX(p.distance).toFixed(1)},${toY(p.speed).toFixed(1)}`
    ).join(' ')
    const ticks = [150, 200, 250, 300, 350].filter(s => s >= minS - 10 && s <= maxS + 10)
    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="ch-trace-svg" style={{ width: '100%', maxHeight: SVG_H }}>
        {ticks.map(s => (
          <line key={s} x1={PAD.left} y1={toY(s)} x2={SVG_W - PAD.right} y2={toY(s)} stroke="#1e2a3a" strokeWidth={1} />
        ))}
        <path d={path} fill="none" stroke={revealed ? '#e10600' : '#778'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {ticks.map(s => (
          <text key={s} x={PAD.left - 4} y={toY(s) + 4} textAnchor="end" fill="#446" fontSize={9} fontFamily="monospace">{s}</text>
        ))}
        <text x={PAD.left + plotW / 2} y={SVG_H - 4} textAnchor="middle" fill="#334" fontSize={9} fontFamily="monospace">distance →</text>
        <text x={10} y={PAD.top + plotH / 2} textAnchor="middle" fill="#334" fontSize={9} fontFamily="monospace" transform={`rotate(-90,10,${PAD.top + plotH / 2})`}>km/h</text>
      </svg>
    )
  }

  // ── Gear (step chart) ────────────────────────────────────────────────────────
  if (chartType === 'gear') {
    const toY  = (g: number) => PAD.top + plotH - ((g - 1) / 7) * plotH
    let path = ''
    for (let i = 0; i < pts.length; i++) {
      const x = toX(pts[i].distance).toFixed(1)
      const y = toY(pts[i].gear).toFixed(1)
      if (i === 0) {
        path = `M${x},${y}`
      } else {
        path += ` L${x},${toY(pts[i - 1].gear).toFixed(1)} L${x},${y}`
      }
    }
    const ticks = [2, 4, 6, 8]
    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="ch-trace-svg" style={{ width: '100%', maxHeight: SVG_H }}>
        {ticks.map(g => (
          <line key={g} x1={PAD.left} y1={toY(g)} x2={SVG_W - PAD.right} y2={toY(g)} stroke="#1e2a3a" strokeWidth={1} />
        ))}
        <path d={path} fill="none" stroke={revealed ? '#4a9eff' : '#778'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {ticks.map(g => (
          <text key={g} x={PAD.left - 4} y={toY(g) + 4} textAnchor="end" fill="#446" fontSize={9} fontFamily="monospace">{g}</text>
        ))}
        <text x={PAD.left + plotW / 2} y={SVG_H - 4} textAnchor="middle" fill="#334" fontSize={9} fontFamily="monospace">distance →</text>
        <text x={10} y={PAD.top + plotH / 2} textAnchor="middle" fill="#334" fontSize={9} fontFamily="monospace" transform={`rotate(-90,10,${PAD.top + plotH / 2})`}>gear</text>
      </svg>
    )
  }

  // ── Throttle (filled area) ────────────────────────────────────────────────────
  if (chartType === 'throttle') {
    const toY  = (v: number) => PAD.top + plotH - (v / 100) * plotH
    const line = pts.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${toX(p.distance).toFixed(1)},${toY(p.throttle).toFixed(1)}`
    ).join(' ')
    const area = `M${toX(pts[0].distance).toFixed(1)},${plotBot} ${line} L${toX(pts[pts.length - 1].distance).toFixed(1)},${plotBot} Z`
    const ticks = [0, 25, 50, 75, 100]
    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="ch-trace-svg" style={{ width: '100%', maxHeight: SVG_H }}>
        {ticks.map(v => (
          <line key={v} x1={PAD.left} y1={toY(v)} x2={SVG_W - PAD.right} y2={toY(v)} stroke="#1e2a3a" strokeWidth={1} />
        ))}
        <path d={area} fill={revealed ? '#27ae6020' : '#77889918'} stroke="none" />
        <path d={line} fill="none" stroke={revealed ? '#27ae60' : '#778'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {[0, 50, 100].map(v => (
          <text key={v} x={PAD.left - 4} y={toY(v) + 4} textAnchor="end" fill="#446" fontSize={9} fontFamily="monospace">{v}%</text>
        ))}
        <text x={PAD.left + plotW / 2} y={SVG_H - 4} textAnchor="middle" fill="#334" fontSize={9} fontFamily="monospace">distance →</text>
        <text x={10} y={PAD.top + plotH / 2} textAnchor="middle" fill="#334" fontSize={9} fontFamily="monospace" transform={`rotate(-90,10,${PAD.top + plotH / 2})`}>throttle</text>
      </svg>
    )
  }

  // ── Throttle + Brake overlay ──────────────────────────────────────────────────
  const toY  = (v: number) => PAD.top + plotH - (v / 100) * plotH

  const thLine = pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${toX(p.distance).toFixed(1)},${toY(p.throttle).toFixed(1)}`
  ).join(' ')
  const thArea = `M${toX(pts[0].distance).toFixed(1)},${plotBot} ${thLine} L${toX(pts[pts.length - 1].distance).toFixed(1)},${plotBot} Z`

  // Brake is boolean — use step path so transitions are sharp
  let brakeLine = `M${toX(pts[0].distance).toFixed(1)},${toY(pts[0].brake ? 100 : 0).toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const x    = toX(pts[i].distance).toFixed(1)
    const yPrev = toY(pts[i - 1].brake ? 100 : 0).toFixed(1)
    const yCurr = toY(pts[i].brake ? 100 : 0).toFixed(1)
    brakeLine += ` L${x},${yPrev} L${x},${yCurr}`
  }
  const brakeArea = `M${toX(pts[0].distance).toFixed(1)},${plotBot} ${brakeLine} L${toX(pts[pts.length - 1].distance).toFixed(1)},${plotBot} Z`

  const tGreen = revealed ? '#27ae60' : '#557'
  const tRed   = revealed ? '#e74c3c' : '#556'

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="ch-trace-svg" style={{ width: '100%', maxHeight: SVG_H }}>
      {[0, 50, 100].map(v => (
        <line key={v} x1={PAD.left} y1={toY(v)} x2={SVG_W - PAD.right} y2={toY(v)} stroke="#1e2a3a" strokeWidth={1} />
      ))}
      {/* Throttle */}
      <path d={thArea} fill={`${tGreen}28`} stroke="none" />
      <path d={thLine} fill="none" stroke={tGreen} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Brake */}
      <path d={brakeArea} fill={`${tRed}28`} stroke="none" />
      <path d={brakeLine} fill="none" stroke={tRed} strokeWidth={1} strokeLinejoin="round" />
      {[0, 50, 100].map(v => (
        <text key={v} x={PAD.left - 4} y={toY(v) + 4} textAnchor="end" fill="#446" fontSize={9} fontFamily="monospace">{v}%</text>
      ))}
      <text x={PAD.left + plotW / 2} y={SVG_H - 4} textAnchor="middle" fill="#334" fontSize={9} fontFamily="monospace">distance →</text>
      {revealed && (
        <>
          <rect x={PAD.left + 4}  y={PAD.top + 4} width={6} height={6} fill={tGreen} rx={1} />
          <text x={PAD.left + 13} y={PAD.top + 10} fill={tGreen} fontSize={8} fontFamily="monospace">throttle</text>
          <rect x={PAD.left + 62} y={PAD.top + 4} width={6} height={6} fill={tRed} rx={1} />
          <text x={PAD.left + 71} y={PAD.top + 10} fill={tRed} fontSize={8} fontFamily="monospace">brake</text>
        </>
      )}
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface SavedAnswer {
  picked: string
  correct: boolean
}

const HISTORY_DAYS = 14  // days to show in archive

export default function DailyChallenge() {
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([])
  const [loadErr,   setLoadErr]   = useState(false)
  const [picked,    setPicked]    = useState<string | null>(null)
  const [streak,    setStreak]    = useState(0)
  const [showHint,  setShowHint]  = useState(false)

  const { challenge, challengeId } = useMemo(() => getTodaysChallenge(), [])
  const options = useMemo(() => shuffledOptions(challenge, challengeId), [challenge, challengeId])

  const revealed = picked !== null

  useEffect(() => {
    setPicked(null)
    setTelemetry([])
    setLoadErr(false)
    setShowHint(false)

    const saved = localStorage.getItem(ANSWER_KEY(challengeId))
    if (saved) {
      try { setPicked((JSON.parse(saved) as SavedAnswer).picked) } catch { /* ignore */ }
    }

    const s = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10)
    setStreak(isNaN(s) ? 0 : s)

    loadTelemetry(telemetryUrl(challenge.circuitId, 2026, challenge.sessionType, challenge.driver))
      .then(setTelemetry)
      .catch(() => setLoadErr(true))
  }, [challenge, challengeId])

  function handlePick(name: string) {
    if (revealed) return
    const correct = name === challenge.answer
    setPicked(name)
    const newStreak = correct ? streak + 1 : 0
    setStreak(newStreak)
    localStorage.setItem(STREAK_KEY, String(newStreak))
    localStorage.setItem(ANSWER_KEY(challengeId), JSON.stringify({ picked: name, correct }))
  }

  const isCorrect = picked === challenge.answer

  // Past HISTORY_DAYS days for archive (oldest first)
  const recentHistory = useMemo(() => {
    const days: { dateStr: string; correct: boolean | null; isToday: boolean }[] = []
    for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - i)
      const y   = d.getUTCFullYear()
      const mo  = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      const dateStr = `${y}-${mo}-${day}`
      const isToday = dateStr === challengeId
      const saved = localStorage.getItem(ANSWER_KEY(dateStr))
      let correct: boolean | null = null
      if (saved) {
        try { correct = (JSON.parse(saved) as SavedAnswer).correct } catch { /* ignore */ }
      }
      days.push({ dateStr, correct, isToday })
    }
    return days
  }, [revealed, challengeId])

  // Session label for the description
  const sessionLabel = (challenge.sessionType === 'qualifying' || challenge.sessionType === 'sprint_qualifying')
    ? 'qualifying lap'
    : 'race lap'

  return (
    <div className="ch-view">
      <div className="ch-header">
        <div className="ch-title-row">
          <span className="ch-title">Daily Telemetry Challenge</span>
          <span className="ch-streak">{streak > 0 ? `🔥 ${streak}` : ''}</span>
        </div>
        <p className="ch-desc">
          {CHART_TYPE_QUESTIONS[challenge.chartType]}{' '}
          Can you identify which circuit this {sessionLabel} was driven at?
          New challenge every day.
        </p>
      </div>

      {/* Telemetry chart */}
      <div className="ch-trace-wrap">
        {loadErr ? (
          <div className="ch-trace-placeholder" style={{ color: '#556' }}>Failed to load telemetry data</div>
        ) : (
          <TelemetryChart telemetry={telemetry} chartType={challenge.chartType} revealed={revealed} />
        )}
        <div className="ch-trace-label">{CHART_TYPE_LABELS[challenge.chartType]}</div>
      </div>

      {/* Revealed: circuit info */}
      {revealed && (
        <div className={`ch-reveal ${isCorrect ? 'correct' : 'wrong'}`}>
          <span className="ch-reveal-flag">{challenge.flag}</span>
          <span className="ch-reveal-name">{challenge.answer}</span>
          <span className="ch-reveal-verdict">{isCorrect ? '✓ Correct!' : '✗ Wrong'}</span>
        </div>
      )}

      {/* Answer options */}
      <div className="ch-options">
        {options.map((opt) => {
          let cls = 'ch-option'
          if (revealed) {
            if (opt.name === challenge.answer) cls += ' correct'
            else if (opt.name === picked)      cls += ' wrong'
            else                               cls += ' faded'
          }
          return (
            <button key={opt.name} className={cls} onClick={() => handlePick(opt.name)} disabled={revealed}>
              <span className="ch-opt-flag">{opt.flag}</span>
              <span className="ch-opt-name">{opt.name}</span>
            </button>
          )
        })}
      </div>

      {!revealed && (
        <button className="ch-hint-btn" onClick={() => setShowHint(v => !v)}>
          {showHint ? 'Hide hint' : 'Show hint'}
        </button>
      )}
      {showHint && !revealed && <div className="ch-hint">💡 {challenge.hint}</div>}

      {revealed && (
        <div className="ch-after">
          <span className="ch-after-msg">Come back tomorrow for a new challenge</span>
          <button
            className="ch-after-btn"
            onClick={() => {
              const text = isCorrect
                ? `I got today's F1 Telemetry Challenge correct! 🔥 ${streak} in a row — try it at f1vis.app`
                : `I got today's F1 Telemetry Challenge wrong — can you beat me? f1vis.app`
              navigator.clipboard?.writeText(text).catch(() => {})
            }}
          >
            Copy result to share
          </button>
        </div>
      )}

      {/* Past answers (last 14 days, excluding today) */}
      <div className="ch-archive">
        <div className="ch-archive-title">Your history</div>
        <div className="ch-archive-list">
          {recentHistory
            .filter(d => !d.isToday && d.correct !== null)
            .reverse()
            .map(({ dateStr, correct }) => {
              const { challenge: ch } = getChallengeForDate(dateStr)
              return (
                <div key={dateStr} className={`ch-archive-row ${correct ? 'correct' : 'wrong'}`}>
                  <span>{ch.flag}</span>
                  <span>{ch.answer}</span>
                  <span className="ch-archive-type">{ch.chartType}</span>
                  <span>{correct ? '✓' : '✗'}</span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
