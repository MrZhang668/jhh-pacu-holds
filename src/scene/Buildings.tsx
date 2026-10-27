import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Campus, ModuleKey } from '../data/campus'
import { BridgeSign } from './BridgeSign'
import { createFacadeMaterial, STYLES, styleFor } from './facade'
import { mergeParts } from './geometry'

const HOVER = new THREE.Color('#68ace5')

interface Props {
  campus: Campus
  hovered: string | null
  onHover: Dispatch<SetStateAction<string | null>>
  /** pointer position over a building, for the name tooltip */
  onPointer: (x: number, y: number) => void
  onOpenModule: (key: ModuleKey) => void
}

export function Buildings({ campus, hovered, onHover, onPointer, onOpenModule }: Props) {
  const invalidate = useThree((s) => s.invalidate)
  const context = useMemo(
    () => ({ geometry: mergeParts(campus.context), material: createFacadeMaterial(STYLES.rowhouse) }),
    [campus],
  )
  const jhh = useMemo(
    () =>
      campus.buildings.map((b) => {
        const material = createFacadeMaterial(styleFor(b.key))
        material.emissive.copy(HOVER)
        material.emissiveIntensity = 0
        return { b, geometry: mergeParts(b.parts), material }
      }),
    [campus],
  )

  // materials are shared objects, so highlight by mutating them and asking for a frame
  useEffect(() => {
    for (const { b, material } of jhh) material.emissiveIntensity = b.key === hovered ? 0.35 : 0
    document.body.style.cursor = jhh.some(({ b }) => b.key === hovered && b.module) ? 'pointer' : ''
    invalidate()
  }, [hovered, jhh, invalidate])

  return (
    <group>
      <mesh geometry={context.geometry} material={context.material} castShadow receiveShadow />
      {jhh.map(({ b, geometry, material }) => (
        <mesh
          key={b.key}
          geometry={geometry}
          material={material}
          castShadow
          receiveShadow
          onPointerOver={(e) => {
            e.stopPropagation()
            onHover(b.key)
          }}
          onPointerMove={(e) => onPointer(e.nativeEvent.clientX, e.nativeEvent.clientY)}
          onPointerOut={() => onHover((cur) => (cur === b.key ? null : cur))}
          onClick={(e) => {
            if (!b.module) return
            e.stopPropagation()
            onOpenModule(b.module)
          }}
        />
      ))}
      <BridgeSign campus={campus} />
    </group>
  )
}
