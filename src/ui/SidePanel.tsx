import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react'
import { MODULES, MODULES_ZH } from '../content/modules'
import {
  DMAIC,
  DMAIC_ZH,
  OVERVIEW,
  OVERVIEW_FOOTNOTE,
  OVERVIEW_ZH,
  PROJECT,
  PROJECT_ZH,
  TIMELINE,
  TIMELINE_ZH,
} from '../content/overview'
import { INTERVIEWS, INTERVIEWS_ZH, PUBLISHED } from '../content/references'
import type { ModuleKey } from '../data/campus'
import type { Route } from '../router'
import { useLang, useT } from '../state/lang'
import { CloseIcon } from './icons'

// module content loads on demand, keeping the first screen light
const MODULE_BODIES: Record<ModuleKey, ReturnType<typeof lazy>> = {
  interviews: lazy(() => import('../modules/InterviewsModule')),
  data: lazy(() => import('../modules/DataModule')),
  thinking: lazy(() => import('../modules/ThinkingModule')),
  outcomes: lazy(() => import('../modules/OutcomesModule')),
}

/** The right-hand panel that opens over the map for a module, the full overview or About. */
export function SidePanel({ route, onClose }: { route: Route; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  const t = useT()
  const zh = useLang() === 'zh'
  const project = zh ? PROJECT_ZH : PROJECT
  const interviews = zh ? INTERVIEWS_ZH : INTERVIEWS
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [route])

  if (route.name === 'map') return null

  let eyebrow: ReactNode
  let title: string
  let sub: string | undefined
  let body: ReactNode

  if (route.name === 'module') {
    const m = (zh ? MODULES_ZH : MODULES)[route.key]
    const Body = MODULE_BODIES[route.key]
    eyebrow = (
      <>
        <span className="n">{m.n}</span> {m.verb}
      </>
    )
    title = m.title
    body = (
      <>
        {m.lede && <p className="lede">{m.lede}</p>}
        {m.facts.length > 0 && (
          <ul className="facts">
            {m.facts.map((f) => (
              <li key={f.label}>
                <b>{f.value}</b>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
        )}
        <Suspense fallback={<p className="loading-inline">{t('Loading…', '加载中…')}</p>}>
          <Body />
        </Suspense>
      </>
    )
  } else if (route.name === 'overview') {
    eyebrow = t('Project overview', '项目概览')
    title = project.title
    sub = project.subtitle
    body = (
      <>
        {(zh ? OVERVIEW_ZH : OVERVIEW).map((c) => (
          <section key={c.key}>
            <h3>{c.heading}</h3>
            <p>{c.full}</p>
          </section>
        ))}
        <section>
          <h3>{t('How we worked: DMAIC', '工作方法：DMAIC')}</h3>
          <ol className="dmaic">
            {(zh ? DMAIC_ZH : DMAIC).map((d) => (
              <li key={d.step}>
                <b>{d.step}</b>
                <span>{d.text}</span>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h3>{t('Timeline', '时间线')}</h3>
          <ol className="timeline">
            {(zh ? TIMELINE_ZH : TIMELINE).map((e) => (
              <li key={e.date}>
                <time>{e.date}</time>
                <span>{e.text}</span>
              </li>
            ))}
          </ol>
        </section>
        <p className="footnote">{OVERVIEW_FOOTNOTE}</p>
      </>
    )
  } else {
    eyebrow = t('About', '关于')
    title = t('Team, hosts & credits', '团队、指导方与致谢')
    sub = project.team
    body = (
      <>
        <section>
          <h3>{t('Team', '团队')}</h3>
          <p>
            {t(
              'Heather Li, Sanket Sachin Navale and Wandong Zhang — MSEM, Johns Hopkins Whiting School of Engineering.',
              'Heather Li、Sanket Sachin Navale、Wandong Zhang —— 约翰斯·霍普金斯大学怀廷工程学院工程管理硕士（MSEM）。',
            )}
          </p>
        </section>
        <section>
          <h3>{t('Hosts', '项目指导方')}</h3>
          <p>
            {t(
              'Dr. Sharon Owens, Director of Nursing for Surgery and Physical Medicine & Rehabilitation, and Amy Hampt, Assistant Director of Nursing for Surgery and PM&R.',
              'Sharon Owens 博士，外科及物理医学与康复科（PM&R）护理部主任；Amy Hampt，外科及 PM&R 护理部副主任。',
            )}
          </p>
        </section>
        <section>
          <h3>{t('Thank you', '致谢')}</h3>
          <p>
            {t(
              'Rose Karlan (Weinberg 4CD), Patty Guthrie (Weinberg 3) and bed manager Mel Vista (Command Center) for opening their units to us, and the clinical and administrative staff who made time for interviews.',
              '感谢 Rose Karlan（Weinberg 4CD）、Patty Guthrie（Weinberg 3）及床位管理员 Mel Vista（指挥中心）向我们开放所在部门，也感谢抽出时间接受访谈的临床与行政人员。',
            )}
          </p>
        </section>
        <section>
          <h3>{t('About this site', '关于本网站')}</h3>
          <p>
            {t(
              'An independent student project (JHU MSEM), not an official Johns Hopkins Medicine website. The hold data shown are illustrative: they keep the patterns found in the analysis, but the values have been adjusted and are not real operational data.',
              '本网站为独立学生项目（JHU MSEM），并非约翰斯·霍普金斯医学官方网站。网站展示的滞留数据为虚拟数据：保留了分析中发现的规律，但具体数值已作调整，并非真实运营数据。',
            )}
          </p>
          <p>
            {t(
              'Campus model from OpenStreetMap data (© OpenStreetMap contributors, ODbL), with building names after the Johns Hopkins Medical Campus map (March 2025). World outline from Natural Earth.',
              '园区模型基于 OpenStreetMap 数据（© OpenStreetMap 贡献者，ODbL 许可），建筑名称参照约翰斯·霍普金斯医学园区地图（2025 年 3 月版）。世界轮廓数据来自 Natural Earth。',
            )}
          </p>
        </section>
        <section>
          <h3>{t('References', '参考文献')}</h3>
          <details className="guide" open>
            <summary>
              {t('Published sources', '公开文献')} ({PUBLISHED.length})
            </summary>
            <ol className="refs">
              {PUBLISHED.map((r) => (
                <li key={r.text}>
                  {r.text}{' '}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer">
                      {t('Link', '链接')}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </details>
          <details className="guide">
            <summary>
              {t('Interviews, by role', '访谈（按职位）')} ({interviews.length})
            </summary>
            <ol className="refs">
              {interviews.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </details>
        </section>
      </>
    )
  }

  const bodyKey = route.name === 'module' ? route.key : route.name
  return (
    <aside className="side-panel" aria-labelledby="panel-title">
      <header className="panel-head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="panel-title" ref={heading} tabIndex={-1}>
          {title}
        </h2>
        {sub && <p className="panel-sub">{sub}</p>}
        <button type="button" className="close" onClick={onClose} aria-label={t('Close and return to the map', '关闭并返回地图')}>
          <CloseIcon />
        </button>
      </header>
      {/* keyed so each page starts scrolled to the top */}
      <div className="panel-body" key={bodyKey}>
        {body}
      </div>
    </aside>
  )
}
