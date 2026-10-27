import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, type BloomEffect } from 'postprocessing'
import * as THREE from 'three'
import type { Campus, ModuleKey } from '../data/campus'
import type { Route } from '../router'
import { Ambient } from './Ambient'
import { Buildings } from './Buildings'
import { CameraDirector, FOG, openingPosition } from './CameraDirector'
import { Ground } from './Ground'
import { LabelProjector } from './LabelProjector'
import type { LabelSpec } from './labels'
import { PacuBands } from './PacuBands'
import { Sky } from './Sky'

/**
 * Rendering tiers: 0 = ambient occlusion + bloom at up to 1.75× resolution, 1 = bloom only at up to
 * 1.25×, 2 = no post-processing at 1×. Phones start at 1; a slow frame rate steps down from there.
 */
type Tier = 0 | 1 | 2
const QUALITY: Record<string, Tier> = { high: 0, medium: 1, low: 2 }
const SMALL = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
const DPR: Record<Tier, number | [number, number]> = { 0: [1, 1.75], 1: [1, 1.25], 2: 1 }

interface Props {
  campus: Campus
  route: Route
  overviewOpen: boolean
  plan: boolean
  resetTick: number
  northTick: number
  reducedMotion: boolean
  ambient: boolean
  ambientRunning: boolean
  /** a still for the no-WebGL fallback or the social card: fixed tier, no frame-rate governor */
  capture: boolean
  labels: LabelSpec[]
  labelEls: Map<string, HTMLElement>
  compass: RefObject<HTMLElement | null>
  hovered: string | null
  onHover: Dispatch<SetStateAction<string | null>>
  onPointer: (x: number, y: number) => void
  onOpenModule: (key: ModuleKey) => void
  onUserStart: () => void
  /** after the first frame is on screen */
  onReady: () => void
}

export default function CampusScene(p: Props) {
  const bloom = useRef<BloomEffect | null>(null)
  const [pinned] = useState(() => {
    const q = new URLSearchParams(window.location.search).get('quality')
    return p.capture ? 0 : q && q in QUALITY ? QUALITY[q] : null
  })
  const [tier, setTier] = useState<Tier>(() => pinned ?? (SMALL ? 1 : 0))

  return (
    <Canvas
      className="scene"
      // the campus is static: only render while the camera moves or something changes
      frameloop="demand"
      shadows="percentage"
      dpr={DPR[tier]}
      camera={{ fov: 28, near: 5, far: 6000, position: openingPosition().toArray() }}
      onCreated={({ scene }) => {
        // dev only: inspect the scene graph from the browser console
        if (import.meta.env.DEV) Object.assign(window, { __scene: scene })
      }}
      onPointerMissed={() => p.onHover(null)}
    >
      {/* colours are set every time the time of day changes (see Sky) */}
      <color attach="background" args={['#e3e8ec']} />
      <fog attach="fog" args={['#e3e8ec', FOG.near, FOG.far]} />
      <Sky bloom={bloom} shadowSize={SMALL ? 1024 : 2048} />
      <Ground campus={p.campus} />
      <Buildings
        campus={p.campus}
        hovered={p.hovered}
        onHover={p.onHover}
        onPointer={p.onPointer}
        onOpenModule={p.onOpenModule}
      />
      <PacuBands campus={p.campus} />
      <Ambient campus={p.campus} enabled={p.ambient} running={p.ambientRunning} />
      <LabelProjector specs={p.labels} els={p.labelEls} />
      <CameraDirector
        campus={p.campus}
        route={p.route}
        overviewOpen={p.overviewOpen}
        plan={p.plan}
        resetTick={p.resetTick}
        northTick={p.northTick}
        reducedMotion={p.reducedMotion}
        compass={p.compass}
        onUserStart={p.onUserStart}
      />
      {tier < 2 ? (
        // soft contact shadows give the miniature-model look; bloom only matters at night
        <EffectComposer key={tier} multisampling={4}>
          {tier === 0 ? <N8AO halfRes aoRadius={9} distanceFalloff={0.6} intensity={2.2} color="#2f3542" /> : <></>}
          <Bloom ref={bloom} intensity={0} luminanceThreshold={0.9} luminanceSmoothing={0.2} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        </EffectComposer>
      ) : (
        <RendererToneMapping />
      )}
      {pinned === null && tier < 2 && <FrameRateGovernor onSlow={() => setTier((t) => (t < 2 ? ((t + 1) as Tier) : t))} />}
      <Redraw on={tier} />
      <FirstFrame onReady={p.onReady} />
      {p.capture && <CaptureProbe specs={p.labels} />}
    </Canvas>
  )
}

/** Without the effect composer, the renderer applies the same neutral tone mapping itself. */
function RendererToneMapping() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const before = gl.toneMapping
    gl.toneMapping = THREE.NeutralToneMapping
    return () => {
      gl.toneMapping = before
    }
  }, [gl])
  return null
}

/**
 * Watches frame pacing while the scene animates (ambient motion targets ~30 fps, camera moves run at
 * the display rate) and asks for a cheaper tier when frames keep arriving slower than ~20 fps.
 * Gaps over 250 ms are idle time between on-demand frames, not slowness.
 */
function FrameRateGovernor({ onSlow }: { onSlow: () => void }) {
  const stats = useRef({ last: 0, ema: 0, n: 0, since: performance.now() })
  useFrame(() => {
    const now = performance.now()
    const s = stats.current
    const gap = now - s.last
    s.last = now
    // shaders compile during the first frames; give each tier a few seconds to settle
    if (gap > 250 || now - s.since < 3000) return
    s.ema = s.n === 0 ? gap : s.ema + (gap - s.ema) * 0.06
    s.n++
    if (s.n > 60 && s.ema > 50) {
      s.n = 0
      s.since = now
      onSlow()
    }
  })
  return null
}

function Redraw({ on }: { on: unknown }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => invalidate(), [on, invalidate])
  return null
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    // useFrame runs before the render; the next animation frame comes after it is on screen
    requestAnimationFrame(() => onReady())
  })
  return null
}

/** Capture mode: writes where the module labels point (canvas pixels) into #capture-data. */
function CaptureProbe({ specs }: { specs: LabelSpec[] }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useFrame(() => {
    const el = document.getElementById('capture-data')
    if (!el) return
    const v = new THREE.Vector3()
    const spots = specs
      .filter((s) => s.kind === 'module')
      .map((s) => {
        v.set(s.pos[0], s.pos[1], s.pos[2]).project(camera)
        return { module: s.module, x: Math.round(((v.x + 1) / 2) * size.width), y: Math.round(((1 - v.y) / 2) * size.height) }
      })
    el.textContent = JSON.stringify({ width: size.width, height: size.height, spots })
  })
  return null
}
