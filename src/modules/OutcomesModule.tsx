import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { EXAMPLES, HOME, SOLUTIONS, type Solution } from '../content/outcomes'
import { WORLD, WORLD_LAND } from '../content/worldLand'
import { CloseIcon } from '../ui/icons'
import { useTooltip } from './viz'

type SolutionKey = Solution['key']

/** Three illustrated cards; one opens into its full write-up, with a way back. */
export default function OutcomesModule() {
  const [open, setOpen] = useState<SolutionKey | null>(null)
  const top = useRef<HTMLDivElement>(null)
  const from = useRef<SolutionKey | null>(null)

  // opening a card starts at its title; going back returns to the card it came from
  useLayoutEffect(() => {
    if (open) top.current?.scrollIntoView({ block: 'start' })
    else if (from.current) document.getElementById(`card-${from.current}`)?.focus({ preventScroll: false })
  }, [open])

  const show = (key: SolutionKey | null) => {
    from.current = open
    setOpen(key)
  }

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

/**
 * Hand-drawn style card art: plain strokes run through a slight turbulence filter so the lines wobble
 * like pencil, with gold and blue washes behind.
 */
function Sketch({ kind }: { kind: SolutionKey }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className="sketch" viewBox="0 0 160 96" aria-hidden="true">
      <defs>
        <filter id={`wobble${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={kind.length} />
          <feDisplacementMap in="SourceGraphic" scale="2.2" />
        </filter>
      </defs>
      <g filter={`url(#wobble${id})`}>{SKETCHES[kind]}</g>
      {/* labels stay crisp, outside the wobble */}
      {kind === 'overlap' && (
        <>
          <text className="label" x="58" y="93" textAnchor="middle">
            7–7
          </text>
          <text className="label" x="102" y="93" textAnchor="middle">
            6–6
          </text>
        </>
      )}
    </svg>
  )
}

const SKETCHES: Record<SolutionKey, ReactNode> = {
  // a recovery bed, the patient's card tapped on a reader, and the bed board lighting up
  tracking: (
    <>
      <ellipse className="wash gold" cx="58" cy="60" rx="46" ry="24" />
      <path className="ink" d="M18 70V42M18 62h66v8M84 62v-7a7 7 0 0 0-7-7H46v14" />
      <circle className="ink" cx="31" cy="54" r="5.5" />
      <path className="ink thin" d="M24 70v6M80 70v6" />
      <rect className="ink fill-card" x="62" y="22" width="18" height="24" rx="3" transform="rotate(-12 71 34)" />
      <path className="ink thin" d="M84 26a7 7 0 0 1 0 10M89 22a13 13 0 0 1 0 18" />
      <path className="ink thin dash" d="M96 38c10 2 14 6 18 12" />
      <rect className="wash blue" x="108" y="44" width="40" height="28" rx="4" />
      <rect className="ink" x="108" y="44" width="40" height="28" rx="4" />
      <path className="ink thin" d="M114 52h18M114 58h26M114 64h12M122 72v8M116 80h20" />
      <circle className="dot" cx="140" cy="52" r="3" />
    </>
  ),
  // two clocks overlapping: the 6-to-6 shift is on the floor while the 7-to-7 nurses hand off
  overlap: (
    <>
      <circle className="wash blue" cx="58" cy="46" r="30" />
      <circle className="wash gold" cx="102" cy="46" r="30" />
      <circle className="ink" cx="58" cy="46" r="30" />
      <circle className="ink" cx="102" cy="46" r="30" />
      <path className="ink" d="M58 46V26M58 46l13 7" />
      <path className="ink" d="M102 46V26M102 46l-14 6" />
      <path className="ink thin" d="M58 18v3M86 46h-3M58 74v-3M30 46h3M102 18v3M130 46h-3M102 74v-3M74 46h3" />
    </>
  ),
  // a made bed with sparkles, the broom, and the EVS card's two taps
  cleaning: (
    <>
      <ellipse className="wash blue" cx="62" cy="62" rx="46" ry="22" />
      <path className="ink" d="M20 72V48M20 64h68v8M88 64v-6a6 6 0 0 0-6-6H40v12" />
      <rect className="ink" x="26" y="52" width="12" height="7" rx="3" />
      <path className="ink thin" d="M26 72v6M84 72v6" />
      <path className="spark" d="M54 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM76 20l1.4 4 4 1.4-4 1.4-1.4 4-1.4-4-4-1.4 4-1.4z" />
      <path className="ink" d="M130 12l-12 40" />
      <path className="ink fill-gold" d="M110 50h18l6 30h-30z" />
      <path className="ink thin" d="M112 60l-2 18M119 60v18M126 60l2 18" />
      <rect className="ink fill-card" x="96" y="16" width="14" height="19" rx="2.5" transform="rotate(10 103 25)" />
      <path className="ink thin" d="M86 22a5 5 0 0 0 0 8M82 19a10 10 0 0 0 0 14" />
    </>
  ),
}

function SolutionCard({ s }: { s: Solution }) {
  return (
    <section className="solution">
      <p className="eyebrow">Intervention {s.n}</p>
      <h3 className="solution-title">{s.title}</h3>
      <p>{s.summary}</p>
      {(s.key === 'tracking' || s.key === 'cleaning') && <TapFlow flow={FLOWS[s.key]} />}
      {s.key === 'tracking' && <TapDemo />}
      {s.key === 'overlap' && <ShiftBars />}
      {s.key === 'cleaning' && <CleaningDemo />}
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

// small line icons for the flowchart (24 × 24, drawn in currentColor)
const icon = (body: ReactNode) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {body}
  </svg>
)
const NFC = icon(
  <>
    <rect x="2.5" y="6" width="11" height="13" rx="2" />
    <path d="M5.5 10h5M5.5 13h3" />
    <path d="M16.5 9a4.5 4.5 0 0 1 0 6.5M19.3 6.5a8 8 0 0 1 0 11.5" />
  </>,
)
const PERSON = icon(
  <>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20.5c0-3.9 3.1-7 7-7s7 3.1 7 7" />
  </>,
)
const OR_LIGHT = icon(
  <>
    <path d="M12 2.5v3" />
    <path d="M4.5 13a7.5 7.5 0 0 1 15 0z" />
    <path d="M8 16.5l-1.5 3.5M12 16.5V20.5M16 16.5l1.5 3.5" />
  </>,
)
const RECOVERY_BED = icon(
  <>
    <path d="M3 6v14M3 16h18v4M21 16v-3a3 3 0 0 0-3-3h-7v6" />
    <circle cx="7" cy="12.5" r="2" />
  </>,
)
const WARD = icon(
  <>
    <rect x="4" y="4" width="16" height="16.5" rx="1.5" />
    <path d="M12 7.5v5M9.5 10h5M10 20.5v-3.5h4v3.5" />
  </>,
)
const EPIC = icon(
  <>
    <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
    <path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
  </>,
)
const BOARD = icon(
  <>
    <rect x="2.5" y="3.5" width="19" height="13" rx="1.5" />
    <path d="M6.5 7.5h6M6.5 10.5h9M6.5 13.5h4M8 20.5h8M12 16.5v4" />
  </>,
)
const CHECK = icon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8 12.3l2.7 2.7L16 9.5" />
  </>,
)
const REUSE = icon(
  <>
    <path d="M20 12a8 8 0 1 1-2.4-5.7" />
    <path d="M20 3.5v4.5h-4.5" />
  </>,
)

const BROOM = icon(
  <>
    <path d="M16.5 2.5l-4 8.5" />
    <path d="M7 11h9l2.5 10h-14z" />
    <path d="M9 15.5l-.8 5.5M12 15.5v5.5M15 15.5l.8 5.5" />
  </>,
)
const CHART = icon(
  <>
    <path d="M3.5 20.5h17" />
    <path d="M6.5 17v-5M11 17V7.5M15.5 17v-7M20 17V4.5" />
  </>,
)

interface FlowStep {
  text: string
  /** an NFC tap; other steps happen in Epic, or are the outcome (done) */
  tap?: boolean
  done?: boolean
}

interface FlowStage {
  dept: string
  icon: ReactNode
  who: string
  steps: FlowStep[]
  /** outlined in gold, with this label at the bottom */
  tag?: string
}

/** What drops from a department into Epic (or rises from Epic into it), under each department. */
interface FlowDrop {
  label: string
  tap?: boolean
  up?: boolean
}

interface Flow {
  label: string
  stages: [FlowStage, FlowStage, FlowStage]
  drops: [FlowDrop | null, FlowDrop | null, FlowDrop | null]
  epic: string
  outputs: { icon: ReactNode; who: string; text: string }[]
  note: { icon: ReactNode; text: string }
}

/**
 * An intervention as a picture: departments left to right with who does what, every NFC tap drops into
 * Epic, and Epic tells the people who act on it without a phone call.
 */
const FLOWS: Record<'tracking' | 'cleaning', Flow> = {
  tracking: {
    label: 'How NFC patient tracking moves information from the bedside to the bed manager',
    stages: [
      { dept: 'Operating room', icon: OR_LIGHT, who: 'OR team', steps: [{ text: 'Card linked to the patient’s encounter before surgery' }] },
      {
        dept: 'PACU',
        icon: RECOVERY_BED,
        who: 'PACU nurse',
        tag: 'Where holds build up',
        steps: [
          { text: 'Arrived in PACU', tap: true },
          { text: 'Ready for transfer', tap: true },
          { text: 'Departed PACU', tap: true },
        ],
      },
      { dept: 'Inpatient unit', icon: WARD, who: 'Receiving nurse', steps: [{ text: 'Bed assigned and room ready before the patient arrives', done: true }] },
    ],
    drops: [{ label: 'card ID' }, { label: 'every tap', tap: true }, { label: 'status', up: true }],
    epic: 'logs every tap with the time and the location, with no manual status entry',
    outputs: [
      { icon: BOARD, who: 'Command Center · bed manager', text: 'sees “Ready for transfer” on the board at once and assigns a bed' },
      { icon: PERSON, who: 'Inpatient unit · charge nurse', text: 'sees the patient coming and has the room and a nurse ready' },
    ],
    note: { icon: REUSE, text: 'Once the patient leaves the PACU, the card is wiped and reused for the next patient.' },
  },
  cleaning: {
    label: 'How the NFC bed-cleaning status moves information from the room to the bed manager',
    stages: [
      { dept: 'Inpatient unit', icon: WARD, who: 'Unit nurse', steps: [{ text: 'Patient discharged, room flagged for cleaning' }] },
      {
        dept: 'Room cleaning',
        icon: BROOM,
        who: 'EVS staff',
        tag: '7-minute safeguard',
        steps: [
          { text: 'Cleaning in progress', tap: true },
          { text: 'Cleaning finished', tap: true },
        ],
      },
      { dept: 'PACU', icon: RECOVERY_BED, who: 'PACU nurse', steps: [{ text: 'Held patient moves into the clean room sooner', done: true }] },
    ],
    drops: [{ label: 'discharge' }, { label: 'both taps', tap: true }, { label: 'room assigned', up: true }],
    epic: 'turns the taps into the room’s status: Cleaning in progress → Ready to assign',
    outputs: [
      { icon: BOARD, who: 'Command Center · bed manager', text: 'sees “Ready to assign” at once, without waiting for a call, and gives the room to a held patient' },
      { icon: CHART, who: 'EVS supervisor', text: 'sees cleaning times by shift on the dashboard' },
    ],
    note: { icon: NFC, text: 'Cards come from a shared pool handed out at the start of each shift.' },
  },
}

const RightArrow = () => (
  <div className="nf-arrow" aria-hidden="true">
    <svg viewBox="0 0 26 24" width="26" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h21M17 6l6 6-6 6" />
    </svg>
  </div>
)

function Stage({ stage }: { stage: FlowStage }) {
  return (
    <div className={`nf-stage${stage.tag ? ' is-hold' : ''}`}>
      <p className="nf-dept">
        <span className="nf-badge">{stage.icon}</span>
        {stage.dept}
      </p>
      <p className="nf-who">
        {PERSON}
        {stage.who}
      </p>
      <ol className="nf-steps">
        {stage.steps.map((st) => (
          <li key={st.text} className={st.tap ? 'is-tap' : undefined}>
            <span className="nf-chip">{st.tap ? NFC : st.done ? CHECK : EPIC}</span>
            <span>
              {st.tap && <b>Tap: </b>}
              {st.text}
            </span>
          </li>
        ))}
      </ol>
      {stage.tag && <p className="nf-hold-tag">{stage.tag}</p>}
    </div>
  )
}

function TapFlow({ flow }: { flow: Flow }) {
  const [a, b, c] = flow.stages
  return (
    <figure className="nfc-flow" aria-label={flow.label}>
      <div className="nf-lanes">
        <Stage stage={a} />
        <RightArrow />
        <Stage stage={b} />
        <RightArrow />
        <Stage stage={c} />
      </div>

      <div className="nf-feed" aria-hidden="true">
        {flow.drops.flatMap((d, i) => [
          ...(i ? [<span key={`gap${i}`} />] : []),
          d ? (
            <span key={d.label} className={`nf-drop${d.tap ? ' is-tap' : ''}${d.up ? ' is-up' : ''}`}>
              <span>
                {d.tap && NFC}
                {d.label}
              </span>
            </span>
          ) : (
            <span key={`none${i}`} />
          ),
        ])}
      </div>

      <div className="nf-epic">
        <span className="nf-badge">{EPIC}</span>
        <p>
          <b>Epic</b>
          <span>{flow.epic}</span>
        </p>
      </div>

      <div className="nf-outputs">
        {flow.outputs.map((o) => (
          <div key={o.who} className="nf-out">
            <span className="nf-badge is-light">{o.icon}</span>
            <p>
              <b>{o.who}</b>
              <span>{o.text}</span>
            </p>
          </div>
        ))}
      </div>

      <figcaption className="nf-reuse">
        {flow.note.icon}
        {flow.note.text}
      </figcaption>
    </figure>
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
