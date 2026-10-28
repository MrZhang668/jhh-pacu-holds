import type { RefObject } from 'react'
import { MODULES, MODULES_ZH } from '../content/modules'
import type { CampusBuilding } from '../data/campus'
import { useL, useT } from '../state/lang'

// notes on buildings that were demolished after the March 2025 campus map (keyed by the English note)
const NOTES_ZH: Record<string, string> = {
  '10 storeys, opened 1926. Shown per the March 2025 campus map; demolished 2024 for the Life Sciences Building.':
    '10 层，1926 年启用。按 2025 年 3 月校园地图显示；已于 2024 年拆除，原址兴建生命科学大楼。',
  '14 storeys. Shown per the March 2025 campus map; demolished 2024–25 for the Life Sciences Building.':
    '14 层。按 2025 年 3 月校园地图显示；已于 2024–25 年拆除，原址兴建生命科学大楼。',
  'Denton A. Cooley fitness center. Shown per the March 2025 campus map; closed Oct 2024 for the Life Sciences Building.':
    'Denton A. Cooley 健身中心。按 2025 年 3 月校园地图显示；已于 2024 年 10 月关闭，原址兴建生命科学大楼。',
}

/** Name tooltip that follows the pointer over a building (moved directly via the ref). */
export function HoverTip({ building, tipRef }: { building: CampusBuilding | null; tipRef: RefObject<HTMLDivElement | null> }) {
  const modules = useL(MODULES, MODULES_ZH)
  const t = useT()
  const mod = building?.module ? modules[building.module] : null
  return (
    <div ref={tipRef} className={`hover-tip${building ? ' on' : ''}`} role="tooltip" aria-hidden={!building}>
      {building && (
        <>
          <b>{building.name}</b>
          {mod && (
            <span>
              {mod.n} · {mod.label} — {t('click to open', '点击打开')}
            </span>
          )}
          {building.note && <span className="note">{t(building.note, NOTES_ZH[building.note] ?? building.note)}</span>}
        </>
      )}
    </div>
  )
}
