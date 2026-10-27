import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { timeStore } from '../state/time'
import type { LabelSpec } from './labels'

const v = new THREE.Vector3()
const GAP = 4

/**
 * Moves the DOM labels of <LabelLayer> to their projected screen positions each frame and hides
 * labels that would overlap a higher-priority one. Sizes are measured once per label (reads
 * before writes, so the frame never forces a layout).
 */
export function LabelProjector({ specs, els }: { specs: LabelSpec[]; els: Map<string, HTMLElement> }) {
  const byPriority = useMemo(() => [...specs].sort((a, b) => b.priority - a.priority), [specs])
  const sizes = useRef(new Map<string, [number, number]>())
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    // the canvas renders on demand, so ask for a frame to place new labels
    sizes.current.clear()
    invalidate()
    // web fonts change label widths once they arrive
    void document.fonts.ready.then(() => {
      sizes.current.clear()
      invalidate()
    })
  }, [specs, invalidate])

  useFrame(({ camera, size }) => {
    for (const s of byPriority) {
      const el = els.get(s.id)
      if (el && !sizes.current.has(s.id)) sizes.current.set(s.id, [el.offsetWidth, el.offsetHeight])
    }
    const placed: [number, number, number, number][] = []
    const hours = timeStore.get()
    for (const s of byPriority) {
      const el = els.get(s.id)
      const wh = sizes.current.get(s.id)
      if (!el || !wh) continue
      if (s.window && (hours < s.window[0] || hours > s.window[1])) {
        el.style.opacity = '0'
        el.style.visibility = 'hidden'
        continue
      }
      el.style.visibility = ''
      const [w, h] = wh
      v.set(s.pos[0], s.pos[1], s.pos[2]).project(camera)
      const x = ((v.x + 1) / 2) * size.width
      const y = ((1 - v.y) / 2) * size.height
      const left = x - w / 2
      const top = s.kind === 'street' ? y - h / 2 : y - h
      const onScreen = v.z < 1 && left < size.width && left + w > 0 && top < size.height && top + h > 0
      const free = !placed.some(([l, t, r, b]) => left < r + GAP && left + w > l - GAP && top < b + GAP && top + h > t - GAP)
      const visible = onScreen && free
      if (visible) placed.push([left, top, left + w, top + h])
      el.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`
      el.style.opacity = visible ? '1' : '0'
      // hidden labels must not catch clicks meant for the map
      el.style.pointerEvents = visible ? '' : 'none'
    }
  })

  return null
}
