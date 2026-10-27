import * as THREE from 'three'
import { DEG, LATITUDE, daylight, nightness, smooth, sunElevation } from '../state/sun'

export { sunElevation }

/** Everything the scene lighting needs for one moment of the day. Reused in place each frame. */
export interface SkyState {
  /** unit vector pointing at the sun (x east, y up, z south) */
  sunDir: THREE.Vector3
  elevation: number
  /** 0 = night … 1 = full day */
  day: number
  /** window lights, 0 … 1 */
  night: number
  fog: THREE.Color
  sunColor: THREE.Color
  sunIntensity: number
  hemiSky: THREE.Color
  hemiGround: THREE.Color
  hemiIntensity: number
  moonIntensity: number
}

const C = (hex: string) => new THREE.Color(hex)
const FOG_DAY = C('#e3e8ec')
const FOG_NIGHT = C('#0e1b33')
const FOG_DUSK = C('#efd9c8')
const SUN_HIGH = C('#fff3e2')
const SUN_LOW = C('#ffb070')
const HEMI_SKY_DAY = C('#eef3f8')
const HEMI_SKY_NIGHT = C('#2a3d63')
const HEMI_GROUND_DAY = C('#d4ccbd')
const HEMI_GROUND_NIGHT = C('#141b2b')

export function createSkyState(): SkyState {
  return {
    sunDir: new THREE.Vector3(),
    elevation: 0,
    day: 1,
    night: 0,
    fog: new THREE.Color(),
    sunColor: new THREE.Color(),
    sunIntensity: 0,
    hemiSky: new THREE.Color(),
    hemiGround: new THREE.Color(),
    hemiIntensity: 0,
    moonIntensity: 0,
  }
}

export function skyAt(hours: number, out: SkyState): SkyState {
  const hourAngle = (hours - 12) * 15 * DEG
  const el = sunElevation(hours)
  // azimuth from south, positive towards the west
  const az = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(LATITUDE))
  out.elevation = el
  out.sunDir.set(-Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize()

  out.day = daylight(hours)
  out.night = nightness(hours)
  // warm haze while the sun is near the horizon
  const dusk = (1 - smooth(2 * DEG, 18 * DEG, el)) * smooth(-7 * DEG, 0, el)

  out.fog.lerpColors(FOG_NIGHT, FOG_DAY, out.day).lerp(FOG_DUSK, dusk * 0.55)
  out.sunColor.lerpColors(SUN_LOW, SUN_HIGH, smooth(3 * DEG, 28 * DEG, el))
  out.sunIntensity = 2.7 * smooth(-1 * DEG, 14 * DEG, el)
  out.hemiSky.lerpColors(HEMI_SKY_NIGHT, HEMI_SKY_DAY, out.day).lerp(FOG_DUSK, dusk * 0.3)
  out.hemiGround.lerpColors(HEMI_GROUND_NIGHT, HEMI_GROUND_DAY, out.day)
  out.hemiIntensity = 0.45 + 0.85 * out.day
  out.moonIntensity = 0.55 * (1 - out.day)
  return out
}
