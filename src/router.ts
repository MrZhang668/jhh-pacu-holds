import { useMemo, useSyncExternalStore } from 'react'
import type { ModuleKey } from './data/campus'

// Hash routes (#/interviews …) so the site works on any static host and the back button closes panels.
export type Route =
  | { name: 'map' }
  | { name: 'module'; key: ModuleKey }
  | { name: 'overview' }
  | { name: 'about' }

const MODULE_KEYS: ModuleKey[] = ['interviews', 'data', 'thinking', 'outcomes']

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  if ((MODULE_KEYS as string[]).includes(path)) return { name: 'module', key: path as ModuleKey }
  if (path === 'overview' || path === 'about') return { name: path }
  return { name: 'map' }
}

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  window.addEventListener('hashchange', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('hashchange', listener)
  }
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return useMemo(() => parse(hash), [hash])
}

// panels opened from inside the app close with history.back(), so the back button stays in sync
let inAppDepth = 0

export function navigate(path: string) {
  const target = path ? `#/${path}` : '#/'
  if (window.location.hash === target) return
  if (parse(target).name === 'map') {
    closePanel()
    return
  }
  if (parse(window.location.hash).name !== 'map') {
    // panel to panel (e.g. "next module"): replace, so one Back or Close returns to the map
    window.history.replaceState(null, '', target)
    notify()
    return
  }
  inAppDepth++
  window.location.hash = target
}

export function closePanel() {
  if (parse(window.location.hash).name === 'map') return
  if (inAppDepth > 0) {
    inAppDepth--
    window.history.back()
  } else {
    // opened from a shared link: replace instead of leaving the site
    window.history.replaceState(null, '', '#/')
    notify()
  }
}
