import { useEffect } from 'react'
import { HOLD_INTENSITY, inShiftChange } from '../content/holds'
import { sunElevation } from '../state/sun'
import { DAY_SECONDS, formatHour, timeStore, useHours, usePlaying } from '../state/time'
import { MoonIcon, PauseIcon, PlayIcon, SunIcon } from './icons'

/** Day/night switch, a 24-hour scrubber with play, and the hourly hold profile above it. */
export function TimeControls() {
  const hours = useHours()
  const playing = usePlaying()

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      timeStore.set(timeStore.get() + ((now - last) / 1000) * (24 / DAY_SECONDS))
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const night = sunElevation(hours) < 0
  const jump = (h: number) => {
    timeStore.setPlaying(false)
    timeStore.set(h)
  }

  return (
    <section className="time-card glass" aria-label="Time of day">
      <div className="seg" role="group" aria-label="Day or night">
        <button type="button" aria-pressed={!night} onClick={() => jump(14)}>
          <SunIcon /> Day
        </button>
        <button type="button" aria-pressed={night} onClick={() => jump(21)}>
          <MoonIcon /> Night
        </button>
      </div>
      <div className="scrub">
        <p className="spark-head">
          <span>PACU holds by hour</span>
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
          aria-label={playing ? 'Pause' : 'Play a whole day'}
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
          aria-label="Time of day"
          aria-valuetext={formatHour(hours)}
        />
        <div className="spark-ticks" aria-hidden="true">
          {TICKS.map((t) => (
            <span key={t.h} style={{ left: `${(t.h / 24) * 100}%` }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <p className="time-note" aria-live="polite">
        {inShiftChange(hours) ? (
          <strong>7 PM shift change: transfers stall while inpatient nurses hand off, so holds spike.</strong>
        ) : (
          <>
            Bars: holds starting each hour, relative to the 7 PM peak. On Zayed and Weinberg, gold beads ring the PACU
            floors as holds build and blue dots are patients moving up to the wards.
          </>
        )}
      </p>
    </section>
  )
}

// hour marks under the slider, at the start of each six-hour block
const TICKS = [
  { h: 0, label: '12 AM' },
  { h: 6, label: '6 AM' },
  { h: 12, label: '12 PM' },
  { h: 18, label: '6 PM' },
]

const W = 216
const H = 28
const GAP = 2

/** Hourly hold profile; the current hour is gold. Bars line up with the slider below. */
function HoldSparkline({ hours }: { hours: number }) {
  const bw = W / 24 - GAP
  const current = Math.floor(hours)
  return (
    <svg
      className="spark"
      viewBox={`0 0 ${W} ${H + 1}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="PACU holds by hour, relative to the busiest hour: low overnight, rising from 10 AM, highest at 7 PM."
    >
      {HOLD_INTENSITY.map((v, i) => {
        const h = Math.max(1.5, v * H)
        return (
          <rect key={i} x={i * (bw + GAP) + GAP / 2} y={H - h} width={bw} height={h} rx={1.5} className={i === current ? 'now' : undefined}>
            <title>{`${formatHour(i)}: ${Math.round(v * 100)}% of the busiest hour`}</title>
          </rect>
        )
      })}
      <line x1={0} x2={W} y1={H + 0.5} y2={H + 0.5} className="base" />
    </svg>
  )
}
