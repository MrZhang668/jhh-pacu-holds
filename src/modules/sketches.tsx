import { useId, type ReactNode } from 'react'
import type { Solution } from '../content/outcomes'

type SolutionKey = Solution['key']

/**
 * Hand-drawn style card art: plain strokes run through a slight turbulence filter so the lines wobble
 * like pencil, with gold and blue washes behind.
 */
export function Sketch({ kind }: { kind: SolutionKey }) {
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
