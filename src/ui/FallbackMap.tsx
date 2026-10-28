import { useEffect, useRef, useState } from 'react'
import { FALLBACK } from '../content/fallback'
import { MODULES } from '../content/modules'
import type { ModuleKey } from '../data/campus'
import { useT } from '../state/lang'
import { ModuleLabel } from './LabelLayer'

// room (screen pixels) the pills need around their anchor points
const PILL = { side: 82, above: 70, below: 20 }
// overlays the labels should stay clear of
const OVERLAYS = ['.site-header', '.overview', '.overview-bar', '.fallback-note']

interface Props {
  /** refit when the overview opens or closes */
  overviewOpen: boolean
  visited: Set<ModuleKey>
  active: ModuleKey | null
  onOpen: (key: ModuleKey) => void
  onLoad: () => void
}

/**
 * Shown when the browser has no WebGL: a still of the 3D campus with the same module labels, scaled
 * and positioned to keep the labels clear of the header, the overview and the note.
 */
export function FallbackMap({ overviewOpen, visited, active, onOpen, onLoad }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ scale: 0, x: 0, y: 0, fade: '' })
  const t = useT()

  useEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => {
      const W = el.clientWidth
      const H = el.clientHeight
      // the free band between the overlays at the top of the screen and those at the bottom
      let top = 0
      let bottom = H
      for (const selector of OVERLAYS) {
        const r = document.querySelector(selector)?.getBoundingClientRect()
        if (!r || r.height === 0) continue
        if (r.top + r.height / 2 < H / 2) top = Math.max(top, r.bottom + 8)
        else bottom = Math.min(bottom, r.top - 8)
      }
      const { width: iw, height: ih, spots } = FALLBACK
      const x0 = Math.min(...spots.map((s) => s.x))
      const x1 = Math.max(...spots.map((s) => s.x))
      const y0 = Math.min(...spots.map((s) => s.y))
      const y1 = Math.max(...spots.map((s) => s.y))
      const contain = Math.min(W / iw, H / ih)
      const cover = Math.max(W / iw, H / ih)
      const fitSpots = Math.min((W - 2 * PILL.side) / (x1 - x0), (bottom - top - PILL.above - PILL.below) / (y1 - y0))
      // fill the screen when its shape is close to the image's; on tall phone screens, zoom only as
      // far as keeps all four labels in view
      const scale = cover / contain < 1.35 ? cover : Math.max(contain, Math.min(cover, fitSpots))
      // centre the labels in the free band, without pulling an image edge into view where the image
      // is big enough to fill the screen
      const place = (screen: number, image: number, offset: number) =>
        image > screen ? Math.min(0, Math.max(screen - image, offset)) : (screen - image) / 2
      const w = iw * scale
      const h = ih * scale
      setView({
        scale,
        x: place(W, w, W / 2 - ((x0 + x1) / 2) * scale),
        y: place(H, h, (top + bottom) / 2 - ((y0 + y1) / 2) * scale + (PILL.above - PILL.below) / 2),
        // soften edges that end inside the screen
        fade: `${h < H - 1 ? ' fade-y' : ''}${w < W - 1 ? ' fade-x' : ''}`,
      })
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [overviewOpen])

  return (
    <div className="fallback" ref={box}>
      <img
        src={`${import.meta.env.BASE_URL}${FALLBACK.image}`}
        alt={t(
          'Illustrated 3D model of The Johns Hopkins Hospital campus in East Baltimore, seen from the south-west.',
          '约翰斯·霍普金斯医院东巴尔的摩园区的 3D 插画模型（西南方向视角）。',
        )}
        width={FALLBACK.width}
        height={FALLBACK.height}
        className={view.fade}
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        onLoad={onLoad}
        onError={onLoad}
      />
      {view.scale > 0 &&
        FALLBACK.spots.map((s) => (
          <div
            key={s.module}
            className="fallback-spot"
            style={{ transform: `translate(${(view.x + s.x * view.scale).toFixed(1)}px, ${(view.y + s.y * view.scale).toFixed(1)}px)` }}
          >
            <ModuleLabel
              building={MODULES[s.module].building}
              moduleKey={s.module}
              visited={visited.has(s.module)}
              active={active === s.module}
              onHover={() => undefined}
              onOpen={onOpen}
            />
          </div>
        ))}
      <p className="fallback-note glass">
        {t(
          'This browser can’t show the interactive 3D model, so this is a still image of it. The labels and everything else work the same.',
          '当前浏览器无法显示交互式 3D 模型，因此这里展示的是静态图像。标签及其他功能均可正常使用。',
        )}
      </p>
    </div>
  )
}
