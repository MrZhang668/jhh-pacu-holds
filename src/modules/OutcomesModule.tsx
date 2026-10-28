import { useLayoutEffect, useRef, useState } from 'react'
import { EXAMPLES, HOME, SOLUTIONS, type Solution } from '../content/outcomes'
import { WORLD, WORLD_LAND } from '../content/worldLand'
import { CloseIcon } from '../ui/icons'
import { navigate, useSubPath } from '../router'
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

  const i = SOLUTIONS.findIndex((s) => s.key === open)
  const s = SOLUTIONS[i]
  return (
    <div ref={top} className="outcomes-body">
      {s ? (
        <>
          <button type="button" className="back-link" onClick={() => show(null)}>
            ← All interventions
          </button>
          <SolutionCard s={s} />
        </>
      ) : (
        <>
          <section>
            <h3>Three interventions</h3>
            <div className="solution-cards">
              {SOLUTIONS.map((sol) => (
                <button key={sol.key} id={`card-${sol.key}`} type="button" className="solution-card" onClick={() => show(sol.key)}>
                  <Sketch kind={sol.key} />
                  <span className="eyebrow">Intervention {sol.n}</span>
                  <span className="solution-card-title">{sol.title}</span>
                  <span className="solution-card-teaser">{sol.teaser}</span>
                  <span className="solution-card-more">See how it works →</span>
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
  return (
    <section className="solution">
      <p className="eyebrow">Intervention {s.n}</p>
      <h3 className="solution-title">{s.title}</h3>
      <p>{s.summary}</p>
      {s.key === 'tracking' && <TrackingScene />}
      {s.key === 'overlap' && <OverlapScene />}
      {s.key === 'cleaning' && <CleaningScene />}
      {/* the detail folds away so the picture and the demo lead */}
      <div className="solution-cols">
        <details className="guide">
          <summary>How it works</summary>
          <ol>
            {s.how.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
        </details>
        <details className="guide">
          <summary>Who does what</summary>
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
  // the card for a hospital appears only once its pin is clicked
  const [open, setOpen] = useState<number | null>(null)
  const toggle = (i: number) => setOpen((o) => (o === i ? null : i))
  const shown = open === null ? null : EXAMPLES[open]
  return (
    <section>
      <h3>Who has tried this</h3>
      <div className="world" ref={host}>
        <svg viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} role="group" aria-label="World map of the four hospitals with similar programs, and Johns Hopkins in Baltimore">
          <path d={WORLD_LAND} className="land" />
          <g transform={`translate(${mx(HOME.lon)} ${my(HOME.lat)})`} {...bind({ value: 'JHH', label: HOME.place, sub: 'our pilot units' })} tabIndex={0}>
            <circle r={22} className="hit" />
            <circle r={9} className="pin home" />
          </g>
          {EXAMPLES.map((e, i) => (
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
              {...bind({ value: e.effect, label: e.place, sub: 'click for details' })}
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
            <button type="button" className="example-close" aria-label="Close" onClick={() => setOpen(null)}>
              <CloseIcon />
            </button>
            <p className="example-value">{shown.effect}</p>
            <p className="example-measure">{shown.measure}</p>
            <p>{shown.what}</p>
          </article>
        ) : (
          <p className="example-hint">Click a numbered pin to see what that hospital did and what changed.</p>
        )}
      </div>
      <p className="sources">Gold dot: The Johns Hopkins Hospital. Figures as reported by each program (see References in About).</p>
    </section>
  )
}
