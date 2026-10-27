// Homepage overview copy (spec §4.2), drawn from the final report of 18 Nov 2025.

export const PROJECT = {
  title: 'Reducing OR & PACU Holds',
  subtitle: 'Enhancing post-operative patient flow at The Johns Hopkins Hospital · Zayed & Weinberg',
  team: 'JHU Whiting School of Engineering · MSEM · Team 6 · Fall 2025',
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

export const OVERVIEW_FOOTNOTE =
  '¹ Heyba et al., “Improving Postanesthesia Care Unit (PACU) Delays: A Quality Improvement Project,” Journal of PeriAnesthesia Nursing, 2024.'

export const DMAIC = [
  { step: 'Define', text: 'Scoped the OR → PACU → inpatient flow across Zayed and Weinberg with our hosts, and drew a workflow mind map of people, systems and hand-offs.' },
  { step: 'Measure', text: '90 days of Tableau PACU-hold data for Zayed 3, Zayed 5 and Weinberg 3, plus an issue tree of every contributor we could find.' },
  { step: 'Analyze', text: 'Compared the data with 24 interviews and 10+ hours of observation, then ranked fixes on an impact × effort matrix.' },
  { step: 'Improve', text: 'Three targeted interventions, checked with frontline staff for fit with existing workflows.' },
  { step: 'Control', text: 'A phased roll-out with Epic events to measure transfers, reviewed after the first seven weeks.' },
]

export const TIMELINE = [
  { date: 'Sep 7, 2025', text: 'Issue tree' },
  { date: 'Sep 8–26', text: 'Interviews and observation on the units' },
  { date: 'Sep 18', text: 'Impact matrix' },
  { date: 'Oct 2', text: 'Presentation to the hosts' },
  { date: 'Nov 18', text: 'Final report' },
]
