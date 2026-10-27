import { useState, type RefObject } from 'react'
import { LayersIcon, NorthIcon, ResetIcon } from './icons'

interface Props {
  compass: RefObject<HTMLSpanElement | null>
  onNorth: () => void
  onReset: () => void
  showNames: boolean
  onShowNames: (on: boolean) => void
  showStreets: boolean
  onShowStreets: (on: boolean) => void
  plan: boolean
  onPlan: (on: boolean) => void
  ambient: boolean
  onAmbient: (on: boolean) => void
}

/** Bottom-right: map layers, compass (click for north up) and reset. */
export function MapControls(p: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div className="map-controls">
      {open && (
        <div id="map-layers" className="layers glass" role="group" aria-label="Map layers">
          <label>
            <input type="checkbox" checked={p.showNames} onChange={(e) => p.onShowNames(e.target.checked)} /> Building names
          </label>
          <label>
            <input type="checkbox" checked={p.showStreets} onChange={(e) => p.onShowStreets(e.target.checked)} /> Street names
          </label>
          <label>
            <input type="checkbox" checked={p.plan} onChange={(e) => p.onPlan(e.target.checked)} /> Plan view (north up)
          </label>
          <label>
            <input type="checkbox" checked={p.ambient} onChange={(e) => p.onAmbient(e.target.checked)} /> Traffic, people &amp; birds
          </label>
        </div>
      )}
      <button
        type="button"
        className="round glass"
        aria-label="Map layers"
        aria-expanded={open}
        aria-controls="map-layers"
        title="Map layers"
        onClick={() => setOpen(!open)}
      >
        <LayersIcon />
      </button>
      <button type="button" className="round glass" aria-label="Turn north up" title="North up" onClick={p.onNorth}>
        <span ref={p.compass} className="needle">
          <NorthIcon />
        </span>
      </button>
      <button type="button" className="round glass" aria-label="Reset view" title="Reset view" onClick={p.onReset}>
        <ResetIcon />
      </button>
    </div>
  )
}
