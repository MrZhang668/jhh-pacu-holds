import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Campus, Pt } from '../data/campus'
import { daylight, nightness } from '../state/sun'
import { timeStore } from '../state/time'
import { WIND } from './wind'

// Ambient life on the campus: traffic (with a few ambulances), staff and visitors on the footpaths,
// a flock of birds and swaying trees. Everything is instanced and updated in one useFrame; while
// it runs, a ~30 fps ticker keeps the on-demand canvas rendering.

const FPS = 30

// ---------- paths ----------

interface Path {
  x: Float32Array
  z: Float32Array
  /** distance along the path at each point */
  cum: Float32Array
  length: number
  loop: boolean
}

function makePath(pts: Pt[]): Path {
  const n = pts.length
  const x = new Float32Array(n)
  const z = new Float32Array(n)
  const cum = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    x[i] = pts[i][0]
    z[i] = pts[i][1]
    if (i > 0) cum[i] = cum[i - 1] + Math.hypot(x[i] - x[i - 1], z[i] - z[i - 1])
  }
  const loop = Math.hypot(x[0] - x[n - 1], z[0] - z[n - 1]) < 1
  return { x, z, cum, length: cum[n - 1], loop }
}

/** Point at distance s along the path (clamped to its ends), written into out. */
function pointAt(path: Path, s: number, out: { x: number; z: number }) {
  const { x, z, cum } = path
  const n = cum.length
  if (s <= 0 || n < 2) {
    out.x = x[0]
    out.z = z[0]
    return
  }
  if (s >= path.length) {
    out.x = x[n - 1]
    out.z = z[n - 1]
    return
  }
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= s) lo = mid
    else hi = mid
  }
  const t = (s - cum[lo]) / (cum[hi] - cum[lo] || 1)
  out.x = x[lo] + (x[hi] - x[lo]) * t
  out.z = z[lo] + (z[hi] - z[lo]) * t
}

/** One direction of travel along a path; offset is to the right of the direction of travel. */
interface Lane {
  path: Path
  dir: 1 | -1
  offset: number
  speed: number
  /** distance travelled so far (lanes vary their speed, so it is integrated) */
  travelled: number
  phase: number
}

interface Mover {
  lane: Lane
  s0: number
  /** 0 … 1: shown only while the hour's activity level is above it */
  rank: number
  /** pedestrians walk at their own pace and keep to their own side of the path */
  pace: number
  side: number
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const P = { x: 0, z: 0 }
const A = { x: 0, z: 0 }
const B = { x: 0, z: 0 }
const POSE = { x: 0, z: 0, dx: 1, dz: 0, fade: 1 }

/** Where a mover is: position, heading and a fade near the open ends of its path. */
function pose(lane: Lane, u: number, fadeLength: number, offset = lane.offset) {
  const { path, dir } = lane
  const L = path.length
  const s = dir === 1 ? u : L - u
  pointAt(path, s, P)
  pointAt(path, s - 2.5 * dir, A)
  pointAt(path, s + 2.5 * dir, B)
  let dx = B.x - A.x
  let dz = B.z - A.z
  const len = Math.hypot(dx, dz) || 1
  dx /= len
  dz /= len
  // right of the direction of travel is (-dz, dx) with x east and z south
  POSE.x = P.x - dz * offset
  POSE.z = P.z + dx * offset
  POSE.dx = dx
  POSE.dz = dz
  POSE.fade = path.loop ? 1 : ramp(u / fadeLength) * ramp((L - u) / fadeLength)
  return POSE
}

const ramp = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))

/** Writes a rotation about y (local +x → heading) with scale k and height scale ky. */
function writeMatrix(arr: Float32Array, i: number, x: number, y: number, z: number, dx: number, dz: number, k: number, ky = k) {
  const o = i * 16
  arr[o] = dx * k
  arr[o + 1] = 0
  arr[o + 2] = dz * k
  arr[o + 3] = 0
  arr[o + 4] = 0
  arr[o + 5] = ky
  arr[o + 6] = 0
  arr[o + 7] = 0
  arr[o + 8] = -dz * k
  arr[o + 9] = 0
  arr[o + 10] = dx * k
  arr[o + 11] = 0
  arr[o + 12] = x
  arr[o + 13] = y
  arr[o + 14] = z
  arr[o + 15] = 1
}

// ---------- how busy each hour is ----------

// Relative traffic by hour: quiet nights, morning and evening rush.
const TRAFFIC = [
  0.3, 0.25, 0.22, 0.22, 0.28, 0.4, 0.62, 0.9, 1, 0.85, 0.75, 0.75, 0.78, 0.78, 0.78, 0.85, 0.95, 1, 0.85, 0.7, 0.6, 0.5,
  0.42, 0.35,
]
const lerpHourly = (table: number[], h: number) => {
  const i = Math.floor(h) % 24
  const t = h - Math.floor(h)
  return table[i] + (table[(i + 1) % 24] - table[i]) * t
}
const bump = (h: number, at: number) => Math.exp(-((h - at) ** 2) / 0.18)
/** Foot traffic: daytime visitors plus a surge of staff at the 7 AM and 7 PM shift changes. */
const footTraffic = (h: number) => Math.min(1, 0.12 + 0.38 * daylight(h) + 0.55 * (bump(h, 7) + bump(h, 19)))

/** 1 when a mover with this rank is out at this activity level, easing in and out. */
const presence = (activity: number, rank: number) => ramp((activity - rank) / 0.06 + 0.5)

// ---------- geometry ----------

function shaded(g: THREE.BufferGeometry, r: number, gr = r, b = r) {
  const n = g.attributes.position.count
  const c = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) c.set([r, gr, b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(c, 3))
  return g
}

function box(w: number, h: number, d: number, x: number, y: number, z = 0) {
  return new THREE.BoxGeometry(w, h, d).translate(x, y, z)
}

/** Forward is +x. Body plus a darker cabin; the paint comes from the instance colour. */
const carGeometry = () =>
  mergeGeometries([shaded(box(4.4, 1.0, 1.85, 0, 0.75), 1), shaded(box(2.4, 0.72, 1.62, -0.25, 1.6), 0.55)])!

const carLightGeometry = () =>
  mergeGeometries([
    shaded(box(0.1, 0.26, 0.42, 2.21, 0.9, 0.6), 1, 0.93, 0.78),
    shaded(box(0.1, 0.26, 0.42, 2.21, 0.9, -0.6), 1, 0.93, 0.78),
    shaded(box(0.1, 0.22, 0.4, -2.21, 0.95, 0.62), 1, 0.12, 0.08),
    shaded(box(0.1, 0.22, 0.4, -2.21, 0.95, -0.62), 1, 0.12, 0.08),
  ])!

/** A box ambulance: patient module, cab and a red stripe. */
const ambulanceGeometry = () =>
  mergeGeometries([
    shaded(box(4.5, 2.4, 2.3, -0.75, 1.55), 1),
    shaded(box(1.9, 1.7, 2.16, 2.45, 1.2), 0.93),
    shaded(box(1.1, 0.7, 2.0, 2.3, 1.75), 0.35, 0.4, 0.48),
    shaded(box(4.54, 0.32, 2.34, -0.75, 1.45), 0.78, 0.12, 0.12),
  ])!

const PERSON_SCALE = 1.25 // a little larger than life so people read from a distance
const bodyGeometry = () => new THREE.CylinderGeometry(0.21, 0.29, 1.3, 6).translate(0, 0.65, 0)
const headGeometry = () => new THREE.IcosahedronGeometry(0.19, 0).translate(0, 1.5, 0)

/** Two wings whose tips sit above the body; scaling y below zero folds them down (a flap). */
function birdGeometry() {
  const g = new THREE.BufferGeometry()
  // prettier-ignore
  const v = new Float32Array([
    0.35, 0, 0, -0.25, 0, 0, -0.05, 0.28, -0.75, // left wing
    -0.25, 0, 0, 0.35, 0, 0, -0.05, 0.28, 0.75, // right wing
  ])
  g.setAttribute('position', new THREE.BufferAttribute(v, 3))
  g.computeVertexNormals()
  return g
}

const RED = new THREE.Color('#ff2a2a')
const BLUE = new THREE.Color('#3d7bff')
const CAR_COLORS = ['#f2f2ef', '#f2f2ef', '#dcdedf', '#c3c7ca', '#9aa0a5', '#6b7177', '#454c55', '#2d3542', '#2f4a6b', '#7b2f2f', '#c8bfae']
// staff in ceil blue, navy, royal and teal scrubs and white coats; visitors in everyday colours
const STAFF_COLORS = ['#86b2dc', '#86b2dc', '#2c4672', '#3d63a8', '#3b8a87', '#f4f4f2', '#f4f4f2']
const VISITOR_COLORS = ['#c9a66b', '#5b6770', '#a04b3c', '#2f3a4a', '#7c8a5c', '#d8d2c4']
const SKIN = ['#f1d3b6', '#e0b48f', '#c68c63', '#9a6544', '#6b4530']

// ---------- the component ----------

interface Props {
  campus: Campus
  /** draw ambient life at all (birds only fly when on) */
  enabled: boolean
  /** advance it (paused while a panel is open) */
  running: boolean
}

export function Ambient({ campus, enabled, running }: Props) {
  const invalidate = useThree((s) => s.invalidate)

  const sim = useMemo(() => {
    const rand = mulberry32(20251118)
    const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]

    // two lanes per street: both directions on a two-way street, side by side on a one-way one
    const lanes: Lane[] = []
    for (const r of campus.traffic ?? []) {
      const path = makePath(r.p)
      if (path.length < 50) continue
      const speed = 9 + rand() * 5
      if (r.o) {
        lanes.push({ path, dir: 1, offset: r.w * 0.16, speed, travelled: 0, phase: rand() * 6 })
        lanes.push({ path, dir: 1, offset: -r.w * 0.12, speed: speed * 1.08, travelled: 0, phase: rand() * 6 })
      } else {
        lanes.push({ path, dir: 1, offset: r.w * 0.25, speed, travelled: 0, phase: rand() * 6 })
        lanes.push({ path, dir: -1, offset: r.w * 0.25, speed: speed * 0.95, travelled: 0, phase: rand() * 6 })
      }
    }
    const vehicles: Mover[] = []
    for (const lane of lanes) {
      const count = Math.max(1, Math.floor(lane.path.length / (60 + rand() * 45)))
      const gap = lane.path.length / count
      for (let i = 0; i < count; i++)
        vehicles.push({ lane, s0: i * gap + (rand() - 0.5) * gap * 0.4, rank: rand(), pace: 1, side: 0 })
    }
    // a few ambulances on the lanes that pass closest to the emergency department (Zayed Tower)
    const ed = campus.buildings.find((b) => b.key === 'zayed')?.anchor ?? [0, 0]
    const near = (lane: Lane) => {
      let best = Infinity
      for (let i = 0; i < lane.path.x.length; i++) best = Math.min(best, Math.hypot(lane.path.x[i] - ed[0], lane.path.z[i] - ed[1]))
      return best
    }
    const ambulances: Mover[] = []
    const streets = new Set<Path>()
    for (const lane of [...lanes].sort((a, b) => near(a) - near(b))) {
      if (ambulances.length === 3) break
      if (streets.has(lane.path)) continue
      streets.add(lane.path)
      const i = vehicles.findIndex((v) => v.lane === lane)
      if (i >= 0) ambulances.push({ ...vehicles.splice(i, 1)[0], rank: 0 })
    }
    const cars = vehicles

    const walkLanes: Lane[] = []
    for (const w of campus.walks ?? []) {
      const path = makePath(w.p)
      if (path.length < 20) continue
      walkLanes.push({ path, dir: 1, offset: 0, speed: 1, travelled: 0, phase: 0 })
      walkLanes.push({ path, dir: -1, offset: 0, speed: 1, travelled: 0, phase: 0 })
    }
    const people: Mover[] = []
    for (const lane of walkLanes) {
      const count = Math.max(1, Math.floor(lane.path.length / (22 + rand() * 14)))
      for (let i = 0; i < count; i++)
        people.push({ lane, s0: rand() * lane.path.length, rank: rand(), pace: 1.1 + rand() * 0.5, side: 0.3 + rand() * 0.8 })
    }

    return {
      lanes,
      cars,
      ambulances,
      people,
      carColors: cars.map(() => pick(CAR_COLORS)),
      bodyColors: people.map(() => (rand() < 0.58 ? pick(STAFF_COLORS) : pick(VISITOR_COLORS))),
      skinColors: people.map(() => pick(SKIN)),
      birds: Array.from({ length: 11 }, (_, i) => {
        const row = Math.ceil(i / 2)
        return { back: row * 3.4, side: (i % 2 ? 1 : -1) * row * 3.6, up: (rand() - 0.5) * 2, phase: rand() * 6.28 }
      }),
    }
  }, [campus])

  const geo = useMemo(
    () => ({
      car: carGeometry(),
      carLights: carLightGeometry(),
      ambulance: ambulanceGeometry(),
      red: box(0.42, 0.3, 0.9, 1.25, 2.92, -0.5),
      blue: box(0.42, 0.3, 0.9, 1.25, 2.92, 0.5),
      body: bodyGeometry(),
      head: headGeometry(),
      bird: birdGeometry(),
    }),
    [],
  )
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])

  const mat = useMemo(
    () => ({
      car: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.1 }),
      lights: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
      ambulance: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }),
      red: new THREE.MeshBasicMaterial({ color: '#ff2a2a', toneMapped: false }),
      blue: new THREE.MeshBasicMaterial({ color: '#3d7bff', toneMapped: false }),
      body: new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }),
      head: new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }),
      bird: new THREE.MeshBasicMaterial({ color: '#39414e', side: THREE.DoubleSide }),
    }),
    [],
  )
  useEffect(() => () => Object.values(mat).forEach((m) => m.dispose()), [mat])

  const cars = useRef<THREE.InstancedMesh>(null)
  const carLights = useRef<THREE.InstancedMesh>(null)
  const ambulances = useRef<THREE.InstancedMesh>(null)
  const reds = useRef<THREE.InstancedMesh>(null)
  const blues = useRef<THREE.InstancedMesh>(null)
  const bodies = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const birds = useRef<THREE.InstancedMesh>(null)

  // lights, beacons and heads follow the matrices of the mesh they belong to
  useLayoutEffect(() => {
    const share = (from: THREE.InstancedMesh | null, ...to: (THREE.InstancedMesh | null)[]) => {
      if (!from) return
      from.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      for (const m of to) if (m) m.instanceMatrix = from.instanceMatrix
    }
    share(cars.current, carLights.current)
    share(ambulances.current, reds.current, blues.current)
    share(bodies.current, heads.current)
    birds.current?.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const color = new THREE.Color()
    const paint = (mesh: THREE.InstancedMesh | null, colors: string[]) => {
      if (!mesh) return
      colors.forEach((c, i) => mesh.setColorAt(i, color.set(c)))
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    paint(cars.current, sim.carColors)
    paint(bodies.current, sim.bodyColors)
    paint(heads.current, sim.skinColors)
    if (ambulances.current) for (let i = 0; i < sim.ambulances.length; i++) ambulances.current.setColorAt(i, color.set('#ffffff'))
  }, [sim])

  // the canvas renders on demand; keep frames coming while things move
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => invalidate(), 1000 / FPS)
    return () => window.clearInterval(id)
  }, [running, invalidate])

  const clock = useRef(0)
  const last = useRef({ hours: Number.NaN, t: Number.NaN, enabled: !enabled })

  useFrame(({ camera }, delta) => {
    const dt = running ? Math.min(delta, 0.1) : 0
    clock.current += dt
    const t = clock.current
    const hours = timeStore.get()
    const l = last.current
    // the birds also depend on where the camera is
    if (t === l.t && hours === l.hours && enabled === l.enabled && !birds.current?.visible) return
    l.t = t
    l.hours = hours
    l.enabled = enabled
    WIND.value = t

    for (const lane of sim.lanes) lane.travelled += dt * lane.speed * (0.82 + 0.18 * Math.sin(t * 0.21 + lane.phase))

    const night = nightness(hours)
    const day = daylight(hours)

    // vehicles
    const traffic = lerpHourly(TRAFFIC, hours)
    const place = (mesh: THREE.InstancedMesh | null, movers: Mover[], always = false) => {
      if (!mesh) return
      const arr = mesh.instanceMatrix.array as Float32Array
      movers.forEach((m, i) => {
        const L = m.lane.path.length
        const u = (((m.s0 + m.lane.travelled) % L) + L) % L
        const p = pose(m.lane, u, 14)
        const k = p.fade * (always ? 1 : presence(traffic, m.rank))
        writeMatrix(arr, i, p.x, 0.22, p.z, p.dx, p.dz, k)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    place(cars.current, sim.cars)
    place(ambulances.current, sim.ambulances, true)
    if (carLights.current) carLights.current.visible = night > 0.05
    mat.lights.color.setScalar(0.4 + 1.6 * night)
    // beacons alternate red and blue, brighter after dark
    const flash = Math.floor(t * 3.2) % 2 === 0
    const glow = 0.9 + 1.4 * night
    mat.red.color.copy(RED).multiplyScalar(flash ? glow : 0.25)
    mat.blue.color.copy(BLUE).multiplyScalar(flash ? 0.25 : glow)

    // pedestrians
    if (bodies.current) {
      const arr = bodies.current.instanceMatrix.array as Float32Array
      const foot = footTraffic(hours)
      sim.people.forEach((m, i) => {
        const L = m.lane.path.length
        const u = (((m.s0 + t * m.pace) % L) + L) % L
        const p = pose(m.lane, u, 4, m.side)
        const k = PERSON_SCALE * p.fade * presence(foot, m.rank)
        writeMatrix(arr, i, p.x, 0.25, p.z, p.dx, p.dz, k)
      })
      bodies.current.instanceMatrix.needsUpdate = true
    }

    // birds: a loose V on a slow figure-eight over the campus, daytime only
    if (birds.current) {
      const mesh = birds.current
      mesh.visible = enabled && day > 0.2 && t > 0
      if (mesh.visible) {
        const arr = mesh.instanceMatrix.array as Float32Array
        const w = (Math.PI * 2) / 150
        const cx = 20 + 330 * Math.sin(w * t)
        const cz = -60 + 210 * Math.sin(2 * w * t)
        let hx = 330 * w * Math.cos(w * t)
        let hz = 420 * w * Math.cos(2 * w * t)
        const hl = Math.hypot(hx, hz) || 1
        hx /= hl
        hz /= hl
        // drawn larger than life to read from afar, so they fade out before the camera gets close
        const near = Math.hypot(camera.position.x - cx, camera.position.y - 82, camera.position.z - cz)
        const k = 3.4 * day * ramp((near - 90) / 90)
        sim.birds.forEach((b, i) => {
          const side = b.side + Math.sin(t * 0.7 + b.phase) * 0.9
          const x = cx - hx * b.back - hz * side
          const z = cz - hz * b.back + hx * side
          const y = 82 + 6 * Math.sin(t * 0.21) + b.up + Math.sin(t * 0.9 + b.phase) * 0.6
          // flap, with the odd glide
          const glide = Math.sin(t * 0.37 + b.phase) > 0.55 ? 0.15 : 1
          const flap = Math.cos(t * 2 * Math.PI * 2.6 + b.phase) * glide
          writeMatrix(arr, i, x, y, z, hx, hz, k, k * (glide < 1 ? 0.35 : flap))
        })
        mesh.instanceMatrix.needsUpdate = true
      }
    }
  })

  return (
    <group>
      <instancedMesh ref={cars} args={[geo.car, mat.car, sim.cars.length]} castShadow frustumCulled={false} />
      <instancedMesh ref={carLights} args={[geo.carLights, mat.lights, sim.cars.length]} frustumCulled={false} />
      <instancedMesh
        ref={ambulances}
        args={[geo.ambulance, mat.ambulance, sim.ambulances.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh ref={reds} args={[geo.red, mat.red, sim.ambulances.length]} frustumCulled={false} />
      <instancedMesh ref={blues} args={[geo.blue, mat.blue, sim.ambulances.length]} frustumCulled={false} />
      <instancedMesh ref={bodies} args={[geo.body, mat.body, sim.people.length]} frustumCulled={false} />
      <instancedMesh ref={heads} args={[geo.head, mat.head, sim.people.length]} frustumCulled={false} />
      <instancedMesh ref={birds} args={[geo.bird, mat.bird, sim.birds.length]} frustumCulled={false} />
    </group>
  )
}
