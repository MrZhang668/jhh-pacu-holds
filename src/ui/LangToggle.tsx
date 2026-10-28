import { langStore, useLang } from '../state/lang'

/** Round button under the map controls: shows the language it switches to. */
export function LangToggle() {
  const lang = useLang()
  const next = lang === 'zh' ? 'en' : 'zh'
  const label = next === 'zh' ? '切换到中文' : 'Switch to English'
  return (
    <button
      type="button"
      className="round glass lang-toggle"
      aria-label={label}
      title={label}
      lang={next === 'zh' ? 'zh-CN' : 'en'}
      onClick={() => langStore.set(next)}
    >
      {next === 'zh' ? '中' : 'EN'}
    </button>
  )
}
