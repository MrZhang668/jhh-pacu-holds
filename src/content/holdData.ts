// Derived, normalized hold data for the Data module. Only percentages and ratios live here — no
// counts or records (the source data are internal JHH operational data and are not part of this repository).

export const DATA_NOTE =
  'Derived from 90 days of JHM operational data (Jun–Sep 2025); values normalized and rounded; not official JHH statistics.'

export const SOURCES = {
  hourly:
    'Hour of day: the three most common hold reasons, from the hour × reason table in the team’s October 2 presentation (90-day extract).',
  tableau:
    'Reasons, sites and destinations: JHM Perioperative Operations PACU-holds dashboard, surgery dates Jun 13 – Sep 10, 2025.',
  scope: 'The two extracts were built differently, so their percentages are shown side by side, never combined.',
}

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

export const HOURLY_HEADLINE = {
  midday: 64, // % of these holds starting 11:00–17:59
  sevenPmRn: 18, // % of "receiving nurse unavailable" holds starting 19:00–19:59
}

export type ReasonGroup = 'Bed / room' | 'Staffing' | 'Documentation' | 'Clinical / orders' | 'Transport' | 'Other'
export type Fix = 'NFC tracking' | 'Shift overlap' | 'NFC bed cleaning'

/** PACU hold reasons as a share of all holds, Pareto order, with the fix that targets them. */
export const REASONS: { label: string; share: number; group: ReasonGroup; fixes: Fix[] }[] = [
  { label: 'Waiting for a room to be assigned', share: 21.8, group: 'Bed / room', fixes: ['NFC tracking', 'NFC bed cleaning'] },
  { label: 'Receiving nurse unavailable', share: 21.6, group: 'Staffing', fixes: ['Shift overlap'] },
  { label: 'Assigned room not clean', share: 13.2, group: 'Bed / room', fixes: ['NFC bed cleaning'] },
  { label: 'Reason not documented', share: 12.6, group: 'Documentation', fixes: ['NFC tracking'] },
  { label: 'PACU transport staff unavailable', share: 7.6, group: 'Staffing', fixes: [] },
  { label: 'No transport out of the hospital', share: 5.7, group: 'Transport', fixes: [] },
  { label: 'Discharge criteria not met', share: 4.6, group: 'Clinical / orders', fixes: [] },
  { label: 'Waiting for provider orders', share: 4.4, group: 'Clinical / orders', fixes: [] },
  { label: 'Waiting for provider', share: 4.0, group: 'Clinical / orders', fixes: [] },
  { label: 'Other reasons', share: 4.5, group: 'Other', fixes: [] },
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

export const DESTINATIONS = [
  { label: 'Non-ICU inpatient unit', share: 82.3 },
  { label: 'Discharged home', share: 16.9 },
  { label: 'ICU', share: 0.8 },
]

/** Average hold length as a multiple of the 30-minute hold threshold. */
export const AVERAGE_VS_THRESHOLD = 2.2
