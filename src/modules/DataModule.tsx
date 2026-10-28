import { Fragment } from 'react'
import {
  AVERAGE_VS_THRESHOLD,
  DATA_NOTE,
  DATA_NOTE_ZH,
  DESTINATIONS,
  DESTINATIONS_ZH,
  HOURLY_HEADLINE,
  HOURLY_REASON_LABELS_ZH,
  HOURLY_REASONS,
  ORIGINS,
  ORIGINS_ZH,
} from '../content/holdData'
import { useIsNight } from '../state/hooks'
import { useL, useT } from '../state/lang'
import { RoutedReasons } from './RoutedReasons'
import { ChartCard, pct, rampColor, useTooltip } from './viz'

// One-hue sequential ramps (light → Hopkins Blue; on the night surface, dark → light)
const DAY_RAMP = ['#eef3f9', '#c9dcf1', '#93bfe8', '#5293d3', '#2263a8', '#002d72']
const NIGHT_RAMP = ['#17243d', '#1f3a62', '#2c5e95', '#4b8dcd', '#8cc1ef', '#d3eafc']
const HEAT_MAX = 17

const hourRange = (h: number) => `${String(h).padStart(2, '0')}:00–${String(h).padStart(2, '0')}:59`

export default function DataModule() {
  const t = useT()
  return (
    <>
      <HourHeatmap />
      <RoutedReasons />
      <OriginsDestinations />
      <ThresholdTile />
      <p className="data-note">{t(DATA_NOTE, DATA_NOTE_ZH)}</p>
    </>
  )
}

function HourHeatmap() {
  const t = useT()
  const night = useIsNight()
  const stops = night ? NIGHT_RAMP : DAY_RAMP
  const { host, bind, element } = useTooltip()
  const hours = Array.from({ length: 24 }, (_, h) => h)
  return (
    <ChartCard
      title={t('When holds start', '滞留何时开始')}
      headline={t(
        <>
          {HOURLY_HEADLINE.midday}% of these holds start between 11:00 and 17:59, and the 7 PM hour alone accounts for{' '}
          {HOURLY_HEADLINE.sevenPmRn}% of “receiving nurse unavailable” holds.
        </>,
        <>
          这些滞留中有 {HOURLY_HEADLINE.midday}% 始于 11:00 至 17:59 之间；仅晚 7 点这一小时，就占“接收护士不可用”类滞留的{' '}
          {HOURLY_HEADLINE.sevenPmRn}%。
        </>,
      )}
      legend={
        <span className="scale-legend">
          <span>0%</span>
          <i style={{ background: `linear-gradient(to right, ${stops.join(', ')})` }} aria-hidden="true" />
          <span>{t(`${HEAT_MAX}%+ of that reason’s holds in the hour`, `该小时占此原因滞留的 ${HEAT_MAX}% 及以上`)}</span>
        </span>
      }
      note={t(
        'Each row sums to about 100% (whole percents, rounded): it shows when that reason’s holds begin.',
        '每行合计约为 100%（取整百分比，已四舍五入），显示该原因的滞留在各时段的开始分布。',
      )}
    >
      <div className="heatmap" ref={host}>
        <div className="hm-grid">
          <span />
          {hours.map((h) => (
            <span key={h} className={`hm-hour${h === 19 ? ' is-shift' : ''}`} aria-hidden="true">
              {h % 3 === 0 || h === 19 ? h : ''}
            </span>
          ))}
          {HOURLY_REASONS.map((r) => {
            const label = t(r.label, HOURLY_REASON_LABELS_ZH[r.key])
            return (
              <Fragment key={r.key}>
                <span className="hm-label">{label}</span>
                {r.shares.map((s, h) => (
                  <span
                    key={h}
                    className={`hm-cell${h === 19 ? ' is-shift' : ''}`}
                    style={{ background: rampColor(stops, s / HEAT_MAX) }}
                    {...bind({
                      value: pct(s, 0),
                      label: `${label}${t(', ', '，')}${hourRange(h)}`,
                      sub: t('of this reason’s holds', '占此原因滞留的比例'),
                    })}
                  />
                ))}
              </Fragment>
            )
          })}
        </div>
        <p className="hm-axis">
          {t('Start hour (24-hour clock)', '开始时间（24 小时制）')} ·{' '}
          <span className="shift-key">{t('19 = the 7 PM nursing shift change', '19 = 晚 7 点护理交接班')}</span>
        </p>
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
  const t = useT()
  const origins = useL(ORIGINS, ORIGINS_ZH)
  const destinations = useL(DESTINATIONS, DESTINATIONS_ZH)
  return (
    <ChartCard
      title={t('Where held patients come from and where they go', '滞留患者从何而来、去往何处')}
      headline={t(
        'Two operating-room groups produce about 71% of holds, and 81% of held patients are waiting for a regular (non-ICU) inpatient bed.',
        '两组手术室产生了约 71% 的滞留；81% 的滞留患者在等待普通（非 ICU）住院床位。',
      )}
    >
      <div className="share-grid">
        <ShareList title={t('Operating rooms the patients came from', '患者来源手术室')} rows={origins} />
        <ShareList title={t('Where they went after the PACU', '离开 PACU 后的去向')} rows={destinations} />
      </div>
    </ChartCard>
  )
}

function ThresholdTile() {
  const t = useT()
  const max = 3
  return (
    <section className="stat-tile" aria-label={t('Average hold length', '平均滞留时长')}>
      <p className="stat-label">{t('Average hold compared with the 30-minute hold threshold', '平均滞留时长与 30 分钟滞留阈值之比')}</p>
      <p className="stat-value">≈ {AVERAGE_VS_THRESHOLD}×</p>
      <div
        className="meter"
        role="img"
        aria-label={t(
          `Average hold is about ${AVERAGE_VS_THRESHOLD} times the 30-minute threshold`,
          `平均滞留时长约为 30 分钟阈值的 ${AVERAGE_VS_THRESHOLD} 倍`,
        )}
      >
        <span className="meter-fill" style={{ width: `${(AVERAGE_VS_THRESHOLD / max) * 100}%` }} />
        <span className="meter-mark" style={{ left: `${(1 / max) * 100}%` }} />
      </div>
      <div className="meter-scale" aria-hidden="true">
        <span>0×</span>
        <span style={{ left: `${(1 / max) * 100}%` }}>{t('1× = 30 min', '1× = 30 分钟')}</span>
        <span style={{ left: `${(2 / max) * 100}%` }}>2×</span>
        <span style={{ left: '100%' }}>3×</span>
      </div>
      <p className="stat-note">
        {t(
          'A delay only counts as a hold once a ready patient has waited more than 30 minutes.',
          '只有当已可转出的患者等待超过 30 分钟时，延误才计为滞留。',
        )}
      </p>
    </section>
  )
}
