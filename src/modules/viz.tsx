import { useCallback, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'

/**
 * Shared chart chrome (dataviz rules): a titled card, an optional legend, a hover/focus tooltip
 * that never gates a value, and a data-table twin for every chart.
 */

export interface TipContent {
  value: string
  label: string
  sub?: string
}

export function useTooltip() {
  const host = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<(TipContent & { x: number; y: number }) | null>(null)

  const at = useCallback((content: TipContent, clientX: number, clientY: number) => {
    const box = host.current?.getBoundingClientRect()
    if (!box) return
    setTip({ ...content, x: clientX - box.left, y: clientY - box.top })
  }, [])

  /** handlers for one mark: pointer and keyboard focus show the same readout */
  const bind = useCallback(
    (content: TipContent) => ({
      onPointerMove: (e: ReactPointerEvent) => at(content, e.clientX, e.clientY),
      onPointerLeave: () => setTip(null),
      onFocus: (e: { currentTarget: Element }) => {
        const r = e.currentTarget.getBoundingClientRect()
        at(content, r.left + r.width / 2, r.top)
      },
      onBlur: () => setTip(null),
    }),
    [at],
  )

  const element = tip ? (
    <div className="viz-tip" role="status" style={{ left: tip.x, top: tip.y }}>
      <b>{tip.value}</b>
      <span>{tip.label}</span>
      {tip.sub && <small>{tip.sub}</small>}
    </div>
  ) : null

  return { host, bind, element }
}

interface ChartCardProps {
  title: string
  headline?: ReactNode
  legend?: ReactNode
  /** data-table twin: column headers and rows of already-formatted cells */
  table: { caption: string; columns: string[]; rows: (string | number)[][] }
  note?: string
  children: ReactNode
}

export function ChartCard({ title, headline, legend, table, note, children }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false)
  return (
    <figure className="chart-card">
      <figcaption>
        <h4>{title}</h4>
        {headline && <p className="chart-headline">{headline}</p>}
      </figcaption>
      {legend && <div className="chart-legend">{legend}</div>}
      {children}
      <div className="chart-foot">
        {note && <p className="chart-note">{note}</p>}
        <button type="button" className="link-button" aria-expanded={showTable} onClick={() => setShowTable(!showTable)}>
          {showTable ? 'Hide data table' : 'Show data table'}
        </button>
      </div>
      {showTable && (
        <div className="chart-table">
          <table>
            <caption>{table.caption}</caption>
            <thead>
              <tr>
                {table.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((cell, j) => (j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  )
}

/** Legend key that mirrors the mark (a rect for bars). */
export function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="legend-key">
      <i style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  )
}

export const pct = (v: number, digits = 1) => `${v.toFixed(digits).replace(/\.0$/, '')}%`

/** Linear interpolation across colour stops (hex), for sequential scales. */
export function rampColor(stops: string[], t: number): string {
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1)
  const i = Math.min(Math.floor(x), stops.length - 2)
  const f = x - i
  const a = parseInt(stops[i].slice(1), 16)
  const b = parseInt(stops[i + 1].slice(1), 16)
  const mix = (shift: number) => Math.round(((a >> shift) & 255) * (1 - f) + ((b >> shift) & 255) * f)
  return `rgb(${mix(16)}, ${mix(8)}, ${mix(0)})`
}
