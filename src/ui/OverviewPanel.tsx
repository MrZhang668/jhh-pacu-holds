import { OVERVIEW } from '../content/overview'
import { navigate } from '../router'

/** Top-centre project summary: three columns, collapsing to a one-line bar once people explore. */
export function OverviewPanel({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  if (collapsed) {
    return (
      <button type="button" className="overview-bar glass" onClick={onToggle} aria-expanded="false" aria-controls="overview">
        <span className="long">Project overview · 24 stakeholders · 90 days of data · 3 interventions</span>
        <span className="short">Project overview</span>
        <span aria-hidden="true">▾</span>
      </button>
    )
  }
  return (
    <section id="overview" className="overview glass" aria-label="Project overview">
      <div className="overview-cols">
        {OVERVIEW.map((c) => (
          <article key={c.key}>
            <h2>{c.heading}</h2>
            <p className="figure">
              <b>{c.figure}</b>
              <span>{c.figureLabel}</span>
            </p>
            <p className="text">{c.short}</p>
          </article>
        ))}
      </div>
      <div className="overview-actions">
        <a
          href="#/overview"
          onClick={(e) => {
            e.preventDefault()
            navigate('overview')
          }}
        >
          Read the full overview →
        </a>
        <button type="button" onClick={onToggle} aria-expanded="true" aria-controls="overview">
          Collapse ▴
        </button>
      </div>
    </section>
  )
}
