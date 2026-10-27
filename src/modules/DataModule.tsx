import { Fragment } from 'react'
import {
  AVERAGE_VS_THRESHOLD,
  DATA_NOTE,
  DESTINATIONS,
  HOURLY_HEADLINE,
  HOURLY_REASONS,
  ORIGINS,
  REASONS,
  SOURCES,
  TARGETED_SHARE,
  type Fix,
} from '../content/holdData'
import { useIsNight } from '../state/hooks'
import { ChartCard, LegendKey, pct, rampColor, useTooltip } from './viz'

// One-hue sequential ramps (light → Hopkins Blue; on the night surface, dark → light)
const DAY_RAMP = ['#eef3f9', '#c9dcf1', '#93bfe8', '#5293d3', '#2263a8', '#002d72']
const NIGHT_RAMP = ['#17243d', '#1f3a62', '#2c5e95', '#4b8dcd', '#8cc1ef', '#d3eafc']
const HEAT_MAX = 18

const hourRange = (h: number) => `${String(h).padStart(2, '0')}:00–${String(h).padStart(2, '0')}:59`

export default function DataModule() {
  return (
    <>
      <p className="data-note">{DATA_NOTE}</p>
      <HourHeatmap />
      <ReasonBars />
      <OriginsDestinations />
      <ThresholdTile />
      <FixCoverage />
      <p className="sources">
        {SOURCES.hourly} {SOURCES.tableau} {SOURCES.scope}
      </p>
    </>
  )
}

function HourHeatmap() {
  const night = useIsNight()
  const stops = night ? NIGHT_RAMP : DAY_RAMP
  const { host, bind, element } = useTooltip()
  const hours = Array.from({ length: 24 }, (_, h) => h)
  return (
    <ChartCard
      title="When holds start"
      headline={
        <>
          {HOURLY_HEADLINE.midday}% of these holds start between 11:00 and 17:59, and the 7 PM hour alone accounts for{' '}
          {HOURLY_HEADLINE.sevenPmRn}% of “receiving nurse unavailable” holds.
        </>
      }
      legend={
        <span className="scale-legend">
          <span>0%</span>
          <i style={{ background: `linear-gradient(to right, ${stops.join(', ')})` }} aria-hidden="true" />
          <span>{HEAT_MAX}%+ of that reason’s holds in the hour</span>
        </span>
      }
      note="Each row sums to about 100% (whole percents, rounded): it shows when that reason’s holds begin."
    >
      <div className="heatmap" ref={host}>
        <div className="hm-grid">
          <span />
          {hours.map((h) => (
            <span key={h} className={`hm-hour${h === 19 ? ' is-shift' : ''}`} aria-hidden="true">
              {h % 3 === 0 || h === 19 ? h : ''}
            </span>
          ))}
          {HOURLY_REASONS.map((r) => (
            <Fragment key={r.key}>
              <span className="hm-label">{r.label}</span>
              {r.shares.map((s, h) => (
                <span
                  key={h}
                  className={`hm-cell${h === 19 ? ' is-shift' : ''}`}
                  style={{ background: rampColor(stops, s / HEAT_MAX) }}
                  {...bind({ value: pct(s, 0), label: `${r.label}, ${hourRange(h)}`, sub: 'of this reason’s holds' })}
                />
              ))}
            </Fragment>
          ))}
        </div>
        <p className="hm-axis">
          Start hour (24-hour clock) · <span className="shift-key">19 = the 7 PM nursing shift change</span>
        </p>
        {element}
      </div>
    </ChartCard>
  )
}

function ReasonBars() {
  const { host, bind, element } = useTooltip()
  const max = 25
  let running = 0
  const rows = REASONS.map((r) => ({ ...r, cumulative: (running += r.share) }))
  const color = (fixes: Fix[]) => (fixes.length ? 'var(--viz-1)' : 'var(--viz-2)')
  return (
    <ChartCard
      title="Why patients wait"
      headline="Two reasons — no room assigned yet and no receiving nurse — make up 43% of holds; the top four reach 69%."
      legend={
        <>
          <LegendKey color="var(--viz-1)" label="Targeted by our interventions" />
          <LegendKey color="var(--viz-2)" label="Other reasons" />
        </>
      }
    >
      <div className="bars" ref={host}>
        <div className="bar-row bar-axis" aria-hidden="true">
          <span />
          <span className="bar-track">
            {[0, 10, 20].map((t) => (
              <span key={t} className="tick" style={{ left: `${(t / max) * 100}%` }}>
                {t}%
              </span>
            ))}
          </span>
          <span className="bar-cum">Cumulative</span>
        </div>
        {rows.map((r) => (
          <div className="bar-row" key={r.label}>
            <span className="bar-label">{r.label}</span>
            <span className="bar-track">
              {[10, 20].map((t) => (
                <i key={t} className="grid" style={{ left: `${(t / max) * 100}%` }} aria-hidden="true" />
              ))}
              <span
                className="bar"
                tabIndex={0}
                style={{ width: `${(r.share / max) * 100}%`, background: color(r.fixes) }}
                {...bind({
                  value: pct(r.share),
                  label: r.label,
                  sub: r.fixes.length ? `Targeted by ${r.fixes.join(' + ')}` : undefined,
                })}
              />
              <span className="bar-value">{pct(r.share)}</span>
            </span>
            <span className="bar-cum">{pct(r.cumulative, 0)}</span>
          </div>
        ))}
        {element}
      </div>
    </ChartCard>
  )
}

function ShareList({ title, rows }: { title: string; rows: { label: string; share: number }[] }) {
  const { host, bind, element } = useTooltip()
  return (
    <div className="share-list" ref={host}>
      <h5>{title}</h5>
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <span className="bar-label">{r.label}</span>
          <span className="bar-track">
            <span
              className="bar"
              tabIndex={0}
              style={{ width: `${r.share}%`, background: 'var(--viz-1)' }}
              {...bind({ value: pct(r.share), label: r.label, sub: title })}
            />
            <span className="bar-value">{pct(r.share)}</span>
          </span>
        </div>
      ))}
      {element}
    </div>
  )
}

function OriginsDestinations() {
  return (
    <ChartCard
      title="Where held patients come from and where they go"
      headline="Two operating-room groups produce about 72% of holds, and 82% of held patients are waiting for a regular (non-ICU) inpatient bed."
      note={SOURCES.tableau}
    >
      <div className="share-grid">
        <ShareList title="Operating rooms the patients came from" rows={ORIGINS} />
        <ShareList title="Where they went after the PACU" rows={DESTINATIONS} />
      </div>
    </ChartCard>
  )
}

function ThresholdTile() {
  const max = 3
  return (
    <section className="stat-tile" aria-label="Average hold length">
      <p className="stat-label">Average hold compared with the 30-minute hold threshold</p>
      <p className="stat-value">≈ {AVERAGE_VS_THRESHOLD}×</p>
      <div className="meter" role="img" aria-label={`Average hold is about ${AVERAGE_VS_THRESHOLD} times the 30-minute threshold`}>
        <span className="meter-fill" style={{ width: `${(AVERAGE_VS_THRESHOLD / max) * 100}%` }} />
        <span className="meter-mark" style={{ left: `${(1 / max) * 100}%` }} />
      </div>
      <div className="meter-scale" aria-hidden="true">
        <span>0×</span>
        <span style={{ left: `${(1 / max) * 100}%` }}>1× = 30 min</span>
        <span style={{ left: `${(2 / max) * 100}%` }}>2×</span>
        <span style={{ left: '100%' }}>3×</span>
      </div>
      <p className="stat-note">A delay only counts as a hold once a ready patient has waited more than 30 minutes.</p>
    </section>
  )
}

const FIX_REASONS: { fix: Fix; reasons: string[] }[] = [
  { fix: 'NFC tracking', reasons: ['Waiting for a room to be assigned', 'Reason not documented'] },
  { fix: 'Shift overlap', reasons: ['Receiving nurse unavailable'] },
  { fix: 'NFC bed cleaning', reasons: ['Assigned room not clean', 'Waiting for a room to be assigned'] },
]

function FixCoverage() {
  const share = (label: string) => REASONS.find((r) => r.label === label)?.share ?? 0
  return (
    <section className="fix-coverage">
      <h4>From data to fixes</h4>
      <p>
        About <b>{TARGETED_SHARE}%</b> of recorded hold reasons fall into categories that at least one of our three
        interventions aims at.
      </p>
      <div className="meter" role="img" aria-label={`${TARGETED_SHARE}% of hold reasons targeted`}>
        <span className="meter-fill" style={{ width: `${TARGETED_SHARE}%` }} />
      </div>
      <ul>
        {FIX_REASONS.map((f) => (
          <li key={f.fix}>
            <b>{f.fix}</b>
            <span>
              {f.reasons.map((r) => (
                <span key={r} className="chip">
                  {r} · {pct(share(r))}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
