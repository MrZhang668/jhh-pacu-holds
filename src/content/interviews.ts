// Interview and observation content for module 01. People appear by role and unit only (spec §13 #3).

/**
 * The people in the meeting illustration and what we concluded from each group.
 * Findings are our own summaries, never interviewees' words. `box` is the
 * clickable area as percentages of the 1672 × 941 image (left, top, width, height).
 */
export const PEOPLE = [
  {
    key: 'or',
    title: 'Operating rooms',
    who: 'Assistant Director of Nursing, Perioperative Services',
    box: [2.4, 37, 21.2, 55],
    findings: [
      'ICU beds are scarce, so bed allocation forces hard trade-offs between surgical patients.',
      'Cases are scheduled around surgeon availability rather than downstream bed capacity.',
      'When no PACU bay is ready, the patient waits in the OR and the next case starts late.',
      'Few steps of the transfer follow a standard process.',
    ],
  },
  {
    key: 'pacu-lead',
    title: 'PACU leadership',
    who: 'Assistant Director of Nursing (Anesthesiology & Critical Care) and the Zayed 3, Zayed 5 and Weinberg 3 PACU managers',
    box: [23.6, 40, 14.8, 34],
    findings: [
      'Staffing shortages mean the PACU cannot always open every scheduled slot.',
      'Coordination with bed managers varies from one bed manager to the next.',
      'Rooms take 45–60 minutes to clean, and patients are sometimes assigned to a bed that is still dirty.',
      'The 17-chair discharge lounge is under-used.',
    ],
  },
  {
    key: 'pacu-floor',
    title: 'PACU charge nurses & bedside care',
    who: 'Charge nurses on the Weinberg 3 PACU, plus our observation in the Weinberg 3 and Zayed PACUs',
    box: [38.4, 40, 19.2, 33],
    findings: [
      'Most delays trace back to the 7 PM nurse shift change and to whether the patient is ready to move.',
      'The PACU also takes ICU and IMC downgrades, so bed turnover is hard to predict.',
      'Bedside set-up takes 30–45 minutes at best; complex and one-to-one patients often run past the 90-minute target.',
      'Hand-off must happen face to face, so few patients move between 7:00 and 7:30.',
    ],
  },
  {
    key: 'inpatient',
    title: 'Inpatient units',
    who: 'Nurse managers of Weinberg 4CD, Zayed 11E and Zayed 9W',
    box: [58, 42.5, 15.8, 30],
    findings: [
      'Ratios of 1:4 by day to 1:6 at night decide whether a unit can take a patient, not just whether a bed is empty.',
      'Secure Chat threads pile up and replies are slow, so updates get missed.',
      'Discharge and cleaning delays hold up admissions; medications often arrive around 11 AM, which makes discharge by noon hard.',
      'Units with better staffing ratios and capacity move patients more smoothly.',
    ],
  },
  {
    key: 'supervisor',
    title: 'Nursing supervision',
    who: 'Nurse Supervisor',
    box: [74.2, 23, 20.4, 23.5],
    findings: [
      'Nursing coverage is managed across the whole hospital, not unit by unit.',
      'Staffing, as much as open beds, sets how fast units can accept PACU patients.',
    ],
  },
  {
    key: 'bed',
    title: 'Command Center & bed management',
    who: 'Bed Management Program Director, Bed Manager and Capacity Management Administrator',
    box: [74.2, 47.5, 21.4, 47],
    findings: [
      'Patient status in Epic is updated by hand, so there is no real-time view of where a patient is.',
      'A patient not documented in the PACU does not appear in Epic and cannot be posted for a bed.',
      'Environmental Services has no standard way to tell bed managers a room is clean.',
      'Bed-management practices differ from one bed manager to the next.',
    ],
  },
] as const

/**
 * Steps of the hand-off chain, with what staff told us goes wrong at each.
 * `lane` places a step on the patient path or in the support lane below it.
 */
export const STAKEHOLDERS = [
  {
    key: 'OR',
    lane: 'flow',
    name: 'Operating rooms',
    short: 'OR',
    pain: 'Cases are scheduled around surgeon availability: ICU-bound cases early, high-volume outpatient cases later. With no PACU bay ready, patients wait in the OR and the next case can’t start.',
  },
  {
    key: 'PACU',
    lane: 'flow',
    name: 'Post-anesthesia care units',
    short: 'PACU',
    pain: 'Recovery bays double as overflow for ICU and IMC downgrades. Acuity and length of stay vary, so the 90-minute target is often missed even after patients meet discharge criteria.',
  },
  {
    key: 'Inpatient',
    lane: 'flow',
    name: 'Inpatient units',
    short: 'Inpatient',
    pain: 'Arrivals during the 7 PM hand-off collide with report; late posting leaves no time to prepare; a free bed isn’t a free nurse — sometimes a dirty bed under a less-busy nurse.',
  },
  {
    key: 'Command Center',
    lane: 'support',
    name: 'Command Center & nursing leadership',
    short: 'Bed management · leadership',
    pain: 'A patient not documented in the PACU doesn’t appear in Epic and can’t be posted. Practices differ from one bed manager to the next, and nursing coverage is balanced hospital-wide rather than unit by unit.',
  },
  {
    key: 'EVS',
    lane: 'support',
    name: 'Environmental Services',
    short: 'Room cleaning',
    pain: 'Rooms take about 45 minutes to clean, sometimes hours, and there is no standard way to tell bed managers a room is ready.',
  },
] as const

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
