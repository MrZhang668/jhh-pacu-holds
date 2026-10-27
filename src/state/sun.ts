// The sun over Baltimore around the equinox. Kept free of three.js so the UI can use it without
// pulling in the 3D bundle.

export const DEG = Math.PI / 180
export const LATITUDE = 39.3 * DEG

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Sun elevation (radians) at an hour: sunrise ≈ 6, sunset ≈ 18. */
export function sunElevation(hours: number): number {
  const hourAngle = (hours - 12) * 15 * DEG
  return Math.asin(Math.cos(LATITUDE) * Math.cos(hourAngle))
}

/** 0 = night … 1 = full day. */
export const daylight = (hours: number) => smooth(-6 * DEG, 10 * DEG, sunElevation(hours))

/** How much artificial light is on (windows, headlights), 0 … 1. */
export const nightness = (hours: number) => 1 - smooth(-5 * DEG, 8 * DEG, sunElevation(hours))
