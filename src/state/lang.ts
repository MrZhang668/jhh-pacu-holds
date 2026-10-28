import { useCallback, useSyncExternalStore } from 'react'

/**
 * Interface language. English is the original; Chinese is a translation that keeps proper nouns
 * (OR, PACU, Epic, NFC, DMAIC, building and street names, people, citations) as they are.
 * ?lang=zh opens the site in Chinese; otherwise the visitor's last choice, then English.
 */
export type Lang = 'en' | 'zh'

const KEY = 'jhh-lang'
const linked = new URLSearchParams(window.location.search).get('lang')

function initial(): Lang {
  if (linked === 'zh' || linked === 'en') return linked
  try {
    return window.localStorage.getItem(KEY) === 'zh' ? 'zh' : 'en'
  } catch {
    return 'en'
  }
}

let lang: Lang = initial()
const listeners = new Set<() => void>()
const apply = () => {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  document.title = lang === 'zh' ? '减少手术室与 PACU 滞留 · 约翰斯·霍普金斯医院' : 'Reducing OR & PACU Holds · Johns Hopkins Hospital'
}
apply()

export const langStore = {
  get: () => lang,
  set(next: Lang) {
    if (next === lang) return
    lang = next
    try {
      window.localStorage.setItem(KEY, next)
    } catch {
      // private mode: the choice lasts for this visit only
    }
    apply()
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export const useLang = () => useSyncExternalStore(langStore.subscribe, langStore.get)

/** t('Collapse', '收起'): the string for the current language. */
export function useT() {
  const current = useLang()
  return useCallback(<T,>(en: T, zh: T): T => (current === 'zh' ? zh : en), [current])
}

/** The English or Chinese version of a content object, for the current language. */
export function useL<T>(en: T, zh: T): T {
  return useLang() === 'zh' ? zh : en
}

/** Outside React (formatters, scene code): the same choice, read once. */
export const tr = <T,>(en: T, zh: T): T => (lang === 'zh' ? zh : en)
