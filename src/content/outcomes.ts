// Module 04: root causes, the three interventions, worldwide examples, impact. From the final report.

export const ROOT_CAUSES = [
  {
    key: 'handoff',
    title: 'Conflicting duties at shift change',
    text: 'Patients posted to arrive between 6:45 and 7:15 PM land in the middle of report.',
    fixes: ['overlap'],
  },
  {
    key: 'standard',
    title: 'No shared standard',
    text: 'Communication and practice follow personal experience and unit culture.',
    fixes: ['tracking', 'cleaning'],
  },
  {
    key: 'visibility',
    title: 'No cross-department visibility',
    text: 'Status depends on manual entries in Epic and Secure Chat, so patients and rooms go “invisible”.',
    fixes: ['tracking', 'cleaning'],
  },
]

export interface Step {
  week: [number, number]
  text: string
}

export interface Solution {
  key: 'tracking' | 'overlap' | 'cleaning'
  n: string
  title: string
  summary: string
  how: string[]
  roles: { who: string; does: string }[]
  cost: { item: string; amount: string }[]
  timeline?: Step[]
}

export const SOLUTIONS: Solution[] = [
  {
    key: 'tracking',
    n: '1',
    title: 'NFC patient tracking',
    summary:
      'Each surgical patient gets a reusable NFC card. A tap on the bedside reader logs arrival and departure in Epic automatically, so bed managers see a patient the moment they reach the PACU.',
    how: [
      'Link the patient’s encounter to a card before the OR.',
      'Tap on arrival and departure at every care area — the same gesture nurses use to sign in.',
      'Epic records the time and location and updates the status boards.',
    ],
    roles: [
      { who: 'PACU nurse managers', does: 'approve the workflow change, train staff, follow adoption' },
      { who: 'Command Center leadership', does: 'submit the Epic ticket for card linking and automatic location updates' },
      { who: 'Epic analysts', does: 'build “tap to update location” and map card IDs to encounters' },
    ],
    cost: [
      { item: '60 NFC cards (Weinberg 3 has 28 beds, Zayed 5 has 24; cards are reused)', amount: '$36' },
      { item: 'NFC readers (already at every bedside)', amount: '$0' },
      { item: 'Training: a 30-minute huddle per unit', amount: 'staff time' },
    ],
    timeline: [
      { week: [1, 1], text: 'Epic ticket submitted' },
      { week: [2, 4], text: 'Epic build and internal testing' },
      { week: [4, 5], text: 'Soft launch on Weinberg 3' },
      { week: [6, 6], text: 'Launch on Zayed 5' },
      { week: [7, 7], text: 'Review the workflow data' },
    ],
  },
  {
    key: 'overlap',
    n: '2',
    title: 'Overlapping shifts',
    summary:
      'About a quarter of inpatient nurses move to 6 AM–6 PM / 6 PM–6 AM. They finish their own report by 6:15, so someone is free to receive PACU patients during the 7 o’clock hand-off.',
    how: [
      'Keep ~75% of nurses on 7–7 shifts and move ~25% to 6–6.',
      'The 6–6 nurses cover arrivals and other units while the 7–7 nurses give report.',
      'Share the new schedules and explain why the hour of overlap matters.',
    ],
    roles: [
      { who: 'Inpatient nurse managers', does: 'build the paired schedules and staff the overlap' },
      { who: 'Charge nurses', does: 'route PACU arrivals to the nurses not in report' },
    ],
    cost: [{ item: 'Rescheduling within existing staff', amount: '$0' }],
  },
  {
    key: 'cleaning',
    n: '3',
    title: 'NFC bed-cleaning status',
    summary:
      'Environmental Services staff tap a card when they start and when they finish cleaning a room. The Command Center sees “cleaning in progress” and “ready to assign” in real time instead of waiting for a call.',
    how: [
      'First tap: “Cleaning in progress”. Second tap: “Cleaning finished — ready to assign”.',
      'A second tap within 7 minutes of the first is ignored, so a double tap can’t fake a clean room.',
      'Bed managers assign the room as soon as the status changes.',
    ],
    roles: [
      { who: 'EVS supervisors', does: 'bring the cards into the cleaning routine and train every shift' },
      { who: 'Command Center leadership', does: 'submit the Epic ticket for the two-tap logic' },
      { who: 'Epic analysts', does: 'build the status change, the 7-minute safeguard and the dashboards' },
    ],
    cost: [
      { item: 'A pool of 20 NFC cards, handed out each shift', amount: '$12' },
      { item: 'Tap-enabled workstations (already on every unit)', amount: '$0' },
      { item: 'Training: 30 minutes in shift meetings', amount: 'staff time' },
    ],
    timeline: [
      { week: [1, 1], text: 'Epic ticket submitted' },
      { week: [2, 4], text: 'Epic build and internal testing' },
      { week: [4, 5], text: 'Soft launch with one EVS shift' },
      { week: [6, 6], text: 'Full roll-out across coverage zones' },
      { week: [7, 7], text: 'Performance review' },
    ],
  },
]

/** Places that tried similar ideas (final report, "Worldwide Examples"). lat/lon for the map pins. */
export const EXAMPLES = [
  {
    place: 'Mount Alvernia Hospital, Singapore',
    lat: 1.35,
    lon: 103.84,
    effect: '−34%',
    measure: 'cleaning response time',
    what: 'NFC tags dropped at discharge trigger housekeeping alerts and update bed availability.',
  },
  {
    place: 'Aalborg University Hospital, Denmark',
    lat: 57.05,
    lon: 9.92,
    effect: '−20%',
    measure: 'time to start a task',
    what: 'Nurses tap NFC tags to order bed cleaning or removal in one touch.',
  },
  {
    place: 'Hospitals in Taiwan',
    lat: 23.7,
    lon: 121.0,
    effect: '−30%',
    measure: 'admission time',
    what: 'RFID/NFC tags track admissions and transfers on nurses’ mobile devices.',
  },
  {
    place: 'MaineHealth, Maine, USA',
    lat: 43.66,
    lon: -70.26,
    effect: '−15 to 20%',
    measure: 'interruptions during hand-off',
    what: 'Staggered bedside shift change: nursing assistants hand off an hour before nurses.',
  },
]

export const HOME = { place: 'The Johns Hopkins Hospital, Baltimore', lat: 39.3, lon: -76.59 }

export const SUCCESS_FACTORS = [
  { title: 'Real-time visibility', text: 'Reliable, live status of patients and rooms for everyone who moves them.' },
  { title: 'Coverage at the hand-off', text: 'Enough free nurses during the busiest transition windows, especially shift change.' },
  { title: 'Proactive beds', text: 'Rooms prepared before the patient is ready, not after.' },
]

export const PHASES = [
  { phase: 'Phase 1', text: 'Configure the Epic workflows and buy a pilot batch of NFC cards.' },
  { phase: 'Phase 2', text: 'Clinical and EVS champions run short trainings with step-by-step guides and in-system prompts.' },
  { phase: 'Phase 3', text: 'Extend the cards to every OR, PACU and inpatient unit, with refresher workshops.' },
]

export const IMPACT =
  'By focusing on shift coverage, system reliability and proactive planning, we expect visible improvements in patient flow — shorter holds, more surgical throughput, a better patient experience and less strain on staff.'

export const VISION =
  'A sustainable patient flow that keeps delays down without lowering the standard of care. If the pilots work, the department can extend the approach beyond Weinberg and Zayed.'
