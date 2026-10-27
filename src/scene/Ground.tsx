import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Campus, Tree } from '../data/campus'
import { polygonGeometry, ribbonGeometry } from './geometry'
import { swaying } from './wind'

const MAJOR = new Set(['primary', 'secondary', 'tertiary', 'primary_link', 'secondary_link'])
const MINOR = new Set(['residential', 'unclassified', 'living_street'])
const PATHS = new Set(['footway', 'path', 'cycleway', 'steps', 'pedestrian'])

export function Ground({ campus }: { campus: Campus }) {
  const geo = useMemo(() => {
    const pick = (kinds: Set<string>) => campus.roads.filter((r) => kinds.has(r.k))
    // small height steps keep the overlapping layers from z-fighting
    return {
      greens: polygonGeometry(campus.greens.map((g) => g.p), 0.05),
      service: ribbonGeometry(pick(new Set(['service'])), 0.12),
      minor: ribbonGeometry(pick(MINOR), 0.16),
      major: ribbonGeometry(pick(MAJOR), 0.2),
      paths: ribbonGeometry(pick(PATHS), 0.24),
    }
  }, [campus])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[7000, 7000]} />
        <meshStandardMaterial color="#dfdfd8" roughness={1} />
      </mesh>
      <mesh geometry={geo.greens} receiveShadow>
        <meshStandardMaterial color="#a9b79c" roughness={1} />
      </mesh>
      <mesh geometry={geo.service} receiveShadow>
        <meshStandardMaterial color="#d0d1cd" roughness={1} />
      </mesh>
      <mesh geometry={geo.minor} receiveShadow>
        <meshStandardMaterial color="#c9cbc8" roughness={1} />
      </mesh>
      <mesh geometry={geo.major} receiveShadow>
        <meshStandardMaterial color="#c2c5c5" roughness={1} />
      </mesh>
      <mesh geometry={geo.paths} receiveShadow>
        <meshStandardMaterial color="#eae7df" roughness={1} />
      </mesh>
      <Trees trees={campus.trees} />
    </group>
  )
}

// Spec greens #7F9C7B / #56715F with small variations.
const ROUND = ['#87a383', '#7f9c7b', '#94ac8c', '#728f70']
const CONIFER = ['#5f7a66', '#56715f', '#67826b']

type Place = (t: Tree, position: THREE.Vector3, scale: THREE.Vector3) => void
const placeCrown: Place = (t, p, s) => {
  p.set(t[0], 5.0 * t[2], t[1])
  s.set(3.0 * t[2], 2.6 * t[2], 3.0 * t[2])
}
const placeCone: Place = (t, p, s) => {
  p.set(t[0], 5.0 * t[2], t[1])
  s.set(2.3 * t[2], 7.2 * t[2], 2.3 * t[2])
}
const placeTrunk: Place = (t, p, s) => {
  p.set(t[0], 1.3 * t[2], t[1])
  s.set(t[2], 2.6 * t[2], t[2])
}

/** Low-poly trees: icosahedron crowns, cone conifers and shared trunks, all instanced. */
function Trees({ trees }: { trees: Tree[] }) {
  const round = useMemo(() => trees.filter((t) => t[3] === 0), [trees])
  const conifer = useMemo(() => trees.filter((t) => t[3] === 1), [trees])
  const crowns = useInstances(round, placeCrown, ROUND)
  const cones = useInstances(conifer, placeCone, CONIFER)
  const trunks = useInstances(trees, placeTrunk)
  // crowns and cones sway while ambient motion runs; trunks stay still
  const crownMat = useMemo(() => swaying(new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 }), 0.05), [])
  const coneMat = useMemo(() => swaying(new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 }), 0.035), [])

  return (
    <group>
      <instancedMesh ref={crowns} args={[undefined, crownMat, round.length]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
      </instancedMesh>
      <instancedMesh ref={cones} args={[undefined, coneMat, conifer.length]} castShadow>
        <coneGeometry args={[1, 1, 7]} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 1, 5]} />
        <meshStandardMaterial color="#8a7966" flatShading roughness={1} />
      </instancedMesh>
    </group>
  )
}

const hash = (x: number, z: number) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453
  return s - Math.floor(s)
}

function useInstances(items: Tree[], place: Place, palette?: string[]) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const p = new THREE.Vector3()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    const c = new THREE.Color()
    items.forEach((t, i) => {
      place(t, p, s)
      const h = hash(t[0], t[1])
      q.setFromAxisAngle(up, h * Math.PI * 2)
      mesh.setMatrixAt(i, m.compose(p, q, s))
      if (palette) mesh.setColorAt(i, c.set(palette[Math.floor(h * palette.length)]))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items, place, palette])
  return ref
}
