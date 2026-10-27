// Interview and observation content for module 01. People appear by role and unit only (spec §13 #3).

export type Theme = 'Shift change' | 'Bed turnover' | 'Communication' | 'Staffing' | 'Standardization' | 'PACU role'

export const THEMES: Theme[] = ['Shift change', 'Bed turnover', 'Communication', 'Staffing', 'Standardization', 'PACU role']

export interface Conversation {
  date: string
  role: string
  where: 'OR' | 'PACU' | 'Inpatient' | 'Command Center' | 'Leadership'
  format: 'In person' | 'Online' | 'Observation'
  takeaway: string
  detail?: string
  themes: Theme[]
}

export const CONVERSATIONS: Conversation[] = [
  {
    date: 'Sep 8',
    role: 'Nurse Manager, Weinberg 4CD',
    where: 'Inpatient',
    format: 'In person',
    takeaway: 'Heavy nurse workload, unclear communication and slow replies on Secure Chat.',
    detail: '36-bed surgical unit (head & neck, plastics, hepatobiliary, GI); 1 nurse to 4–5 patients by day, 1 to 6 at night.',
    themes: ['Staffing', 'Communication'],
  },
  {
    date: 'Sep 9',
    role: 'Nurse Manager, Zayed 11E',
    where: 'Inpatient',
    format: 'Online',
    takeaway: 'Zayed units run more smoothly thanks to better staffing ratios and capacity.',
    detail: '32-bed orthopedic, spine, trauma and neuro unit; 1:4 by day, 1:5 at night; about five discharges and admissions a day.',
    themes: ['Staffing'],
  },
  {
    date: 'Sep 18',
    role: 'Nurse Manager, Zayed 9W',
    where: 'Inpatient',
    format: 'Online',
    takeaway: 'Discharge and cleaning delays limit admissions, and the shift change causes holds.',
    detail: 'Organ-transplant unit; 3–4 discharges a day. Medications arrive around 11 AM, so “discharge by noon” is hard to meet.',
    themes: ['Bed turnover', 'Shift change'],
  },
  {
    date: 'Sep 18',
    role: 'Asst. Director of Nursing (Anesthesiology & Critical Care) with the Zayed 3, Zayed 5 and Weinberg 3 PACU managers',
    where: 'PACU',
    format: 'Online',
    takeaway: 'Staffing shortages, inconsistent bed-manager coordination and slow room cleaning.',
    detail: 'Rooms take 45–60 minutes to clean; patients are sometimes assigned to a dirty bed; the 17-chair discharge lounge is under-used.',
    themes: ['Staffing', 'Standardization', 'Bed turnover'],
  },
  {
    date: 'Sep 19',
    role: 'Charge Nurses, Weinberg 3 PACU',
    where: 'PACU',
    format: 'In person',
    takeaway: 'Delays come from the nurse shift change and from patient readiness.',
    detail: 'The PACU also takes ICU and IMC downgrades, which makes bed turnover unpredictable.',
    themes: ['Shift change', 'PACU role'],
  },
  {
    date: 'Sep 19',
    role: 'Field observation, Weinberg 3 and Zayed PACUs',
    where: 'PACU',
    format: 'Observation',
    takeaway: 'The 90-minute PACU target is often unreachable for complex cases, and few patients move during the hand-off.',
    detail: 'Bedside set-up takes 30–45 minutes at best; one-to-one patients tie up a nurse; when Zayed 5 is on hold, Zayed 3 absorbs the overflow.',
    themes: ['PACU role', 'Shift change', 'Staffing'],
  },
  {
    date: 'Sep 19',
    role: 'Nurse Supervisor',
    where: 'Leadership',
    format: 'In person',
    takeaway: 'A hospital-wide view of nursing coverage across units.',
    themes: ['Staffing'],
  },
  {
    date: 'Sep 24',
    role: 'Asst. Director of Nursing, Perioperative Services',
    where: 'OR',
    format: 'In person',
    takeaway: 'Limited ICU beds, hard bed-allocation choices and little process standardization.',
    themes: ['Standardization'],
  },
  {
    date: 'Sep 24',
    role: 'Capacity Management Administrator',
    where: 'Command Center',
    format: 'Online',
    takeaway: 'How capacity is managed across the whole hospital, not unit by unit.',
    themes: ['Standardization'],
  },
  {
    date: 'Sep 24',
    role: 'Bed Manager, Command Center',
    where: 'Command Center',
    format: 'In person',
    takeaway: 'Communication gaps, no real-time information and a reliance on manual updates.',
    themes: ['Communication', 'Standardization'],
  },
  {
    date: 'Sep 26',
    role: 'Bed Management Program Director',
    where: 'Command Center',
    format: 'Online',
    takeaway: 'An information gap between Environmental Services (EVS) and bed managers.',
    themes: ['Bed turnover', 'Communication'],
  },
]

/**
 * Steps of the hand-off chain, with what staff told us goes wrong at each.
 * `lane` places a step on the patient path or in the support lane below it;
 * `heard` lists which conversation groups count towards that step.
 */
export const STAKEHOLDERS = [
  {
    key: 'OR',
    lane: 'flow',
    name: 'Operating rooms',
    short: 'OR',
    heard: ['OR'],
    pain: 'Cases are scheduled around surgeon availability: ICU-bound cases early, high-volume outpatient cases later. With no PACU bay ready, patients wait in the OR and the next case can’t start.',
  },
  {
    key: 'PACU',
    lane: 'flow',
    name: 'Post-anesthesia care units',
    short: 'PACU',
    heard: ['PACU'],
    pain: 'Recovery bays double as overflow for ICU and IMC downgrades. Acuity and length of stay vary, so the 90-minute target is often missed even after patients meet discharge criteria.',
  },
  {
    key: 'Inpatient',
    lane: 'flow',
    name: 'Inpatient units',
    short: 'Inpatient',
    heard: ['Inpatient'],
    pain: 'Arrivals during the 7 PM hand-off collide with report; late posting leaves no time to prepare; a free bed isn’t a free nurse — sometimes a dirty bed under a less-busy nurse.',
  },
  {
    key: 'Command Center',
    lane: 'support',
    name: 'Command Center & nursing leadership',
    short: 'Bed management · leadership',
    heard: ['Command Center', 'Leadership'],
    pain: 'A patient not documented in the PACU doesn’t appear in Epic and can’t be posted. Practices differ from one bed manager to the next, and nursing coverage is balanced hospital-wide rather than unit by unit.',
  },
  {
    key: 'EVS',
    lane: 'support',
    name: 'Environmental Services',
    short: 'Room cleaning',
    heard: [],
    pain: 'Rooms take about 45 minutes to clean, sometimes hours, and there is no standard way to tell bed managers a room is ready.',
  },
] as const

export const THEME_CARDS: { theme: Theme; title: string; text: string; evidence: string }[] = [
  {
    theme: 'Shift change',
    title: 'The 7 PM hand-off',
    text: 'An arrival between 6:45 and 7:15 PM collides with report, pulling the receiving nurse away from both. On Weinberg 3 we saw few patients move between 7:00 and 7:30.',
    evidence: '5+ nurses on each of two inpatient units named it a safety concern; charge nurses on three PACUs confirmed it.',
  },
  {
    theme: 'Bed turnover',
    title: 'Clean rooms arrive late',
    text: 'Cleaning takes about 45 minutes and often much longer, and bed managers can’t see when it is done.',
    evidence: 'Raised by PACU managers, a transplant-unit manager and the bed-management director.',
  },
  {
    theme: 'Communication',
    title: 'Nobody can see the patient',
    text: 'Status lives in Epic, but updates are static and manual; Secure Chat threads pile up and phone calls fill the gaps.',
    evidence: '15 of 18 staff (83%) were unsure of a patient’s status or location at some point.',
  },
  {
    theme: 'Staffing',
    title: 'A bed is not a nurse',
    text: 'Ratios of 1:4 to 1:6 and one-to-one patients decide whether a unit can actually take an admission.',
    evidence: 'A Zayed manager credited better ratios and capacity for smoother transfers.',
  },
  {
    theme: 'Standardization',
    title: 'Everyone does it their way',
    text: 'Bed management, PACU and inpatient practices follow personal experience and unit culture rather than a shared protocol.',
    evidence: '18 cross-comparisons of the same tasks across people and units.',
  },
  {
    theme: 'PACU role',
    title: 'The PACU is also an overflow',
    text: 'Recovery bays absorb ICU and IMC downgrades and overnight boarders, so turnover is hard to predict.',
    evidence: 'Observed in Weinberg 3 and the Zayed PACUs.',
  },
]

/** A patient’s path through the Weinberg 3 PACU, from our observation notes. */
export const JOURNEY = [
  { step: 'First call', time: 'before arrival', text: 'The OR calls ahead so the charge nurse can pre-assign a bay and a nurse.' },
  { step: 'Bedside set-up', time: '30–45 min', text: 'Monitoring, vitals every 15 minutes and documentation; 30–45 minutes counts as fast.' },
  { step: 'Recovery', time: 'target 90 min', text: 'Complex cases and one-to-one patients often run past the 90-minute target.', hold: true },
  { step: 'Ready to move', time: 'hold starts', text: 'Posted for a bed — waiting for a clean, assigned room and a receiving nurse.', hold: true },
  { step: 'Hand-off', time: 'face to face', text: 'Report must happen in person; few patients move during the 7:00–7:30 shift change.' },
]

/** The semi-structured interview guide we used, by topic. */
export const GUIDE = [
  {
    topic: 'The transfer process',
    questions: [
      'Walk us through a typical transfer from the PACU to your unit.',
      'How often do OR or PACU holds affect your workflow?',
      'How do discharges on your unit affect your ability to accept PACU patients?',
    ],
  },
  {
    topic: 'Bed assignment',
    questions: [
      'How are beds assigned for incoming post-surgical patients?',
      'What makes it hard to keep beds open or ready?',
      'How do you prioritize when several patients are ready at once?',
    ],
  },
  {
    topic: 'Staffing',
    questions: [
      'How does nurse staffing affect how quickly you can accept a patient?',
      'Do staffing levels line up with peak surgical times?',
      'Is the 7 AM / 7 PM shift change harder for transfers?',
    ],
  },
  {
    topic: 'Hospital policies',
    questions: [
      'How is communication with the PACU and OR handled, and where do hand-offs go wrong?',
      'How well does Epic support smooth transfers?',
      'Which policies unintentionally slow things down?',
    ],
  },
]
