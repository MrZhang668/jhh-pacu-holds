import type { RefObject } from 'react'
import { MODULES } from '../content/modules'
import type { CampusBuilding } from '../data/campus'

/** Name tooltip that follows the pointer over a building (moved directly via the ref). */
export function HoverTip({ building, tipRef }: { building: CampusBuilding | null; tipRef: RefObject<HTMLDivElement | null> }) {
  const mod = building?.module ? MODULES[building.module] : null
  return (
    <div ref={tipRef} className={`hover-tip${building ? ' on' : ''}`} role="tooltip" aria-hidden={!building}>
      {building && (
        <>
          <b>{building.name}</b>
          {mod && (
            <span>
              {mod.n} · {mod.label} — click to open
            </span>
          )}
          {building.note && <span className="note">{building.note}</span>}
        </>
      )}
    </div>
  )
}
