import type * as THREE from 'three'

/** Seconds of wind time, advanced by <Ambient> while ambient motion runs (shared shader uniform). */
export const WIND = { value: 0 }

/**
 * Lets an instanced tree material sway: the top of the shape moves most, the base stays put, and
 * each tree gets its own phase from its position.
 */
export function swaying<T extends THREE.Material>(material: T, amount: number): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = WIND
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWind;')
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float windPhase = dot(instanceMatrix[3].xz, vec2(0.031, 0.047));
        #else
          float windPhase = 0.0;
        #endif
        float windSway = sin(uWind * 1.3 + windPhase) * 0.75 + sin(uWind * 2.9 + windPhase * 2.1) * 0.25;
        transformed.xz += ${amount.toFixed(4)} * max(position.y + 0.5, 0.0) * windSway * vec2(1.0, 0.6);`,
      )
  }
  material.customProgramCacheKey = () => `sway-${amount}`
  return material
}
