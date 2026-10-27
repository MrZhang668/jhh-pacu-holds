import { useSyncExternalStore } from 'react'
import { sunElevation } from './sun'
import { timeStore } from './time'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
  )
}

/** True once the sun is below the horizon; only re-renders when that flips. */
export function useIsNight(): boolean {
  return useSyncExternalStore(timeStore.subscribe, () => sunElevation(timeStore.get()) < -0.03)
}

// Visited modules are remembered per browser (a convenience; storage may be unavailable).
const VISITED_KEY = 'jhh-pacu:visited'

export function loadVisited<T extends string>(): Set<T> {
  try {
    return new Set(JSON.parse(localStorage.getItem(VISITED_KEY) ?? '[]') as T[])
  } catch {
    return new Set()
  }
}

export function saveVisited(visited: Set<string>) {
  try {
    localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]))
  } catch {
    // private mode or blocked storage: visited marks just won't persist
  }
}

// On/off preferences such as ambient motion, also per browser; null when never set.
export function loadFlag(name: string): boolean | null {
  try {
    const v = localStorage.getItem(`jhh-pacu:${name}`)
    return v === null ? null : v === '1'
  } catch {
    return null
  }
}

export function saveFlag(name: string, on: boolean) {
  try {
    localStorage.setItem(`jhh-pacu:${name}`, on ? '1' : '0')
  } catch {
    // storage unavailable: the choice lasts for this visit only
  }
}
