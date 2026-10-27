import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react'
import { MODULES } from '../content/modules'
import { DMAIC, OVERVIEW, OVERVIEW_FOOTNOTE, PROJECT, TIMELINE } from '../content/overview'
import { INTERVIEWS, PUBLISHED } from '../content/references'
import type { ModuleKey } from '../data/campus'
import type { Route } from '../router'
import { CloseIcon } from './icons'

// module content loads on demand, keeping the first screen light
const MODULE_BODIES: Record<ModuleKey, ReturnType<typeof lazy>> = {
  interviews: lazy(() => import('../modules/InterviewsModule')),
  data: lazy(() => import('../modules/DataModule')),
  thinking: lazy(() => import('../modules/ThinkingModule')),
  outcomes: lazy(() => import('../modules/OutcomesModule')),
}

/** The right-hand panel that opens over the map for a module, the full overview or About. */
export function SidePanel({ route, onClose }: { route: Route; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [route])

  if (route.name === 'map') return null

  let eyebrow: ReactNode
  let title: string
  let sub: string | undefined
  let body: ReactNode

  if (route.name === 'module') {
    const m = MODULES[route.key]
    const Body = MODULE_BODIES[route.key]
    eyebrow = (
      <>
        <span className="n">{m.n}</span> {m.verb}
      </>
    )
    title = m.title
    body = (
      <>
        {m.lede && <p className="lede">{m.lede}</p>}
        {m.facts.length > 0 && (
          <ul className="facts">
            {m.facts.map((f) => (
              <li key={f.label}>
                <b>{f.value}</b>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
        )}
        <Suspense fallback={<p className="loading-inline">Loading…</p>}>
          <Body />
        </Suspense>
      </>
    )
  } else if (route.name === 'overview') {
    eyebrow = 'Project overview'
    title = PROJECT.title
    sub = PROJECT.subtitle
    body = (
      <>
        {OVERVIEW.map((c) => (
          <section key={c.key}>
            <h3>{c.heading}</h3>
            <p>{c.full}</p>
          </section>
        ))}
        <section>
          <h3>How we worked: DMAIC</h3>
          <ol className="dmaic">
            {DMAIC.map((d) => (
              <li key={d.step}>
                <b>{d.step}</b>
                <span>{d.text}</span>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h3>Timeline</h3>
          <ol className="timeline">
            {TIMELINE.map((t) => (
              <li key={t.date}>
                <time>{t.date}</time>
                <span>{t.text}</span>
              </li>
            ))}
          </ol>
        </section>
        <p className="footnote">{OVERVIEW_FOOTNOTE}</p>
      </>
    )
  } else {
    eyebrow = 'About'
    title = 'Team, hosts & credits'
    sub = PROJECT.team
    body = (
      <>
        <section>
          <h3>Team</h3>
          <p>Heather Li, Sanket Sachin Navale and Wandong Zhang — MSEM, Johns Hopkins Whiting School of Engineering.</p>
        </section>
        <section>
          <h3>Hosts</h3>
          <p>
            Dr. Sharon Owens, Director of Nursing for Surgery and Physical Medicine &amp; Rehabilitation, and Amy Hampt,
            Assistant Director of Nursing for Surgery and PM&amp;R.
          </p>
        </section>
        <section>
          <h3>Thank you</h3>
          <p>
            Rose Karlan (Weinberg 4CD), Patty Guthrie (Weinberg 3) and bed manager Mel Vista (Command Center) for
            opening their units to us, and the clinical and administrative staff who made time for interviews.
          </p>
        </section>
        <section>
          <h3>About this site</h3>
          <p>
            An independent student project (JHU MSEM Team 6), not an official Johns Hopkins Medicine website. Hold data
            are derived and normalized from 90 days of internal operational data; they are not official JHH statistics.
          </p>
          <p>
            Campus model from OpenStreetMap data (© OpenStreetMap contributors, ODbL), with building names after the
            Johns Hopkins Medical Campus map (March 2025). World outline from Natural Earth.
          </p>
        </section>
        <section>
          <h3>References</h3>
          <details className="guide" open>
            <summary>Published sources ({PUBLISHED.length})</summary>
            <ol className="refs">
              {PUBLISHED.map((r) => (
                <li key={r.text}>
                  {r.text}{' '}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </details>
          <details className="guide">
            <summary>Interviews, by role ({INTERVIEWS.length})</summary>
            <ol className="refs">
              {INTERVIEWS.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </details>
        </section>
      </>
    )
  }

  const bodyKey = route.name === 'module' ? route.key : route.name
  return (
    <aside className="side-panel" aria-labelledby="panel-title">
      <header className="panel-head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="panel-title" ref={heading} tabIndex={-1}>
          {title}
        </h2>
        {sub && <p className="panel-sub">{sub}</p>}
        <button type="button" className="close" onClick={onClose} aria-label="Close and return to the map">
          <CloseIcon />
        </button>
      </header>
      {/* keyed so each page starts scrolled to the top */}
      <div className="panel-body" key={bodyKey}>
        {body}
      </div>
    </aside>
  )
}
