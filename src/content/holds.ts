// Relative PACU hold intensity by start hour (00:00–23:00), all three PACUs combined.
// Derived from the hour × reason table in the Final Presentation (90-day Tableau extract): the three
// most common reasons are summed per hour and divided by the busiest hour (19:00 = 1). Normalized and
// rounded, so no counts leave the team's data. Not official JHH statistics.
export const HOLD_INTENSITY = [
  0.02, 0.01, 0.02, 0.02, 0.01, 0.01, 0.0, 0.02, 0.01, 0.04, 0.14, 0.43,
  0.74, 0.68, 0.73, 0.66, 0.64, 0.72, 0.65, 1.0, 0.41, 0.18, 0.06, 0.05,
] as const

/** Intensity at a fractional hour, interpolated between hourly bins (bin centre = h + 0.5). */
export function holdIntensityAt(hours: number): number {
  const x = hours - 0.5
  const i = Math.floor(x)
  const t = x - i
  const a = HOLD_INTENSITY[((i % 24) + 24) % 24]
  const b = HOLD_INTENSITY[(((i + 1) % 24) + 24) % 24]
  return a + (b - a) * t
}

/** The evening nursing hand-off, when receiving inpatient nurses are least available. */
export const SHIFT_CHANGE: [number, number] = [18.75, 19.25]

export const inShiftChange = (hours: number) => hours >= SHIFT_CHANGE[0] && hours <= SHIFT_CHANGE[1]

/** PACU floors that glow with the hold intensity (floor numbers from the project data). */
export const PACU_FLOORS = [
  { building: 'zayed', floor: 3, label: 'Zayed 3 PACU' },
  { building: 'zayed', floor: 5, label: 'Zayed 5 PACU' },
  { building: 'weinberg', floor: 3, label: 'Weinberg 3 PACU' },
] as const

/** Storey height used to place those floors (m): Zayed is 56 m over 12 levels. */
export const FLOOR_HEIGHT: Record<string, number> = { zayed: 4.67, weinberg: 4.5 }

/**
 * Inpatient floors the transfer dots rise to: Zayed 9–11, and Weinberg from 4CD (the next floor up)
 * to 7, stretched so the motion still reads from the opening view.
 */
export const WARD_FLOORS: Record<string, [number, number]> = { zayed: [9, 11], weinberg: [4, 7] }
