import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FLOOR_HEIGHT, holdIntensityAt, PACU_FLOORS } from '../content/holds'
import type { Campus } from '../data/campus'
import { timeStore } from '../state/time'
import { bandGeometry } from './geometry'

// 3D heat ramp from the spec (§7.1): light gold → logo gold → orange
const RAMP = ['#ffe27a', '#ffcf01', '#f08a24'].map((c) => new THREE.Color(c))

function rampColor(k: number, out: THREE.Color) {
  const x = Math.min(1, Math.max(0, k)) * (RAMP.length - 1)
  const i = Math.min(Math.floor(x), RAMP.length - 2)
  return out.lerpColors(RAMP[i], RAMP[i + 1], x - i)
}

/**
 * The PACU floors of Zayed (3, 5) and Weinberg (3) glow with the relative hold intensity of the
 * current hour. The band is drawn over the façade (polygon offset), so other buildings still hide it.
 */
export function PacuBands({ campus }: { campus: Campus }) {
  const bands = useMemo(
    () =>
      PACU_FLOORS.flatMap((f) => {
        const building = campus.buildings.find((b) => b.key === f.building)
        const h = FLOOR_HEIGHT[f.building]
        const geometry = building && bandGeometry(building.parts, (f.floor - 1) * h + 0.2, f.floor * h - 0.2)
        return geometry ? [{ key: f.label, geometry }] : []
      }),
    [campus],
  )
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
        toneMapped: false,
      }),
    [],
  )
  const last = useRef(Number.NaN)

  useFrame(() => {
    const hours = timeStore.get()
    if (hours === last.current) return
    last.current = hours
    const k = holdIntensityAt(hours)
    rampColor(k, material.color)
    material.opacity = 0.18 + 0.62 * k
    material.visible = k > 0.03
  })

  return (
    <group>
      {bands.map((b) => (
        <mesh key={b.key} geometry={b.geometry} material={material} renderOrder={2} />
      ))}
    </group>
  )
}
