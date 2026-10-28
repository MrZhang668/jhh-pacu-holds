import type React from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  DMAIC_DETAIL,
  DMAIC_DETAIL_ZH,
  ISSUE_TREE,
  ISSUE_TREE_ZH,
  MATRIX,
  MATRIX_TAKEAWAY,
  MATRIX_TAKEAWAY_ZH,
  MATRIX_ZH,
  type TreeNode,
} from '../content/thinking'
import { useL, useT } from '../state/lang'
import { WorkflowScene } from './WorkflowScene'

type Tab = 'flow' | 'tree' | 'matrix'
const TABS: { key: Tab; label: string; zh: string }[] = [
  { key: 'flow', label: 'Workflow map', zh: '工作流程图' },
  { key: 'tree', label: 'Issue tree', zh: '问题树' },
  { key: 'matrix', label: 'Impact matrix', zh: '影响矩阵' },
]

export default function ThinkingModule() {
  const t = useT()
  const [tab, setTab] = useState<Tab>('flow')
  const [highlight, setHighlight] = useState<string | null>(null)
  const tabs = useRef<HTMLDivElement>(null)
  return (
    <>
      <DmaicFlow
        onOpen={(next) => {
          setTab(next)
          tabs.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        }}
      />
      <div ref={tabs} className="tabs" role="tablist" aria-label={t('Thinking tools', '分析工具')}>
        {TABS.map((x) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            id={`tab-${x.key}`}
            aria-selected={tab === x.key}
            aria-controls={`panel-${x.key}`}
            onClick={() => setTab(x.key)}
          >
            {t(x.label, x.zh)}
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
  const t = useT()
  return (
    <section>
      <p>
        {t(
          'We followed one surgical patient from the OR to home. Holds appear at the hand-offs, where one unit waits on another. Glowing icons matter at the current step; tap any icon to see what loads it.',
          '我们跟随一位手术患者，从手术室（OR）一直走到出院回家。滞留出现在交接环节，即一个科室在等待另一个科室的时候。发光的图标表示与当前步骤相关；点击任一图标，可查看影响该环节的因素。',
        )}
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

const CJK = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/
const CJK_WORDS = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]|[^\s\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]+/g

/**
 * Lines a label wraps to in `width` px, greedy by word. A Chinese character can break anywhere and is
 * about two Latin glyphs wide; English labels take the original word-by-word path unchanged.
 */
function lineCount(text: string, width: number, char: number) {
  const per = Math.max(8, Math.floor(width / char))
  let lines = 1
  let used = 0
  if (!CJK.test(text)) {
    for (const word of text.split(' ')) {
      const len = word.length + (used ? 1 : 0)
      if (used && used + len > per) {
        lines++
        used = word.length
      } else used += len
    }
    return lines
  }
  let prevCjk = true
  for (const word of text.match(CJK_WORDS) ?? []) {
    const cjk = CJK.test(word)
    const size = cjk ? 2 : word.length
    const len = size + (used && !cjk && !prevCjk ? 1 : 0)
    if (used && used + len > per) {
      lines++
      used = size
    } else used += len
    prevCjk = cjk
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
  const t = useT()
  const tree = useL(ISSUE_TREE, ISSUE_TREE_ZH)
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
  place(tree, 0, -1)
  const height = cursor + MAP_PAD
  const x0 = (d: number) => MAP_COLS[d][0] * width
  const x1 = (d: number) => MAP_COLS[d][1] * width


  return (
    <section>
      <p>
        {t(
          'Every contributor to a hold, split by where it happens. Keeping the branches mutually exclusive forced us to dig into each unit instead of repeating “communication” everywhere.',
          '按发生地点拆分的所有滞留影响因素。保持各分支相互独立，迫使我们深入分析每个科室，而不是处处重复“沟通”二字。',
        )}
      </p>
      <div className="tree-tools">
        <input
          type="search"
          placeholder={t('Search the tree…', '搜索问题树…')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('Search the issue tree', '搜索问题树')}
        />
        <button type="button" className="link-button" onClick={() => setOpen(new Set(ALL_BRANCHES))}>
          {t('Expand all', '全部展开')}
        </button>
        <button type="button" className="link-button" onClick={() => setOpen(new Set(['root']))}>
          {t('Collapse all', '全部收起')}
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

// where an issue happens, from its node in the issue tree; colours match the tree's branches
const LOCATIONS = ['Operating room', 'PACU', 'Inpatient unit', 'Hospital-wide']
const LOCATIONS_ZH: typeof LOCATIONS = ['手术室', 'PACU', '住院病区', '全院层面']
const locOf = (node: string) => (node.startsWith('or-') ? 0 : node.startsWith('pacu-') ? 1 : node.startsWith('in-') ? 2 : 3)

// quadrants in reading order, matching the chart: top-left, top-right, bottom-left, bottom-right
const QUADS = [
  { name: 'Quick wins', note: 'High impact · low effort' },
  { name: 'Major projects', note: 'High impact · high effort' },
  { name: 'Fill-ins', note: 'Low impact · low effort' },
  { name: 'Hard, low payoff', note: 'Low impact · high effort' },
]
const QUADS_ZH: typeof QUADS = [
  { name: '速赢项', note: '高影响 · 低投入' },
  { name: '重点项目', note: '高影响 · 高投入' },
  { name: '补充项', note: '低影响 · 低投入' },
  { name: '难度大、回报低', note: '低影响 · 高投入' },
]
const quadOf = ([x, y]: [number, number]) => (y >= 0.5 ? 0 : 2) + (x >= 0.5 ? 1 : 0)

/** Appendix C: impact × effort, sorted into quadrants and coloured by location. */
function ImpactMatrix({ onPick }: { onPick: (node: string) => void }) {
  const t = useT()
  const matrix = useL(MATRIX, MATRIX_ZH)
  const locations = useL(LOCATIONS, LOCATIONS_ZH)
  const quads = useL(QUADS, QUADS_ZH)
  const [hover, setHover] = useState<string | null>(null)
  const [loc, setLoc] = useState<number | null>(null)
  const [quad, setQuad] = useState<number | null>(null)
  const W = 560
  const H = 430
  const X0 = 56
  const X1 = 540
  const Y0 = 34
  const Y1 = 370
  const XM = (X0 + X1) / 2
  const YM = (Y0 + Y1) / 2
  const px = (x: number) => X0 + x * (X1 - X0)
  const py = (y: number) => Y1 - y * (Y1 - Y0)
  // numbered in reading order: quadrant by quadrant, so each list counts up
  const ranked = [...matrix].sort((a, b) => quadOf(a.pos) - quadOf(b.pos))
  const items = matrix.map((m) => ({ ...m, n: ranked.indexOf(m) + 1, loc: locOf(m.node) }))
  const lit = (m: (typeof items)[number]) => (loc === null || m.loc === loc) && (quad === null || quadOf(m.pos) === quad)
  const quadRect = [
    [X0, Y0],
    [XM, Y0],
    [X0, YM],
    [XM, YM],
  ]
  return (
    <section>
      <p>{t(MATRIX_TAKEAWAY, MATRIX_TAKEAWAY_ZH)}</p>
      <div className="mx-legend" role="group" aria-label={t('Filter by where the issue happens', '按问题发生地点筛选')}>
        {locations.map((l, i) => (
          <button key={l} type="button" className={`mx-chip c${i}`} aria-pressed={loc === i} onClick={() => setLoc(loc === i ? null : i)}>
            <span className="mx-swatch" aria-hidden="true" />
            {l}
            <span className="mx-count">{items.filter((m) => m.loc === i).length}</span>
          </button>
        ))}
      </div>
      <div className="matrix mx">
        <div className="mx-plot">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('Impact versus effort', '影响与投入对比')}>
            {quads.map((q, i) => {
              const [x, y] = quadRect[i]
              const n = items.filter((m) => quadOf(m.pos) === i).length
              return (
                <g key={q.name} className={`mx-quad q${i}${quad === i ? ' is-on' : ''}${quad !== null && quad !== i ? ' is-off' : ''}`}>
                  <rect x={x} y={y} width={XM - X0} height={YM - Y0} />
                  {/* labels sit outside the plot so they never cover a point */}
                  <text x={i % 2 ? x + (XM - X0) : x + 4} y={i < 2 ? Y0 - 10 : Y1 + 22} textAnchor={i % 2 ? 'end' : 'start'}>
                    {q.name} · {n}
                  </text>
                </g>
              )
            })}
            <line x1={XM} x2={XM} y1={Y0} y2={Y1} className="mx-mid" />
            <line x1={X0} x2={X1} y1={YM} y2={YM} className="mx-mid" />
            <line x1={X0} x2={X1} y1={Y1} y2={Y1} className="axis" />
            <line x1={X0} x2={X0} y1={Y0} y2={Y1} className="axis" />
            <text x={XM} y={H - 8} className="axis-label" textAnchor="middle">
              {t('Effort →', '投入 →')}
            </text>
            <text x={18} y={YM} className="axis-label" textAnchor="middle" transform={`rotate(-90 18 ${YM})`}>
              {t('Impact →', '影响 →')}
            </text>
            {items.map((m) => {
              const [x, y] = m.pos
              return (
                <g
                  key={m.key}
                  className={`pt c${m.loc}${hover === m.key ? ' is-hover' : ''}${lit(m) ? '' : ' is-dim'}`}
                  style={{ transform: `translate(${px(x)}px, ${py(y)}px)` }}
                  tabIndex={0}
                  role="button"
                  aria-label={t(
                    `${m.n}. ${m.label}, ${locations[m.loc]} — show in the issue tree`,
                    `${m.n}. ${m.label}，${locations[m.loc]}：在问题树中查看`,
                  )}
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
                  <circle r={11} className="dot" />
                  <text dy={4} textAnchor="middle">
                    {m.n}
                  </text>
                </g>
              )
            })}
            {hover &&
              (() => {
                const m = items.find((i) => i.key === hover)
                if (!m) return null
                const x = px(m.pos[0])
                const y = py(m.pos[1])
                const left = m.pos[0] > 0.6
                return (
                  <g className="mx-tag" transform={`translate(${x + (left ? -18 : 18)} ${y})`}>
                    <text textAnchor={left ? 'end' : 'start'} dy={4}>
                      {m.label}
                    </text>
                  </g>
                )
              })()}
          </svg>
        </div>
        {/* the same four quadrants as lists, laid out like the chart */}
        <div className="mx-quads">
          {quads.map((q, i) => {
            const list = items.filter((m) => quadOf(m.pos) === i)
            return (
              <div
                key={q.name}
                className={`mx-box q${i}${quad === i ? ' is-on' : ''}`}
                onMouseEnter={() => setQuad(i)}
                onMouseLeave={() => setQuad(null)}
              >
                <div className="mx-box-head">
                  <b>{q.name}</b>
                  <span>{q.note}</span>
                </div>
                {list.length ? (
                  <ul>
                    {list.map((m) => (
                      <li
                        key={m.key}
                        className={`c${m.loc}${hover === m.key ? ' is-hover' : ''}${lit(m) ? '' : ' is-dim'}`}
                        onMouseEnter={() => setHover(m.key)}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => onPick(m.node)}
                      >
                        <span className="mx-num">{m.n}</span>
                        <span>{m.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mx-empty">{t('None', '无')}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <p className="sources">
        {t(
          'Positions read off the team’s hand-drawn matrix. Colours show where each issue happens; click a point or an item to find it in the issue tree.',
          '各点位置取自团队手绘的矩阵。颜色表示问题发生的地点；点击某个点或条目，即可在问题树中找到它。',
        )}
      </p>
    </section>
  )
}

// where each step's work lives on the site: a tab below, or the outcomes module
const DMAIC_LINKS: ({ tab: Tab; label: string; zh: string } | { href: string; label: string; zh: string })[] = [
  { tab: 'flow', label: 'Open the workflow map', zh: '打开工作流程图' },
  { tab: 'tree', label: 'Open the issue tree', zh: '打开问题树' },
  { tab: 'matrix', label: 'Open the impact matrix', zh: '打开影响矩阵' },
  { href: '#/outcomes', label: 'See the three interventions', zh: '查看三项改进措施' },
  { href: '#/outcomes', label: 'See the roll-out plan', zh: '查看推行计划' },
]

/** The five DMAIC steps as one interlocking arrow; a step's detail opens beneath it on hover or tap. */
function DmaicFlow({ onOpen }: { onOpen: (t: Tab) => void }) {
  const t = useT()
  const steps = useL(DMAIC_DETAIL, DMAIC_DETAIL_ZH)
  const [on, setOn] = useState<number | null>(null)
  const d = on === null ? null : steps[on]
  // the English step name: the big letter, keys, and the gloss after the Chinese title
  const en = on === null ? null : DMAIC_DETAIL[on].step
  const link = on === null ? null : DMAIC_LINKS[on]
  return (
    <section className="dmaic-flow" aria-label={t('How we worked: DMAIC', '工作方法：DMAIC')} onMouseLeave={() => setOn(null)}>
      <p className="dm-eyebrow">{t('How we worked · DMAIC', '工作方法 · DMAIC')}</p>
      <ol className="dm-chain">
        {steps.map((s, i) => (
          <li key={DMAIC_DETAIL[i].step} className={`dm-step s${i}${on === i ? ' is-on' : ''}${on !== null && on !== i ? ' is-off' : ''}`}>
            <button
              type="button"
              aria-expanded={on === i}
              aria-controls="dm-detail"
              onMouseEnter={() => setOn(i)}
              onFocus={() => setOn(i)}
              onClick={() => setOn(on === i ? null : i)}
            >
              <span className="dm-letter" aria-hidden="true">
                {DMAIC_DETAIL[i].step[0]}
              </span>
              <span className="dm-name">{s.step}</span>
            </button>
          </li>
        ))}
      </ol>
      <div id="dm-detail" className={`dm-detail${d ? ' is-open' : ''}`} style={{ '--at': `${(on ?? 0) * 20 + 10}%` } as React.CSSProperties}>
        <div className="dm-clip">
          {d && link && (
            <div className="dm-card" key={en}>
              <b className="dm-title">{t(d.step, `${d.step}（${en}）`)}</b>
              <span className="dm-tools">{d.tools}</span>
              <p>{d.text}</p>
              {'tab' in link ? (
                <button type="button" className="link-button" onClick={() => onOpen(link.tab)}>
                  {t(link.label, link.zh)} ↓
                </button>
              ) : (
                <a className="link-button" href={link.href}>
                  {t(link.label, link.zh)} →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      {!d && <p className="dm-hint">{t('Hover or tap a step to see what we did.', '将鼠标悬停在某一步骤上或点击它，查看我们做了什么。')}</p>}
    </section>
  )
}
