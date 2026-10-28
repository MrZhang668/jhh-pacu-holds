import { useLayoutEffect, useRef, useState } from 'react'
import { EXAMPLES, EXAMPLES_ZH, HOME, HOME_ZH, SOLUTIONS, SOLUTIONS_ZH, type Solution } from '../content/outcomes'
import { WORLD, WORLD_LAND } from '../content/worldLand'
import { CloseIcon } from '../ui/icons'
import { navigate, useSubPath } from '../router'
import { useL, useT } from '../state/lang'
import { CleaningScene, OverlapScene, TrackingScene } from './SceneFlow'
import { Sketch } from './sketches'
import { useTooltip } from './viz'

type SolutionKey = Solution['key']

/**
 * Three illustrated cards; one opens into its full write-up, with a way back. The open card lives in
 * the URL (#/outcomes/tracking), so other modules can link straight to an intervention.
 */
export default function OutcomesModule() {
  const sub = useSubPath()
  const t = useT()
  const solutions = useL(SOLUTIONS, SOLUTIONS_ZH)
  const open = SOLUTIONS.some((sol) => sol.key === sub) ? (sub as SolutionKey) : null
  const top = useRef<HTMLDivElement>(null)
  const from = useRef<SolutionKey | null>(null)

  // opening a card starts at its title; going back returns to the card it came from
  useLayoutEffect(() => {
    if (open) top.current?.scrollIntoView({ block: 'start' })
    else if (from.current) document.getElementById(`card-${from.current}`)?.focus({ preventScroll: false })
    from.current = open
  }, [open])

  const show = (key: SolutionKey | null) => navigate(key ? `outcomes/${key}` : 'outcomes')

  const i = solutions.findIndex((s) => s.key === open)
  const s = solutions[i]
  return (
    <div ref={top} className="outcomes-body">
      {s ? (
        <>
          <button type="button" className="back-link" onClick={() => show(null)}>
            {t('← All interventions', '← 全部改进措施')}
          </button>
          <SolutionCard s={s} />
        </>
      ) : (
        <>
          <section>
            <h3>{t('Three interventions', '三项改进措施')}</h3>
            <div className="solution-cards">
              {solutions.map((sol) => (
                <button key={sol.key} id={`card-${sol.key}`} type="button" className="solution-card" onClick={() => show(sol.key)}>
                  <Sketch kind={sol.key} />
                  <span className="eyebrow">{t(`Intervention ${sol.n}`, `改进措施 ${sol.n}`)}</span>
                  <span className="solution-card-title">{sol.title}</span>
                  <span className="solution-card-teaser">{sol.teaser}</span>
                  <span className="solution-card-more">{t('See how it works →', '了解具体做法 →')}</span>
                </button>
              ))}
            </div>
          </section>
          <ExamplesMap />
        </>
      )}
    </div>
  )
}

function SolutionCard({ s }: { s: Solution }) {
  const t = useT()
  return (
    <section className="solution">
      <p className="eyebrow">{t(`Intervention ${s.n}`, `改进措施 ${s.n}`)}</p>
      <h3 className="solution-title">{s.title}</h3>
      <p>{s.summary}</p>
      {s.key === 'tracking' && <TrackingScene />}
      {s.key === 'overlap' && <OverlapScene />}
      {s.key === 'cleaning' && <CleaningScene />}
      {/* the detail folds away so the picture and the demo lead */}
      <div className="solution-cols">
        <details className="guide">
          <summary>{t('How it works', '具体做法')}</summary>
          <ol>
            {s.how.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
        </details>
        <details className="guide">
          <summary>{t('Who does what', '分工')}</summary>
          <ul className="roles">
            {s.roles.map((r) => (
              <li key={r.who}>
                <b>{r.who}</b> {r.does}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  )
}

const mx = (lon: number) => ((lon + 180) / 360) * WORLD.width
const my = (lat: number) => ((WORLD.north - lat) / 360) * WORLD.width

function ExamplesMap() {
  const { host, bind, element } = useTooltip()
  const t = useT()
  const examples = useL(EXAMPLES, EXAMPLES_ZH)
  const home = useL(HOME, HOME_ZH)
  // the card for a hospital appears only once its pin is clicked
  const [open, setOpen] = useState<number | null>(null)
  const toggle = (i: number) => setOpen((o) => (o === i ? null : i))
  const shown = open === null ? null : examples[open]
  return (
    <section>
      <h3>{t('Who has tried this', '其他机构的实践')}</h3>
      <div className="world" ref={host}>
        <svg viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} role="group" aria-label={t('World map of the four hospitals with similar programs, and Johns Hopkins in Baltimore', '世界地图：四家开展类似项目的医院，以及位于巴尔的摩的约翰斯·霍普金斯医院')}>
          <path d={WORLD_LAND} className="land" />
          <g transform={`translate(${mx(home.lon)} ${my(home.lat)})`} {...bind({ value: 'JHH', label: home.place, sub: t('our pilot units', '我们的试点病区') })} tabIndex={0}>
            <circle r={22} className="hit" />
            <circle r={9} className="pin home" />
          </g>
          {examples.map((e, i) => (
            <g
              key={e.place}
              className={`example-pin${open === i ? ' is-open' : ''}`}
              transform={`translate(${mx(e.lon)} ${my(e.lat)})`}
              role="button"
              tabIndex={0}
              aria-pressed={open === i}
              aria-label={`${i + 1}. ${e.place}`}
              onClick={() => toggle(i)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault()
                  toggle(i)
                }
              }}
              {...bind({ value: e.effect, label: e.place, sub: t('click for details', '点击查看详情') })}
            >
              <circle r={22} className="hit" />
              <circle r={13} className="pin" />
              <text dy={5} textAnchor="middle">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
        {element}
      </div>
      <div className="example-slot" aria-live="polite">
        {shown && open !== null ? (
          <article className="theme-card example-card">
            <p className="eyebrow">
              <span className="num">{open + 1}</span> {shown.place}
            </p>
            <button type="button" className="example-close" aria-label={t('Close', '关闭')} onClick={() => setOpen(null)}>
              <CloseIcon />
            </button>
            <p className="example-value">{shown.effect}</p>
            <p className="example-measure">{shown.measure}</p>
            <p>{shown.what}</p>
          </article>
        ) : (
          <p className="example-hint">{t('Click a numbered pin to see what that hospital did and what changed.', '点击带编号的标记，查看该医院的做法及带来的变化。')}</p>
        )}
      </div>
      <p className="sources">{t('Gold dot: The Johns Hopkins Hospital. Figures as reported by each program (see References in About).', '金色圆点：约翰斯·霍普金斯医院。数据均为各项目自行报告（参见“关于”页中的参考文献）。')}</p>
    </section>
  )
}
