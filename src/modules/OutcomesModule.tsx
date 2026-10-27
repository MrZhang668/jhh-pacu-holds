import { useEffect, useState } from 'react'
import {
  EXAMPLES,
  HOME,
  IMPACT,
  PHASES,
  ROOT_CAUSES,
  SOLUTIONS,
  SUCCESS_FACTORS,
  VISION,
  type Solution,
  type Step,
} from '../content/outcomes'
import { WORLD, WORLD_LAND } from '../content/worldLand'
import { useTooltip } from './viz'

export default function OutcomesModule() {
  return (
    <>
      <CauseFixGrid />
      {SOLUTIONS.map((s) => (
        <SolutionCard key={s.key} s={s} />
      ))}
      <ExamplesMap />
      <section>
        <h3>What has to be true</h3>
        <div className="card-grid">
          {SUCCESS_FACTORS.map((f) => (
            <article key={f.title} className="theme-card">
              <h4>{f.title}</h4>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h3>Roll-out</h3>
        <ol className="phases">
          {PHASES.map((p) => (
            <li key={p.phase}>
              <b>{p.phase}</b>
              <span>{p.text}</span>
            </li>
          ))}
        </ol>
        <h3>Anticipated impact</h3>
        <p>{IMPACT}</p>
        <h3>Long-term vision</h3>
        <p>{VISION}</p>
      </section>
    </>
  )
}

const FIX_TITLES = Object.fromEntries(SOLUTIONS.map((s) => [s.key, s.title]))

function CauseFixGrid() {
  return (
    <section>
      <h3>From root causes to interventions</h3>
      <div className="table-wrap">
        <table className="cause-grid">
          <caption className="visually-hidden">Which intervention addresses which root cause</caption>
          <thead>
            <tr>
              <th scope="col">Root cause</th>
              {SOLUTIONS.map((s) => (
                <th key={s.key} scope="col">
                  {s.n}. {s.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROOT_CAUSES.map((c) => (
              <tr key={c.key}>
                <th scope="row">
                  <b>{c.title}</b>
                  <span>{c.text}</span>
                </th>
                {SOLUTIONS.map((s) => (
                  <td key={s.key}>
                    {c.fixes.includes(s.key) ? (
                      <span className="tick-dot" aria-label={`addressed by ${FIX_TITLES[s.key]}`} />
                    ) : (
                      <span className="visually-hidden">not addressed</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SolutionCard({ s }: { s: Solution }) {
  return (
    <section className="solution">
      <p className="eyebrow">Intervention {s.n}</p>
      <h3 className="solution-title">{s.title}</h3>
      <p>{s.summary}</p>
      {s.key === 'tracking' && <TapDemo />}
      {s.key === 'overlap' && <ShiftBars />}
      {s.key === 'cleaning' && <CleaningDemo />}
      <div className="solution-cols">
        <div>
          <h4>How it works</h4>
          <ol>
            {s.how.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
          <h4>Who does what</h4>
          <ul className="roles">
            {s.roles.map((r) => (
              <li key={r.who}>
                <b>{r.who}</b> {r.does}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Cost</h4>
          <table className="cost">
            <tbody>
              {s.cost.map((c) => (
                <tr key={c.item}>
                  <th scope="row">{c.item}</th>
                  <td>{c.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {s.timeline && (
            <>
              <h4>Seven-week plan</h4>
              <WeekPlan steps={s.timeline} />
            </>
          )}
        </div>
      </div>
    </section>
  )
}

const TRACK_EVENTS = [
  { event: 'Arrived in PACU', time: '14:02', board: 'In PACU — visible to bed managers' },
  { event: 'Ready for transfer', time: '15:31', board: 'Ready — assign a bed now' },
  { event: 'Departed PACU', time: '15:44', board: 'Transferred — bay free for the next case' },
]

/** Tap the card: Epic logs the event and the bed manager’s board updates. */
function TapDemo() {
  const [taps, setTaps] = useState(0)
  return (
    <div className="demo" aria-label="Demonstration of NFC patient tracking">
      <div className="demo-actions">
        <button type="button" className="demo-button" onClick={() => setTaps((t) => Math.min(3, t + 1))} disabled={taps === 3}>
          Tap the patient’s card
        </button>
        <button type="button" className="link-button" onClick={() => setTaps(0)}>
          Reset
        </button>
      </div>
      <ol className="demo-log">
        {TRACK_EVENTS.map((e, i) => (
          <li key={e.event} className={i < taps ? 'is-done' : undefined}>
            <time>{i < taps ? e.time : '—'}</time>
            {e.event}
          </li>
        ))}
      </ol>
      <p className="demo-board" aria-live="polite">
        <span>Bed manager’s board</span>
        {taps === 0 ? 'Patient not in the system yet — no posting possible' : TRACK_EVENTS[taps - 1].board}
      </p>
    </div>
  )
}

/** 24 hours, two shift patterns: the 6–6 nurses are mid-shift during the 7 PM hand-off. */
function ShiftBars() {
  const W = 640
  const x = (h: number) => 120 + (h / 24) * (W - 140)
  const rows = [
    { label: '7–7 nurses (~75%)', y: 30, change: [7, 19] },
    { label: '6–6 nurses (~25%)', y: 78, change: [6, 18] },
  ]
  return (
    <figure className="shift-bars">
      <svg viewBox={`0 0 ${W} 150`} role="img" aria-label="Shift patterns over 24 hours: 7-to-7 nurses hand off at 7 AM and 7 PM, 6-to-6 nurses at 6 AM and 6 PM, so they are free during the 7 PM hand-off.">
        <rect x={x(18.75)} y={14} width={x(19.25) - x(18.75)} height={104} className="window" />
        {rows.map((r) => (
          <g key={r.label}>
            <text x={0} y={r.y + 16} className="row-label">
              {r.label}
            </text>
            <rect x={x(0)} y={r.y} width={x(24) - x(0)} height={24} rx={4} className="night" />
            <rect x={x(r.change[0])} y={r.y} width={x(r.change[1]) - x(r.change[0])} height={24} rx={4} className="day" />
            {r.change.map((c) => (
              <rect key={c} x={x(c) - 3} y={r.y - 3} width={6} height={30} rx={2} className="handoff" />
            ))}
          </g>
        ))}
        {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
          <text key={h} x={x(h)} y={136} className="tick" textAnchor="middle">
            {h}
          </text>
        ))}
      </svg>
      <figcaption>
        <span className="legend-key">
          <i className="k-handoff" aria-hidden="true" /> hand-off (report)
        </span>
        <span className="legend-key">
          <i className="k-window" aria-hidden="true" /> 6:45–7:15 PM: PACU arrivals go to the 6–6 nurses
        </span>
      </figcaption>
    </figure>
  )
}

type CleanState = 'dirty' | 'cleaning' | 'ready'

/** Two taps with a 7-minute safeguard; the clock runs at 3 simulated minutes per second. */
function CleaningDemo() {
  const [state, setState] = useState<CleanState>('dirty')
  const [minutes, setMinutes] = useState(0)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (state !== 'cleaning') return
    const id = window.setInterval(() => setMinutes((m) => m + 3), 1000)
    return () => window.clearInterval(id)
  }, [state])

  const tap = () => {
    if (state === 'dirty') {
      setState('cleaning')
      setMinutes(0)
      setMessage('First tap: the room shows “Cleaning in progress”.')
    } else if (state === 'cleaning') {
      if (minutes < 7) setMessage(`Second tap after ${minutes} min ignored — under the 7-minute safeguard.`)
      else {
        setState('ready')
        setMessage(`Second tap after ${minutes} min: “Ready to assign” reaches the Command Center at once.`)
      }
    } else {
      setState('dirty')
      setMinutes(0)
      setMessage('')
    }
  }

  const steps: { key: CleanState; label: string }[] = [
    { key: 'dirty', label: 'Needs cleaning' },
    { key: 'cleaning', label: 'Cleaning in progress' },
    { key: 'ready', label: 'Ready to assign' },
  ]
  return (
    <div className="demo" aria-label="Demonstration of the NFC bed-cleaning status">
      <ol className="state-row">
        {steps.map((s) => (
          <li key={s.key} className={state === s.key ? 'is-current' : undefined}>
            {s.label}
            {s.key === 'cleaning' && state === 'cleaning' && <time>{minutes} min</time>}
          </li>
        ))}
      </ol>
      <div className="demo-actions">
        <button type="button" className="demo-button" onClick={tap}>
          {state === 'ready' ? 'Next patient leaves (reset)' : 'Tap the EVS card'}
        </button>
      </div>
      <p className="demo-board" aria-live="polite">
        <span>Command Center</span>
        {message || 'Waiting for the first tap.'}
      </p>
    </div>
  )
}

function WeekPlan({ steps }: { steps: Step[] }) {
  return (
    <div className="weekplan" role="table" aria-label="Seven-week plan">
      <div className="wp-row wp-head" role="row">
        <span role="columnheader">Step</span>
        {[1, 2, 3, 4, 5, 6, 7].map((w) => (
          <span key={w} role="columnheader">
            W{w}
          </span>
        ))}
      </div>
      {steps.map((s) => (
        <div className="wp-row" role="row" key={s.text}>
          <span role="rowheader">{s.text}</span>
          <span
            className="wp-bar"
            role="cell"
            aria-label={s.week[0] === s.week[1] ? `week ${s.week[0]}` : `weeks ${s.week[0]} to ${s.week[1]}`}
            style={{ gridColumn: `${s.week[0] + 1} / ${s.week[1] + 2}` }}
          />
        </div>
      ))}
    </div>
  )
}

const mx = (lon: number) => ((lon + 180) / 360) * WORLD.width
const my = (lat: number) => ((WORLD.north - lat) / 360) * WORLD.width

function ExamplesMap() {
  const { host, bind, element } = useTooltip()
  return (
    <section>
      <h3>Who has tried this</h3>
      <div className="world" ref={host}>
        <svg viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} role="img" aria-label="World map of the four hospitals with similar programs, and Johns Hopkins in Baltimore">
          <path d={WORLD_LAND} className="land" />
          <g transform={`translate(${mx(HOME.lon)} ${my(HOME.lat)})`} {...bind({ value: 'JHH', label: HOME.place, sub: 'our pilot units' })} tabIndex={0}>
            <circle r={22} className="hit" />
            <circle r={9} className="pin home" />
          </g>
          {EXAMPLES.map((e, i) => (
            <g
              key={e.place}
              transform={`translate(${mx(e.lon)} ${my(e.lat)})`}
              tabIndex={0}
              {...bind({ value: e.effect, label: e.place, sub: e.measure })}
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
      <div className="card-grid examples">
        {EXAMPLES.map((e, i) => (
          <article key={e.place} className="theme-card">
            <p className="eyebrow">
              <span className="num">{i + 1}</span> {e.place}
            </p>
            <p className="example-value">{e.effect}</p>
            <p className="example-measure">{e.measure}</p>
            <p>{e.what}</p>
          </article>
        ))}
      </div>
      <p className="sources">Gold dot: The Johns Hopkins Hospital. Figures as reported by each program (see References in About).</p>
    </section>
  )
}
