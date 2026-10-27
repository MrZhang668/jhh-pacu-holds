import { useSyncExternalStore } from 'react'

/**
 * Time of day for the scene (0–24 h), shared by the UI (slider) and the 3D scene (sun, window
 * lights, PACU floor glow). The scene reads it inside useFrame, so playback does not re-render React.
 */
// ?time=19 opens the scene at 7 PM (handy for sharing the shift-change moment)
const linked = new URLSearchParams(window.location.search).get('time')
let hours = linked !== null && Number(linked) >= 0 && Number(linked) < 24 ? Number(linked) : 14
let playing = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const DAY_SECONDS = 60 // one full day of playback

export const timeStore = {
  get: () => hours,
  isPlaying: () => playing,
  set(h: number) {
    hours = ((h % 24) + 24) % 24
    emit()
  },
  setPlaying(p: boolean) {
    playing = p
    emit()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export const useHours = () => useSyncExternalStore(timeStore.subscribe, timeStore.get)
export const usePlaying = () => useSyncExternalStore(timeStore.subscribe, timeStore.isPlaying)

export function formatHour(h: number): string {
  const total = Math.round(h * 60) % (24 * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  const suffix = hh < 12 ? 'AM' : 'PM'
  return `${hh % 12 === 0 ? 12 : hh % 12}:${String(mm).padStart(2, '0')} ${suffix}`
}
