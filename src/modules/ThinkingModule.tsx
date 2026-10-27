import { useEffect, useMemo, useRef, useState } from 'react'
import { DMAIC_DETAIL, FLOW, ISSUE_TREE, MATRIX, MATRIX_TAKEAWAY, type TreeNode } from '../content/thinking'

type Tab = 'flow' | 'tree' | 'matrix' | 'dmaic'
const TABS: { key: Tab; label: string }[] = [
  { key: 'flow', label: 'Workflow map' },
  { key: 'tree', label: 'Issue tree' },
  { key: 'matrix', label: 'Impact matrix' },
  { key: 'dmaic', label: 'DMAIC' },
]

export default function ThinkingModule() {
  const [tab, setTab] = useState<Tab>('flow')
  const [highlight, setHighlight] = useState<string | null>(null)
  return (
    <>
      <div className="tabs" role="tablist" aria-label="Thinking tools">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tab-panel">
        {tab === 'flow' && <FlowMap />}
        {tab === 'tree' && <IssueTree highlight={highlight} />}
        {tab === 'matrix' && (
          <ImpactMatrix
            onPick={(node) => {
              setHighlight(node)
              setTab('tree')
            }}
          />
        )}
        {tab === 'dmaic' && <Dmaic />}
      </div>
    </>
  )
}

/** Appendix A redrawn: the patient chain, what loads each step, and a patient moving through it. */
function FlowMap() {
  const [run, setRun] = useState(0)
  const card = (title: string, items: string[], tone?: string) => (
    <div className={`flow-card${tone ? ` ${tone}` : ''}`}>
      <b>{title}</b>
      <ul>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  )
  return (
    <section>
      <p>
        We drew the whole path a surgical patient takes and everything that loads each step. Holds appear at the hand-offs,
        where one unit waits on another.
      </p>
      <div className="flow">
        <div className="flow-row flow-top">
          {card('OR load', FLOW.orInputs)}
          {card('PACU nurses', FLOW.nurse, 'is-nurse')}
          {card('Inpatient nurses', FLOW.nurse, 'is-nurse')}
          <span />
        </div>
        <div className="flow-row flow-chain" key={run}>
          {FLOW.stages.map((s, i) => (
            <div key={s} className={`flow-stage${i === 3 ? ' is-end' : ''}`}>
              <span>{s}</span>
            </div>
          ))}
          {['t1', 't2'].map((t) => (
            <span key={t} className={`flow-transfer ${t}`}>
              <small>Transfer</small>
              {FLOW.transfer.map((x) => x.replace('Transfer ', '')).join(' · ')}
            </span>
          ))}
          <span className="flow-patient" aria-hidden="true" />
          <span className="flow-hold" aria-hidden="true">
            hold
          </span>
        </div>
        <div className="flow-row flow-bottom">
          <span />
          <div className="flow-stack">
            {card('Bed manager', FLOW.bedManager, 'is-bed')}
            {card('Beds', FLOW.bed, 'is-bed')}
          </div>
          <div className="flow-stack">
            {card('Bed manager', FLOW.bedManager, 'is-bed')}
            {card('Beds', FLOW.bed, 'is-bed')}
          </div>
          <span />
        </div>
      </div>
      <div className="flow-foot">
        <p>
          The moving dot is one patient. It stalls between the PACU and the inpatient unit — ready to move, but waiting for a
          clean, assigned bed and a nurse who is free.
        </p>
        <button type="button" className="link-button" onClick={() => setRun((n) => n + 1)}>
          Replay
        </button>
      </div>
    </section>
  )
}

function contains(node: TreeNode, id: string): boolean {
  return node.id === id || (node.children ?? []).some((c) => contains(c, id))
}

function matches(node: TreeNode, q: string): boolean {
  return node.label.toLowerCase().includes(q) || (node.children ?? []).some((c) => matches(c, q))
}

/** Appendix B as a collapsible tree, searchable, and able to jump to a node from the matrix. */
function IssueTree({ highlight }: { highlight: string | null }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(() => new Set(['root', 'or', 'pacu', 'inpatient', 'hospital']))
  const q = query.trim().toLowerCase()
  const found = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!highlight) return
    setOpen((prev) => {
      const next = new Set(prev)
      const walk = (n: TreeNode) => {
        if (contains(n, highlight)) {
          next.add(n.id)
          n.children?.forEach(walk)
        }
      }
      walk(ISSUE_TREE)
      return next
    })
  }, [highlight])

  useEffect(() => {
    found.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlight, open])

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const render = (n: TreeNode, depth: number) => {
    if (q && !matches(n, q)) return null
    const expanded = q ? true : open.has(n.id)
    const hit = q && n.label.toLowerCase().includes(q)
    const isTarget = highlight === n.id
    return (
      <li key={n.id} ref={isTarget ? found : undefined} className={`${hit ? 'is-hit' : ''}${isTarget ? ' is-target' : ''}`}>
        {n.children ? (
          <button type="button" className={`tree-node depth-${depth}`} aria-expanded={expanded} onClick={() => toggle(n.id)}>
            <span className="caret" aria-hidden="true">
              {expanded ? '▾' : '▸'}
            </span>
            {n.label}
          </button>
        ) : (
          <span className={`tree-leaf depth-${depth}`}>{n.label}</span>
        )}
        {n.children && expanded && <ul>{n.children.map((c) => render(c, depth + 1))}</ul>}
      </li>
    )
  }

  const all = useMemo(() => {
    const ids: string[] = []
    const walk = (n: TreeNode) => {
      if (n.children) {
        ids.push(n.id)
        n.children.forEach(walk)
      }
    }
    walk(ISSUE_TREE)
    return ids
  }, [])

  return (
    <section>
      <p>
        Every contributor to a hold, split by where it happens. Keeping the branches mutually exclusive forced us to dig into
        each unit instead of repeating “communication” everywhere.
      </p>
      <div className="tree-tools">
        <input type="search" placeholder="Search the tree…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the issue tree" />
        <button type="button" className="link-button" onClick={() => setOpen(new Set(all))}>
          Expand all
        </button>
        <button type="button" className="link-button" onClick={() => setOpen(new Set(['root']))}>
          Collapse all
        </button>
      </div>
      <ul className="tree">{render(ISSUE_TREE, 0)}</ul>
    </section>
  )
}

/** Appendix C: impact × effort, round 1 vs the revised round 2. Click a point to find it in the tree. */
function ImpactMatrix({ onPick }: { onPick: (node: string) => void }) {
  const [round, setRound] = useState<'r1' | 'r2'>('r2')
  const [hover, setHover] = useState<string | null>(null)
  const W = 560
  const H = 400
  const X0 = 56
  const X1 = 540
  const Y0 = 16
  const Y1 = 352
  const px = (x: number) => X0 + x * (X1 - X0)
  const py = (y: number) => Y1 - y * (Y1 - Y0)
  return (
    <section>
      <div className="matrix-head">
        <p>{MATRIX_TAKEAWAY}</p>
        <div className="seg seg-small" role="group" aria-label="Round">
          <button type="button" aria-pressed={round === 'r1'} onClick={() => setRound('r1')}>
            Round 1
          </button>
          <button type="button" aria-pressed={round === 'r2'} onClick={() => setRound('r2')}>
            Round 2 (revised)
          </button>
        </div>
      </div>
      <div className="matrix">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Impact versus effort, ${round === 'r1' ? 'first' : 'revised'} round`}>
          <rect x={X0} y={Y0} width={(X1 - X0) / 2} height={(Y1 - Y0) / 2} className="quick-wins" />
          <line x1={X0} x2={X1} y1={(Y0 + Y1) / 2} y2={(Y0 + Y1) / 2} className="mid" />
          <line x1={(X0 + X1) / 2} x2={(X0 + X1) / 2} y1={Y0} y2={Y1} className="mid" />
          <line x1={X0} x2={X1} y1={Y1} y2={Y1} className="axis" />
          <line x1={X0} x2={X0} y1={Y0} y2={Y1} className="axis" />
          <text x={X0 + 8} y={Y0 + 16} className="quad">Quick wins</text>
          <text x={X1 - 8} y={Y0 + 16} className="quad" textAnchor="end">Major projects</text>
          <text x={X0 + 8} y={Y1 - 8} className="quad">Fill-ins</text>
          <text x={X1 - 8} y={Y1 - 8} className="quad" textAnchor="end">Hard, low payoff</text>
          <text x={(X0 + X1) / 2} y={H - 14} className="axis-label" textAnchor="middle">Effort →</text>
          <text x={18} y={(Y0 + Y1) / 2} className="axis-label" textAnchor="middle" transform={`rotate(-90 18 ${(Y0 + Y1) / 2})`}>
            Impact →
          </text>
          {MATRIX.map((m, i) => {
            const pos = m[round]
            const shown = Boolean(pos)
            const [x, y] = pos ?? m.r1 ?? m.r2 ?? [0.5, 0.5]
            return (
              <g
                key={m.key}
                className={`pt${hover === m.key ? ' is-hover' : ''}`}
                style={{ transform: `translate(${px(x)}px, ${py(y)}px)`, opacity: shown ? 1 : 0, pointerEvents: shown ? 'auto' : 'none' }}
                tabIndex={shown ? 0 : -1}
                role="button"
                aria-label={`${i + 1}. ${m.label} — show in the issue tree`}
                onMouseEnter={() => setHover(m.key)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(m.key)}
                onBlur={() => setHover(null)}
                onClick={() => onPick(m.node)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onPick(m.node)
                }}
              >
                <circle r={14} className="hit" />
                <circle r={10} className="dot" />
                <text dy={4} textAnchor="middle">
                  {i + 1}
                </text>
              </g>
            )
          })}
        </svg>
        <ol className="matrix-list">
          {MATRIX.map((m, i) => (
            <li
              key={m.key}
              className={`${m[round] ? '' : 'is-off'}${hover === m.key ? ' is-hover' : ''}`}
              onMouseEnter={() => setHover(m.key)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="num">{i + 1}</span>
              {m.label}
            </li>
          ))}
        </ol>
      </div>
      <p className="sources">Positions read off the team’s two hand-drawn rounds; click a point to find it in the issue tree.</p>
    </section>
  )
}

function Dmaic() {
  return (
    <section>
      <ol className="dmaic-steps">
        {DMAIC_DETAIL.map((d, i) => (
          <li key={d.step}>
            <span className="num">{i + 1}</span>
            <b>{d.step}</b>
            <span className="tools">{d.tools}</span>
            <p>{d.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
