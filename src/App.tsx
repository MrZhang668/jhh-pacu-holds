import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { bootDone, bootFail, bootProgress } from './boot'
import { loadCampus, type Campus, type ModuleKey } from './data/campus'
import { closePanel, navigate, useRoute } from './router'
import { buildLabelSpecs } from './scene/labels'
import { loadFlag, loadVisited, saveFlag, saveVisited, useIsNight, useMediaQuery } from './state/hooks'
import { FallbackMap } from './ui/FallbackMap'
import { Header } from './ui/Header'
import { HoverTip } from './ui/HoverTip'
import { LabelLayer } from './ui/LabelLayer'
import { MapControls } from './ui/MapControls'
import { OverviewPanel } from './ui/OverviewPanel'
import { SidePanel } from './ui/SidePanel'
import { TimeControls } from './ui/TimeControls'

const params = new URLSearchParams(window.location.search)
/** ?capture=still|og renders a clean frame for the images in public/ (see scripts/capture_stills.py) */
const CAPTURE = params.get('capture') === 'still' || params.get('capture') === 'og' ? params.get('capture') : null

// the 3D scene (three.js and friends) is its own chunk, fetched alongside the campus data
const loadScene = () => import('./scene/CampusScene')
const CampusScene = lazy(loadScene)

/** ?webgl=0 shows the fallback on purpose. */
function hasWebGL(): boolean {
  if (params.get('webgl') === '0') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(gl)
  } catch {
    return false
  }
}

/** If the 3D scene fails to start (no usable WebGL context, say), fall back to the still image. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

const prefers = (query: string) => window.matchMedia(query).matches

export default function App() {
  const route = useRoute()
  const [campus, setCampus] = useState<Campus | null>(null)
  const [webgl, setWebgl] = useState(hasWebGL)
  const [plan, setPlan] = useState(false)
  const [showNames, setShowNames] = useState(false)
  const [showStreets, setShowStreets] = useState(false)
  // traffic, people and birds: on unless the visitor prefers less motion or is on a phone
  const [ambient, setAmbient] = useState(
    () =>
      loadFlag('ambient') ?? !(prefers('(prefers-reduced-motion: reduce)') || prefers('(max-width: 767px), (pointer: coarse)')),
  )
  // pointer over a building mesh (drives the tooltip) and over a module label
  const [hovered, setHovered] = useState<string | null>(null)
  const [labelHover, setLabelHover] = useState<string | null>(null)
  const [resetTick, setResetTick] = useState(0)
  const [northTick, setNorthTick] = useState(0)
  // the overview starts open on large screens and folds away once people start exploring
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1360 || window.innerHeight < 820)
  const [interacted, setInteracted] = useState(false)
  const [visited, setVisited] = useState(() => loadVisited<ModuleKey>())
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const night = useIsNight()
  // shared between the DOM label layer and the projector inside the canvas
  const [labelEls] = useState(() => new Map<string, HTMLElement>())
  const compass = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bootProgress(0.15)
    if (webgl) loadScene().then(() => bootProgress(0.3), () => undefined) // a failure surfaces in SceneBoundary
    loadCampus((f) => bootProgress(0.15 + 0.6 * f)).then(
      (c) => {
        bootProgress(0.8, 'Building the scene…')
        setCampus(c)
      },
      (e: unknown) => bootFail(e instanceof Error ? e.message : String(e)),
    )
    // once, on first load (webgl only changes later if the scene fails, and then nothing is refetched)
  }, [])

  useEffect(() => {
    if (route.name !== 'module') return
    setVisited((v) => {
      if (v.has(route.key)) return v
      const next = new Set(v).add(route.key)
      saveVisited(next)
      return next
    })
  }, [route])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = night ? 'night' : 'day'
  }, [night])

  const labels = useMemo(
    () => (campus ? buildLabelSpecs(campus, showNames, showStreets) : []),
    [campus, showNames, showStreets],
  )

  const moveTip = useCallback((x: number, y: number) => {
    if (tip.current) tip.current.style.transform = `translate3d(${x + 14}px, ${y + 18}px, 0)`
  }, [])
  const openModule = useCallback((key: ModuleKey) => navigate(key), [])
  const onUserStart = useCallback(() => {
    setInteracted(true)
    setCollapsed(true)
  }, [])
  const onSceneError = useCallback(() => setWebgl(false), [])
  const toggleAmbient = useCallback((on: boolean) => {
    setAmbient(on)
    saveFlag('ambient', on)
  }, [])

  const panelOpen = route.name !== 'map'
  const hoveredBuilding = campus?.buildings.find((b) => b.key === hovered) ?? null
  const activeModule = route.name === 'module' ? route.key : null

  return (
    <main
      className={`app${panelOpen ? ' panel-open' : ''}${webgl ? '' : ' no-webgl'}${CAPTURE ? ` is-capture capture-${CAPTURE}` : ''}`}
      style={CAPTURE ? { width: Number(params.get('w') ?? 1600), height: Number(params.get('h') ?? 1000) } : undefined}
    >
      {webgl ? (
        campus && (
          <SceneBoundary onError={onSceneError}>
            <Suspense fallback={null}>
              <CampusScene
                campus={campus}
                route={route}
                // the fallback still is framed like the opening shot with the overview open
                overviewOpen={CAPTURE ? CAPTURE === 'still' : !collapsed}
                plan={plan}
                resetTick={resetTick}
                northTick={northTick}
                reducedMotion={reducedMotion}
                ambient={ambient || Boolean(CAPTURE)}
                ambientRunning={ambient && !panelOpen && !CAPTURE}
                capture={Boolean(CAPTURE)}
                labels={labels}
                labelEls={labelEls}
                compass={compass}
                hovered={labelHover ?? hovered}
                onHover={setHovered}
                onPointer={moveTip}
                onOpenModule={openModule}
                onUserStart={onUserStart}
                onReady={bootDone}
              />
            </Suspense>
            <LabelLayer
              specs={labels}
              els={labelEls}
              visited={visited}
              active={activeModule}
              onHover={setLabelHover}
              onOpen={openModule}
            />
            <HoverTip building={hoveredBuilding} tipRef={tip} />
          </SceneBoundary>
        )
      ) : (
        <FallbackMap
          overviewOpen={!collapsed && !panelOpen}
          visited={visited}
          active={activeModule}
          onOpen={openModule}
          onLoad={bootDone}
        />
      )}

      <Header route={route} />
      {!panelOpen && <OverviewPanel collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />}
      {webgl && <TimeControls />}
      {webgl && (
        <MapControls
          compass={compass}
          onNorth={() => setNorthTick((n) => n + 1)}
          onReset={() => {
            setPlan(false)
            setResetTick((n) => n + 1)
          }}
          showNames={showNames}
          onShowNames={setShowNames}
          showStreets={showStreets}
          onShowStreets={setShowStreets}
          plan={plan}
          onPlan={setPlan}
          ambient={ambient}
          onAmbient={toggleAmbient}
        />
      )}
      {webgl && !interacted && !panelOpen && (
        <p className="hint glass">Drag to rotate · Scroll to zoom · Right-drag to pan · Pick a numbered label to explore</p>
      )}
      <footer className="smallprint">
        Independent student project (JHU MSEM Team 6) · Not an official Johns Hopkins Medicine website · Map data ©
        OpenStreetMap contributors
      </footer>
      {campus && <SidePanel route={route} campus={campus} onClose={closePanel} />}
      {CAPTURE === 'og' && (
        <div className="og-card">
          <p className="og-eyebrow">JHU MSEM · Team 6 · Fall 2025</p>
          <h1>Reducing OR &amp; PACU Holds</h1>
          <p>Patient flow at The Johns Hopkins Hospital, explored on a 3D model of the East Baltimore campus.</p>
        </div>
      )}
      {CAPTURE && <pre id="capture-data" hidden />}
    </main>
  )
}
