import { useState, useEffect, useMemo } from 'react'
import type { TelemetryPoint } from '../types'
import { loadTelemetry } from '../lib/csvLoader'
import { telemetryUrl } from '../lib/dataIndex'
import { CHALLENGES, shuffledOptions, getTodaysChallenge } from '../lib/challengeData'

const STREAK_KEY  = 'f1vis_ch_streak'
const ANSWER_KEY  = (idx: number) => `f1vis_ch_${idx}`

// ── Speed trace SVG ──────────────────────────────────────────────────────────

const SVG_W = 560
const SVG_H = 140
const PAD   = { top: 12, bottom: 24, left: 36, right: 12 }

function SpeedTrace({ telemetry, revealed }: { telemetry: TelemetryPoint[]; revealed: boolean }) {
  if (telemetry.length === 0) return (
    <div className="ch-trace-placeholder">
      <div className="ch-trace-scanning">Loading telemetry…</div>
    </div>
  )

  // Downsample to ~400 points for performance
  const step = Math.max(1, Math.floor(telemetry.length / 400))
  const pts  = telemetry.filter((_, i) => i % step === 0)

  const maxDist  = pts[pts.length - 1].distance
  const minSpeed = Math.min(...pts.map(p => p.speed))
  const maxSpeed = Math.max(...pts.map(p => p.speed))
  const speedRange = maxSpeed - minSpeed || 1

  const plotW = SVG_W - PAD.left - PAD.right
  const plotH = SVG_H - PAD.top - PAD.bottom

  const toX = (d: number) => PAD.left + (d / maxDist) * plotW
  const toY = (s: number) => PAD.top + plotH - ((s - minSpeed) / speedRange) * plotH

  const path = pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${toX(p.distance).toFixed(1)},${toY(p.speed).toFixed(1)}`
  ).join(' ')

  // Speed zone fills: under 200 km/h = low speed corners, 200-280 = medium, 280+ = high
  const yLow    = toY(200)
  const yMed    = toY(280)
  const plotBot = PAD.top + plotH

  // Y-axis labels
  const speedTicks = [150, 200, 250, 300, 350].filter(s => s >= minSpeed - 10 && s <= maxSpeed + 10)

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="ch-trace-svg"
      style={{ width: '100%', maxHeight: SVG_H }}
    >
      {/* Background zones */}
      <rect x={PAD.left} y={Math.min(yMed, PAD.top)} width={plotW} height={Math.max(0, Math.min(yLow, plotBot) - Math.min(yMed, PAD.top))} fill="#27ae6012" />
      <rect x={PAD.left} y={Math.min(yLow, plotBot)} width={plotW} height={Math.max(0, plotBot - Math.min(yLow, plotBot))} fill="#e74c3c12" />

      {/* Grid lines */}
      {speedTicks.map(s => (
        <line key={s} x1={PAD.left} y1={toY(s)} x2={SVG_W - PAD.right} y2={toY(s)}
          stroke="#1e2a3a" strokeWidth={1} />
      ))}

      {/* Speed line */}
      <path d={path} fill="none" stroke={revealed ? '#e10600' : '#778'} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Y axis labels */}
      {speedTicks.map(s => (
        <text key={s} x={PAD.left - 4} y={toY(s) + 4} textAnchor="end"
          fill="#446" fontSize={9} fontFamily="monospace">{s}</text>
      ))}

      {/* X axis label */}
      <text x={PAD.left + plotW / 2} y={SVG_H - 4} textAnchor="middle"
        fill="#334" fontSize={9} fontFamily="monospace">distance →</text>

      {/* Speed label */}
      <text x={8} y={PAD.top + plotH / 2} textAnchor="middle"
        fill="#334" fontSize={9} fontFamily="monospace"
        transform={`rotate(-90, 8, ${PAD.top + plotH / 2})`}>km/h</text>
    </svg>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface SavedAnswer {
  picked: string
  correct: boolean
}

export default function DailyChallenge() {
  const [telemetry,   setTelemetry]   = useState<TelemetryPoint[]>([])
  const [loadErr,     setLoadErr]     = useState(false)
  const [picked,      setPicked]      = useState<string | null>(null)
  const [streak,      setStreak]      = useState(0)
  const [showHint,    setShowHint]    = useState(false)

  const { challenge, dayIdx } = useMemo(() => getTodaysChallenge(), [])
  const options = useMemo(() => shuffledOptions(challenge, dayIdx), [challenge, dayIdx])

  const revealed = picked !== null

  useEffect(() => {
    // Restore saved answer
    const saved = localStorage.getItem(ANSWER_KEY(dayIdx))
    if (saved) {
      try {
        const data: SavedAnswer = JSON.parse(saved)
        setPicked(data.picked)
      } catch { /* ignore */ }
    }

    // Restore streak
    const s = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10)
    setStreak(isNaN(s) ? 0 : s)

    // Load telemetry
    const url = telemetryUrl(challenge.circuitId, challenge.sessionType, challenge.driver)
    loadTelemetry(url)
      .then(setTelemetry)
      .catch(() => setLoadErr(true))
  }, [challenge, dayIdx])

  function handlePick(name: string) {
    if (revealed) return
    const correct = name === challenge.answer
    setPicked(name)

    const newStreak = correct ? streak + 1 : 0
    setStreak(newStreak)
    localStorage.setItem(STREAK_KEY, String(newStreak))
    localStorage.setItem(ANSWER_KEY(dayIdx), JSON.stringify({ picked: name, correct }))
  }

  const isCorrect = picked === challenge.answer

  // ── Calendar view: all past answers ──────────────────────────────────────
  const historyDots = useMemo(() => {
    return CHALLENGES.map((_, i) => {
      const saved = localStorage.getItem(ANSWER_KEY(getDayIndexFor(i)))
      if (!saved) return null
      try { return (JSON.parse(saved) as SavedAnswer).correct } catch { return null }
    })
  }, [revealed])  // re-check after each answer

  return (
    <div className="ch-view">
      <div className="ch-header">
        <div className="ch-title-row">
          <span className="ch-title">Daily Telemetry Challenge</span>
          <span className="ch-streak">{streak > 0 ? `🔥 ${streak} streak` : ''}</span>
        </div>
        <p className="ch-desc">
          Study the anonymous speed trace. Can you identify which circuit this qualifying lap was driven at?
          New challenge every day.
        </p>
      </div>

      {/* Progress dots */}
      <div className="ch-progress-dots">
        {CHALLENGES.map((_, i) => {
          const h = historyDots[i]
          const isToday = i === dayIdx % CHALLENGES.length
          return (
            <span
              key={i}
              className={`ch-dot ${h === true ? 'correct' : h === false ? 'wrong' : isToday ? 'today' : 'future'}`}
              title={CHALLENGES[i].answer}
            />
          )
        })}
      </div>

      {/* Speed trace */}
      <div className="ch-trace-wrap">
        {loadErr ? (
          <div className="ch-trace-placeholder" style={{ color: '#556' }}>
            Failed to load telemetry data
          </div>
        ) : (
          <SpeedTrace telemetry={telemetry} revealed={revealed} />
        )}
        <div className="ch-trace-label">Speed (km/h) across one qualifying lap</div>
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
            <button
              key={opt.name}
              className={cls}
              onClick={() => handlePick(opt.name)}
              disabled={revealed}
            >
              <span className="ch-opt-flag">{opt.flag}</span>
              <span className="ch-opt-name">{opt.name}</span>
            </button>
          )
        })}
      </div>

      {/* Hint / post-answer actions */}
      {!revealed && (
        <button className="ch-hint-btn" onClick={() => setShowHint(v => !v)}>
          {showHint ? 'Hide hint' : 'Show hint'}
        </button>
      )}
      {showHint && !revealed && (
        <div className="ch-hint">💡 {challenge.hint}</div>
      )}

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

      {/* Past challenges archive */}
      <div className="ch-archive">
        <div className="ch-archive-title">Your history</div>
        <div className="ch-archive-list">
          {CHALLENGES.map((ch, i) => {
            const h = historyDots[i]
            if (h === null) return null
            return (
              <div key={i} className={`ch-archive-row ${h ? 'correct' : 'wrong'}`}>
                <span>{ch.flag}</span>
                <span>{ch.answer}</span>
                <span>{h ? '✓' : '✗'}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// dayIdx for the i-th challenge in the rotation (working backwards from today)
function getDayIndexFor(challengeSlot: number): number {
  const todayIdx = Math.floor(Date.now() / 86_400_000)
  const todaySlot = todayIdx % CHALLENGES.length
  const diff = (challengeSlot - todaySlot + CHALLENGES.length) % CHALLENGES.length
  // if diff === 0 → today, diff === 1 → tomorrow (future), else → past
  if (diff === 0) return todayIdx
  if (diff <= CHALLENGES.length / 2) return todayIdx + diff  // future
  return todayIdx - (CHALLENGES.length - diff)               // past
}
