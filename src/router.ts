import { useMemo, useSyncExternalStore } from 'react'
import type { ModuleKey } from './data/campus'

// Hash routes (#/interviews …) so the site works on any static host and the back button closes panels.
// A module may carry one sub-path (#/outcomes/tracking) for a page inside it; that part stays out of
// Route, so moving between pages of one module never re-runs what follows the route (camera, focus).
export type Route =
  | { name: 'map' }
  | { name: 'module'; key: ModuleKey }
  | { name: 'overview' }
  | { name: 'about' }

const MODULE_KEYS: ModuleKey[] = ['interviews', 'data', 'thinking', 'outcomes']

const splitHash = (hash: string) => hash.replace(/^#\/?/, '').split('/')

function parse(hash: string): Route {
  const path = splitHash(hash)[0]
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
  const path = useSyncExternalStore(subscribe, () => splitHash(window.location.hash)[0])
  return useMemo(() => parse(path), [path])
}

/** The page inside the open module (#/outcomes/tracking → 'tracking'), if any. */
export function useSubPath(): string | null {
  return useSyncExternalStore(subscribe, () => splitHash(window.location.hash)[1] || null)
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
