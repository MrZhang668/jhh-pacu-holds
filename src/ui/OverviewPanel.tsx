import { ACKNOWLEDGEMENT, ACKNOWLEDGEMENT_ZH, OVERVIEW, OVERVIEW_ZH } from '../content/overview'
import { navigate } from '../router'
import { useL, useT } from '../state/lang'

/** Top-centre project summary: three columns, collapsing to a one-line bar once people explore. */
export function OverviewPanel({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const t = useT()
  const overview = useL(OVERVIEW, OVERVIEW_ZH)
  if (collapsed) {
    return (
      <button type="button" className="overview-bar glass" onClick={onToggle} aria-expanded="false" aria-controls="overview">
        <span className="long">
          {t(
            'Project overview · 24 stakeholders · 90 days of data · 3 interventions',
            '项目概览 · 24 位利益相关者 · 90 天数据 · 3 项改进措施',
          )}
        </span>
        <span className="short">{t('Project overview', '项目概览')}</span>
        <span aria-hidden="true">▾</span>
      </button>
    )
  }
  return (
    <section id="overview" className="overview glass" aria-label={t('Project overview', '项目概览')}>
      <div className="overview-cols">
        {overview.map((c) => (
          <article key={c.key}>
            <h2>{c.heading}</h2>
            <p className="figure">
              <b>{c.figure}</b>
            </p>
            <p className="text">{c.short}</p>
          </article>
        ))}
      </div>
      <p className="overview-ack">
        <b>{t('Acknowledgement', '致谢与声明')}</b> {t(ACKNOWLEDGEMENT, ACKNOWLEDGEMENT_ZH)}
      </p>
      <div className="overview-actions">
        <a
          href="#/overview"
          onClick={(e) => {
            e.preventDefault()
            navigate('overview')
          }}
        >
          {t('Read the full overview →', '阅读完整概览 →')}
        </a>
        <button type="button" onClick={onToggle} aria-expanded="true" aria-controls="overview">
          {t('Collapse ▴', '收起 ▴')}
        </button>
      </div>
    </section>
  )
}
