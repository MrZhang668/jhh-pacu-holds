import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { REASONS, TARGETED_SHARE, type FixKey } from '../content/holdData'
import { SOLUTIONS } from '../content/outcomes'
import { navigate } from '../router'
import { Sketch } from './sketches'
import { ChartCard, LegendKey, pct } from './viz'

/**
 * "Why patients wait" as a routing chart: each targeted reason runs a gold wire from its bar to the
 * intervention that answers it. Hovering a bar or an intervention lights its routes and shows a card;
 * clicking opens the intervention (a reason with two routes asks which one first).
 */

type Focus = { kind: 'reason'; i: number } | { kind: 'fix'; key: FixKey }

const MAX = 25
const OUT_OF_SCOPE = 'Outside our three fixes: a candidate for the next round.'
const FIX_SHARE = Object.fromEntries(
  SOLUTIONS.map((s) => [s.key, REASONS.reduce((sum, r) => sum + (r.fixes.includes(s.key) ? r.share : 0), 0)]),
) as Record<FixKey, number>
const solution = (key: FixKey) => SOLUTIONS.find((s) => s.key === key)!
const openFix = (key: FixKey) => navigate(`outcomes/${key}`)

interface Wire {
  id: string
  i: number
  key: FixKey
  d: string
  end: [number, number]
}

export function RoutedReasons() {
  const host = useRef<HTMLDivElement>(null)
  const values = useRef<(HTMLSpanElement | null)[]>([])
  const rows = useRef<(HTMLElement | null)[]>([])
  const fixes = useRef<Partial<Record<FixKey, HTMLButtonElement | null>>>({})
  const bars = useRef<HTMLDivElement>(null)
  const columnOfFixes = useRef<HTMLDivElement>(null)
  const [wires, setWires] = useState<Wire[]>([])
  const [focus, setFocus] = useState<Focus | null>(null)
  const [pinned, setPinned] = useState<number | null>(null)
  const [cardAt, setCardAt] = useState<{ top: number; left: number } | null>(null)
  const card = useRef<HTMLDivElement>(null)

  // wires run from the end of each bar's value, along the row, then curve into the intervention
  const layout = useCallback(() => {
    const box = host.current?.getBoundingClientRect()
    const column = bars.current?.getBoundingClientRect()
    if (!box || !column) return
    const next: Wire[] = []
    REASONS.forEach((r, i) => {
      const v = values.current[i]?.getBoundingClientRect()
      if (!v) return
      for (const key of r.fixes) {
        const f = fixes.current[key]?.getBoundingClientRect()
        if (!f || f.width === 0) continue
        const sx = v.right - box.left + 8
        const sy = v.top + v.height / 2 - box.top
        const tx = Math.max(column.right - box.left + 6, sx)
        const ex = f.left - box.left - 4
        const ey = f.top + f.height / 2 - box.top
        const bend = (ex - tx) * 0.55
        next.push({
          id: `${i}-${key}`,
          i,
          key,
          d: `M${sx} ${sy}H${tx}C${tx + bend} ${sy} ${ex - bend} ${ey} ${ex} ${ey}`,
          end: [ex, ey],
        })
      }
    })
    setWires(next)
  }, [])

  useLayoutEffect(() => {
    layout()
    const ro = new ResizeObserver(layout)
    for (const el of [host.current, bars.current, columnOfFixes.current]) if (el) ro.observe(el)
    // the value labels move once the web font arrives
    document.fonts?.ready.then(layout)
    return () => ro.disconnect()
  }, [layout])

  // the card sits under the hovered row, or beside the hovered intervention
  useLayoutEffect(() => {
    const box = host.current?.getBoundingClientRect()
    if (!focus || !box) return setCardAt(null)
    const width = card.current?.offsetWidth ?? 300
    if (focus.kind === 'reason') {
      const row = rows.current[focus.i]?.getBoundingClientRect()
      const v = values.current[focus.i]?.getBoundingClientRect()
      if (!row || !v) return
      const left = Math.max(0, Math.min(v.right - box.left - width / 2, box.width - width))
      setCardAt({ top: row.bottom - box.top + 4, left })
    } else {
      const f = fixes.current[focus.key]?.getBoundingClientRect()
      if (!f) return
      setCardAt({ top: f.top - box.top, left: Math.max(0, f.left - box.left - width - 12) })
    }
  }, [focus])

  // a pinned choice closes on a click elsewhere
  useEffect(() => {
    if (pinned === null) return
    const away = (e: PointerEvent) => {
      if (!card.current?.contains(e.target as Node)) unpin()
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [pinned])

  const unpin = () => {
    setPinned(null)
    setFocus(null)
  }
  const hover = (f: Focus | null) => {
    if (pinned === null) setFocus(f)
  }

  const litReasons = new Set<number>()
  const litFixes = new Set<FixKey>()
  if (focus?.kind === 'reason') {
    litReasons.add(focus.i)
    REASONS[focus.i].fixes.forEach((k) => litFixes.add(k))
  } else if (focus?.kind === 'fix') {
    litFixes.add(focus.key)
    REASONS.forEach((r, i) => r.fixes.includes(focus.key) && litReasons.add(i))
  }

  const pick = (i: number) => {
    const r = REASONS[i]
    if (r.fixes.length === 1) openFix(r.fixes[0])
    else if (r.fixes.length > 1) {
      setFocus({ kind: 'reason', i })
      setPinned(i)
    }
  }

  // Escape closes a pinned choice first, and only then (on a second press) the whole panel
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || pinned === null) return
    e.stopPropagation()
    const back = pinned
    unpin()
    rows.current[back]?.focus()
  }

  return (
    <ChartCard
      title="Why patients wait, and where each reason goes"
      headline={`Four reasons cover ${TARGETED_SHARE}% of holds, and each one already has a fix waiting for it.`}
      legend={
        <>
          <span className="legend-key">
            <i className="wire-key" aria-hidden="true" />
            Gold line: routed to an intervention
          </span>
          <LegendKey color="var(--viz-2)" label="Grey: outside our scope" />
        </>
      }
    >
      <div className="routes-wrap">
        <div className={`routes${focus ? ' is-focusing' : ''}`} ref={host} onKeyDown={onKey}>
          <div className="routes-bars" ref={bars}>
            <div className="route-row bar-axis" aria-hidden="true">
              <span />
              <span className="bar-track">
                {[0, 10, 20].map((t) => (
                  <span key={t} className="tick" style={{ left: `${(t / MAX) * 100}%` }}>
                    {t}%
                  </span>
                ))}
              </span>
            </div>
            {REASONS.map((r, i) => {
              const targeted = r.fixes.length > 0
              const body = (
                <>
                  <span className="bar-label">
                    {r.label}
                    {targeted && (
                      <span className="route-tags" aria-hidden="true">
                        {r.fixes.map((k) => (
                          <span key={k}>→ {solution(k).title}</span>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="bar-track">
                    {[10, 20].map((t) => (
                      <i key={t} className="grid" style={{ left: `${(t / MAX) * 100}%` }} aria-hidden="true" />
                    ))}
                    <span className={`bar${targeted ? ' is-targeted' : ''}`} style={{ width: `${(r.share / MAX) * 100}%` }} />
                    <span className="bar-value" ref={(el) => void (values.current[i] = el)}>
                      {pct(r.share)}
                    </span>
                  </span>
                </>
              )
              const common = {
                className: `route-row${litReasons.has(i) ? ' is-lit' : ''}${targeted ? ' is-targeted' : ''}`,
                onPointerEnter: () => hover({ kind: 'reason', i }),
                onPointerLeave: () => hover(null),
                onFocus: () => hover({ kind: 'reason', i }),
                onBlur: () => hover(null),
              }
              return targeted ? (
                <button
                  key={r.label}
                  type="button"
                  {...common}
                  ref={(el) => void (rows.current[i] = el)}
                  aria-label={`${r.label}, ${pct(r.share)} of holds. Routed to ${r.fixes.map((k) => solution(k).title).join(' and ')}.`}
                  aria-haspopup={r.fixes.length > 1 ? 'true' : undefined}
                  onClick={() => pick(i)}
                >
                  {body}
                </button>
              ) : (
                <div
                  key={r.label}
                  {...common}
                  ref={(el) => void (rows.current[i] = el)}
                  tabIndex={0}
                  aria-label={`${r.label}, ${pct(r.share)} of holds. ${OUT_OF_SCOPE}`}
                >
                  {body}
                </div>
              )
            })}
          </div>

          <svg className="route-wires" aria-hidden="true">
            {wires.map((w) => {
              const lit = litReasons.has(w.i) && litFixes.has(w.key)
              return (
                <g key={w.id} className={`route-wire${lit ? ' is-lit' : ''}`}>
                  <path d={w.d} />
                  <circle cx={w.end[0]} cy={w.end[1]} r={3} />
                </g>
              )
            })}
          </svg>

          <div className="route-fixes" ref={columnOfFixes}>
            {SOLUTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                ref={(el) => void (fixes.current[s.key] = el)}
                className={`route-fix${litFixes.has(s.key) ? ' is-lit' : ''}`}
                onPointerEnter={() => hover({ kind: 'fix', key: s.key })}
                onPointerLeave={() => hover(null)}
                onFocus={() => hover({ kind: 'fix', key: s.key })}
                onBlur={() => hover(null)}
                onClick={() => openFix(s.key)}
              >
                <Sketch kind={s.key} />
                <span className="route-fix-title">{s.title}</span>
                <span className="route-fix-share">answers {pct(FIX_SHARE[s.key], 0)} of holds</span>
              </button>
            ))}
          </div>

          {focus && (
            <div
              ref={card}
              className={`route-card${pinned !== null ? ' is-pinned' : ''}`}
              role={pinned !== null ? 'dialog' : 'status'}
              aria-label={pinned !== null ? 'Choose an intervention' : undefined}
              style={cardAt ? { top: cardAt.top, left: cardAt.left } : { visibility: 'hidden' }}
            >
              {focus.kind === 'reason' ? <ReasonCard i={focus.i} pinned={pinned !== null} /> : <FixCard fix={focus.key} />}
            </div>
          )}
        </div>
      </div>
    </ChartCard>
  )
}

function ReasonCard({ i, pinned }: { i: number; pinned: boolean }) {
  const r = REASONS[i]
  return (
    <>
      <p className="rc-figure">
        <b>{pct(r.share)}</b> of holds
      </p>
      <p className="rc-title">{r.label}</p>
      {r.fixes.length ? (
        <>
          <p className="rc-route">{pinned ? 'Two fixes meet here. Open one:' : 'Routed to'}</p>
          <ul className="rc-fixes">
            {r.fixes.map((k, n) => (
              <li key={k}>
                {pinned ? (
                  // the choice takes focus as it appears, so Escape and Tab stay inside the card
                  <button type="button" autoFocus={n === 0} onClick={() => openFix(k)}>
                    {solution(k).title} →
                  </button>
                ) : (
                  <span>{solution(k).title}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="rc-why">{r.why}</p>
          {!pinned && <p className="rc-hint">{r.fixes.length > 1 ? 'Click to choose a fix' : 'Click to open the fix'} →</p>}
        </>
      ) : (
        <p className="rc-why">{OUT_OF_SCOPE}</p>
      )}
    </>
  )
}

function FixCard({ fix }: { fix: FixKey }) {
  const s = solution(fix)
  return (
    <>
      <p className="rc-figure">
        <b>{pct(FIX_SHARE[fix], 0)}</b> of holds route here
      </p>
      <p className="rc-title">{s.title}</p>
      <ul className="rc-fixes">
        {REASONS.filter((r) => r.fixes.includes(fix)).map((r) => (
          <li key={r.label}>
            <span>
              {r.label} · {pct(r.share)}
            </span>
          </li>
        ))}
      </ul>
      <p className="rc-why">{s.teaser}</p>
      <p className="rc-hint">Click to see how it works →</p>
    </>
  )
}
