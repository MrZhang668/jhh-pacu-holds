import { useEffect, useRef, type ComponentRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import * as THREE from 'three'
import { MODULES } from '../content/modules'
import type { Campus } from '../data/campus'
import type { Route } from '../router'

const DEG = Math.PI / 180
// Opening shot from the south-west (above Broadway × Orleans St) looking north-east, so the
// Billings façade (facing Broadway) and the Zayed/Bloomberg glass (facing Orleans St) both show.
export const TARGET = new THREE.Vector3(10, 0, -40)
// from the west-south-west: Billings shows its Broadway façade, and all four module buildings
// spread across the screen instead of lining up front to back
const OPENING = { distance: 1000, polar: 52 * DEG, azimuth: -60 * DEG }
const BREATH = { idleMs: 4000, amplitude: 5 * DEG, period: 28 }
/** haze from just beyond the campus at the opening distance to fully hidden at the city's edge */
export const FOG = { near: 1050, far: 2600 }
/** share of the screen width covered by the side panel on wide screens */
export const PANEL_SHARE = 0.62
export const WIDE = 900
/**
 * While the overview panel (≈ 330 px tall) is open at the top, lower the campus by this share of the
 * view height so the northernmost label (Welch) clears it. Short screens start with it collapsed.
 */
const overviewShift = (height: number) => Math.min(0.32, Math.max(0.15, 330 / height - 0.09))

/** ?cam=x,y,z,tx,ty,tz opens on another shot (used to frame stills and close-up checks) */
const START = (() => {
  const v = new URLSearchParams(window.location.search).get('cam')?.split(',').map(Number)
  return v?.length === 6 && v.every(Number.isFinite) ? v : null
})()

export function openingPosition(distance = OPENING.distance, azimuth = OPENING.azimuth) {
  return new THREE.Vector3().setFromSpherical(new THREE.Spherical(distance, OPENING.polar, azimuth)).add(TARGET)
}

/** Phones and portrait tablets get an opening shot fitted to the screen; the desktop one is too wide. */
export const PHONE = 768
const isFitted = (width: number, height: number) => width < PHONE || height > width
// angles to try, the desktop one first: another angle can stack the labels instead of crowding them
const AZIMUTHS = [-60, -45, -30, -75, -15].map((a) => a * DEG)
// the projector's spacing between labels, and a typical label size before one can be measured
const GAP = 4
const TYPICAL_LABEL = { width: 140, height: 78 }

/**
 * The fitted opening shot: the first angle (and the smallest distance for it) at which all four module
 * labels fit in the free part of the screen without overlapping, plus the focal offset that centres
 * them there. If no angle works, the desktop angle at the distance where the labels fit.
 */
function fittedFraming(campus: Campus, width: number, height: number, fov: number) {
  // the free area between the overlays: header and overview bar above, time card or overview
  // bar below, map buttons on the right
  let top = 0
  let bottom = height
  let right = width
  for (const selector of ['.site-header', '.overview-bar', '.time-card']) {
    const r = document.querySelector(selector)?.getBoundingClientRect()
    if (!r || r.height === 0) continue
    if (r.top + r.height / 2 < height / 2) top = Math.max(top, r.bottom + 6)
    else bottom = Math.min(bottom, r.top - 6)
  }
  const buttons = document.querySelector('.map-controls')?.getBoundingClientRect()
  if (buttons && buttons.width > 0) right = buttons.left - 4

  const labels = campus.buildings
    .filter((b) => b.module)
    .map((b) => {
      const r = document.querySelector(`.module-label[data-module="${b.module}"]`)?.getBoundingClientRect()
      return {
        anchor: new THREE.Vector3(b.anchor[0], b.top + 2, b.anchor[1]),
        width: r?.width || TYPICAL_LABEL.width,
        height: r?.height || TYPICAL_LABEL.height,
      }
    })
  const camera = new THREE.PerspectiveCamera(fov, width / height, 5, 6000)
  const v = new THREE.Vector3()
  type Frame = { azimuth: number; distance: number; x0: number; x1: number; y0: number; y1: number }
  let chosen: Frame | null = null
  let fallback: Frame | null = null

  for (const azimuth of AZIMUTHS) {
    for (let distance = OPENING.distance; distance <= 2000; distance += 50) {
      camera.position.copy(openingPosition(distance, azimuth))
      camera.lookAt(TARGET)
      camera.updateMatrixWorld()
      const boxes = labels.map((l) => {
        v.copy(l.anchor).project(camera)
        const x = ((v.x + 1) / 2) * width
        const y = ((1 - v.y) / 2) * height
        return [x - l.width / 2, y - l.height, x + l.width / 2, y + GAP] as const
      })
      const frame = {
        azimuth,
        distance,
        x0: Math.min(...boxes.map((b) => b[0])),
        y0: Math.min(...boxes.map((b) => b[1])),
        x1: Math.max(...boxes.map((b) => b[2])),
        y1: Math.max(...boxes.map((b) => b[3])),
      }
      if (frame.x1 - frame.x0 > right || frame.y1 - frame.y0 > bottom - top) continue
      fallback ??= frame
      // standing further back only crowds the labels more, so this distance decides for this angle
      const clear = boxes.every((a, i) =>
        boxes.slice(i + 1).every((b) => a[2] + GAP <= b[0] || b[2] + GAP <= a[0] || a[3] + GAP <= b[1] || b[3] + GAP <= a[1]),
      )
      if (clear) chosen = frame
      break
    }
    if (chosen) break
  }
  const f: Frame = chosen ?? fallback ?? { azimuth: OPENING.azimuth, distance: 2000, x0: 0, x1: right, y0: top, y1: bottom }
  // screen pixels per world unit at the target, to turn the shift into a focal offset; a positive x
  // offset slides the picture left and a negative y offset slides it down
  const perUnit = height / (2 * f.distance * Math.tan((fov * DEG) / 2))
  const dx = right / 2 - (f.x0 + f.x1) / 2
  const dy = (top + bottom) / 2 - (f.y0 + f.y1) / 2
  return { azimuth: f.azimuth, distance: f.distance, offset: [-dx / perUnit, -dy / perUnit] as const }
}

interface Props {
  campus: Campus
  route: Route
  /** the overview panel is expanded (it sits at the top on screens wider than 1100 px) */
  overviewOpen: boolean
  plan: boolean
  resetTick: number
  northTick: number
  reducedMotion: boolean
  compass: RefObject<HTMLElement | null>
  onUserStart: () => void
}

/**
 * Owns the camera: the opening shot, flights to a module's building (kept in the strip left of the
 * side panel), the way back, plan view, a slow idle sway, and the compass needle.
 */
export function CameraDirector(props: Props) {
  const { campus, route, overviewOpen, plan, resetTick, northTick, reducedMotion, compass, onUserStart } = props
  const ref = useRef<ComponentRef<typeof CameraControls>>(null)
  const invalidate = useThree((s) => s.invalidate)
  const scene = useThree((s) => s.scene)
  const size = useThree((s) => s.size)
  const wide = size.width >= WIDE
  const fitted = isFitted(size.width, size.height)
  const overviewOnTop = overviewOpen && size.width > 1100
  // read by the reset effect, which should not re-run (and reset the view) on every resize
  const sizeNow = useRef(size)
  sizeNow.current = size
  const saved = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  const idle = useRef({ since: performance.now(), breathing: false, base: 0, phase: 0 })
  const panelOpen = route.name !== 'map'
  const animate = !reducedMotion

  useEffect(() => {
    ref.current?.setBoundary(new THREE.Box3(new THREE.Vector3(-480, -1, -560), new THREE.Vector3(420, 40, 420)))
    // dev only: lets the browser console frame shots for progress screenshots
    if (import.meta.env.DEV) Object.assign(window, { __controls: ref.current })
  }, [])

  // module flights and the way back
  useEffect(() => {
    const c = ref.current
    if (!c) return
    idle.current.breathing = false
    idle.current.since = performance.now()
    if (route.name === 'module') {
      const info = MODULES[route.key]
      const b = campus.buildings.find((x) => x.key === info.building)
      if (!b) return
      if (!saved.current) saved.current = { pos: c.getPosition(new THREE.Vector3()), target: c.getTarget(new THREE.Vector3()) }
      const { azimuth, polar, distance, targetY } = info.camera
      const t = new THREE.Vector3(b.anchor[0], targetY, b.anchor[1])
      const p = new THREE.Vector3().setFromSpherical(new THREE.Spherical(distance, polar * DEG, azimuth * DEG)).add(t)
      void c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, animate)
    } else if (route.name === 'map' && saved.current) {
      const { pos, target } = saved.current
      saved.current = null
      void c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, animate)
    }
    invalidate()
  }, [route, campus, animate, invalidate])

  // Focal offset slides the picture without turning the camera: the building sits in the strip
  // left of a side panel, and the campus drops below the overview panel while that is open.
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const camera = c.camera as THREE.PerspectiveCamera
    const halfView = Math.tan((camera.fov * DEG) / 2)
    if (route.name === 'module') {
      const d = MODULES[route.key].camera.distance
      void c.setFocalOffset(wide ? PANEL_SHARE * d * halfView * camera.aspect : 0, 0, 0, animate)
    } else if (route.name === 'map' && overviewOnTop && !plan) {
      // a negative y offset slides the picture down
      void c.setFocalOffset(0, -overviewShift(size.height) * 2 * OPENING.distance * halfView, 0, animate)
    } else if (route.name === 'map' && fitted && !plan) {
      const [x, y] = fittedFraming(campus, size.width, size.height, camera.fov).offset
      void c.setFocalOffset(x, y, 0, animate)
    } else {
      void c.setFocalOffset(0, 0, 0, animate)
    }
    invalidate()
  }, [route, wide, fitted, overviewOnTop, plan, campus, animate, invalidate, size.width, size.height])

  // plan view (north up, straight down) and reset
  useEffect(() => {
    const c = ref.current
    if (!c) return
    if (plan) {
      c.minPolarAngle = c.maxPolarAngle = 0
      c.minAzimuthAngle = c.maxAzimuthAngle = 0
      void c.setLookAt(TARGET.x, 1500, TARGET.z + 0.01, TARGET.x, 0, TARGET.z, animate)
    } else {
      c.minPolarAngle = 20 * DEG
      c.maxPolarAngle = 70 * DEG
      c.minAzimuthAngle = -Infinity
      c.maxAzimuthAngle = Infinity
      const { width, height } = sizeNow.current
      if (START && resetTick === 0) {
        void c.setLookAt(START[0], START[1], START[2], START[3], START[4], START[5], false)
      } else {
        const fov = (c.camera as THREE.PerspectiveCamera).fov
        const shot = isFitted(width, height) ? fittedFraming(campus, width, height, fov) : OPENING
        const distance = shot.distance
        const p = openingPosition(distance, shot.azimuth)
        void c.setLookAt(p.x, p.y, p.z, TARGET.x, TARGET.y, TARGET.z, animate)
        // a fitted shot may stand further back: move the haze back with it
        if (scene.fog instanceof THREE.Fog) {
          scene.fog.near = FOG.near + distance - OPENING.distance
          scene.fog.far = FOG.far + distance - OPENING.distance
        }
      }
    }
    saved.current = null
    invalidate()
  }, [plan, resetTick, campus, scene, animate, invalidate])

  // compass: turn north up, keeping the tilt
  useEffect(() => {
    const c = ref.current
    if (!c || northTick === 0) return
    void c.rotateTo(0, c.polarAngle, animate)
    invalidate()
  }, [northTick, animate, invalidate])

  // the canvas renders on demand, so a slow timer wakes it when the idle sway should start
  useEffect(() => {
    if (reducedMotion) return
    const id = window.setInterval(() => {
      if (!panelOpen && !plan && performance.now() - idle.current.since > BREATH.idleMs) invalidate()
    }, 1000)
    return () => window.clearInterval(id)
  }, [panelOpen, plan, reducedMotion, invalidate])

  useFrame((_, delta) => {
    const c = ref.current
    if (!c) return
    if (compass.current) compass.current.style.transform = `rotate(${c.azimuthAngle}rad)`
    const s = idle.current
    if (reducedMotion || panelOpen || plan || performance.now() - s.since < BREATH.idleMs) {
      s.breathing = false
      return
    }
    if (!s.breathing) {
      s.breathing = true
      s.base = c.azimuthAngle
      s.phase = 0
    }
    s.phase += Math.min(delta, 0.1)
    c.azimuthAngle = s.base + BREATH.amplitude * Math.sin((s.phase / BREATH.period) * Math.PI * 2)
    invalidate()
  })

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={140}
      maxDistance={1800}
      smoothTime={0.5}
      dollySpeed={0.6}
      // zoom towards whatever is under the pointer
      dollyToCursor
      onStart={() => {
        idle.current.breathing = false
        idle.current.since = performance.now()
        onUserStart()
      }}
      onEnd={() => {
        idle.current.since = performance.now()
      }}
    />
  )
}
