// Derived, normalized hold data for the Data module. Only percentages and ratios live here — no
// counts or records (the source data are internal JHH operational data and are not part of this repository).

import type { Solution } from './outcomes'

export const DATA_NOTE =
  'Derived from 90 days of JHM operational data (Jun–Sep 2025); values normalized and rounded; not official JHH statistics.'

export const DATA_NOTE_ZH =
  '数据源自约翰斯·霍普金斯医学（JHM）90 天的运营数据（2025 年 6 月至 9 月）；数值经归一化与四舍五入处理，并非约翰斯·霍普金斯医院官方统计。'

/** Share of each reason's holds by start hour, whole percents (each row sums to ~100%). Kept at whole
 *  percents on purpose: one decimal is finer than a single hold, so the counts could be read back. */
export const HOURLY_REASONS = [
  {
    key: 'waitingRoom',
    label: 'Waiting for a room to be assigned',
    shares: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 7, 10, 9, 11, 8, 9, 9, 10, 12, 6, 2, 1, 1],
  },
  {
    key: 'rnUnavailable',
    label: 'Receiving nurse unavailable',
    shares: [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 6, 9, 7, 7, 9, 8, 10, 10, 18, 7, 3, 1, 1],
  },
  {
    key: 'notClean',
    label: 'Assigned room not clean',
    shares: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 13, 14, 13, 10, 12, 11, 7, 10, 3, 2, 1, 0],
  },
] as const

/** Chinese row labels for HOURLY_REASONS, by key. */
export const HOURLY_REASON_LABELS_ZH: Record<(typeof HOURLY_REASONS)[number]['key'], string> = {
  waitingRoom: '等待分配病房',
  rnUnavailable: '接收护士不可用',
  notClean: '已分配病房未清洁',
}

export const HOURLY_HEADLINE = {
  midday: 64, // % of these holds starting 11:00–17:59
  sevenPmRn: 18, // % of "receiving nurse unavailable" holds starting 19:00–19:59
}

export type FixKey = Solution['key']

/**
 * PACU hold reasons as a share of all holds, Pareto order, with the interventions that target them and
 * one line on how (wording from the interventions in the final report).
 */
export const REASONS: { label: string; share: number; fixes: FixKey[]; why?: string }[] = [
  {
    label: 'Waiting for a room to be assigned',
    share: 21.8,
    fixes: ['tracking', 'cleaning'],
    why: 'Bed managers see the patient arrive with one tap and the room turn clean with two, with no phone calls in between.',
  },
  {
    label: 'Receiving nurse unavailable',
    share: 21.6,
    fixes: ['overlap'],
    why: 'Nurses on 6-to-6 shifts take PACU arrivals while the 7 PM report runs.',
  },
  {
    label: 'Assigned room not clean',
    share: 13.2,
    fixes: ['cleaning'],
    why: 'Two taps tell the Command Center the moment a room is clean.',
  },
  {
    label: 'Reason not documented',
    share: 12.6,
    fixes: ['tracking'],
    why: 'A tap logs arrival and departure in Epic automatically, so the hold is on the record.',
  },
  { label: 'PACU transport staff unavailable', share: 7.6, fixes: [] },
  { label: 'No transport out of the hospital', share: 5.7, fixes: [] },
  { label: 'Discharge criteria not met', share: 4.6, fixes: [] },
  { label: 'Waiting for provider orders', share: 4.4, fixes: [] },
  { label: 'Waiting for provider', share: 4.0, fixes: [] },
  { label: 'Other reasons', share: 4.5, fixes: [] },
]

export const REASONS_ZH: typeof REASONS = [
  {
    label: '等待分配病房',
    share: 21.8,
    fixes: ['tracking', 'cleaning'],
    why: '床位管理员只需一次触碰即可看到患者到达，两次触碰即可得知病房已清洁，其间无需任何电话沟通。',
  },
  {
    label: '接收护士不可用',
    share: 21.6,
    fixes: ['overlap'],
    why: '“6 点至 6 点”班次的护士在晚 7 点交班报告期间接收 PACU 转入患者。',
  },
  {
    label: '已分配病房未清洁',
    share: 13.2,
    fixes: ['cleaning'],
    why: '只需两次触碰，指挥中心即可第一时间得知病房已清洁。',
  },
  {
    label: '原因未记录',
    share: 12.6,
    fixes: ['tracking'],
    why: '一次触碰即可在 Epic 中自动记录到达与离开时间，滞留情况因此有据可查。',
  },
  { label: 'PACU 转运人员不可用', share: 7.6, fixes: [] },
  { label: '无离院交通工具', share: 5.7, fixes: [] },
  { label: '未达到出院标准', share: 4.6, fixes: [] },
  { label: '等待医生医嘱', share: 4.4, fixes: [] },
  { label: '等待医生', share: 4.0, fixes: [] },
  { label: '其他原因', share: 4.5, fixes: [] },
]

export const TARGETED_SHARE = 69 // waiting for room + nurse unavailable + room not clean + not documented

/** Where held patients came from (operating rooms) and where they went next. */
export const ORIGINS = [
  { label: 'Zayed–Bloomberg ORs, floor 3', share: 36.5 },
  { label: 'Weinberg ORs', share: 35.1 },
  { label: 'Zayed–Bloomberg ORs, floor 4', share: 19.6 },
  { label: 'Zayed–Bloomberg ORs, floor 5', share: 8.2 },
  { label: 'Outpatient Center and Wilmer ORs', share: 0.6 },
]

export const ORIGINS_ZH: typeof ORIGINS = [
  { label: 'Zayed–Bloomberg 手术室（3 楼）', share: 36.5 },
  { label: 'Weinberg 手术室', share: 35.1 },
  { label: 'Zayed–Bloomberg 手术室（4 楼）', share: 19.6 },
  { label: 'Zayed–Bloomberg 手术室（5 楼）', share: 8.2 },
  { label: '门诊中心（Outpatient Center）与 Wilmer 手术室', share: 0.6 },
]

export const DESTINATIONS = [
  { label: 'Non-ICU inpatient unit', share: 82.3 },
  { label: 'Discharged home', share: 16.9 },
  { label: 'ICU', share: 0.8 },
]

export const DESTINATIONS_ZH: typeof DESTINATIONS = [
  { label: '非 ICU 住院病区', share: 82.3 },
  { label: '出院回家', share: 16.9 },
  { label: 'ICU', share: 0.8 },
]

/** Average hold length as a multiple of the 30-minute hold threshold. */
export const AVERAGE_VS_THRESHOLD = 2.2
