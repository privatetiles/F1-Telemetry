import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { CircuitConfig, CircuitSession, TelemetryPoint, ColorMode } from './types'
import { CIRCUITS, telemetryUrl, fullRaceUrl, teamRadioUrl, raceControlUrl } from './lib/dataIndex'
import { loadAllDriverTelemetry, loadTelemetryFromFile, loadFullRaceTelemetry } from './lib/csvLoader'
import type { SafetyCarPeriod, StintInfo, PitStopInfo, OvertakeEvent } from './lib/csvLoader'
import { computeMiniSectors, computeMiniSectorsFromSegments } from './lib/miniSectors'
import { loadTrackData, CIRCUIT_TRACK_PREFIX } from './lib/paceData'
import type { TrackData } from './lib/paceData'
import { buildDriverSpeedProfiles, getEffectiveLayout, type ProfileData } from './lib/lapPredictor'
import { computeBattleGaps } from './lib/battleGaps'
import { driverColor } from './lib/teamColors'
import { fetchRaceRadio } from './lib/openf1'
import type { RadioCall } from './lib/openf1'
import type { BattleGapEntry } from './lib/battleGaps'
import CircuitSelector from './components/CircuitSelector'
import TrackMap from './components/TrackMap'
import type { RaceControlMessage } from './components/TrackMap'
import TutorialOverlay from './components/TutorialOverlay'
import type { TutorialStep } from './components/TutorialOverlay'
import FeedbackButton from './components/FeedbackButton'
import CommentsPanel from './components/CommentsPanel'
import AuthModal from './components/AuthModal'
import ProModal from './components/ProModal'
import { supabase } from './lib/supabase'
import type { Profile } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import DriverPanel from './components/DriverPanel'
import MiniSectorTimeline from './components/MiniSectorTimeline'
import StaticTrackMap from './components/StaticTrackMap'
import PaceAnalysisView from './components/PaceAnalysisView'
import PaceAnalysis2View from './components/PaceAnalysis2View'
import Sidebar from './components/Sidebar'
import type { AppView } from './components/Sidebar'
import StandingsPage from './components/StandingsPage'
import CalendarPage from './components/CalendarPage'
import ResultsPage from './components/ResultsPage'
import DriversPage from './components/DriversPage'
import TeamsPage from './components/TeamsPage'
import CircuitsPage from './components/CircuitsPage'
import ChangelogPage from './components/ChangelogPage'
import InsightsPage from './components/InsightsPage'
import GamesPage from './components/GamesPage'
import SocialsPage from './components/SocialsPage'
import BattleTracker from './components/BattleTracker'
import HistoricalRacesPage from './components/HistoricalRacesPage'
import PositionChart from './components/PositionChart'
import Settings, { getStoredTheme, applyTheme } from './components/Settings'
import Icon from './components/Icon'
import './App.css'

const DEFAULT_DRIVER_PANE_WIDTH = 224
const DEFAULT_RIGHT_PANE_WIDTH = 268

function storedPaneWidth(key: string, fallback: number, min: number, max: number): number {
  const value = Number(localStorage.getItem(key))
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback
}

export default function App() {
  const [selectedSeason, setSelectedSeason] = useState<'historical' | number>(2026)
  const [circuit, setCircuit] = useState<CircuitConfig>(() => {
    return CIRCUITS.filter(c => !c.year && c.hasData)
      .sort((a, b) => b.raceDate.localeCompare(a.raceDate))[0] ?? CIRCUITS[0]
  })
  const [session, setSession] = useState<CircuitSession>(() => {
    const c = CIRCUITS.filter(c => !c.year && c.hasData)
      .sort((a, b) => b.raceDate.localeCompare(a.raceDate))[0] ?? CIRCUITS[0]
    return c.sessions.find(s => s.type === 'full_race') ?? c.sessions[0]
  })
  const [driverTelemetry, setDriverTelemetry] = useState<Record<string, TelemetryPoint[]>>({})
  const [dnfDrivers, setDnfDrivers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [activeDrivers, setActiveDrivers] = useState<Set<string>>(new Set())
  const [soloMode, setSoloMode] = useState(false)
  const [highlightedDriver, setHighlightedDriver] = useState<string | null>(null)
  const [colorMode, setColorMode] = useState<ColorMode>('speed')
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // 'about', 'privacy' and 'disclaimer' are intentionally excluded — they now
  // live at their own paths (/about/, /privacy/, /disclaimer/), not hash views.
  const VALID_VIEWS: AppView[] = ['telemetry', 'standings', 'calendar', 'results', 'drivers', 'teams', 'circuits', 'pace', 'pace2', 'insights', 'games', 'historicalraces', 'socials', 'changelog']
  const hashToView = (hash: string): AppView => {
    const v = hash.replace(/^#\/?/, '') as AppView
    return VALID_VIEWS.includes(v) ? v : 'telemetry'
  }
  const [activeView, setActiveView] = useState<AppView>(() => hashToView(window.location.hash))
  const [battleDrivers, setBattleDrivers] = useState<string[]>([])
  const [uploadedTelemetry, setUploadedTelemetry] = useState<Record<string, TelemetryPoint[]>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [pendingResultRound, setPendingResultRound] = useState<number | undefined>(undefined)
  const dragCounter = useRef(0)
  const [resizingPane, setResizingPane] = useState<'driver' | 'right' | null>(null)
  const [paneWidths, setPaneWidths] = useState(() => ({
    driver: storedPaneWidth('f1vis_driver_pane_width', DEFAULT_DRIVER_PANE_WIDTH, 150, 360),
    right: storedPaneWidth('f1vis_right_pane_width', DEFAULT_RIGHT_PANE_WIDTH, 180, 420),
  }))
  const paneWidthsRef = useRef(paneWidths)
  const paneResizeRef = useRef<{
    side: 'driver' | 'right'
    pointerId: number
    startX: number
    startWidth: number
  } | null>(null)

  const [lapBoundaries, setLapBoundaries] = useState<number[]>([])
  const [totalLaps, setTotalLaps] = useState(0)
  const [safetyCars, setSafetyCars] = useState<SafetyCarPeriod[]>([])
  const [stints, setStints] = useState<Record<string, StintInfo[]>>({})
  const [pitStops, setPitStops] = useState<Record<string, PitStopInfo[]>>({})
  const [overtakes, setOvertakes] = useState<OvertakeEvent[]>([])
  const [standingRestartLaps, setStandingRestartLaps] = useState<Set<number>>(new Set())
  const [radioData, setRadioData] = useState<RadioCall[]>([])
  const [tunedDriver, setTunedDriver] = useState<string | null>(null)
  const [activeRadioCaption, setActiveRadioCaption] = useState<{ driver: string; url: string; text?: string } | null>(null)
  const [raceControlMessages, setRaceControlMessages] = useState<RaceControlMessage[]>([])
  const [tutorialOpen, setTutorialOpen] = useState(() => !localStorage.getItem('f1vis_tour_done'))
  const [authUser, setAuthUser]         = useState<User | null>(null)
  const [profile, setProfile]           = useState<Profile | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [proModalOpen, setProModalOpen]   = useState(false)
  const [commentsOpen, setCommentsOpen]   = useState(false)

  const [trackData, setTrackData] = useState<TrackData | null>(null)

  // Inject AdSense after content renders so Auto Ads never sees a blank page.
  // Pro users skip injection entirely; if they upgrade mid-session the script is removed.
  useEffect(() => {
    const { theme, liveryTeam } = getStoredTheme()
    applyTheme(theme, liveryTeam)
  }, [])

  useEffect(() => {
    if (profile?.tier === 'pro') return
    const t = setTimeout(() => {
      if (document.querySelector('script[src*="adsbygoogle"]')) return
      const s = document.createElement('script')
      s.async = true
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8705495890489536'
      s.crossOrigin = 'anonymous'
      document.head.appendChild(s)
    }, 2000)
    return () => clearTimeout(t)
  }, [profile])

  useEffect(() => {
    if (profile?.tier !== 'pro') return
    document.querySelector('script[src*="adsbygoogle"]')?.remove()
  }, [profile])

  // Supabase auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthUser(data.session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load profile whenever user changes
  useEffect(() => {
    if (!authUser) { setProfile(null); return }
    supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data as Profile) })
  }, [authUser])

  // Handle post-checkout redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('pro') === '1' && authUser) {
      supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
        .then(({ data }) => { if (data) setProfile(data as Profile) })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [authUser])

  useEffect(() => {
    window.location.hash = activeView === 'telemetry' ? '' : activeView
  }, [activeView])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (activeView !== 'telemetry') return
      if (e.key === ' ') {
        e.preventDefault()
        setPlaying((p) => !p)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const step = totalLaps > 0 ? 1 / totalLaps : 0.05
        setProgress((p) => Math.min(1, p + step))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const step = totalLaps > 0 ? 1 / totalLaps : 0.05
        setProgress((p) => Math.max(0, p - step))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeView, totalLaps])

  useEffect(() => {
    const onPop = () => setActiveView(hashToView(window.location.hash))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Driver speed profiles — built in background (backup data, not shown in UI)
  const [driverProfiles, setDriverProfiles] = useState<ProfileData | null>(null)

  useEffect(() => {
    buildDriverSpeedProfiles().then((p) => setDriverProfiles(p))
  }, [])

  useEffect(() => {
    setTrackData(null)
    const prefix = CIRCUIT_TRACK_PREFIX[circuit.id]
    if (!prefix) return
    loadTrackData(prefix).then(setTrackData).catch(() => {})
  }, [circuit.id])

  const processFiles = useCallback(async (files: File[]) => {
    const csvFiles = files.filter((f) => f.name.toLowerCase().endsWith('.csv'))

    for (const file of csvFiles) {
      const match = file.name.match(/^([A-Za-z]{2,3})[^A-Za-z]/)
      const raw = file.name.replace(/\.[^.]+$/, '')
      const code = (match?.[1] ?? raw.slice(0, 3)).toUpperCase()
      try {
        const data = await loadTelemetryFromFile(file)
        if (data.length > 0) {
          setUploadedTelemetry((prev) => ({ ...prev, [code]: data }))
          setActiveDrivers((prev) => new Set([...prev, code]))
        }
      } catch { /* skip unrecognised files */ }
    }
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault() }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    processFiles(Array.from(e.dataTransfer.files))
  }, [processFiles])

  const updatePaneWidth = useCallback((side: 'driver' | 'right', requestedWidth: number) => {
    const min = side === 'driver' ? 150 : 180
    const max = side === 'driver' ? 360 : 420
    const width = Math.max(min, Math.min(max, Math.round(requestedWidth)))
    const next = { ...paneWidthsRef.current, [side]: width }
    paneWidthsRef.current = next
    setPaneWidths(next)
  }, [])

  const handlePaneResizeStart = useCallback((side: 'driver' | 'right', e: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(max-width: 768px)').matches) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    paneResizeRef.current = {
      side,
      pointerId: e.pointerId,
      startX: e.clientX,
      startWidth: paneWidthsRef.current[side],
    }
    setResizingPane(side)
  }, [])

  const handlePaneResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = paneResizeRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const delta = e.clientX - drag.startX
    updatePaneWidth(drag.side, drag.startWidth + (drag.side === 'driver' ? delta : -delta))
  }, [updatePaneWidth])

  const handlePaneResizeEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = paneResizeRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    paneResizeRef.current = null
    setResizingPane(null)
    localStorage.setItem('f1vis_driver_pane_width', String(paneWidthsRef.current.driver))
    localStorage.setItem('f1vis_right_pane_width', String(paneWidthsRef.current.right))
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  const handlePaneResizeKey = useCallback((side: 'driver' | 'right', e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const delta = e.key === 'ArrowRight' ? 16 : -16
    updatePaneWidth(side, paneWidthsRef.current[side] + (side === 'driver' ? delta : -delta))
    localStorage.setItem(
      side === 'driver' ? 'f1vis_driver_pane_width' : 'f1vis_right_pane_width',
      String(paneWidthsRef.current[side]),
    )
  }, [updatePaneWidth])

  const resetPaneWidth = useCallback((side: 'driver' | 'right') => {
    const width = side === 'driver' ? DEFAULT_DRIVER_PANE_WIDTH : DEFAULT_RIGHT_PANE_WIDTH
    updatePaneWidth(side, width)
    localStorage.setItem(
      side === 'driver' ? 'f1vis_driver_pane_width' : 'f1vis_right_pane_width',
      String(width),
    )
  }, [updatePaneWidth])

  const handleCircuitChange = useCallback((c: CircuitConfig) => {
    setCircuit(c)
  }, [])

  const handleSeasonChange = useCallback((season: 'historical' | number) => {
    setSelectedSeason(season)
    const candidates = CIRCUITS.filter(c =>
      season === 'historical' ? (c.year !== undefined && c.year < 2026)
      : season === 2026 ? !c.year
      : c.year === season
    )
    // Prefer the same circuit id in the new season (if it exists and has data), then first with data
    const first = candidates.find(c => c.id === circuit.id && c.hasData)
      ?? candidates.find(c => c.hasData)
      ?? candidates[0]
    if (first) { setCircuit(first); setSession(first.sessions[0]) }
  }, [circuit.id])

  // Load telemetry for circuits with real data
  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    setDriverTelemetry({})
    setDnfDrivers(new Set())
    setActiveDrivers(new Set())
    setBattleDrivers([])
    setLapBoundaries([])
    setTotalLaps(0)
    setSafetyCars([])
    setStints({})
    setPitStops({})
    setOvertakes([])
    setStandingRestartLaps(new Set())
    setRadioData([])
    setTunedDriver(null)
    setActiveRadioCaption(null)
    setRaceControlMessages([])

    if (!circuit.hasData) {
      setLoading(false)
      return
    }

    setLoading(true)
    const year = circuit.year ?? 2026

    if (session.type === 'full_race' || session.type === 'full_sprint_race') {
      const folder = session.type === 'full_sprint_race' ? 'sprint_race' : 'race'
      loadFullRaceTelemetry(fullRaceUrl(circuit.id, year, folder)).then(({ data, dnf, totalLaps: tl, lapBoundaries: lb, safetyCars: sc, stints: st, pitStops: ps, overtakes: ov, standingRestartLaps: srl }) => {
        setDriverTelemetry(data)
        setDnfDrivers(dnf)
        setLapBoundaries(lb)
        setTotalLaps(tl)
        setSafetyCars(sc)
        setStints(st)
        setPitStops(ps)
        setOvertakes(ov)
        setStandingRestartLaps(srl)
        setActiveDrivers(new Set(Object.keys(data)))
        setLoading(false)
      }).catch(() => setLoading(false))
      // Radio loads independently — prefers local cache, falls back to live OpenF1 API
      fetchRaceRadio(year, circuit.raceDate, teamRadioUrl(circuit.id, year, folder)).then(setRadioData).catch(() => {})
      // Race control messages
      fetch(raceControlUrl(circuit.id, year, folder))
        .then(r => r.ok ? r.json() : [])
        .then(setRaceControlMessages)
        .catch(() => {})
      return
    }

    const urls = session.drivers.map((driver) => ({
      driver,
      url: telemetryUrl(circuit.id, year, session.type, driver),
    }))

    loadAllDriverTelemetry(urls).then(({ data, dnf }) => {
      setDriverTelemetry(data)
      setDnfDrivers(dnf)
      const loaded = Object.keys(data)
      if (soloMode) {
        const fastest = loaded.reduce((best, d) => {
          const tb = data[best]?.at(-1)?.time ?? Infinity
          const td = data[d]?.at(-1)?.time ?? Infinity
          return td < tb ? d : best
        }, loaded[0] ?? '')
        setActiveDrivers(fastest ? new Set([fastest]) : new Set())
      } else {
        setActiveDrivers(new Set(loaded))
      }
      setLoading(false)
    })
  }, [circuit.id, circuit.year, session.type])

  const selectDriver = useCallback((driver: string) => {
    if (soloMode) {
      setActiveDrivers(new Set([driver]))
    } else {
      setActiveDrivers((prev) => {
        const next = new Set(prev)
        if (next.has(driver)) next.delete(driver)
        else next.add(driver)
        return next
      })
    }
  }, [soloMode])

  const handleSoloToggle = useCallback(() => {
    setSoloMode((prev) => {
      const next = !prev
      if (next) {
        setActiveDrivers((curr) => {
          const first = curr.values().next().value
          return first ? new Set([first]) : curr
        })
      } else {
        setActiveDrivers(new Set(Object.keys(driverTelemetry)))
      }
      return next
    })
  }, [driverTelemetry])

  const mergedTelemetry = useMemo(
    () => ({ ...driverTelemetry, ...uploadedTelemetry }),
    [driverTelemetry, uploadedTelemetry]
  )

  const hasDisplayData = circuit.hasData || Object.keys(mergedTelemetry).length > 0

  const lapTimes = useMemo(() => {
    const out: Record<string, number> = {}
    for (const [driver, data] of Object.entries(mergedTelemetry)) {
      if (data.length === 0) continue
      const lastTime = data.at(-1)!.time
      if (totalLaps > 0) {
        // Full race: only LEAD-LAP drivers (completed all totalLaps) get a finite lapTime
        // that represents their actual race crossing time (winner = smallest).
        // Lapped/retired drivers get Infinity so they sort after finishers and don't
        // corrupt fastestTime (a driver 3 laps down crossed the line ~270 s before the
        // winner, so their lastTime would be smaller — making them appear as "winner").
        const lapsCompleted = data.at(-1)!.relDist * totalLaps
        out[driver] = Math.round(lapsCompleted) >= totalLaps ? lastTime : Infinity
      } else {
        out[driver] = lastTime
      }
    }
    return out
  }, [mergedTelemetry, totalLaps])

  // Static laps-behind from final telemetry — used only for sorting in non-live mode
  const lapsBehind = useMemo<Record<string, number>>(() => {
    if (totalLaps === 0) return {}
    const out: Record<string, number> = {}
    for (const [driver, data] of Object.entries(mergedTelemetry)) {
      if (data.length === 0) continue
      const lapsCompleted = data.at(-1)!.relDist * totalLaps
      const behind = totalLaps - Math.round(lapsCompleted)
      if (behind > 0 && behind < totalLaps) out[driver] = behind
    }
    return out
  }, [mergedTelemetry, totalLaps])

  const refLapDuration = useMemo(() => {
    const times = Object.values(lapTimes).filter(isFinite)
    return times.length > 0 ? Math.max(...times) : 90
  }, [lapTimes])

  // Previous position order — used for hysteresis when two cars are nose-to-tail.
  const prevRaceOrderRef = useRef<Record<string, number>>({})

  // Live race positions + relDists for full-race replay — recomputed each frame as progress changes.
  const currentRaceState = useMemo<{ positions: Record<string, number>; relDists: Record<string, number> } | null>(() => {
    if (totalLaps === 0) return null
    const targetTime = progress * refLapDuration
    const pairs: [string, number][] = []
    for (const [driver, tel] of Object.entries(mergedTelemetry)) {
      if (tel.length === 0) continue
      let lo = 0, hi = tel.length - 1
      while (lo < hi) {
        const m = (lo + hi + 1) >> 1
        if (tel[m].time <= targetTime) lo = m; else hi = m - 1
      }
      pairs.push([driver, tel[lo].relDist])
    }
    // Hysteresis: only when both drivers have an established prior rank AND are within
    // 0.3s of each other — prevents criss-crossing without locking in wrong initial order.
    const threshold = 0.3 / refLapDuration
    const prevRank = prevRaceOrderRef.current
    pairs.sort((a, b) => {
      const rdDiff = b[1] - a[1]
      const pa = prevRank[a[0]]
      const pb = prevRank[b[0]]
      if (Math.abs(rdDiff) < threshold && pa !== undefined && pb !== undefined && pa !== pb) {
        return pa - pb
      }
      return rdDiff > 0 ? 1 : rdDiff < 0 ? -1 : 0
    })
    const positions: Record<string, number> = {}
    const relDists: Record<string, number> = {}
    pairs.forEach(([d, rd], i) => { positions[d] = i + 1; relDists[d] = rd })
    prevRaceOrderRef.current = positions
    return { positions, relDists }
  }, [totalLaps, progress, mergedTelemetry, refLapDuration])

  // Final (frozen) standings computed once from each driver's last telemetry point.
  // Used when progress >= 1 to lock the panel at the official race result.
  const finalPositions = useMemo<Record<string, number> | null>(() => {
    if (totalLaps === 0) return null
    const entries = Object.entries(mergedTelemetry)
      .filter(([, tel]) => tel.length > 0)
      .map(([driver, tel]) => {
        const last = tel.at(-1)!
        return { driver, relDist: last.relDist, finishTime: last.time }
      })
    entries.sort((a, b) => {
      const rdDiff = b.relDist - a.relDist
      if (Math.abs(rdDiff) > 0.5 / totalLaps) return rdDiff > 0 ? 1 : -1
      return a.finishTime - b.finishTime
    })
    const out: Record<string, number> = {}
    entries.forEach(({ driver }, i) => { out[driver] = i + 1 })
    return out
  }, [mergedTelemetry, totalLaps])

  const currentRacePositions = totalLaps > 0
    ? (progress >= 1 ? finalPositions : (currentRaceState?.positions ?? null))
    : null

  // Live laps behind — recomputed each frame from current race positions
  const liveLapsBehind = useMemo<Record<string, number>>(() => {
    if (!currentRaceState || totalLaps === 0) return {}
    const { relDists } = currentRaceState
    const vals = Object.values(relDists)
    if (vals.length === 0) return {}
    const leaderRD = Math.max(...vals)
    const out: Record<string, number> = {}
    for (const [driver, rd] of Object.entries(relDists)) {
      const behind = Math.floor((leaderRD - rd) * totalLaps)
      if (behind > 0) out[driver] = behind
    }
    return out
  }, [currentRaceState, totalLaps])

  // Gap to car immediately ahead, in seconds (live, updates each frame)
  const gapsToAhead = useMemo<Record<string, number> | null>(() => {
    if (!currentRaceState) return null
    const { positions, relDists } = currentRaceState
    const out: Record<string, number> = {}
    const drivers = Object.keys(positions).sort((a, b) => positions[a] - positions[b])
    for (let i = 1; i < drivers.length; i++) {
      const d = drivers[i]
      const ahead = drivers[i - 1]
      const gap = (relDists[ahead] - relDists[d]) * refLapDuration
      out[d] = Math.max(0, gap)
    }
    return out
  }, [currentRaceState, refLapDuration])

  // Final gaps — finish-time difference to car ahead for lead-lap drivers
  const finalGapsToAhead = useMemo<Record<string, number> | null>(() => {
    if (!finalPositions || totalLaps === 0) return null
    const sorted = Object.keys(finalPositions).sort((a, b) => finalPositions[a] - finalPositions[b])
    const out: Record<string, number> = {}
    for (let i = 1; i < sorted.length; i++) {
      const d = sorted[i]
      const ahead = sorted[i - 1]
      const tD = lapTimes[d]
      const tAhead = lapTimes[ahead]
      if (isFinite(tD) && isFinite(tAhead)) out[d] = Math.max(0, tD - tAhead)
    }
    return out
  }, [finalPositions, lapTimes, totalLaps])

  // Current safety car / red flag status
  const currentSC = useMemo<SafetyCarPeriod | null>(() => {
    if (safetyCars.length === 0) return null
    const t = progress * refLapDuration
    // RED takes priority over SC/VSC
    return safetyCars.find(sc => sc.type === 'RED' && t >= sc.start && t <= sc.end)
      ?? safetyCars.find(sc => sc.type === 'SC' && t >= sc.start && t <= sc.end)
      ?? safetyCars.find(sc => sc.type === 'VSC' && t >= sc.start && t <= sc.end)
      ?? null
  }, [safetyCars, progress, refLapDuration])

  // Current tyre compound per driver (changes each stint)
  const currentCompounds = useMemo<Record<string, string>>(() => {
    if (totalLaps === 0 || Object.keys(stints).length === 0) return {}
    const currentLap = Math.floor(progress * totalLaps) + 1
    const out: Record<string, string> = {}
    for (const [driver, driverStints] of Object.entries(stints)) {
      const stint = driverStints.find(s => currentLap >= s.s && currentLap <= s.e)
      if (stint) out[driver] = stint.c
    }
    return out
  }, [totalLaps, progress, stints])

  // Overtake/position-change events as progress fractions (for timeline markers)
  const overtakeMarkersP = useMemo<number[]>(() => {
    if (refLapDuration === 0 || overtakes.length === 0) return []
    const seen = new Set<number>()
    const out: number[] = []
    for (const o of overtakes) {
      const bucket = Math.round(o.t / refLapDuration * 200)
      if (seen.has(bucket)) continue
      seen.add(bucket)
      const p = o.t / refLapDuration
      if (p > 0 && p < 1) out.push(p)
    }
    return out
  }, [overtakes, refLapDuration])

  // Radio calls mapped to 0-1 progress fractions — passed to TrackMap for markers and playback
  const radioCallsWithProgress = useMemo(() => {
    if (refLapDuration <= 0 || radioData.length === 0) return []
    return radioData
      .map(r => ({ driver: r.driver, url: r.url, text: r.text, progress: r.time / refLapDuration }))
      .filter(r => r.progress >= 0 && r.progress <= 1.5)
  }, [radioData, refLapDuration])

  // Position of each driver at the end of each lap — for the position chart
  const lapPositions = useMemo<Record<string, number[]>>(() => {
    if (totalLaps === 0 || lapBoundaries.length === 0) return {}
    const drivers = Object.keys(mergedTelemetry)
    if (drivers.length === 0) return {}
    const out: Record<string, number[]> = {}
    drivers.forEach((d) => { out[d] = [] })
    for (let lap = 1; lap <= totalLaps; lap++) {
      const p = lap < totalLaps ? (lapBoundaries[lap] ?? lap / totalLaps) : 1
      const t = p * refLapDuration
      const pairs: [string, number][] = []
      for (const [driver, tel] of Object.entries(mergedTelemetry)) {
        if (tel.length === 0) continue
        let lo = 0, hi = tel.length - 1
        while (lo < hi) {
          const m = (lo + hi + 1) >> 1
          if (tel[m].time <= t) lo = m; else hi = m - 1
        }
        pairs.push([driver, tel[lo].relDist])
      }
      pairs.sort((a, b) => b[1] - a[1])
      pairs.forEach(([d], i) => { out[d].push(i + 1) })
    }
    return out
  }, [totalLaps, lapBoundaries, mergedTelemetry, refLapDuration])

  const battleGaps = useMemo<BattleGapEntry[]>(
    () => computeBattleGaps(battleDrivers, mergedTelemetry, progress * refLapDuration),
    [battleDrivers, mergedTelemetry, progress, refLapDuration],
  )

  const miniSectors = useMemo(
    () => session.type === 'full_race' ? [] : trackData
      ? computeMiniSectorsFromSegments(mergedTelemetry, trackData.segments)
      : computeMiniSectors(mergedTelemetry),
    [mergedTelemetry, trackData, session.type]
  )

  const handleProgressChange = useCallback((p: number | ((prev: number) => number)) => {
    if (typeof p === 'function') {
      setProgress(prev => Math.max(0, Math.min(1, p(prev))))
    } else {
      setProgress(Math.max(0, Math.min(1, p)))
    }
  }, [])

  const effectiveHighlight = soloMode
    ? (activeDrivers.values().next().value ?? highlightedDriver)
    : highlightedDriver

  void getEffectiveLayout(circuit.id, driverProfiles)  // keep profiles warm as backup

  const TUTORIAL_STEPS: TutorialStep[] = [
    {
      title: 'Welcome to F1 Telemetry Visualizer',
      body: "Real race data, replayed lap by lap. This quick tour covers the key features — takes about 30 seconds.",
      placement: 'center',
    },
    {
      selector: '.circuit-selector',
      title: 'Pick a race',
      body: "Choose a season, then a circuit. Full-race replays are available for highlighted rounds. The countdown shows the next upcoming GP.",
      placement: 'bottom',
    },
    {
      selector: '.driver-panel',
      title: 'Driver panel',
      body: "Toggle drivers on or off. Click a name to highlight that driver on the track. The Solo button focuses on one driver at a time.",
      placement: 'right',
    },
    {
      selector: '.track-map-container',
      title: 'Live track map',
      body: "Every car moves around the circuit in real time. Colored dots show each driver's position. Hover to highlight, click to lock on.",
    },
    {
      selector: '.playback-bar',
      title: 'Playback controls',
      body: "Play, pause, and scrub through the race. Speed up to 30× or 60× to skim the whole race. The colored bands on the timeline show safety car periods.",
      placement: 'top',
    },
    {
      selector: '.battle-panel',
      title: 'Battle tracker',
      body: "Add up to 5 drivers to track their live gaps. The number shows how many seconds separate them — great for following a wheel-to-wheel fight.",
      placement: 'left',
    },
    {
      selector: '.playback-bar',
      title: 'Team radio',
      body: "Use the Radio control to enable synchronized team radio. Real clips from drivers and engineers play at the exact moment they happened in the race.",
      placement: 'top',
    },
    {
      title: 'Track flag states',
      body: "The track turns yellow during VSC or Safety Car periods, with specific sectors highlighted for local yellow flags. Red flag = full red track. It resets white when the track is clear.",
      placement: 'center',
    },
    {
      selector: '.app-header',
      title: "That's it!",
      body: "Explore Pace Analysis, Standings, and Calendar in the navigation. Drop a CSV file anywhere to load custom telemetry.",
      placement: 'bottom',
    },
  ]

  async function downloadRadioClip(url: string, driver: string) {
    const basename = url.split('/').pop() ?? 'clip.mp3'
    const filename = `${circuit.id}_${circuit.year ?? 2026}_${driver}_${basename}`
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.target = '_blank'
      a.click()
    }
  }

  function downloadTelemetryCSV() {
    const headers = 'driver,time,speed,gear,throttle,brake,drs,x,y,distance,relDist'
    for (const driver of Array.from(activeDrivers)) {
      const points = mergedTelemetry[driver]
      if (!points?.length) continue
      const rows = points.map(p =>
        `${driver},${p.time},${p.speed},${p.gear},${p.throttle},${p.brake ? 1 : 0},${p.drs},${p.x},${p.y},${p.distance},${p.relDist}`
      )
      const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${driver}_telemetry.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div
      className="app"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-hint">Drop telemetry CSV files here</div>
        </div>
      )}

      <header className="app-header">
        <div className="logo">
          <span className="logo-f1">F1</span>
          <span className="logo-divider" />
          <span className="logo-text">Telemetry</span>
        </div>
        <span className="header-context">Race data, replayed</span>
        {loading && activeView === 'telemetry' && <span className="loading-badge">Loading…</span>}
        <div className="header-actions">
          <button
            className="header-action-btn tutorial-trigger"
            onClick={() => setTutorialOpen(true)}
            title="Tour the features"
          ><Icon name="help" size={17} /><span>Help</span></button>
          <button
            className={`header-action-btn comments-toggle-btn ${commentsOpen ? 'active' : ''}`}
            onClick={() => setCommentsOpen(v => !v)}
            title="Open community comments"
          >
            <Icon name="socials" size={17} /><span>Community</span>
          </button>
          {authUser ? (
            <button className="auth-user-btn" onClick={() => supabase.auth.signOut()} title="Sign out">
              {(authUser.user_metadata?.full_name ?? authUser.email ?? 'User').split(' ')[0]}
            </button>
          ) : (
            <button className="auth-signin-header-btn" onClick={() => setAuthModalOpen(true)}>
              Sign in
            </button>
          )}
          <div className="settings-wrap">
          <button
            className={`header-action-btn settings-trigger ${settingsOpen ? 'active' : ''}`}
            onClick={() => setSettingsOpen(v => !v)}
            title="Appearance settings"
            aria-label="Appearance settings"
          ><Icon name="settings" size={17} /></button>
          {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
          </div>
          <a
            href="https://www.buymeacoffee.com/PrivateTiles"
            target="_blank"
            rel="noopener noreferrer"
            className="bmc-btn"
            aria-label="Buy me a coffee"
            title="Buy me a coffee"
          >
            <Icon name="coffee" size={17} />
            <span>Support the project</span>
          </a>
        </div>
      </header>

      <div className="app-body">
        <Sidebar active={activeView} onNav={setActiveView} />

        <div className="app-content">
          {activeView === 'standings' ? (
            <StandingsPage />
          ) : activeView === 'calendar' ? (
            <CalendarPage onSelectRound={(r) => { setPendingResultRound(r); setActiveView('results') }} />
          ) : activeView === 'results' ? (
            <ResultsPage initialRound={pendingResultRound} />
          ) : activeView === 'drivers' ? (
            <DriversPage />
          ) : activeView === 'teams' ? (
            <TeamsPage />
          ) : activeView === 'circuits' ? (
            <CircuitsPage />
          ) : activeView === 'insights' ? (
            <InsightsPage />
          ) : activeView === 'games' ? (
            <GamesPage authUser={authUser} onSignIn={() => setAuthModalOpen(true)} />
          ) : activeView === 'historicalraces' ? (
            <HistoricalRacesPage
              onWatchReplay={(c) => {
                setCircuit(c)
                setSession(c.sessions[0])
                setActiveView('telemetry')
              }}
            />
          ) : activeView === 'socials' ? (
            <SocialsPage />
          ) : activeView === 'changelog' ? (
            <ChangelogPage />
          ) : activeView === 'pace' ? (
            <PaceAnalysisView />
          ) : activeView === 'pace2' ? (
            <PaceAnalysis2View />
          ) : (
            <>
              <CircuitSelector
                selectedCircuit={circuit}
                selectedSession={session}
                selectedSeason={selectedSeason}
                onCircuitChange={handleCircuitChange}
                onSessionChange={(s) => { setSession(s) }}
                onSeasonChange={handleSeasonChange}
              />

              <div
                className={`main-layout ${hasDisplayData ? 'resizable-panes' : ''} ${resizingPane ? 'resizing-panes' : ''}`}
                style={hasDisplayData ? {
                  '--driver-pane-width': `${paneWidths.driver}px`,
                  '--right-pane-width': `${paneWidths.right}px`,
                } as React.CSSProperties : undefined}
              >
                {hasDisplayData ? (
                  <>
                    <DriverPanel
                      drivers={session.drivers.length > 0 ? session.drivers : Object.keys(mergedTelemetry)}
                      activeDrivers={activeDrivers}
                      dnfDrivers={dnfDrivers}
                      onSelect={selectDriver}
                      lapTimes={lapTimes}
                      highlightedDriver={effectiveHighlight}
                      onHighlight={setHighlightedDriver}
                      soloMode={soloMode}
                      onSoloToggle={handleSoloToggle}
                      currentPositions={currentRacePositions ?? undefined}
                      lapsBehind={totalLaps > 0
                        ? (progress >= 1 ? (Object.keys(lapsBehind).length > 0 ? lapsBehind : undefined)
                          : (progress * refLapDuration > 30 && Object.keys(liveLapsBehind).length > 0 ? liveLapsBehind : undefined))
                        : (Object.keys(lapsBehind).length > 0 ? lapsBehind : undefined)}
                      gapsToAhead={progress >= 1 ? (finalGapsToAhead ?? undefined) : (progress * refLapDuration > 30 ? (gapsToAhead ?? undefined) : undefined)}
                      currentCompounds={totalLaps > 0 && Object.keys(currentCompounds).length > 0 ? currentCompounds : undefined}
                      tunedDriver={radioCallsWithProgress.length > 0 ? tunedDriver : undefined}
                      onTuneDriver={radioCallsWithProgress.length > 0 ? setTunedDriver : undefined}
                    />

                    <div
                      className="pane-resizer"
                      role="separator"
                      aria-label="Resize drivers panel"
                      aria-orientation="vertical"
                      aria-valuemin={150}
                      aria-valuemax={360}
                      aria-valuenow={paneWidths.driver}
                      tabIndex={0}
                      onPointerDown={(e) => handlePaneResizeStart('driver', e)}
                      onPointerMove={handlePaneResizeMove}
                      onPointerUp={handlePaneResizeEnd}
                      onPointerCancel={handlePaneResizeEnd}
                      onKeyDown={(e) => handlePaneResizeKey('driver', e)}
                      onDoubleClick={() => resetPaneWidth('driver')}
                      title="Drag to resize Drivers. Double-click to reset."
                    />

                    <div className="center-pane">
                      <TrackMap
                        circuitId={circuit.id}
                        driverTelemetry={mergedTelemetry}
                        activeDrivers={activeDrivers}
                        highlightedDriver={effectiveHighlight}
                        soloMode={soloMode}
                        progress={progress}
                        onProgressChange={handleProgressChange}
                        playing={playing}
                        onPlayPause={() => setPlaying((p) => !p)}
                        battleGaps={battleGaps}
                        lapBoundaries={lapBoundaries}
                        totalLaps={totalLaps}
                        onHighlight={setHighlightedDriver}
                        safetyCars={refLapDuration > 0 ? safetyCars.map(sc => ({
                          ...sc,
                          startP: sc.start / refLapDuration,
                          endP: Math.min(1, sc.end / refLapDuration),
                        })) : []}
                        currentSC={currentSC ?? undefined}
                        pitStops={Object.keys(pitStops).length > 0 ? pitStops : undefined}
                        standingRestartLaps={standingRestartLaps.size > 0 ? standingRestartLaps : undefined}
                        overtakeMarkers={overtakeMarkersP.length > 0 ? overtakeMarkersP : undefined}
                        radioCallsWithProgress={radioCallsWithProgress.length > 0 ? radioCallsWithProgress : undefined}
                        tunedDriver={tunedDriver}
                        onTuneDriver={setTunedDriver}
                        onActiveRadioChange={setActiveRadioCaption}
                        raceControlMessages={raceControlMessages.length > 0 ? raceControlMessages : undefined}
                        loading={loading}
                      />

                      {totalLaps > 0 ? (
                        <PositionChart
                          lapPositions={lapPositions}
                          totalLaps={totalLaps}
                          progress={progress}
                          onProgressChange={handleProgressChange}
                          lapBoundaries={lapBoundaries}
                          activeDrivers={activeDrivers}
                          highlightedDriver={effectiveHighlight}
                        />
                      ) : (
                        <MiniSectorTimeline
                          miniSectors={miniSectors}
                          activeDrivers={activeDrivers}
                          highlightedDriver={effectiveHighlight}
                          colorMode={colorMode}
                          onColorModeChange={setColorMode}
                          progress={progress}
                        />
                      )}
                    </div>

                    <div
                      className="pane-resizer"
                      role="separator"
                      aria-label="Resize battle panel"
                      aria-orientation="vertical"
                      aria-valuemin={180}
                      aria-valuemax={420}
                      aria-valuenow={paneWidths.right}
                      tabIndex={0}
                      onPointerDown={(e) => handlePaneResizeStart('right', e)}
                      onPointerMove={handlePaneResizeMove}
                      onPointerUp={handlePaneResizeEnd}
                      onPointerCancel={handlePaneResizeEnd}
                      onKeyDown={(e) => handlePaneResizeKey('right', e)}
                      onDoubleClick={() => resetPaneWidth('right')}
                      title="Drag to resize Battle. Double-click to reset."
                    />

                    <div className="right-pane">
                      <BattleTracker
                        drivers={session.drivers.length > 0 ? session.drivers : Object.keys(mergedTelemetry)}
                        driverTelemetry={mergedTelemetry}
                        progress={progress}
                        refLapDuration={refLapDuration}
                        battleDrivers={battleDrivers}
                        onChangeBattleDrivers={setBattleDrivers}
                      />
                      {activeRadioCaption && (
                        <div className="radio-caption-box" onClick={() => setTunedDriver(tunedDriver === activeRadioCaption.driver ? null : activeRadioCaption.driver)}>
                          <div className="radio-caption-box-header">
                            <span className="radio-driver-dot" style={{ background: driverColor(activeRadioCaption.driver) }} />
                            <span className="radio-driver-name">{activeRadioCaption.driver}</span>
                            {profile?.tier === 'pro' && (
                              <button
                                className="radio-download-btn"
                                onClick={e => { e.stopPropagation(); downloadRadioClip(activeRadioCaption.url, activeRadioCaption.driver) }}
                                title="Download clip"
                              >↓</button>
                            )}
                            <span className="radio-wave-icon" style={{ marginLeft: profile?.tier === 'pro' ? '0' : 'auto' }}><Icon name="radio" size={15} /></span>
                          </div>
                          {activeRadioCaption.text && (
                            <div className="radio-caption-box-text">{activeRadioCaption.text}</div>
                          )}
                        </div>
                      )}
                      {profile?.tier === 'pro' && Array.from(activeDrivers).some(d => mergedTelemetry[d]?.length) && (
                        <button className="pro-download-csv-btn" onClick={downloadTelemetryCSV}>
                          ↓ Download CSV
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="static-track-center">
                    <StaticTrackMap circuit={circuit} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="app-footer">
        <a className="footer-link" href="/about/">About</a>
        <span className="footer-sep">·</span>
        <a className="footer-link" href="/privacy/">Privacy Policy</a>
        <span className="footer-sep">·</span>
        <a className="footer-link" href="/disclaimer/">Disclaimer</a>
        <span className="footer-sep">·</span>
        <span className="footer-copy">© 2026 f1vis.app</span>
        <span className="footer-sep">·</span>
        <span className="footer-legal">This website is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.</span>
      </footer>

      {!commentsOpen && <FeedbackButton />}

      {commentsOpen && (
        <CommentsPanel
          circuitId={circuit.id}
          user={authUser}
          profile={profile}
          onSignInClick={() => setAuthModalOpen(true)}
          onUpgradeClick={() => setProModalOpen(true)}
          onProfileUpdate={setProfile}
        />
      )}

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      {proModalOpen && (
        <ProModal onClose={() => setProModalOpen(false)} />
      )}

      {tutorialOpen && (
        <TutorialOverlay
          steps={TUTORIAL_STEPS}
          onClose={() => {
            setTutorialOpen(false)
            localStorage.setItem('f1vis_tour_done', '1')
          }}
        />
      )}
    </div>
  )
}
