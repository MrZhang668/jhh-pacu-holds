import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FLOOR_HEIGHT, holdIntensityAt, inShiftChange, PACU_FLOORS, WARD_FLOORS } from '../content/holds'
import type { Campus, Part } from '../data/campus'
import { nightness } from '../state/sun'
import { timeStore } from '../state/time'

// PACU holds acted out on Zayed and Weinberg. Gold beads ring each PACU floor: the share that is lit
// is the hold intensity of the hour (relative to the 7 PM peak, never a patient count). Blue dots
// rise from the PACU to the inpatient floors: a trickle that thins as holds build and stops through
// the 7 PM hand-off, and when holds ease the beads themselves leave upward. Motion runs with the
// ambient life, whose ticker keeps the on-demand canvas rendering; otherwise the beads simply show
// the hour.

const SPACING = 8 // m between bead slots along the façade
const OFFSET = 2.2 // m out from the wall
const BEAD = 1.9 // bead radius (m): about half a storey, so the ring reads from the opening view
const DOT = 1.05 // transfer dot radius (m)
const STREAM = 2.4 // transfer dots per second per PACU when nothing is held
const RISE_SPEED = 7 // m/s
const POOL = 160

// the band's heat ramp (light gold → logo gold → orange); the hand-off is orange
const RAMP = ['#ffe27a', '#ffcf01', '#f08a24'].map((c) => new THREE.Color(c))
const ORANGE = new THREE.Color('#f08a24')
const BLUE = new THREE.Color('#4aa3f0')

function rampColor(k: number, out: THREE.Color) {
  const x = Math.min(1, Math.max(0, k)) * (RAMP.length - 1)
  const i = Math.min(Math.floor(x), RAMP.length - 2)
  return out.lerpColors(RAMP[i], RAMP[i + 1], x - i)
}

const easeOutBack = (v: number) => 1 + 2.70158 * (v - 1) ** 3 + 1.70158 * (v - 1) ** 2
const easeInOut = (u: number) => u * u * (3 - 2 * u)

function inside(ring: Part['p'], x: number, z: number) {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i]
    const [xj, zj] = ring[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit
  }
  return hit
}

/** Whether (x, y, z) is inside any building, so beads never hide in a neighbour's wall. */
function solid(campus: Campus, x: number, y: number, z: number) {
  for (const b of campus.buildings) {
    for (const part of b.parts) {
      if (y < (part.b ?? 0) || y > part.h) continue
      if (inside(part.p, x, z) && !part.o?.some((hole) => inside(hole, x, z))) return true
    }
  }
  return false
}

interface Slot {
  x: number
  z: number
  /** lit once the hold intensity passes this; golden-ratio steps spread the lit beads evenly */
  t: number
  /** on a wall that reaches the wards, so a bead leaving from here can rise along it */
  source: boolean
}

/** Bead slots every SPACING metres around the walls of one floor, just outside the façade. */
function floorSlots(campus: Campus, key: string, y0: number, y1: number, wardTop: number): Slot[] {
  const building = campus.buildings.find((b) => b.key === key)
  if (!building) return []
  const y = (y0 + y1) / 2
  const slots: Slot[] = []
  for (const part of building.parts) {
    // the same parts that carry the glowing band
    if ((part.b ?? 0) > y0 + 0.01 || part.h < y1 - 1.5) continue
    const ring = part.p
    let walked = 0
    let next = SPACING / 2
    for (let i = 0; i < ring.length; i++) {
      const [ax, az] = ring[i]
      const [bx, bz] = ring[(i + 1) % ring.length]
      const len = Math.hypot(bx - ax, bz - az)
      if (len < 1e-6) continue
      let nx = (bz - az) / len
      let nz = -(bx - ax) / len
      if (inside(ring, (ax + bx) / 2 + nx * 0.5, (az + bz) / 2 + nz * 0.5)) {
        nx = -nx
        nz = -nz
      }
      for (; next < walked + len; next += SPACING) {
        const s = (next - walked) / len
        const x = ax + (bx - ax) * s + nx * OFFSET
        const z = az + (bz - az) * s + nz * OFFSET
        if (!solid(campus, x, y, z)) slots.push({ x, z, t: 0, source: part.h >= wardTop })
      }
      walked += len
    }
  }
  slots.forEach((s, i) => (s.t = ((i + 1) * 0.6180339887) % 1))
  return slots
}

/** Uniform scale at a point (no rotation: beads and dots are spheres). */
function place(arr: Float32Array, i: number, x: number, y: number, z: number, k: number) {
  const o = i * 16
  arr.fill(0, o, o + 16)
  arr[o] = k
  arr[o + 5] = k
  arr[o + 10] = k
  arr[o + 12] = x
  arr[o + 13] = y
  arr[o + 14] = z
  arr[o + 15] = 1
}

export function HoldFlow({ campus, running }: { campus: Campus; running: boolean }) {
  const floors = useMemo(
    () =>
      PACU_FLOORS.map((f) => {
        const h = FLOOR_HEIGHT[f.building]
        const [w0, w1] = WARD_FLOORS[f.building]
        const ward: [number, number] = [(w0 - 0.5) * h, (w1 - 0.5) * h]
        const slots = floorSlots(campus, f.building, (f.floor - 1) * h, f.floor * h, ward[1] + 2)
        return {
          y: (f.floor - 0.5) * h,
          ward,
          slots,
          sources: slots.flatMap((s, i) => (s.source ? [i] : [])),
          lit: new Float32Array(slots.length),
          due: 0,
        }
      }),
    [campus],
  )
  const beadCount = floors.reduce((n, f) => n + f.slots.length, 0)

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), [])
  const mat = useMemo(
    () => ({
      bead: new THREE.MeshBasicMaterial({ toneMapped: false }),
      dot: new THREE.MeshBasicMaterial({ toneMapped: false }),
    }),
    [],
  )
  useEffect(
    () => () => {
      geometry.dispose()
      mat.bead.dispose()
      mat.dot.dispose()
    },
    [geometry, mat],
  )

  const beads = useRef<THREE.InstancedMesh>(null)
  const dots = useRef<THREE.InstancedMesh>(null)
  // transfer dots and departing beads share one pool
  const pool = useMemo(
    () => ({
      x: new Float32Array(POOL),
      z: new Float32Array(POOL),
      y0: new Float32Array(POOL),
      y1: new Float32Array(POOL),
      age: new Float32Array(POOL),
      life: new Float32Array(POOL),
      size: new Float32Array(POOL),
      next: 0,
    }),
    [],
  )

  useLayoutEffect(() => {
    beads.current?.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const mesh = dots.current
    if (!mesh) return
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const arr = mesh.instanceMatrix.array as Float32Array
    for (let i = 0; i < POOL; i++) {
      place(arr, i, 0, 0, 0, 0)
      mesh.setColorAt(i, BLUE)
    }
  }, [beadCount])

  const clock = useRef(0)
  const last = useRef(Number.NaN)
  const beadColor = useMemo(() => new THREE.Color(), [])
  const dotColor = useMemo(() => new THREE.Color(), [])

  useFrame((_, delta) => {
    const dt = running ? Math.min(delta, 0.1) : 0
    clock.current += dt
    const hours = timeStore.get()
    if (!running && hours === last.current) return
    last.current = hours
    const t = clock.current
    const k = holdIntensityAt(hours)
    const shift = inShiftChange(hours)
    const glow = 1 + 0.7 * nightness(hours)
    // through the hand-off the beads turn orange and throb in step
    const pulse = shift ? 0.5 + 0.5 * Math.sin(t * 9) : 0
    if (shift) beadColor.copy(ORANGE).multiplyScalar(glow * (0.85 + 0.45 * pulse))
    else rampColor(k, beadColor).multiplyScalar(glow)
    mat.bead.color.copy(beadColor)
    dotColor.copy(BLUE).multiplyScalar(glow)

    const mesh = dots.current
    const launch = (x: number, y: number, z: number, top: number, size: number, color: THREE.Color) => {
      if (!mesh) return
      const i = pool.next
      pool.next = (i + 1) % POOL
      pool.x[i] = x
      pool.z[i] = z
      pool.y0[i] = y
      pool.y1[i] = top
      pool.age[i] = 0
      pool.life[i] = Math.min(5, Math.max(2.5, (top - y) / RISE_SPEED))
      pool.size[i] = size
      mesh.setColorAt(i, color)
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    const wardHeight = (f: (typeof floors)[number]) => f.ward[0] + Math.random() * (f.ward[1] - f.ward[0])

    if (beads.current) {
      const arr = beads.current.instanceMatrix.array as Float32Array
      let i = 0
      for (const f of floors) {
        f.slots.forEach((s, j) => {
          let v = f.lit[j]
          if (s.t < k) v = running ? Math.min(1, v + dt / 0.4) : 1
          else if (v > 0) {
            // no longer held: the patient leaves for the wards (beads off the tall walls rise, others just go)
            if (running && v > 0.5 && s.source) launch(s.x, f.y, s.z, wardHeight(f), BEAD * 0.8, beadColor)
            v = 0
          }
          f.lit[j] = v
          const beat = shift ? 1 + 0.22 * pulse : 1 + 0.05 * Math.sin(t * 2.2 + j)
          place(arr, i++, s.x, f.y, s.z, BEAD * easeOutBack(v) * beat)
        })
        if (running && f.sources.length) {
          f.due += dt * STREAM * (1 - k) * (shift ? 0 : 1)
          for (; f.due >= 1; f.due--) {
            const s = f.slots[f.sources[Math.floor(Math.random() * f.sources.length)]]
            launch(s.x, f.y, s.z, wardHeight(f), DOT, dotColor)
          }
        }
      }
      beads.current.instanceMatrix.needsUpdate = true
    }

    if (mesh) {
      const arr = mesh.instanceMatrix.array as Float32Array
      for (let i = 0; i < POOL; i++) {
        if (pool.life[i] === 0) continue
        pool.age[i] += dt
        const u = pool.age[i] / pool.life[i]
        if (u >= 1) {
          pool.life[i] = 0
          place(arr, i, 0, 0, 0, 0)
          continue
        }
        // fade in off the façade, fade out on arrival
        const size = pool.size[i] * Math.min(1, u / 0.12) * Math.min(1, (1 - u) / 0.3)
        place(arr, i, pool.x[i], pool.y0[i] + (pool.y1[i] - pool.y0[i]) * easeInOut(u), pool.z[i], size)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
  })

  if (!beadCount) return null
  return (
    <group>
      <instancedMesh key={beadCount} ref={beads} args={[geometry, mat.bead, beadCount]} frustumCulled={false} />
      <instancedMesh ref={dots} args={[geometry, mat.dot, POOL]} frustumCulled={false} />
    </group>
  )
}
