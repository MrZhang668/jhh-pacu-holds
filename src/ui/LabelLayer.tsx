import { MODULES } from '../content/modules'
import type { ModuleKey } from '../data/campus'
import type { LabelSpec } from '../scene/labels'

interface Props {
  specs: LabelSpec[]
  els: Map<string, HTMLElement>
  visited: Set<ModuleKey>
  active: ModuleKey | null
  onHover: (building: string | null) => void
  onOpen: (key: ModuleKey) => void
}

/** DOM labels over the canvas; <LabelProjector> (inside the canvas) positions them every frame. */
export function LabelLayer({ specs, els, visited, active, onHover, onOpen }: Props) {
  return (
    <div className="label-layer">
      {specs.map((s) => (
        <div
          key={s.id}
          className={`label label-${s.kind}`}
          ref={(el) => {
            if (el) els.set(s.id, el)
            return () => {
              els.delete(s.id)
            }
          }}
        >
          {s.kind === 'module' && s.module ? (
            <ModuleLabel
              building={s.building}
              moduleKey={s.module}
              visited={visited.has(s.module)}
              active={active === s.module}
              onHover={onHover}
              onOpen={onOpen}
            />
          ) : s.kind === 'building' ? (
            <div className={`bname tier-${s.tier?.toLowerCase()}`} aria-hidden="true">
              {s.title}
            </div>
          ) : s.kind === 'event' ? (
            <div className="event-tag" aria-hidden="true">
              {s.title}
            </div>
          ) : (
            <div className="sname" aria-hidden="true">
              {s.title}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface ModuleLabelProps {
  building: string | undefined
  moduleKey: ModuleKey
  visited: boolean
  active: boolean
  onHover: (building: string | null) => void
  onOpen: (key: ModuleKey) => void
}

/** Numbered pill on a stem, pointing at the roof of the module's building. */
export function ModuleLabel({ building, moduleKey, visited, active, onHover, onOpen }: ModuleLabelProps) {
  const m = MODULES[moduleKey]
  const hover = (on: boolean) => onHover(on ? building ?? null : null)
  return (
    <button
      type="button"
      className={`module-label${active ? ' is-active' : ''}`}
      data-module={moduleKey}
      aria-label={`${m.n} ${m.label}: ${m.title}`}
      onClick={() => onOpen(moduleKey)}
      onMouseEnter={() => hover(true)}
      onMouseLeave={() => hover(false)}
      onFocus={() => hover(true)}
      onBlur={() => hover(false)}
    >
      <span className="teaser" aria-hidden="true">
        {m.teaser}
      </span>
      <span className="pill">
        <span className="n">{m.n}</span>
        {m.label}
        {visited && <span className="seen" title="Visited" />}
      </span>
      <span className="stem" aria-hidden="true" />
      <span className="dot" aria-hidden="true" />
    </button>
  )
}
