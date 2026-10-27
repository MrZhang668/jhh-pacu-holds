import { useState } from 'react'
import { GUIDE, PEOPLE, STAKEHOLDERS } from '../content/interviews'

export default function InterviewsModule() {
  return (
    <>
      <section>
        <h3>Who we heard from</h3>
        <MeetingScene />
        <StakeholderMap />
      </section>
      <Guide />
      <p className="sources">Interviewees appear by role and unit only.</p>
    </>
  )
}

/** The meeting illustration; each person opens what we concluded from that group. */
function MeetingScene() {
  const [active, setActive] = useState<(typeof PEOPLE)[number]['key'] | null>(null)
  const person = PEOPLE.find((p) => p.key === active)
  return (
    <>
      <div className="meeting">
        <img
          src={`${import.meta.env.BASE_URL}images/who-we-heard.webp`}
          width={1672}
          height={941}
          alt="Illustration: staff from the OR, PACU, inpatient units, nursing supervision and bed management around one table."
          loading="lazy"
        />
        {PEOPLE.map((p) => {
          const [left, top, width, height] = p.box
          return (
            <button
              key={p.key}
              type="button"
              className="meeting-person"
              style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
              aria-label={`${p.title}: what we learned`}
              aria-expanded={active === p.key}
              aria-controls="meeting-findings"
              onClick={() => setActive(active === p.key ? null : p.key)}
            />
          )
        })}
      </div>
      {person ? (
        <div id="meeting-findings" className="sh-detail" key={person.key} aria-live="polite">
          <button type="button" className="sh-close" aria-label="Close" onClick={() => setActive(null)}>
            ×
          </button>
          <h4>{person.title}</h4>
          <p className="meeting-who">{person.who}</p>
          <ul className="meeting-findings">
            {person.findings.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p id="meeting-findings" className="sh-hint">
          Click anyone at the table to see what we learned from them.
        </p>
      )}
    </>
  )
}

type StepKey = (typeof STAKEHOLDERS)[number]['key']

/** The hand-off chain as two lanes; a step's notes open only when it is picked. */
function StakeholderMap() {
  const [active, setActive] = useState<StepKey | null>(null)
  const node = STAKEHOLDERS.find((s) => s.key === active)
  const flow = STAKEHOLDERS.filter((s) => s.lane === 'flow')
  const support = STAKEHOLDERS.filter((s) => s.lane === 'support')

  const card = (s: (typeof STAKEHOLDERS)[number], i?: number) => (
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
    </button>
  )

  return (
    <>
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
        </div>
      ) : (
        <p id="sh-detail" className="sh-hint">
          Select a step to see where it gets stuck.
        </p>
      )}
    </>
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
