import { SHIFT_CHANGE } from '../content/holds'
import { MODULE_ORDER, MODULES } from '../content/modules'
import type { Campus, ModuleKey, Road } from '../data/campus'

/** A label drawn in the DOM overlay and positioned every frame by <LabelProjector>. */
export interface LabelSpec {
  id: string
  kind: 'module' | 'building' | 'street' | 'event'
  /** higher wins when labels overlap */
  priority: number
  /** world position of the anchor (bottom-centre; centre for streets) */
  pos: [number, number, number]
  title: string
  /** Chinese title, where the label is translated (building and street names stay in English) */
  titleZh?: string
  module?: ModuleKey
  building?: string
  tier?: 'A' | 'B'
  /** only shown while the time of day is inside this window (hours) */
  window?: [number, number]
}

const STREETS = [
  'North Broadway', 'Orleans Street', 'North Wolfe Street', 'East Monument Street', 'East Madison Street',
  'North Caroline Street', 'North Washington Street', 'Rutland Avenue', 'McElderry Street', 'Jefferson Street',
  'East Fayette Street',
]

const short = (name: string) =>
  name.replace(/^North /, 'N. ').replace(/^East /, 'E. ').replace(/ Street$/, ' St').replace(/ Avenue$/, ' Ave')

/** One anchor per street: the midpoint of its longest way inside the campus core. */
function streetAnchors(roads: Road[]) {
  return STREETS.flatMap((name) => {
    let best: { len: number; x: number; z: number } | null = null
    for (const r of roads) {
      if (r.n !== name) continue
      const seg = r.p.slice(1).map((p, i) => Math.hypot(p[0] - r.p[i][0], p[1] - r.p[i][1]))
      const len = seg.reduce((a, b) => a + b, 0)
      let rest = len / 2
      let i = 0
      while (i < seg.length - 1 && rest > seg[i]) rest -= seg[i++]
      const t = seg[i] ? rest / seg[i] : 0
      const x = r.p[i][0] + (r.p[i + 1][0] - r.p[i][0]) * t
      const z = r.p[i][1] + (r.p[i + 1][1] - r.p[i][1]) * t
      if (Math.abs(x) > 420 || z < -520 || z > 380) continue
      if (!best || len > best.len) best = { len, x, z }
    }
    return best ? [{ name: short(name), x: best.x, z: best.z }] : []
  })
}

// "Shift change" tags on the inpatient floors (Zayed 9–11, Weinberg 4CD) during the evening hand-off,
// kept well below the roof so they never collide with the module pill on top
const SHIFT_TAGS = [
  { building: 'zayed', y: 24 },
  { building: 'weinberg', y: 6 },
]

/** Labels in paint and tab order: low priority first, module pills last in tour order. */
export function buildLabelSpecs(campus: Campus, showNames: boolean, showStreets: boolean): LabelSpec[] {
  const specs: LabelSpec[] = []
  if (showStreets) {
    for (const s of streetAnchors(campus.roads)) {
      specs.push({ id: `street:${s.name}`, kind: 'street', priority: 0, pos: [s.x, 0.5, s.z], title: s.name })
    }
  }
  if (showNames) {
    for (const b of campus.buildings) {
      if (b.module) continue
      specs.push({
        id: `building:${b.key}`,
        kind: 'building',
        priority: b.tier === 'A' ? 2 : 1,
        pos: [b.anchor[0], b.top + 4, b.anchor[1]],
        title: b.name,
        tier: b.tier,
        building: b.key,
      })
    }
  }
  for (const tag of SHIFT_TAGS) {
    const b = campus.buildings.find((x) => x.key === tag.building)
    if (b) {
      specs.push({
        id: `event:shift:${b.key}`,
        kind: 'event',
        priority: 4,
        pos: [b.anchor[0], tag.y, b.anchor[1]],
        title: 'Shift change · 7 PM',
        titleZh: '交接班 · 19:00',
        building: b.key,
        window: SHIFT_CHANGE,
      })
    }
  }
  for (const key of MODULE_ORDER) {
    const b = campus.buildings.find((x) => x.key === MODULES[key].building)
    if (b) {
      specs.push({
        id: `module:${key}`,
        kind: 'module',
        // module pills always win: they are the way into the content
        priority: 5,
        pos: [b.anchor[0], b.top + 2, b.anchor[1]],
        title: MODULES[key].label,
        module: key,
        building: b.key,
      })
    }
  }
  return specs
}
