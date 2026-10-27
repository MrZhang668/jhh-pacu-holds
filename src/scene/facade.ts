import * as THREE from 'three'

/**
 * Facade look of a building. Windows, slab lines and glass curtain walls are drawn procedurally in
 * the shader from world position (no UVs, no window geometry): walls are cut into floors of
 * `floorH` metres and bays of `bay` metres; `winW`/`winH` are the window share of a bay/floor.
 */
export interface FacadeStyle {
  wall: string
  trim: string
  window: string
  roof: string
  pitched: string
  dome: string
  copper: string
  floorH: number
  bay: number
  winW: number
  winH: number
  /** vertical centre of the window within a floor, 0–1 */
  winY?: number
  /** continuous horizontal window bands */
  ribbon?: boolean
  /** open parking decks */
  garage?: boolean
  /** walls above this height (m) are a multicolour glass curtain wall */
  glassAbove?: number
  glass?: string[]
  /** how strongly windows light up at night (1 = fully) */
  nightScale?: number
}

// Palette from the spec (网页开发提示词.md §7.1): real material hues, muted and lifted.
const BASE = { trim: '#e4dbcc', roof: '#d6d3cb', pitched: '#6d7a86', dome: '#6d7a86', copper: '#7fae9a' }
const hospital = { ...BASE, wall: '#b48572', window: '#5b6a77', floorH: 4.2, bay: 3.0, winW: 0.5, winH: 0.46 }

export const STYLES = {
  /** 1880s–1920s red brick: Billings, Marburg, Phipps … */
  historic: { ...BASE, wall: '#b77d68', window: '#56636f', floorH: 4.6, bay: 3.4, winW: 0.36, winH: 0.5 },
  /** later brick hospital blocks with punched windows */
  hospital,
  /** brick with continuous window bands */
  ribbon: { ...BASE, wall: '#b88d7a', window: '#5d7182', floorH: 4.3, bay: 3.2, winW: 0.9, winH: 0.42, ribbon: true },
  /** pale precast / limestone research blocks */
  precast: { ...BASE, wall: '#d4cabb', window: '#5d6c79', floorH: 4.0, bay: 3.0, winW: 0.9, winH: 0.4, ribbon: true },
  /** Sheikh Zayed Tower: brick podium, green–cyan–lime glass above */
  zayed: { ...hospital, glassAbove: 22, glass: ['#6fa9b9', '#8ec6d8', '#b7dde6', '#7db69c', '#c3d98f', '#9fcbd0'] },
  /** Bloomberg Children's Center: brick podium, blue–violet glass above */
  bloomberg: { ...hospital, glassAbove: 22, glass: ['#5f88b6', '#8b90c6', '#a9b6e0', '#7fa3c9', '#9fb9d8', '#b3a9d6'] },
  /** all-glass recent buildings */
  glass: {
    ...BASE, wall: '#c9ced3', window: '#5f7282', floorH: 4.2, bay: 3.0, winW: 0.9, winH: 0.5, glassAbove: 0,
    glass: ['#9db7c6', '#b5c9d4', '#8aa6b8', '#c7d6de', '#a4bccb', '#bccbd6'],
  },
  /** Hospital Bridge: glazed walkway under a dark sign band */
  bridge: { ...BASE, wall: '#2f2a2b', window: '#8fb3c6', floorH: 6, bay: 2.4, winW: 0.9, winH: 0.5, winY: 0.67, ribbon: true },
  garage: { ...BASE, wall: '#d3cfc6', window: '#73797f', floorH: 3.2, bay: 8, winW: 0.9, winH: 0.5, garage: true },
  /** Baltimore rowhouses around the campus: kept pale (and dim at night) so the campus reads first */
  rowhouse: {
    ...BASE, wall: '#e3d8ce', trim: '#efe8df', window: '#b9bec4', roof: '#d9d5ce', floorH: 3.3, bay: 2.4, winW: 0.34, winH: 0.42,
    nightScale: 0.22,
  },
} satisfies Record<string, FacadeStyle>

export type StyleName = keyof typeof STYLES

/** Building key → facade style; anything not listed uses `hospital`. */
const BUILDING_STYLE: Record<string, StyleName> = {
  billings: 'historic', marburg: 'historic', park: 'historic', phipps: 'historic', welch: 'historic',
  wilmer: 'historic', 'hampton-house': 'historic',
  zayed: 'zayed', bloomberg: 'bloomberg',
  weinberg: 'ribbon', miller: 'ribbon', ross: 'ribbon', '1830': 'ribbon', bsph: 'ribbon', turner: 'ribbon',
  pctb: 'precast', 'nelson-harvey': 'precast', blalock: 'precast', 'reed-hall': 'precast', cooley: 'precast',
  viragh: 'glass', smith: 'glass', '550': 'glass',
  'hospital-bridge': 'bridge',
  'orleans-garage': 'garage', 'mcelderry-garage': 'garage', 'caroline-garage': 'garage', 'rutland-garage': 'garage',
  'wash-garage': 'garage', 'kki-garage': 'garage',
}

export const styleFor = (key: string): FacadeStyle => STYLES[BUILDING_STYLE[key] ?? 'hospital']

const VERT_DECL = /* glsl */ `
attribute float aKind;
varying vec3 vFacadePos;
varying vec3 vFacadeNormal;
varying float vKind;
`

const FRAG_DECL = /* glsl */ `
varying vec3 vFacadePos;
varying vec3 vFacadeNormal;
varying float vKind;
uniform vec3 uWall, uTrim, uWin, uRoof, uPitched, uDome, uCopper;
uniform vec4 uGrid;   // floor height, bay width, window width share, window height share
uniform float uWinY, uRibbon, uGarage, uGlassAbove, uGlassCount, uNight;
uniform vec3 uGlass[6];
float facadeHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
// 1 inside |x| < halfWidth, 0 outside; w = one pixel in x units, measured on the continuous
// coordinate (fract() jumps at cell edges, so its own derivative is useless there)
float facadeBox(float x, float halfWidth, float w) {
  return 1.0 - smoothstep(halfWidth - w, halfWidth + w, abs(x));
}
`

const COLOR_CHUNK = /* glsl */ `
#include <color_fragment>
float facadeWin = 0.0;
float facadeGlass = 0.0;
float facadeLit = 1.0;   // which windows are lit at night
{
  vec3 col;
  if (vKind < 0.5) {
    vec3 n = normalize(vFacadeNormal);
    vec2 t = normalize(vec2(-n.z, n.x) + vec2(1e-5));
    float u = dot(vFacadePos.xz, t);
    float fy = vFacadePos.y / uGrid.x;
    float level = floor(fy);
    float fv = fract(fy);
    float bay = floor(u / uGrid.y);
    float cu = fract(u / uGrid.y);
    // When a bay or floor shrinks below a few pixels, fade the pattern to its average colour
    // instead of letting it shimmer (moiré) at the distant default view.
    float wu = fwidth(u / uGrid.y) * 0.7;
    float wv = fwidth(fy) * 0.7;
    float detail = 1.0 - clamp((max(wu, wv) / 0.7 - 0.12) * 4.0, 0.0, 1.0);
    if (vFacadePos.y > uGlassAbove) {
      int idx = int(min(floor(facadeHash(vec2(bay, level)) * uGlassCount), uGlassCount - 1.0));
      float mullion = (1.0 - facadeBox(cu - 0.465, 0.465, wu)) + (1.0 - facadeBox(fv - 0.45, 0.45, wv));
      mullion = clamp(mullion, 0.0, 1.0) * detail;
      col = mix(uGlass[idx], uTrim * 0.6, mullion * 0.55);
      facadeGlass = 1.0 - mullion;
      // at night the curtain wall glows softly and evenly (random bright panels read as a checkerboard)
      facadeWin = facadeGlass;
      facadeLit = 0.1 + 0.14 * facadeHash(vec2(bay * 1.7, level + 3.1));
    } else if (uGarage > 0.5) {
      float open = facadeBox(fv - 0.57, 0.27, wv) * facadeBox(cu - 0.47, 0.47, wu);
      col = mix(uWall, uWin, mix(0.42, open, detail));
    } else {
      float halfW = uRibbon > 0.5 ? 0.45 : uGrid.z * 0.5;
      float win = facadeBox(cu - 0.5, halfW, wu) * facadeBox(fv - uWinY, uGrid.w * 0.5, wv);
      // far away: the share of the wall that is window
      float average = 2.0 * halfW * uGrid.w;
      facadeWin = mix(average, win, detail);
      // a random ~45% of rooms are lit; far away that becomes the average
      facadeLit = mix(0.45, step(0.55, facadeHash(vec2(bay + 13.0, level * 1.37))), detail);
      col = mix(uWall, uWin, facadeWin);
      col = mix(col, uTrim, (1.0 - facadeBox(fv, 0.04, wv)) * 0.45 * step(0.5, level) * detail);
    }
  } else if (vKind < 1.5) {
    col = uRoof;
  } else if (vKind < 2.5) {
    col = uPitched;
  } else if (vKind < 3.5) {
    col = uDome;
  } else {
    col = uCopper;
  }
  diffuseColor.rgb = col;
}
`

// Program cache key: shared by every facade, but changes whenever the shader code does
// (otherwise three.js keeps serving a stale cached program after a hot reload).
const PROGRAM_KEY = (() => {
  const src = VERT_DECL + FRAG_DECL + COLOR_CHUNK
  let h = 0
  for (let i = 0; i < src.length; i++) h = (Math.imul(31, h) + src.charCodeAt(i)) | 0
  return `jhh-facade-${h >>> 0}`
})()

/** Every facade material, so the sky can switch window lights on for all of them at dusk. */
export const FACADE_MATERIALS = new Set<THREE.MeshStandardMaterial>()

/** MeshStandardMaterial with the procedural facade; all facades share one shader program. */
export function createFacadeMaterial(style: FacadeStyle): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.88,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
  })
  const glass = (style.glass ?? [style.window]).map((c) => new THREE.Color(c))
  while (glass.length < 6) glass.push(glass[glass.length - 1].clone())
  const uniforms = {
    uWall: { value: new THREE.Color(style.wall) },
    uTrim: { value: new THREE.Color(style.trim) },
    uWin: { value: new THREE.Color(style.window) },
    uRoof: { value: new THREE.Color(style.roof) },
    uPitched: { value: new THREE.Color(style.pitched) },
    uDome: { value: new THREE.Color(style.dome) },
    uCopper: { value: new THREE.Color(style.copper) },
    uGrid: { value: new THREE.Vector4(style.floorH, style.bay, style.winW, style.winH) },
    uWinY: { value: style.winY ?? 0.56 },
    uRibbon: { value: style.ribbon ? 1 : 0 },
    uGarage: { value: style.garage ? 1 : 0 },
    uGlassAbove: { value: style.glassAbove ?? 1e5 },
    uGlassCount: { value: style.glass?.length ?? 1 },
    uGlass: { value: glass },
    /** 0 = day, 1 = night (window glow); driven by the day/night toggle in M3 */
    uNight: { value: 0 },
  }
  material.userData.uniforms = uniforms
  material.userData.nightScale = style.nightScale ?? 0.4
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERT_DECL}`)
      .replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\nvFacadeNormal = normalize(mat3(modelMatrix) * objectNormal);',
      )
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvFacadePos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvKind = aKind;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_DECL}`)
      .replace('#include <color_fragment>', COLOR_CHUNK)
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.32, facadeGlass);',
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uNight * facadeWin * facadeLit * vec3(1.0, 0.835, 0.54) * 1.15;',
      )
  }
  material.customProgramCacheKey = () => PROGRAM_KEY
  FACADE_MATERIALS.add(material)
  return material
}
