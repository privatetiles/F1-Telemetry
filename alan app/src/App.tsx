import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { CircuitConfig, CircuitSession, TelemetryPoint, ColorMode } from './types'
import { CIRCUITS, telemetryUrl } from './lib/dataIndex'
import { loadAllDriverTelemetry, loadTelemetryFromFile } from './lib/csvLoader'
import { computeMiniSectors, computeMiniSectorsFromSegments } from './lib/miniSectors'
import { loadTrackData, CIRCUIT_TRACK_PREFIX } from './lib/paceData'
import type { TrackData } from './lib/paceData'
import { buildDriverSpeedProfiles, getEffectiveLayout, type ProfileData } from './lib/lapPredictor'
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
  const VALID_VIEWS: AppView[] = ['telemetry', 'standings', 'calendar', 'results', 'drivers', 'teams', 'circuits', 'pace', 'pace2', 'insights', 'privacy', 'about', 'disclaimer']
  const hashToView = (hash: string): AppView => {
    const v = hash.replace(/^#\/?/, '') as AppView
    return VALID_VIEWS.includes(v) ? v : 'telemetry'
  }
  const [activeView, setActiveView] = useState<AppView>(() => hashToView(window.location.hash))
  const [uploadedTelemetry, setUploadedTelemetry] = useState<Record<string, TelemetryPoint[]>>({})
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pendingResultRound, setPendingResultRound] = useState<number | undefined>(undefined)
  const dragCounter = useRef(0)

  const [trackData, setTrackData] = useState<TrackData | null>(null)

  useEffect(() => {
    window.location.hash = activeView === 'telemetry' ? '' : activeView
  }, [activeView])

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

    if (!circuit.hasData) {
      setLoading(false)
      return
    }

    setLoading(true)

    const urls = session.drivers.map((driver) => ({
      driver,
      url: telemetryUrl(circuit.id, session.type, driver),
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
      if (data.length > 0) out[driver] = data[data.length - 1].time
    }
    return out
  }, [mergedTelemetry])

  const miniSectors = useMemo(
    () => trackData
      ? computeMiniSectorsFromSegments(mergedTelemetry, trackData.segments)
      : computeMiniSectors(mergedTelemetry),
    [mergedTelemetry, trackData]
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
                      drivers={circuit.hasData ? session.drivers : Object.keys(mergedTelemetry)}
                      activeDrivers={activeDrivers}
                      dnfDrivers={dnfDrivers}
                      onSelect={selectDriver}
                      lapTimes={lapTimes}
                      highlightedDriver={effectiveHighlight}
                      onHighlight={setHighlightedDriver}
                      soloMode={soloMode}
                      onSoloToggle={handleSoloToggle}
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
                      />

                      <MiniSectorTimeline
                        miniSectors={miniSectors}
                        activeDrivers={activeDrivers}
                        highlightedDriver={effectiveHighlight}
                        colorMode={colorMode}
                        onColorModeChange={setColorMode}
                        progress={progress}
                      />
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
