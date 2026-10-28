import { useState, type RefObject } from 'react'
import { useT } from '../state/lang'
import { LayersIcon, NorthIcon, ResetIcon } from './icons'
import { LangToggle } from './LangToggle'

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

/** Bottom-right: map layers, compass (click for north up), reset and the language switch. */
export function MapControls(p: Props) {
  const [open, setOpen] = useState(false)
  const t = useT()
  return (
    <div className="map-controls">
      {open && (
        <div id="map-layers" className="layers glass" role="group" aria-label={t('Map layers', '地图图层')}>
          <label>
            <input type="checkbox" checked={p.showNames} onChange={(e) => p.onShowNames(e.target.checked)} /> {t('Building names', '建筑名称')}
          </label>
          <label>
            <input type="checkbox" checked={p.showStreets} onChange={(e) => p.onShowStreets(e.target.checked)} /> {t('Street names', '街道名称')}
          </label>
          <label>
            <input type="checkbox" checked={p.plan} onChange={(e) => p.onPlan(e.target.checked)} /> {t('Plan view (north up)', '平面视图（上北）')}
          </label>
          <label>
            <input type="checkbox" checked={p.ambient} onChange={(e) => p.onAmbient(e.target.checked)} /> {t('Traffic, people & birds', '车流、行人与飞鸟')}
          </label>
        </div>
      )}
      <button
        type="button"
        className="round glass"
        aria-label={t('Map layers', '地图图层')}
        aria-expanded={open}
        aria-controls="map-layers"
        title={t('Map layers', '地图图层')}
        onClick={() => setOpen(!open)}
      >
        <LayersIcon />
      </button>
      <button type="button" className="round glass" aria-label={t('Turn north up', '转为上北')} title={t('North up', '上北')} onClick={p.onNorth}>
        <span ref={p.compass} className="needle">
          <NorthIcon />
        </span>
      </button>
      <button type="button" className="round glass" aria-label={t('Reset view', '重置视角')} title={t('Reset view', '重置视角')} onClick={p.onReset}>
        <ResetIcon />
      </button>
      <LangToggle />
    </div>
  )
}
