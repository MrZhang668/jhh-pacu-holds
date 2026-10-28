import { useState } from 'react'
import { GUIDE, GUIDE_ZH, PEOPLE, PEOPLE_ZH, STAKEHOLDERS, STAKEHOLDERS_ZH } from '../content/interviews'
import { useL, useT } from '../state/lang'

export default function InterviewsModule() {
  const t = useT()
  return (
    <>
      <section>
        <h3>{t('Who we heard from', '我们访谈了谁')}</h3>
        <MeetingScene />
        <StakeholderMap />
      </section>
      <Guide />
      <p className="sources">{t('Interviewees appear by role and unit only.', '受访者仅以职务和所在病区呈现。')}</p>
    </>
  )
}

/** The meeting illustration; each person opens what we concluded from that group. */
function MeetingScene() {
  const t = useT()
  const people = useL(PEOPLE, PEOPLE_ZH)
  const [active, setActive] = useState<(typeof PEOPLE)[number]['key'] | null>(null)
  const person = people.find((p) => p.key === active)
  return (
    <>
      <div className="meeting">
        <img
          src={`${import.meta.env.BASE_URL}images/who-we-heard.webp`}
          width={1672}
          height={941}
          alt={t(
            'Illustration: staff from the OR, PACU, inpatient units, nursing supervision and bed management around one table.',
            '插图：来自手术室、PACU、住院病区、护理督导和床位管理的工作人员围坐在一张桌旁。',
          )}
          loading="lazy"
        />
        {people.map((p) => {
          const [left, top, width, height] = p.box
          return (
            <button
              key={p.key}
              type="button"
              className="meeting-person"
              style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
              aria-label={t(`${p.title}: what we learned`, `${p.title}：我们的发现`)}
              aria-expanded={active === p.key}
              aria-controls="meeting-findings"
              onClick={() => setActive(active === p.key ? null : p.key)}
            />
          )
        })}
      </div>
      {person ? (
        <div id="meeting-findings" className="sh-detail" key={person.key} aria-live="polite">
          <button type="button" className="sh-close" aria-label={t('Close', '关闭')} onClick={() => setActive(null)}>
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
          {t('Click anyone at the table to see what we learned from them.', '点击桌旁任意一人，查看我们从其所在群体获得的发现。')}
        </p>
      )}
    </>
  )
}

type StepKey = (typeof STAKEHOLDERS)[number]['key']

/** The hand-off chain as two lanes; a step's notes open only when it is picked. */
function StakeholderMap() {
  const t = useT()
  const stakeholders = useL(STAKEHOLDERS, STAKEHOLDERS_ZH)
  const [active, setActive] = useState<StepKey | null>(null)
  const node = stakeholders.find((s) => s.key === active)
  const flow = stakeholders.filter((s) => s.lane === 'flow')
  const support = stakeholders.filter((s) => s.lane === 'support')

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
        <p className="sh-lane-label">{t('Patient path', '患者路径')}</p>
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
          <p className="sh-lane-label">{t('Supporting every step', '贯穿各环节的支持')}</p>
          <div className="sh-support-row">{support.map((s) => card(s))}</div>
        </div>
      </div>
      {node ? (
        <div id="sh-detail" className="sh-detail" key={node.key} aria-live="polite">
          <button type="button" className="sh-close" aria-label={t('Close', '关闭')} onClick={() => setActive(null)}>
            ×
          </button>
          <h4>{node.name}</h4>
          <p>{node.pain}</p>
        </div>
      ) : (
        <p id="sh-detail" className="sh-hint">
          {t('Select a step to see where it gets stuck.', '选择一个环节，查看它在哪里受阻。')}
        </p>
      )}
    </>
  )
}

function Guide() {
  const t = useT()
  const guide = useL(GUIDE, GUIDE_ZH)
  return (
    <section>
      <h3>{t('How we asked', '我们如何提问')}</h3>
      <p>
        {t(
          'Semi-structured interviews: the same four topics every time, with follow-ups on real recent cases.',
          '半结构化访谈：每次围绕相同的四个主题，并结合近期真实案例进行追问。',
        )}
      </p>
      {guide.map((g) => (
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
