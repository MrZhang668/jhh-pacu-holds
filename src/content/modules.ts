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
  lede: string
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
      { value: '64%', label: 'of holds (top 3 reasons) start 11:00–17:59' },
      { value: '18%', label: 'of “receiving RN unavailable” holds start in the 7 PM hour' },
      { value: '≈ 2.2×', label: 'average hold vs. the 30-minute threshold' },
      { value: '~69%', label: 'of hold reasons fall where our fixes aim' },
    ],
    camera: { azimuth: -18, polar: 60, distance: 430, targetY: 22 },
  },
  thinking: {
    n: '03',
    label: 'Mind Map',
    verb: 'Synthesize',
    title: 'Mind Map · Issue Tree · Impact Matrix',
    building: 'welch',
    teaser: 'How we framed and ranked the problem',
    lede: 'Mapping the flow end to end showed delays cascading from the OR to the PACU to the inpatient units.',
    facts: [
      { value: 'DMAIC', label: 'Lean Six Sigma framework' },
      { value: '4', label: 'issue-tree branches: OR, PACU, inpatient, hospital-wide' },
      { value: '2', label: 'rounds of the impact × effort matrix' },
    ],
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
