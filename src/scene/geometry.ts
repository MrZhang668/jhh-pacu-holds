import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Part, Pt, Roof } from '../data/campus'

/** Surface kinds, stored per vertex in the `aKind` attribute and read by the facade shader. */
export const KIND = { wall: 0, flatRoof: 1, pitched: 2, dome: 3, copper: 4 } as const

// Footprints are (x, z) with z pointing south. Shapes are drawn in the XY plane as (x, -z) and
// rotated -90° about X, which maps extrusion depth to +y and the shape back onto (x, z).
const toVec = ([x, z]: Pt) => new THREE.Vector2(x, -z)

/** A piece of a part: either a prism (caps are roofs, sides are walls) or a roof of one kind. */
type Piece = { g: THREE.BufferGeometry; kind: number | 'prism' }

function prism(part: Part, top: number): THREE.BufferGeometry | null {
  const bottom = part.b ?? 0
  if (top - bottom < 0.2) return null
  const shape = new THREE.Shape(part.p.map(toVec))
  for (const hole of part.o ?? []) shape.holes.push(new THREE.Path(hole.map(toVec)))
  const g = new THREE.ExtrudeGeometry(shape, { depth: top - bottom, bevelEnabled: false, curveSegments: 1 })
  g.rotateX(-Math.PI / 2)
  g.translate(0, bottom, 0)
  return g
}

/** Oriented box: centre, angle of the u axis, half-extents along u and v. */
export interface Box {
  cx: number
  cz: number
  angle: number
  hu: number
  hv: number
}

/** Minimum-area oriented bounding box, testing every edge direction of the ring. */
export function orientedBox(ring: Pt[]): Box {
  let best: Box & { area: number } = { area: Infinity, cx: 0, cz: 0, angle: 0, hu: 0, hv: 0 }
  for (let i = 0; i < ring.length; i++) {
    const [x1, z1] = ring[i]
    const [x2, z2] = ring[(i + 1) % ring.length]
    const angle = Math.atan2(z2 - z1, x2 - x1)
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
    for (const [x, z] of ring) {
      const u = x * c + z * s
      const v = -x * s + z * c
      minU = Math.min(minU, u); maxU = Math.max(maxU, u)
      minV = Math.min(minV, v); maxV = Math.max(maxV, v)
    }
    const area = (maxU - minU) * (maxV - minV)
    if (area < best.area) {
      const mu = (minU + maxU) / 2
      const mv = (minV + maxV) / 2
      best = { area, angle, cx: mu * c - mv * s, cz: mu * s + mv * c, hu: (maxU - minU) / 2, hv: (maxV - minV) / 2 }
    }
  }
  return best
}

/** Same box, re-expressed with its u axis turned by quarter turns (u/v swap on odd turns). */
function turn(box: Box, quarters: number): Box {
  const odd = quarters % 2 === 1
  return { ...box, angle: box.angle + (quarters * Math.PI) / 2, hu: odd ? box.hv : box.hu, hv: odd ? box.hu : box.hv }
}

function defaultRoofHeight(roof: Roof, box: Box): number {
  const short = Math.min(box.hu, box.hv)
  const long = Math.max(box.hu, box.hv)
  switch (roof.s) {
    case 'dome':
      return short
    case 'cone':
      return long * 1.2
    case 'skillion':
      return Math.min(short * 0.3, 3)
    default:
      return short * 0.6
  }
}

/** Builds a geometry from triangles given in box-local (u, y, v) coordinates. */
function fromBoxTriangles(box: Box, uyv: number[]): THREE.BufferGeometry {
  const c = Math.cos(box.angle)
  const s = Math.sin(box.angle)
  const pos = new Float32Array(uyv.length)
  for (let i = 0; i < uyv.length; i += 3) {
    const u = uyv[i]
    const v = uyv[i + 2]
    pos[i] = box.cx + u * c - v * s
    pos[i + 1] = uyv[i + 1]
    pos[i + 2] = box.cz + u * s + v * c
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  return g
}

type V3 = [number, number, number]
const tris = (...faces: V3[][]) => faces.flatMap((f) => f.flat())

function roofPiece(roof: Roof, box: Box, base: number, rh: number): Piece | null {
  const top = base + rh
  switch (roof.s) {
    case 'dome': {
      const g = new THREE.SphereGeometry(1, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2)
      g.scale(box.hu, rh, box.hv)
      g.rotateY(-box.angle)
      g.translate(box.cx, base, box.cz)
      return { g, kind: KIND.dome }
    }
    case 'cone': {
      const radius = (box.hu + box.hv) / 2
      const g = new THREE.ConeGeometry(radius, rh, 16)
      g.translate(box.cx, base + rh / 2, box.cz)
      // slender cones are spires (copper, like the one on the Billings dome); stout ones are slate turret roofs
      return { g, kind: radius < 3.2 ? KIND.copper : KIND.pitched }
    }
    case 'skillion': {
      // Wedge sloping down towards +v. Pick the frame whose +v best matches roof:direction
      // (compass degrees the slope faces); without it, slope across the short side.
      let b = box.hv <= box.hu ? box : turn(box, 1)
      if (roof.d !== undefined) {
        const rad = (roof.d * Math.PI) / 180
        const down: Pt = [Math.sin(rad), -Math.cos(rad)]
        const score = (f: Box) => -Math.sin(f.angle) * down[0] + Math.cos(f.angle) * down[1]
        b = [0, 1, 2, 3].map((q) => turn(box, q)).reduce((a, c) => (score(c) > score(a) ? c : a))
      }
      const { hu: L, hv: W } = b
      const H1: V3 = [-L, top, -W], H2: V3 = [L, top, -W]
      const L1: V3 = [-L, base, W], L2: V3 = [L, base, W]
      const B1: V3 = [-L, base, -W], B2: V3 = [L, base, -W]
      const g = fromBoxTriangles(b, tris([H1, L2, H2], [H1, L1, L2], [B1, H2, B2], [B1, H1, H2], [B1, L1, H1], [B2, H2, L2]))
      return { g, kind: KIND.pitched }
    }
    case 'gabled':
    case 'hipped':
    case 'side_hipped':
    case 'half-hipped':
    case 'pyramidal': {
      // ridge along u: the long axis, or the short one for roof:orientation=across
      const longIsU = box.hu >= box.hv
      const b = longIsU !== (roof.o === 'across') ? box : turn(box, 1)
      const { hu: L, hv: W } = b
      const A: V3 = [-L, base, -W], B: V3 = [L, base, -W], C: V3 = [L, base, W], D: V3 = [-L, base, W]
      const inset = roof.s === 'gabled' ? 0 : Math.min(W, L)
      const R1: V3 = [-L + inset, top, 0], R2: V3 = [L - inset, top, 0]
      const g = fromBoxTriangles(b, tris([A, R2, B], [A, R1, R2], [D, C, R2], [D, R2, R1], [A, D, R1], [B, R2, C]))
      return { g, kind: KIND.pitched }
    }
    default:
      return null
  }
}

function partPieces(part: Part): Piece[] {
  if (!part.r) {
    const g = prism(part, part.h)
    return g ? [{ g, kind: 'prism' }] : []
  }
  const box = orientedBox(part.p)
  const bottom = part.b ?? 0
  const rh = Math.min(part.r.h ?? defaultRoofHeight(part.r, box), part.h - bottom)
  const wallTop = part.h - rh
  const roof = roofPiece(part.r, box, Math.max(wallTop, bottom), rh)
  const walls = prism(part, roof ? wallTop : part.h)
  const pieces: Piece[] = walls ? [{ g: walls, kind: 'prism' }] : []
  if (roof) pieces.push(roof)
  return pieces
}

/** Writes the per-vertex surface kind. Prisms: ExtrudeGeometry group 0 = caps (roof), 1 = sides (walls). */
function tagKinds(g: THREE.BufferGeometry, kind: Piece['kind']) {
  const kinds = new Float32Array(g.attributes.position.count)
  if (kind === 'prism') {
    for (const grp of g.groups) kinds.fill(grp.materialIndex === 0 ? KIND.flatRoof : KIND.wall, grp.start, grp.start + grp.count)
  } else {
    kinds.fill(kind)
  }
  g.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1))
}

/** Walls + roofs of many parts merged into one non-indexed geometry with an `aKind` attribute. */
export function mergeParts(parts: Part[]): THREE.BufferGeometry {
  const pieces: THREE.BufferGeometry[] = []
  for (const part of parts) {
    try {
      for (const piece of partPieces(part)) {
        const g = piece.g.index ? piece.g.toNonIndexed() : piece.g
        tagKinds(g, piece.kind)
        g.deleteAttribute('uv')
        g.deleteAttribute('normal')
        g.clearGroups()
        pieces.push(g)
      }
    } catch {
      // a broken footprint should not take down the whole scene
    }
  }
  const merged = mergeGeometries(pieces) ?? new THREE.BufferGeometry()
  merged.computeVertexNormals()
  merged.computeBoundingSphere()
  return merged
}

/**
 * The walls of a building between heights y0 and y1 (no caps), e.g. one storey wrapped around all
 * parts that reach it. Parts topping out up to 1.5 m short of y1 still count, clipped to their top.
 */
export function bandGeometry(parts: Part[], y0: number, y1: number): THREE.BufferGeometry | null {
  const pieces: THREE.BufferGeometry[] = []
  for (const part of parts) {
    if ((part.b ?? 0) > y0 + 0.01 || part.h < y1 - 1.5) continue
    const g = prism({ ...part, b: y0 }, Math.min(y1, part.h))
    const sides = g?.groups.find((grp) => grp.materialIndex === 1)
    if (!g || !sides) continue
    const pos = (g.attributes.position.array as Float32Array).slice(sides.start * 3, (sides.start + sides.count) * 3)
    const piece = new THREE.BufferGeometry()
    piece.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    pieces.push(piece)
  }
  if (!pieces.length) return null
  const merged = mergeGeometries(pieces)
  merged.computeVertexNormals()
  return merged
}

/** Flat ribbons along polylines (roads, paths), with round joints. Triangles face up. */
export function ribbonGeometry(lines: { w: number; p: Pt[] }[], y: number): THREE.BufferGeometry {
  const pos: number[] = []
  const tri = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number) =>
    pushUp(pos, y, ax, az, bx, bz, cx, cz)
  const JOINT = 8
  for (const { w, p } of lines) {
    const r = w / 2
    for (let i = 0; i < p.length - 1; i++) {
      const [x1, z1] = p[i]
      const [x2, z2] = p[i + 1]
      const len = Math.hypot(x2 - x1, z2 - z1) || 1
      const nx = (-(z2 - z1) / len) * r
      const nz = ((x2 - x1) / len) * r
      tri(x1 + nx, z1 + nz, x2 - nx, z2 - nz, x2 + nx, z2 + nz)
      tri(x1 + nx, z1 + nz, x1 - nx, z1 - nz, x2 - nx, z2 - nz)
    }
    for (const [x, z] of p) {
      for (let k = 0; k < JOINT; k++) {
        const a1 = (k / JOINT) * Math.PI * 2
        const a2 = ((k + 1) / JOINT) * Math.PI * 2
        tri(x, z, x + Math.cos(a2) * r, z + Math.sin(a2) * r, x + Math.cos(a1) * r, z + Math.sin(a1) * r)
      }
    }
  }
  return flatGeometry(pos)
}

/** Filled polygons lying flat at height y (lawns, plazas). */
export function polygonGeometry(polys: Pt[][], y: number): THREE.BufferGeometry {
  const pos: number[] = []
  for (const ring of polys) {
    const pts = ring.map(([x, z]) => new THREE.Vector2(x, z))
    for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(pts, [])) {
      pushUp(pos, y, pts[a].x, pts[a].y, pts[b].x, pts[b].y, pts[c].x, pts[c].y)
    }
  }
  return flatGeometry(pos)
}

/** Appends a horizontal triangle wound counter-clockwise as seen from above, so its front faces +y. */
function pushUp(pos: number[], y: number, ax: number, az: number, bx: number, bz: number, cx: number, cz: number) {
  // with z pointing south, an upward-facing triangle has a negative x-z cross product
  if ((bx - ax) * (cz - az) - (bz - az) * (cx - ax) > 0) pos.push(ax, y, az, cx, y, cz, bx, y, bz)
  else pos.push(ax, y, az, bx, y, bz, cx, y, cz)
}

function flatGeometry(pos: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  const normals = new Float32Array(pos.length)
  for (let i = 1; i < normals.length; i += 3) normals[i] = 1
  g.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  g.computeBoundingSphere()
  return g
}
