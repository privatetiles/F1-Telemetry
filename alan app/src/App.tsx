import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { CircuitConfig, CircuitSession, TelemetryPoint, ColorMode } from './types'
import { CIRCUITS, telemetryUrl, fullRaceUrl } from './lib/dataIndex'
import { loadAllDriverTelemetry, loadTelemetryFromFile, loadFullRaceTelemetry } from './lib/csvLoader'
import type { SafetyCarPeriod, StintInfo, PitStopInfo, OvertakeEvent } from './lib/csvLoader'
import { computeMiniSectors, computeMiniSectorsFromSegments } from './lib/miniSectors'
import { loadTrackData, CIRCUIT_TRACK_PREFIX } from './lib/paceData'
import type { TrackData } from './lib/paceData'
import { buildDriverSpeedProfiles, getEffectiveLayout, type ProfileData } from './lib/lapPredictor'
import { computeBattleGaps } from './lib/battleGaps'
import type { BattleGapEntry } from './lib/battleGaps'
import CircuitSelector from './components/CircuitSelector'
import TrackMap from './components/TrackMap'
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
import PrivacyPage from './components/PrivacyPage'
import AboutPage from './components/AboutPage'
import DisclaimerPage from './components/DisclaimerPage'
import InsightsPage from './components/InsightsPage'
import DailyChallenge from './components/DailyChallenge'
import BattleTracker from './components/BattleTracker'
import HistoricalRacesPage from './components/HistoricalRacesPage'
import PositionChart from './components/PositionChart'
import './App.css'

export default function App() {
  const [circuit, setCircuit] = useState<CircuitConfig>(CIRCUITS[0])
  const [session, setSession] = useState<CircuitSession>(CIRCUITS[0].sessions[0])
  const [driverTelemetry, setDriverTelemetry] = useState<Record<string, TelemetryPoint[]>>({})
  const [dnfDrivers, setDnfDrivers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [activeDrivers, setActiveDrivers] = useState<Set<string>>(new Set())
  const [soloMode, setSoloMode] = useState(false)
  const [highlightedDriver, setHighlightedDriver] = useState<string | null>(null)
  const [colorMode, setColorMode] = useState<ColorMode>('speed')
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const VALID_VIEWS: AppView[] = ['telemetry', 'standings', 'calendar', 'results', 'drivers', 'teams', 'circuits', 'pace', 'pace2', 'insights', 'challenge', 'historicalraces', 'privacy', 'about', 'disclaimer']
  const hashToView = (hash: string): AppView => {
    const v = hash.replace(/^#\/?/, '') as AppView
    return VALID_VIEWS.includes(v) ? v : 'telemetry'
  }
  const [activeView, setActiveView] = useState<AppView>(() => hashToView(window.location.hash))
  const [battleDrivers, setBattleDrivers] = useState<string[]>([])
  const [uploadedTelemetry, setUploadedTelemetry] = useState<Record<string, TelemetryPoint[]>>({})
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pendingResultRound, setPendingResultRound] = useState<number | undefined>(undefined)
  const dragCounter = useRef(0)

  const [lapBoundaries, setLapBoundaries] = useState<number[]>([])
  const [totalLaps, setTotalLaps] = useState(0)
  const [safetyCars, setSafetyCars] = useState<SafetyCarPeriod[]>([])
  const [stints, setStints] = useState<Record<string, StintInfo[]>>({})
  const [pitStops, setPitStops] = useState<Record<string, PitStopInfo[]>>({})
  const [overtakes, setOvertakes] = useState<OvertakeEvent[]>([])

  const [trackData, setTrackData] = useState<TrackData | null>(null)

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
    const imgFiles = files.filter((f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name))

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

    for (const file of imgFiles) {
      const url = URL.createObjectURL(file)
      setCustomBgUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url })
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

  const handleCircuitChange = useCallback((c: CircuitConfig) => {
    setCircuit(c)
  }, [])

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

    if (!circuit.hasData) {
      setLoading(false)
      return
    }

    setLoading(true)
    const year = circuit.year ?? 2026

    if (session.type === 'full_race') {
      loadFullRaceTelemetry(fullRaceUrl(circuit.id, year)).then(({ data, dnf, totalLaps: tl, lapBoundaries: lb, safetyCars: sc, stints: st, pitStops: ps, overtakes: ov }) => {
        setDriverTelemetry(data)
        setDnfDrivers(dnf)
        setLapBoundaries(lb)
        setTotalLaps(tl)
        setSafetyCars(sc)
        setStints(st)
        setPitStops(ps)
        setOvertakes(ov)
        setActiveDrivers(new Set(Object.keys(data)))
        setLoading(false)
      }).catch(() => setLoading(false))
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
  }, [circuit.id, session.type])

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
    pairs.sort((a, b) => b[1] - a[1])
    const positions: Record<string, number> = {}
    const relDists: Record<string, number> = {}
    pairs.forEach(([d, rd], i) => { positions[d] = i + 1; relDists[d] = rd })
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
    setProgress(p as number)
  }, [])

  const effectiveHighlight = soloMode
    ? (activeDrivers.values().next().value ?? highlightedDriver)
    : highlightedDriver

  void getEffectiveLayout(circuit.id, driverProfiles)  // keep profiles warm as backup

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
          <div className="drop-hint">Drop CSV or image files here</div>
        </div>
      )}

      <header className="app-header">
        <div className="logo">
          <span className="logo-f1">F1</span>
          <span className="logo-text">Telemetry Visualizer</span>
        </div>
        {loading && activeView === 'telemetry' && <span className="loading-badge">Loading…</span>}
        <a href="https://www.buymeacoffee.com/PrivateTiles" target="_blank" rel="noopener noreferrer" className="bmc-btn">
          <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=PrivateTiles&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" />
        </a>
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
          ) : activeView === 'challenge' ? (
            <DailyChallenge />
          ) : activeView === 'historicalraces' ? (
            <HistoricalRacesPage
              onWatchReplay={(c) => {
                setCircuit(c)
                setSession(c.sessions[0])
                setActiveView('telemetry')
              }}
            />
          ) : activeView === 'privacy' ? (
            <PrivacyPage />
          ) : activeView === 'about' ? (
            <AboutPage />
          ) : activeView === 'disclaimer' ? (
            <DisclaimerPage />
          ) : activeView === 'pace' ? (
            <PaceAnalysisView />
          ) : activeView === 'pace2' ? (
            <PaceAnalysis2View />
          ) : (
            <>
              <CircuitSelector
                selectedCircuit={circuit}
                selectedSession={session}
                onCircuitChange={handleCircuitChange}
                onSessionChange={(s) => { setSession(s) }}
              />

              <div className="main-layout">
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
                        bgImageUrl={customBgUrl ?? undefined}
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
                        overtakeMarkers={overtakeMarkersP.length > 0 ? overtakeMarkersP : undefined}
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

                    <BattleTracker
                      drivers={session.drivers.length > 0 ? session.drivers : Object.keys(mergedTelemetry)}
                      driverTelemetry={mergedTelemetry}
                      progress={progress}
                      refLapDuration={refLapDuration}
                      battleDrivers={battleDrivers}
                      onChangeBattleDrivers={setBattleDrivers}
                    />
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
        <button className="footer-link" onClick={() => setActiveView('about')}>About</button>
        <span className="footer-sep">·</span>
        <button className="footer-link" onClick={() => setActiveView('privacy')}>Privacy Policy</button>
        <span className="footer-sep">·</span>
        <button className="footer-link" onClick={() => setActiveView('disclaimer')}>Disclaimer</button>
        <span className="footer-sep">·</span>
        <span className="footer-copy">© 2026 f1vis.app</span>
        <span className="footer-sep">·</span>
        <span className="footer-legal">This website is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.</span>
      </footer>
    </div>
  )
}
