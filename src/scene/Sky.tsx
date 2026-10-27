import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { BloomEffect } from 'postprocessing'
import * as THREE from 'three'
import { timeStore } from '../state/time'
import { FACADE_MATERIALS } from './facade'
import { createSkyState, skyAt } from './lighting'

/** Sun, sky light, moon and haze, all driven by the time-of-day store. */
export function Sky({ bloom, shadowSize }: { bloom: RefObject<BloomEffect | null>; shadowSize: number }) {
  const sun = useRef<THREE.DirectionalLight>(null)
  const moon = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const scene = useThree((s) => s.scene)
  const invalidate = useThree((s) => s.invalidate)
  const state = useMemo(createSkyState, [])
  const last = useRef(Number.NaN)
  // the bloom effect is recreated when the rendering tier changes
  const lastBloom = useRef<BloomEffect | null>(null)

  // the canvas renders on demand: a new time of day needs a frame
  useEffect(() => timeStore.subscribe(() => invalidate()), [invalidate])

  useFrame(() => {
    const hours = timeStore.get()
    if ((hours === last.current && bloom.current === lastBloom.current) || !sun.current || !moon.current || !hemi.current) return
    last.current = hours
    lastBloom.current = bloom.current
    skyAt(hours, state)
    if (scene.background instanceof THREE.Color) scene.background.copy(state.fog)
    scene.fog?.color.copy(state.fog)
    sun.current.position.copy(state.sunDir).multiplyScalar(700)
    sun.current.color.copy(state.sunColor)
    sun.current.intensity = state.sunIntensity
    hemi.current.color.copy(state.hemiSky)
    hemi.current.groundColor.copy(state.hemiGround)
    hemi.current.intensity = state.hemiIntensity
    moon.current.intensity = state.moonIntensity
    for (const m of FACADE_MATERIALS) m.userData.uniforms.uNight.value = state.night * m.userData.nightScale
    if (bloom.current) bloom.current.intensity = 0.45 * state.night
  }, -1)

  return (
    <>
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
      >
        <orthographicCamera attach="shadow-camera" args={[-500, 500, 500, -500, 10, 2000]} />
      </directionalLight>
      {/* cool moonlight from the north-east, no shadows */}
      <directionalLight ref={moon} position={[300, 420, -300]} color="#9fb4ff" intensity={0} />
    </>
  )
}
