import { useEffect } from 'react'
import { HOLD_INTENSITY, inShiftChange } from '../content/holds'
import { sunElevation } from '../state/sun'
import { useLang, useT } from '../state/lang'
import { DAY_SECONDS, formatHour, timeStore, useHours, usePlaying } from '../state/time'
import { MoonIcon, PauseIcon, PlayIcon, SunIcon } from './icons'

/** Day/night switch, a 24-hour scrubber with play, and the hourly hold profile above it. */
export function TimeControls({ panelOpen }: { panelOpen: boolean }) {
  const hours = useHours()
  const playing = usePlaying()
  const t = useT()

  useEffect(() => {
    if (!playing) return
    // every step redraws the scene: ~30 a second on the map, ~10 while a panel covers most of it
    const step = 1000 / (panelOpen ? 10 : 30)
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      if (now - last >= step) {
        // a background tab stops animation frames; carry on from there instead of jumping ahead
        timeStore.set(timeStore.get() + (Math.min(now - last, 250) / 1000) * (24 / DAY_SECONDS))
        last = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, panelOpen])

  const night = sunElevation(hours) < 0
  const jump = (h: number) => {
    timeStore.setPlaying(false)
    timeStore.set(h)
  }

  return (
    <section className="time-card glass" aria-label={t('Time of day', '时间')}>
      <div className="seg" role="group" aria-label={t('Day or night', '白天或夜晚')}>
        <button type="button" aria-pressed={!night} onClick={() => jump(14)}>
          <SunIcon /> {t('Day', '白天')}
        </button>
        <button type="button" aria-pressed={night} onClick={() => jump(21)}>
          <MoonIcon /> {t('Night', '夜晚')}
        </button>
      </div>
      <div className="scrub">
        <p className="spark-head">
          <span>{t('PACU holds by hour', '各时段 PACU 滞留')}</span>
          {/* the gold swatch ties the clock to the gold bar for the selected hour */}
          <output>
            <i aria-hidden="true" />
            {formatHour(hours)}
          </output>
        </p>
        <button
          type="button"
          className="play"
          onClick={() => timeStore.setPlaying(!playing)}
          aria-label={playing ? t('Pause', '暂停') : t('Play a whole day', '播放一整天')}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <HoldSparkline hours={hours} />
        <input
          type="range"
          min={0}
          max={23.95}
          step={0.05}
          value={hours}
          onChange={(e) => jump(Number(e.target.value))}
          aria-label={t('Time of day', '时间')}
          aria-valuetext={formatHour(hours)}
        />
        <div className="spark-ticks" aria-hidden="true">
          {TICKS.map((tick) => (
            <span key={tick.h} style={{ left: `${(tick.h / 24) * 100}%` }}>
              {t(formatHour(tick.h).replace(':00', ''), formatHour(tick.h))}
            </span>
          ))}
        </div>
      </div>
      <p className="time-note" aria-live="polite">
        {inShiftChange(hours) ? (
          <strong>
            {t(
              '7 PM shift change: transfers stall while inpatient nurses hand off, so holds spike.',
              '晚 7 点交接班：住院病区护士交接期间转运停滞，滞留随之激增。',
            )}
          </strong>
        ) : (
          t(
            'Bars: holds starting each hour, relative to the 7 PM peak. On Zayed and Weinberg, gold beads ring the PACU floors as holds build and blue dots are patients moving up to the wards.',
            '柱形：每小时新增的滞留数，以晚 7 点峰值为基准。在 Zayed 与 Weinberg 大楼上，金色光点随滞留增加环绕 PACU 楼层，蓝色圆点代表转往住院病房的患者。',
          )
        )}
      </p>
    </section>
  )
}

// hour marks under the slider, at the start of each six-hour block
const TICKS = [{ h: 0 }, { h: 6 }, { h: 12 }, { h: 18 }]

const W = 216
const H = 28
const GAP = 2

/** Hourly hold profile; the current hour is gold. Bars line up with the slider below. */
function HoldSparkline({ hours }: { hours: number }) {
  const bw = W / 24 - GAP
  const current = Math.floor(hours)
  const t = useT()
  useLang() // the hour labels follow the language too
  return (
    <svg
      className="spark"
      viewBox={`0 0 ${W} ${H + 1}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={t(
        'PACU holds by hour, relative to the busiest hour: low overnight, rising from 10 AM, highest at 7 PM.',
        '各时段 PACU 滞留（相对最繁忙时段）：夜间较少，上午 10 点起上升，晚 7 点最高。',
      )}
    >
      {HOLD_INTENSITY.map((v, i) => {
        const h = Math.max(1.5, v * H)
        return (
          <rect key={i} x={i * (bw + GAP) + GAP / 2} y={H - h} width={bw} height={h} rx={1.5} className={i === current ? 'now' : undefined}>
            <title>{t(`${formatHour(i)}: ${Math.round(v * 100)}% of the busiest hour`, `${formatHour(i)}：最繁忙时段的 ${Math.round(v * 100)}%`)}</title>
          </rect>
        )
      })}
      <line x1={0} x2={W} y1={H + 0.5} y2={H + 0.5} className="base" />
    </svg>
  )
}
