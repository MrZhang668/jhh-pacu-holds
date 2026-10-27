import type React from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DMAIC_DETAIL, ISSUE_TREE, MATRIX, MATRIX_TAKEAWAY, type TreeNode } from '../content/thinking'
import { WorkflowScene } from './WorkflowScene'

type Tab = 'flow' | 'tree' | 'matrix'
const TABS: { key: Tab; label: string }[] = [
  { key: 'flow', label: 'Workflow map' },
  { key: 'tree', label: 'Issue tree' },
  { key: 'matrix', label: 'Impact matrix' },
]

export default function ThinkingModule() {
  const [tab, setTab] = useState<Tab>('flow')
  const [highlight, setHighlight] = useState<string | null>(null)
  const tabs = useRef<HTMLDivElement>(null)
  return (
    <>
      <DmaicFlow
        onOpen={(t) => {
          setTab(t)
          tabs.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        }}
      />
      <div ref={tabs} className="tabs" role="tablist" aria-label="Thinking tools">
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
      </div>
    </>
  )
}

/** Appendix A redrawn: one patient's path, step by step, with what loads each step behind icons. */
function FlowMap() {
  return (
    <section>
      <p>
        We followed one surgical patient from the OR to home. Holds appear at the hand-offs, where one unit waits on
        another. Glowing icons matter at the current step; tap any icon to see what loads it.
      </p>
      <WorkflowScene />
    </section>
  )
}

function contains(node: TreeNode, id: string): boolean {
  return node.id === id || (node.children ?? []).some((c) => contains(c, id))
}

function matches(node: TreeNode, q: string): boolean {
  return node.label.toLowerCase().includes(q) || (node.children ?? []).some((c) => matches(c, q))
}

// mind-map columns as shares of the width: root card, then one column per level
const MAP_COLS: [number, number][] = [
  [0, 0.18],
  [0.205, 0.39],
  [0.415, 0.655],
  [0.68, 1],
]
const MAP_ROW = 42
// average glyph width per level, for guessing how a label wraps
const MAP_CHAR = [8, 7.8, 7, 6.6]

/** Lines a label wraps to in `width` px, greedy by word. */
function lineCount(text: string, width: number, char: number) {
  const per = Math.max(8, Math.floor(width / char))
  let lines = 1
  let used = 0
  for (const word of text.split(' ')) {
    const len = word.length + (used ? 1 : 0)
    if (used && used + len > per) {
      lines++
      used = word.length
    } else used += len
  }
  return lines
}
const MAP_PAD = 14
const MAP_MIN = 600

// every node with children; the map starts fully open, like the team's drawing
const ALL_BRANCHES: string[] = []
;(function walk(n: TreeNode) {
  if (n.children) {
    ALL_BRANCHES.push(n.id)
    n.children.forEach(walk)
  }
})(ISSUE_TREE)

interface Placed {
  node: TreeNode
  depth: number
  /** which top-level branch it hangs from (colour) */
  branch: number
  parent?: Placed
  y: number
  /** children hidden while folded */
  folded: number
}

/** Appendix B as a mind map: foldable, searchable, and able to jump to a node from the matrix. */
function IssueTree({ highlight }: { highlight: string | null }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(() => new Set(ALL_BRANCHES))
  const q = query.trim().toLowerCase()
  const found = useRef<HTMLElement>(null)

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

  // the map is laid out to the panel's width; narrower than MAP_MIN it scrolls sideways
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(760)
  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const fit = () => setWidth(Math.max(MAP_MIN, el.clientWidth))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // every shown leaf (or folded node) takes a row; a parent sits halfway between its first and last child
  const placed: Placed[] = []
  let cursor = MAP_PAD
  const place = (n: TreeNode, depth: number, branch: number, parent?: Placed): Placed => {
    const kids = n.children ?? []
    const shown = kids.length > 0 && (q ? true : open.has(n.id))
    const p: Placed = { node: n, depth, branch, parent, y: 0, folded: shown ? 0 : kids.length }
    placed.push(p)
    if (shown) {
      const cs = kids.map((c, i) => place(c, depth + 1, depth === 0 ? i : branch, p))
      p.y = (cs[0].y + cs[cs.length - 1].y) / 2
    } else {
      // a leaf's row grows with the lines its label wraps to
      const w = (MAP_COLS[depth][1] - MAP_COLS[depth][0]) * width - 10
      const h = Math.max(MAP_ROW, lineCount(n.label + (p.folded ? ' +0' : ''), w, MAP_CHAR[depth]) * 17 + 22)
      p.y = cursor + h / 2
      cursor += h
    }
    return p
  }
  place(ISSUE_TREE, 0, -1)
  const height = cursor + MAP_PAD
  const x0 = (d: number) => MAP_COLS[d][0] * width
  const x1 = (d: number) => MAP_COLS[d][1] * width


  return (
    <section>
      <p>
        Every contributor to a hold, split by where it happens. Keeping the branches mutually exclusive forced us to dig into
        each unit instead of repeating “communication” everywhere.
      </p>
      <div className="tree-tools">
        <input type="search" placeholder="Search the tree…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the issue tree" />
        <button type="button" className="link-button" onClick={() => setOpen(new Set(ALL_BRANCHES))}>
          Expand all
        </button>
        <button type="button" className="link-button" onClick={() => setOpen(new Set(['root']))}>
          Collapse all
        </button>
      </div>
      <div className="mindmap-scroll" ref={wrap}>
        <div className="mindmap" style={{ width, height }}>
          <svg width={width} height={height} aria-hidden="true">
            {placed.map((p) => {
              if (p.depth === 0) return null
              const sx = x1(p.depth - 1)
              const ex = x0(p.depth)
              const mx = (sx + ex) / 2
              const py = p.parent!.y
              return (
                <path
                  key={p.node.id}
                  className={`mm-edge b${p.branch} d${p.depth}${q && !matches(p.node, q) ? ' is-dim' : ''}`}
                  d={`M${sx} ${py}C${mx} ${py} ${mx} ${p.y} ${ex} ${p.y}H${x1(p.depth)}`}
                />
              )
            })}
          </svg>
          {placed.map((p) => {
            const hit = q && p.node.label.toLowerCase().includes(q)
            const isTarget = highlight === p.node.id
            const cls = `mm-node d${p.depth}${p.depth > 0 ? ` b${p.branch}` : ''}${hit ? ' is-hit' : ''}${isTarget ? ' is-target' : ''}${
              q && !matches(p.node, q) ? ' is-dim' : ''
            }`
            const style =
              p.depth === 0
                ? { left: 0, top: p.y, width: x1(0) }
                : { left: x0(p.depth), top: p.y, width: x1(p.depth) - x0(p.depth) - 6 }
            const body = (
              <>
                {p.node.label}
                {p.folded > 0 && <span className="mm-more">+{p.folded}</span>}
              </>
            )
            return p.node.children && p.depth > 0 ? (
              <button
                key={p.node.id}
                ref={isTarget ? (found as React.RefObject<HTMLButtonElement>) : undefined}
                type="button"
                className={cls}
                style={style}
                aria-expanded={!p.folded}
                onClick={() => toggle(p.node.id)}
              >
                {body}
              </button>
            ) : (
              <div key={p.node.id} ref={isTarget ? (found as React.RefObject<HTMLDivElement>) : undefined} className={cls} style={style}>
                {body}
              </div>
            )
          })}
        </div>
      </div>
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

// where each step's work lives on the site: a tab below, or the outcomes module
const DMAIC_LINKS: ({ tab: Tab; label: string } | { href: string; label: string })[] = [
  { tab: 'flow', label: 'Open the workflow map' },
  { tab: 'tree', label: 'Open the issue tree' },
  { tab: 'matrix', label: 'Open the impact matrix' },
  { href: '#/outcomes', label: 'See the three interventions' },
  { href: '#/outcomes', label: 'See the roll-out plan' },
]

/** The five DMAIC steps as one interlocking arrow; a step's detail opens beneath it on hover or tap. */
function DmaicFlow({ onOpen }: { onOpen: (t: Tab) => void }) {
  const [on, setOn] = useState<number | null>(null)
  const d = on === null ? null : DMAIC_DETAIL[on]
  const link = on === null ? null : DMAIC_LINKS[on]
  return (
    <section className="dmaic-flow" aria-label="How we worked: DMAIC" onMouseLeave={() => setOn(null)}>
      <p className="dm-eyebrow">How we worked · DMAIC</p>
      <ol className="dm-chain">
        {DMAIC_DETAIL.map((s, i) => (
          <li key={s.step} className={`dm-step s${i}${on === i ? ' is-on' : ''}${on !== null && on !== i ? ' is-off' : ''}`}>
            <button
              type="button"
              aria-expanded={on === i}
              aria-controls="dm-detail"
              onMouseEnter={() => setOn(i)}
              onFocus={() => setOn(i)}
              onClick={() => setOn(on === i ? null : i)}
            >
              <span className="dm-letter" aria-hidden="true">
                {s.step[0]}
              </span>
              <span className="dm-name">{s.step}</span>
            </button>
          </li>
        ))}
      </ol>
      <div id="dm-detail" className={`dm-detail${d ? ' is-open' : ''}`} style={{ '--at': `${(on ?? 0) * 20 + 10}%` } as React.CSSProperties}>
        <div className="dm-clip">
          {d && link && (
            <div className="dm-card" key={d.step}>
              <b className="dm-title">{d.step}</b>
              <span className="dm-tools">{d.tools}</span>
              <p>{d.text}</p>
              {'tab' in link ? (
                <button type="button" className="link-button" onClick={() => onOpen(link.tab)}>
                  {link.label} ↓
                </button>
              ) : (
                <a className="link-button" href={link.href}>
                  {link.label} →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      {!d && <p className="dm-hint">Hover or tap a step to see what we did.</p>}
    </section>
  )
}
