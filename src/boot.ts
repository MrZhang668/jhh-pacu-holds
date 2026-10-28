import { tr } from './state/lang'

// The loading screen lives in index.html so it shows before any script runs. These helpers move its
// progress bar and fade it out once the first frame of the campus is on screen.

const boot = () => document.getElementById('boot')

/** Moves the bar to a fraction (0 … 1); it never moves backwards. */
export function bootProgress(fraction: number, note?: string) {
  const el = boot()
  if (!el) return
  const bar = el.querySelector<HTMLElement>('.boot-bar > span')
  if (bar) {
    const next = Math.max(Number(bar.dataset.value ?? 0), Math.min(1, fraction))
    bar.dataset.value = String(next)
    bar.style.transform = `scaleX(${next})`
  }
  const text = el.querySelector('.boot-note')
  if (note && text) text.textContent = note
}

export function bootDone() {
  const el = boot()
  if (!el || el.classList.contains('is-done')) return
  bootProgress(1)
  el.classList.add('is-done')
  el.setAttribute('aria-busy', 'false')
  window.setTimeout(() => el.remove(), 700)
}

export function bootFail(message: string) {
  const el = boot()
  if (!el) return
  el.classList.add('is-error')
  el.setAttribute('aria-busy', 'false')
  const text = el.querySelector('.boot-note')
  if (text) text.textContent = tr(`${message}. Please reload the page.`, `${message}。请刷新页面。`)
}
