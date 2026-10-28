// Homepage overview copy (spec §4.2), drawn from the final report of 18 Nov 2025. Each block has an
// English original and a Chinese translation of the same shape (*_ZH).

export const PROJECT = {
  org: 'Johns Hopkins Hospital',
  title: 'Reducing OR & PACU Holds',
  subtitle: 'Enhancing post-operative patient flow at The Johns Hopkins Hospital · Zayed & Weinberg',
  team: 'JHU Whiting School of Engineering · MSEM · Fall 2025',
}

export const PROJECT_ZH: typeof PROJECT = {
  org: '约翰斯·霍普金斯医院',
  title: '减少手术室与 PACU 滞留',
  subtitle: '优化约翰斯·霍普金斯医院术后患者流转 · Zayed 与 Weinberg 大楼',
  team: '约翰斯·霍普金斯大学怀廷工程学院 · 工程管理硕士（MSEM）· 2025 年秋季',
}

export interface OverviewColumn {
  key: 'background' | 'methods' | 'outcomes'
  heading: string
  figure: string
  figureLabel: string
  /** 2–3 lines for the homepage panel */
  short: string
  /** full paragraph for the overview page */
  full: string
}

export const OVERVIEW: OverviewColumn[] = [
  {
    key: 'background',
    heading: 'Background',
    figure: '> 30 min',
    figureLabel: 'counts as a hold',
    short:
      'Patients ready to leave the OR or PACU often wait more than 30 minutes for the next step: a “hold” that ties up critical-care space and delays surgery.',
    full:
      'Patients who are ready to leave the OR or PACU often wait more than 30 minutes for the next step — a “hold”. Holds tie up critical-care space, delay surgical schedules and strain staff. Each minute of OR hold costs an estimated $20–30, and cutting PACU holds by 25 minutes can lift surgical volume by 8–12%.¹',
  },
  {
    key: 'methods',
    heading: 'Process & Methods',
    figure: '24',
    figureLabel: 'stakeholders · 10+ h observed · 90 days of data',
    short:
      'Following Lean Six Sigma DMAIC, we mapped the flow, built an issue tree and an impact matrix, analyzed PACU-hold data and spent time on the units.',
    full:
      'Following Lean Six Sigma DMAIC, we mapped the OR → PACU → inpatient flow, built an issue tree and an impact matrix, analyzed 90 days of PACU-hold data from Zayed 3, Zayed 5 and Weinberg 3, interviewed 24 stakeholders and observed four units for more than 10 hours.',
  },
  {
    key: 'outcomes',
    heading: 'Outcomes',
    figure: '3',
    figureLabel: 'interventions · < $50 new hardware',
    short:
      'Holds peak between 11 AM and 5 PM and spike at the 7 PM shift change. We proposed three low-cost fixes built on tools the hospital already has.',
    full:
      'Holds peak between 11 AM and 5 PM and spike again at the 7 PM shift change. We traced them to three root causes and proposed three low-cost fixes: NFC tap-in patient tracking in Epic, overlapping 6-to-6 nursing shifts, and an NFC bed-cleaning status feed for Environmental Services.',
  },
]

export const OVERVIEW_ZH: OverviewColumn[] = [
  {
    key: 'background',
    heading: '项目背景',
    figure: '> 30 分钟',
    figureLabel: '即视为滞留',
    short:
      '已可离开手术室（OR）或麻醉后恢复室（PACU）的患者，常常要等待 30 分钟以上才能进入下一环节。这种“滞留”（hold）占用重症监护资源，并延误手术。',
    full:
      '已可离开手术室或 PACU 的患者，常常要等待 30 分钟以上才能进入下一环节，即“滞留”（hold）。滞留占用重症监护资源、打乱手术排程，也加重医护人员负担。据估算，手术室每滞留一分钟的成本约为 20–30 美元；若 PACU 滞留时间缩短 25 分钟，手术量可提升 8–12%。¹',
  },
  {
    key: 'methods',
    heading: '过程与方法',
    figure: '24',
    figureLabel: '位利益相关者 · 10+ 小时现场观察 · 90 天数据',
    short:
      '我们遵循精益六西格玛 DMAIC 方法，梳理患者流程，构建问题树与影响矩阵，分析 PACU 滞留数据，并深入病区实地调研。',
    full:
      '我们遵循精益六西格玛 DMAIC 方法，梳理了“手术室 → PACU → 住院病区”的患者流程，构建问题树与影响矩阵，分析了 Zayed 3、Zayed 5 和 Weinberg 3 三个 PACU 共 90 天的滞留数据，访谈了 24 位利益相关者，并在四个病区进行了 10 小时以上的现场观察。',
  },
  {
    key: 'outcomes',
    heading: '项目成果',
    figure: '3',
    figureLabel: '项改进措施 · 新增硬件 < 50 美元',
    short:
      '滞留集中在上午 11 点至下午 5 点，并在晚 7 点交接班时再次激增。我们基于医院现有工具，提出了三项低成本改进措施。',
    full:
      '滞留集中在上午 11 点至下午 5 点，并在晚 7 点交接班时再次激增。我们将其归结为三个根本原因，并提出三项低成本改进措施：在 Epic 中实现 NFC 触碰式患者追踪、实行“6 点至 6 点”的错峰护理班次，以及为环境服务部（EVS）提供基于 NFC 的床位清洁状态推送。',
  },
]

export const OVERVIEW_FOOTNOTE =
  '¹ Heyba et al., “Improving Postanesthesia Care Unit (PACU) Delays: A Quality Improvement Project,” Journal of PeriAnesthesia Nursing, 2024.'

/** Shown under the three columns on the homepage. */
export const ACKNOWLEDGEMENT =
  'We thank Dr. Sharon Owens and Amy Hampt of JHH Nursing for hosting this project, and the nurses, managers and bed managers who shared their time. This is an independent student project from the JHU MSEM program, not an official Johns Hopkins Medicine publication; all hold figures are derived and normalized.'

export const ACKNOWLEDGEMENT_ZH =
  '感谢约翰斯·霍普金斯医院护理部 Sharon Owens 博士与 Amy Hampt 对本项目的指导与支持，也感谢所有抽出宝贵时间的护士、护士长及床位管理人员。本网站为约翰斯·霍普金斯大学 MSEM 项目的独立学生作品，并非约翰斯·霍普金斯医学（Johns Hopkins Medicine）官方发布内容；文中所有滞留数据均经过推导与归一化处理。'

export const DMAIC = [
  { step: 'Define', text: 'Scoped the OR → PACU → inpatient flow across Zayed and Weinberg with our hosts, and drew a workflow mind map of people, systems and hand-offs.' },
  { step: 'Measure', text: '90 days of Tableau PACU-hold data for Zayed 3, Zayed 5 and Weinberg 3, plus an issue tree of every contributor we could find.' },
  { step: 'Analyze', text: 'Compared the data with 24 interviews and 10+ hours of observation, then ranked fixes on an impact × effort matrix.' },
  { step: 'Improve', text: 'Three targeted interventions, checked with frontline staff for fit with existing workflows.' },
  { step: 'Control', text: 'A phased roll-out with Epic events to measure transfers, reviewed after the first seven weeks.' },
]

export const DMAIC_ZH: typeof DMAIC = [
  { step: '定义（Define）', text: '与项目指导方共同界定 Zayed 与 Weinberg 大楼“手术室 → PACU → 住院病区”的流程范围，并绘制涵盖人员、系统与交接环节的工作流思维导图。' },
  { step: '测量（Measure）', text: '收集 Zayed 3、Zayed 5 和 Weinberg 3 三个 PACU 共 90 天的 Tableau 滞留数据，并构建涵盖所有已知影响因素的问题树。' },
  { step: '分析（Analyze）', text: '将数据与 24 次访谈及 10 小时以上的现场观察相互印证，并在“影响 × 投入”矩阵上对改进方案进行排序。' },
  { step: '改进（Improve）', text: '提出三项针对性改进措施，并与一线员工确认其与现有工作流程的契合度。' },
  { step: '控制（Control）', text: '分阶段推行，借助 Epic 事件记录衡量转运情况，并在前七周后进行复盘。' },
]

export const TIMELINE = [
  { date: 'Sep 7, 2025', text: 'Issue tree' },
  { date: 'Sep 8–26', text: 'Interviews and observation on the units' },
  { date: 'Sep 18', text: 'Impact matrix' },
  { date: 'Oct 2', text: 'Presentation to the hosts' },
  { date: 'Nov 18', text: 'Final report' },
]

export const TIMELINE_ZH: typeof TIMELINE = [
  { date: '2025 年 9 月 7 日', text: '问题树' },
  { date: '9 月 8–26 日', text: '病区访谈与现场观察' },
  { date: '9 月 18 日', text: '影响矩阵' },
  { date: '10 月 2 日', text: '向项目指导方汇报' },
  { date: '11 月 18 日', text: '最终报告' },
]
