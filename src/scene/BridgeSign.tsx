import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Campus } from '../data/campus'
import { orientedBox } from './geometry'

const TEXT = 'THE JOHNS HOPKINS HOSPITAL'
const FONT = '600 60px "Source Serif 4 Variable", Georgia, serif'

/** Lettering on the dark band of the Hospital Bridge over Orleans St (see jhh-bridge.jpeg). */
export function BridgeSign({ campus }: { campus: Campus }) {
  const invalidate = useThree((s) => s.invalidate)

  const sign = useMemo(() => {
    const bridge = campus.buildings.find((b) => b.key === 'hospital-bridge')
    if (!bridge) return null
    // the walkway is the part with the longest footprint
    const reach = (p: (typeof bridge.parts)[number]) => {
      const box = orientedBox(p.p)
      return Math.max(box.hu, box.hv)
    }
    const part = bridge.parts.reduce((a, p) => (reach(p) > reach(a) ? p : a))
    const box = orientedBox(part.p)
    const b = box.hu >= box.hv ? box : { ...box, angle: box.angle + Math.PI / 2, hu: box.hv, hv: box.hu }

    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 80
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    const draw = () => {
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#efe9df'
      ctx.font = FONT
      ctx.letterSpacing = '10px'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(TEXT, canvas.width / 2, canvas.height / 2 + 3)
      texture.needsUpdate = true
    }
    draw()
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })

    const length = Math.min(46, b.hu * 2 - 4)
    const height = 1.7
    const y = part.h - 1.05
    // centre the lettering over Orleans St, where the bridge crosses it (as in the photo)
    const ux = Math.cos(b.angle)
    const uz = Math.sin(b.angle)
    const crossings: number[] = []
    for (const r of campus.roads) {
      if (r.n !== 'Orleans Street') continue
      for (let i = 1; i < r.p.length; i++) {
        // signed distances of the segment ends from the bridge axis; a sign change means a crossing
        const [ax, az] = r.p[i - 1]
        const [qx, qz] = r.p[i]
        const da = -(ax - b.cx) * uz + (az - b.cz) * ux
        const dq = -(qx - b.cx) * uz + (qz - b.cz) * ux
        if (da * dq > 0 || da === dq) continue
        const k = da / (da - dq)
        const t = (ax + (qx - ax) * k - b.cx) * ux + (az + (qz - az) * k - b.cz) * uz
        if (Math.abs(t) < b.hu) crossings.push(t)
      }
    }
    const half = b.hu - length / 2
    const along = crossings.length
      ? Math.max(-half, Math.min(half, crossings.reduce((a, c) => a + c, 0) / crossings.length))
      : 0
    const sides = [1, -1].map((s) => {
      // outward normal of the long side (the box's v axis)
      const nx = -uz * s
      const nz = ux * s
      const d = b.hv + 0.06
      const cx = b.cx + ux * along + nx * d
      const cz = b.cz + uz * along + nz * d
      return { position: [cx, y, cz] as const, rotationY: Math.atan2(nx, nz) }
    })
    return { length, height, sides, material, redraw: draw }
  }, [campus])

  useEffect(() => {
    if (!sign) return
    // redraw once the serif web font is ready
    void document.fonts.load(FONT).then(() => {
      sign.redraw()
      invalidate()
    })
  }, [sign, invalidate])

  if (!sign) return null
  return (
    <group>
      {sign.sides.map((s, i) => (
        <mesh key={i} position={s.position} rotation-y={s.rotationY} material={sign.material}>
          <planeGeometry args={[sign.length, sign.height]} />
        </mesh>
      ))}
    </group>
  )
}
