import type { ModuleKey } from '../data/campus'

export interface ModuleInfo {
  n: string
  /** label on the building */
  label: string
  verb: string
  title: string
  /** building that hosts the module (campus key) */
  building: string
  /** one line shown when hovering the label */
  teaser: string
  /** one-sentence conclusion at the top of the panel */
  lede?: string
  facts: { value: string; label: string }[]
  /** camera framing when the module opens: degrees and metres around the building anchor */
  camera: { azimuth: number; polar: number; distance: number; targetY: number }
}

// Tour order: listen → measure → synthesize → recommend.
export const MODULE_ORDER: ModuleKey[] = ['interviews', 'data', 'thinking', 'outcomes']

export const MODULES: Record<ModuleKey, ModuleInfo> = {
  interviews: {
    n: '01',
    label: 'Interviews',
    verb: 'Listen',
    title: 'Interviews & Field Observation',
    building: 'weinberg',
    teaser: '24 stakeholders · 10+ hours on four units',
    lede: 'Nurses, managers and bed managers described the same few bottlenecks from every side of the hand-off.',
    facts: [
      { value: '24', label: 'stakeholders interviewed' },
      { value: '18', label: 'frontline nurses among them' },
      { value: '10+ h', label: 'observing 2 PACUs and 2 inpatient units' },
      { value: '83%', label: 'of staff unsure of patient status or location' },
    ],
    camera: { azimuth: -40, polar: 57, distance: 330, targetY: 14 },
  },
  data: {
    n: '02',
    label: 'Data',
    verb: 'Measure',
    title: '90 Days of PACU Holds',
    building: 'zayed',
    teaser: 'When and why patients wait',
    lede: 'Holds build through the afternoon and spike at the 7 PM shift change.',
    facts: [
      { value: '63%', label: 'of holds (top 3 reasons) start 11:00–17:59' },
      { value: '17%', label: 'of “receiving RN unavailable” holds start in the 7 PM hour' },
      { value: '≈ 2.3×', label: 'average hold vs. the 30-minute threshold' },
      { value: '~70%', label: 'of hold reasons fall where our fixes aim' },
    ],
    camera: { azimuth: -18, polar: 60, distance: 430, targetY: 22 },
  },
  thinking: {
    n: '03',
    label: 'Problem Definition and Analysis',
    verb: 'Synthesize',
    title: 'Problem Definition & Root Causes',
    building: 'welch',
    teaser: 'How we framed and ranked the problem',
    facts: [],
    camera: { azimuth: -24, polar: 55, distance: 260, targetY: 8 },
  },
  outcomes: {
    n: '04',
    label: 'Outcomes',
    verb: 'Recommend',
    title: 'Three Targeted Interventions',
    building: 'billings',
    teaser: 'Three low-cost fixes for the hand-off',
    lede: 'Three changes built on equipment the hospital already owns target the most common hold reasons.',
    facts: [
      { value: 'NFC', label: 'tap-in patient tracking in Epic' },
      { value: '6–6', label: 'overlapping shifts for ~25% of inpatient nurses' },
      { value: 'EVS', label: 'NFC bed-cleaning status for bed managers' },
      { value: '< $50', label: 'new hardware in total' },
    ],
    camera: { azimuth: -74, polar: 58, distance: 330, targetY: 18 },
  },
}

type ModuleText = Pick<ModuleInfo, 'label' | 'verb' | 'title' | 'teaser' | 'lede' | 'facts'>

const ZH_TEXT: Record<ModuleKey, ModuleText> = {
  interviews: {
    label: '访谈',
    verb: '倾听',
    title: '访谈与现场观察',
    teaser: '24 位利益相关者 · 在四个病区观察 10+ 小时',
    lede: '护士、护士长与床位管理员从交接的不同环节出发，描述的却是同样几个瓶颈。',
    facts: [
      { value: '24', label: '位受访利益相关者' },
      { value: '18', label: '位为一线护士' },
      { value: '10+ 小时', label: '在 2 个 PACU 和 2 个住院病区现场观察' },
      { value: '83%', label: '的员工不确定患者的状态或位置' },
    ],
  },
  data: {
    label: '数据',
    verb: '测量',
    title: '90 天 PACU 滞留数据',
    teaser: '患者何时等待，又为何等待',
    lede: '滞留在午后持续累积，并在晚 7 点交接班时激增。',
    facts: [
      { value: '63%', label: '的滞留（前 3 大原因）始于 11:00–17:59' },
      { value: '17%', label: '的“接收护士不可用”滞留始于晚 7 点时段' },
      { value: '≈ 2.3×', label: '平均滞留时长约为 30 分钟阈值的倍数' },
      { value: '~70%', label: '的滞留原因落在我们改进措施的覆盖范围内' },
    ],
  },
  thinking: {
    label: '问题定义与分析',
    verb: '综合',
    title: '问题定义与根本原因',
    teaser: '我们如何界定问题并排定优先级',
    facts: [],
  },
  outcomes: {
    label: '成果',
    verb: '建议',
    title: '三项针对性改进措施',
    teaser: '针对交接环节的三项低成本改进',
    lede: '三项改进均基于医院现有设备，针对最常见的滞留原因。',
    facts: [
      { value: 'NFC', label: '在 Epic 中实现触碰式患者追踪' },
      { value: '6–6', label: '约 25% 的住院护士实行错峰班次' },
      { value: 'EVS', label: '为床位管理员提供 NFC 床位清洁状态' },
      { value: '< 50 美元', label: '新增硬件总成本' },
    ],
  },
}

export const MODULES_ZH = Object.fromEntries(
  MODULE_ORDER.map((k) => [k, { ...MODULES[k], ...ZH_TEXT[k] }]),
) as Record<ModuleKey, ModuleInfo>
