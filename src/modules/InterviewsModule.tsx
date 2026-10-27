import { useState } from 'react'
import {
  CONVERSATIONS,
  GUIDE,
  JOURNEY,
  STAKEHOLDERS,
  THEME_CARDS,
  THEMES,
  type Theme,
} from '../content/interviews'

export default function InterviewsModule() {
  return (
    <>
      <StakeholderMap />
      <Timeline />
      <ThemeCards />
      <Journey />
      <Guide />
      <p className="sources">Interviewees appear by role and unit only.</p>
    </>
  )
}

type StepKey = (typeof STAKEHOLDERS)[number]['key']

const heardAt = (s: (typeof STAKEHOLDERS)[number]) =>
  CONVERSATIONS.filter((c) => (s.heard as readonly string[]).includes(c.where))

/** The hand-off chain as two lanes; a step's notes open only when it is picked. */
function StakeholderMap() {
  const [active, setActive] = useState<StepKey | null>(null)
  const node = STAKEHOLDERS.find((s) => s.key === active)
  const flow = STAKEHOLDERS.filter((s) => s.lane === 'flow')
  const support = STAKEHOLDERS.filter((s) => s.lane === 'support')

  const card = (s: (typeof STAKEHOLDERS)[number], i?: number) => {
    const n = heardAt(s).length
    return (
      <button
        key={s.key}
        type="button"
        className="sh-node"
        aria-expanded={active === s.key}
        aria-controls="sh-detail"
        onClick={() => setActive(active === s.key ? null : s.key)}
      >
        {i !== undefined && <span className="sh-step">0{i + 1}</span>}
        <span className="sh-name">{s.short}</span>
        <span className="sh-count">{n ? `${n} conversation${n > 1 ? 's' : ''}` : 'Described by others'}</span>
      </button>
    )
  }

  return (
    <section>
      <h3>Who we heard from</h3>
      <img
        className="sh-hero"
        src={`${import.meta.env.BASE_URL}images/who-we-heard.webp`}
        width={1672}
        height={941}
        alt="Illustration: staff from the OR, PACU, inpatient units, bed management and nursing supervision around one table, discussing the OR → PACU → inpatient hand-off."
        loading="lazy"
      />
      <div className="sh-map">
        <p className="sh-lane-label">Patient path</p>
        <div className="sh-flow">
          {flow.map((s, i) => (
            <div key={s.key} className="sh-cell">
              {card(s, i)}
              {i < flow.length - 1 && (
                <span className="sh-arrow" aria-hidden="true">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="sh-ticks" aria-hidden="true">
          {flow.map((s) => (
            <span key={s.key} />
          ))}
        </div>
        <div className="sh-support">
          <p className="sh-lane-label">Supporting every step</p>
          <div className="sh-support-row">{support.map((s) => card(s))}</div>
        </div>
      </div>
      {node ? (
        <div id="sh-detail" className="sh-detail" key={node.key} aria-live="polite">
          <button type="button" className="sh-close" aria-label="Close" onClick={() => setActive(null)}>
            ×
          </button>
          <h4>{node.name}</h4>
          <p>{node.pain}</p>
          <p className="sh-heard-label">We spoke with</p>
          {heardAt(node).length ? (
            <ul className="sh-heard">
              {heardAt(node).map((c) => (
                <li key={c.date + c.role}>
                  <span>{c.role}</span>
                  <span className="format">
                    {c.format} · {c.date}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sh-none">No direct interview here; bed managers and PACU managers described this step.</p>
          )}
        </div>
      ) : (
        <p id="sh-detail" className="sh-hint">
          Select a step to see what we heard there.
        </p>
      )}
    </section>
  )
}

function Timeline() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const items = theme ? CONVERSATIONS.filter((c) => c.themes.includes(theme)) : CONVERSATIONS
  return (
    <section>
      <h3>Conversations · Sep 8–26, 2025</h3>
      <div className="filters" role="group" aria-label="Filter by theme">
        <button type="button" aria-pressed={theme === null} onClick={() => setTheme(null)}>
          All
        </button>
        {THEMES.map((t) => (
          <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(theme === t ? null : t)}>
            {t}
          </button>
        ))}
      </div>
      <ol className="timeline-list">
        {items.map((c) => (
          <li key={c.date + c.role}>
            <time>{c.date}</time>
            <div>
              <p className="tl-role">
                {c.role} <span className="format">{c.format}</span>
              </p>
              <p className="tl-take">{c.takeaway}</p>
              {c.detail && <p className="tl-detail">{c.detail}</p>}
              <p className="tl-tags">
                {c.themes.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ThemeCards() {
  return (
    <section>
      <h3>What we kept hearing</h3>
      <div className="card-grid">
        {THEME_CARDS.map((c) => (
          <article key={c.title} className="theme-card">
            <p className="eyebrow">{c.theme}</p>
            <h4>{c.title}</h4>
            <p>{c.text}</p>
            <p className="evidence">{c.evidence}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Journey() {
  return (
    <section>
      <h3>A patient’s path through the Weinberg 3 PACU</h3>
      <ol className="journey">
        {JOURNEY.map((j) => (
          <li key={j.step} className={j.hold ? 'is-hold' : undefined}>
            <span className="j-dot" aria-hidden="true" />
            <b>{j.step}</b>
            <span className="j-time">{j.time}</span>
            <p>{j.text}</p>
          </li>
        ))}
      </ol>
      <p className="journey-key">
        <span className="j-dot is-hold" aria-hidden="true" /> where holds build up
      </p>
    </section>
  )
}

function Guide() {
  return (
    <section>
      <h3>How we asked</h3>
      <p>Semi-structured interviews: the same four topics every time, with follow-ups on real recent cases.</p>
      {GUIDE.map((g) => (
        <details key={g.topic} className="guide">
          <summary>{g.topic}</summary>
          <ul>
            {g.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </details>
      ))}
    </section>
  )
}
