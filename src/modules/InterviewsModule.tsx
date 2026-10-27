import { useState } from 'react'
import {
  CONVERSATIONS,
  GUIDE,
  JOURNEY,
  QUOTE,
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
      <blockquote className="quote">
        <p>“{QUOTE.text}”</p>
        <footer>— {QUOTE.who}</footer>
      </blockquote>
      <Guide />
      <p className="sources">Interviewees appear by role and unit only.</p>
    </>
  )
}

/** The hand-off chain; pick a step to see what people there told us. */
function StakeholderMap() {
  const [active, setActive] = useState<(typeof STAKEHOLDERS)[number]['key']>('PACU')
  const node = STAKEHOLDERS.find((s) => s.key === active)!
  const heard = CONVERSATIONS.filter((c) => c.where === active)
  const button = (key: (typeof STAKEHOLDERS)[number]['key']) => {
    const s = STAKEHOLDERS.find((x) => x.key === key)!
    return (
      <button type="button" className="sh-node" aria-pressed={active === key} onClick={() => setActive(key)}>
        {s.name}
      </button>
    )
  }
  return (
    <section>
      <h3>Who we heard from</h3>
      <div className="sh-map">
        <div className="sh-chain">
          {button('OR')}
          <span className="sh-arrow" aria-hidden="true">→</span>
          {button('PACU')}
          <span className="sh-arrow" aria-hidden="true">→</span>
          {button('Inpatient')}
        </div>
        <div className="sh-support">
          {button('Command Center')}
          {button('EVS')}
        </div>
      </div>
      <div className="sh-detail" aria-live="polite">
        <h4>{node.name}</h4>
        <p>{node.pain}</p>
        <p className="sh-heard">
          {heard.length
            ? `We spoke with: ${heard.map((c) => c.role).join('; ')}.`
            : 'No direct interview here; bed managers and PACU managers described this step.'}
        </p>
      </div>
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
