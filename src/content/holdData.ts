// Illustrative hold data for the Data module. The figures are adjusted from the project's findings: the
// patterns (when holds start, which reasons lead, where patients come from and go) match the analysis,
// but no value is the real one. Only percentages and ratios live here — no counts or records.

import type { Solution } from './outcomes'

/** Small print at the foot of the Data page. */
export const DATA_NOTE =
  'The figures on this page are illustrative, not real operational data.'

export const DATA_NOTE_ZH =
  '本页面展示的是虚拟数据，并非真实运营数据。'

/** Share of each reason's holds by start hour, whole percents (each row sums to ~100%). Kept at whole
 *  percents on purpose: one decimal is finer than a single hold, so the counts could be read back. */
export const HOURLY_REASONS = [
  {
    key: 'waitingRoom',
    label: 'Waiting for a room to be assigned',
    shares: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4, 6, 10, 10, 10, 9, 8, 10, 9, 13, 6, 2, 1, 1],
  },
  {
    key: 'rnUnavailable',
    label: 'Receiving nurse unavailable',
    shares: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 2, 5, 8, 8, 7, 8, 9, 9, 11, 17, 8, 3, 2, 1],
  },
  {
    key: 'notClean',
    label: 'Assigned room not clean',
    shares: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 4, 12, 13, 14, 11, 11, 10, 8, 9, 3, 1, 1, 0],
  },
] as const

/** Chinese row labels for HOURLY_REASONS, by key. */
export const HOURLY_REASON_LABELS_ZH: Record<(typeof HOURLY_REASONS)[number]['key'], string> = {
  waitingRoom: '等待分配病房',
  rnUnavailable: '接收护士不可用',
  notClean: '已分配病房未清洁',
}

export const HOURLY_HEADLINE = {
  midday: 63, // % of these holds starting 11:00–17:59
  sevenPmRn: 17, // % of "receiving nurse unavailable" holds starting 19:00–19:59
}

export type FixKey = Solution['key']

/**
 * PACU hold reasons as a share of all holds, Pareto order, with the interventions that target them and
 * one line on how (wording from the interventions in the final report).
 */
export const REASONS: { label: string; share: number; fixes: FixKey[]; why?: string }[] = [
  {
    label: 'Waiting for a room to be assigned',
    share: 22.4,
    fixes: ['tracking', 'cleaning'],
    why: 'Bed managers see the patient arrive with one tap and the room turn clean with two, with no phone calls in between.',
  },
  {
    label: 'Receiving nurse unavailable',
    share: 21.1,
    fixes: ['overlap'],
    why: 'Nurses on 6-to-6 shifts take PACU arrivals while the 7 PM report runs.',
  },
  {
    label: 'Assigned room not clean',
    share: 13.9,
    fixes: ['cleaning'],
    why: 'Two taps tell the Command Center the moment a room is clean.',
  },
  {
    label: 'Reason not documented',
    share: 12.3,
    fixes: ['tracking'],
    why: 'A tap logs arrival and departure in Epic automatically, so the hold is on the record.',
  },
  { label: 'PACU transport staff unavailable', share: 7.2, fixes: [] },
  { label: 'No transport out of the hospital', share: 6.1, fixes: [] },
  { label: 'Waiting for provider orders', share: 4.7, fixes: [] },
  { label: 'Discharge criteria not met', share: 4.3, fixes: [] },
  { label: 'Waiting for provider', share: 3.6, fixes: [] },
  { label: 'Other reasons', share: 4.4, fixes: [] },
]

export const REASONS_ZH: typeof REASONS = [
  {
    label: '等待分配病房',
    share: 22.4,
    fixes: ['tracking', 'cleaning'],
    why: '床位管理员只需一次触碰即可看到患者到达，两次触碰即可得知病房已清洁，其间无需任何电话沟通。',
  },
  {
    label: '接收护士不可用',
    share: 21.1,
    fixes: ['overlap'],
    why: '“6 点至 6 点”班次的护士在晚 7 点交班报告期间接收 PACU 转入患者。',
  },
  {
    label: '已分配病房未清洁',
    share: 13.9,
    fixes: ['cleaning'],
    why: '只需两次触碰，指挥中心即可第一时间得知病房已清洁。',
  },
  {
    label: '原因未记录',
    share: 12.3,
    fixes: ['tracking'],
    why: '一次触碰即可在 Epic 中自动记录到达与离开时间，滞留情况因此有据可查。',
  },
  { label: 'PACU 转运人员不可用', share: 7.2, fixes: [] },
  { label: '无离院交通工具', share: 6.1, fixes: [] },
  { label: '等待医生医嘱', share: 4.7, fixes: [] },
  { label: '未达到出院标准', share: 4.3, fixes: [] },
  { label: '等待医生', share: 3.6, fixes: [] },
  { label: '其他原因', share: 4.4, fixes: [] },
]

export const TARGETED_SHARE = 70 // waiting for room + nurse unavailable + room not clean + not documented

/** Where held patients came from (operating rooms) and where they went next. */
export const ORIGINS = [
  { label: 'Zayed–Bloomberg ORs, floor 3', share: 37.2 },
  { label: 'Weinberg ORs', share: 33.9 },
  { label: 'Zayed–Bloomberg ORs, floor 4', share: 20.4 },
  { label: 'Zayed–Bloomberg ORs, floor 5', share: 7.9 },
  { label: 'Outpatient Center and Wilmer ORs', share: 0.6 },
]

export const ORIGINS_ZH: typeof ORIGINS = [
  { label: 'Zayed–Bloomberg 手术室（3 楼）', share: 37.2 },
  { label: 'Weinberg 手术室', share: 33.9 },
  { label: 'Zayed–Bloomberg 手术室（4 楼）', share: 20.4 },
  { label: 'Zayed–Bloomberg 手术室（5 楼）', share: 7.9 },
  { label: '门诊中心（Outpatient Center）与 Wilmer 手术室', share: 0.6 },
]

export const DESTINATIONS = [
  { label: 'Non-ICU inpatient unit', share: 80.9 },
  { label: 'Discharged home', share: 18.2 },
  { label: 'ICU', share: 0.9 },
]

export const DESTINATIONS_ZH: typeof DESTINATIONS = [
  { label: '非 ICU 住院病区', share: 80.9 },
  { label: '出院回家', share: 18.2 },
  { label: 'ICU', share: 0.9 },
]

/** Average hold length as a multiple of the 30-minute hold threshold. */
export const AVERAGE_VS_THRESHOLD = 2.3
