// Module 03: the team's framing tools — workflow mind map, issue tree, impact matrix, DMAIC.
// Transcribed from the final report's appendices A–C.

/** Workflow mind map (Appendix A): the patient chain and what loads each step. */
export const FLOW = {
  stages: ['OR', 'PACU', 'Inpatient unit', 'Discharge'],
  orInputs: ['Surgeries per day', 'How well nurses can follow surgery progress', 'OR team priorities'],
  transfer: ['Transfer distance', 'Transfer staff'],
  nurse: ['Temporary surges of patients', 'Preparing to receive', 'Transfers', 'Attending to patients', 'Priorities'],
  bedManager: ['Data management (system / app)', 'Communication with nurses: priority, frequency', 'Policy'],
  bed: ['Total beds', 'Cleaning time per bed', 'Admissions per day (in, out, total)', 'Turnovers'],
}

export interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
}

/** Issue tree (Appendix B), split by location; branches kept mutually exclusive. */
export const ISSUE_TREE: TreeNode = {
  id: 'root',
  label: 'Transfer delays (“holds”) at The Johns Hopkins Hospital',
  children: [
    {
      id: 'or',
      label: 'Operating room',
      children: [
        {
          id: 'or-scheduling',
          label: 'Scheduling surgeries',
          children: [
            { id: 'or-er', label: 'Extra patients from the ER' },
            { id: 'or-complex', label: 'High volume of complex cases' },
            { id: 'or-stagger', label: 'Lack of staggering' },
          ],
        },
        {
          id: 'or-comm',
          label: 'Works apart from other units / communication',
          children: [
            { id: 'or-eta', label: 'No estimated time when surgeries will finish' },
            { id: 'or-notify', label: 'No system to notify other units' },
            { id: 'or-beds', label: 'Little awareness of bed availability' },
          ],
        },
        {
          id: 'or-type',
          label: 'Surgery type',
          children: [{ id: 'or-aftercare', label: 'Different aftercare procedures and instructions' }],
        },
      ],
    },
    {
      id: 'pacu',
      label: 'PACU',
      children: [
        {
          id: 'pacu-staff',
          label: 'Staff scheduling',
          children: [
            { id: 'pacu-peak', label: 'Shortage during peak OR hours' },
            { id: 'pacu-overlap', label: 'No staff overlap during shift changes' },
          ],
        },
        {
          id: 'pacu-capacity',
          label: 'Capacity',
          children: [
            { id: 'pacu-assign', label: 'Slow nurse and bed assignment' },
            { id: 'pacu-clean', label: 'Clean beds depend on turnover time' },
            { id: 'pacu-resources', label: 'Limited resources' },
          ],
        },
        {
          id: 'pacu-workload',
          label: 'Nurse workload',
          children: [
            { id: 'pacu-tasks', label: 'Assess, attend, transfer' },
            { id: 'pacu-docs', label: 'Documentation' },
          ],
        },
        {
          id: 'pacu-readiness',
          label: 'Patient readiness',
          children: [
            { id: 'pacu-vitals', label: 'Unstable vitals, more monitoring needed' },
            { id: 'pacu-labs', label: 'Waiting for lab results' },
          ],
        },
        { id: 'pacu-message', label: 'No timely message from the OR or inpatient unit' },
        {
          id: 'pacu-stay',
          label: 'Extended stay',
          children: [
            { id: 'pacu-recovery', label: 'Slow recovery' },
            { id: 'pacu-criteria', label: 'Discharge criteria not met' },
            { id: 'pacu-meds', label: 'Medication delay' },
          ],
        },
        { id: 'pacu-equipment', label: 'Equipment availability' },
      ],
    },
    {
      id: 'inpatient',
      label: 'Inpatient unit',
      children: [
        { id: 'in-nurse', label: 'Heavy nurse responsibility' },
        {
          id: 'in-family',
          label: 'Family',
          children: [
            { id: 'in-consent', label: 'Consent for discharge' },
            { id: 'in-language', label: 'Language barriers' },
          ],
        },
        { id: 'in-beds', label: 'Open beds but no management' },
      ],
    },
    {
      id: 'hospital',
      label: 'Hospital-wide',
      children: [
        {
          id: 'h-temp',
          label: 'Temporary nurses',
          children: [{ id: 'h-procedures', label: 'Unclear about procedures' }],
        },
        {
          id: 'h-policy',
          label: 'Policy',
          children: [
            { id: 'h-escalation', label: 'No standard time frame or follow-through for escalation' },
            { id: 'h-medication', label: 'Administration of certain medications' },
          ],
        },
        {
          id: 'h-transport',
          label: 'Transportation',
          children: [
            { id: 'h-layout', label: 'Hospital layout and travel time between units' },
            { id: 'h-priority', label: 'Prioritization' },
          ],
        },
      ],
    },
  ],
}

/**
 * Impact matrix (Appendix C): issues placed by effort (x, 0 = low) and impact (y, 0 = low), read
 * off the team's revised drawing. `node` links a point to the issue-tree branch it came from.
 */
export interface MatrixItem {
  key: string
  label: string
  node: string
  pos: [number, number]
}

export const MATRIX: MatrixItem[] = [
  { key: 'message', label: 'No timely message from other departments', node: 'pacu-message', pos: [0.4, 0.91] },
  { key: 'readiness', label: 'Patient readiness', node: 'pacu-readiness', pos: [0.11, 0.87] },
  { key: 'open-beds', label: 'Open beds but no management', node: 'in-beds', pos: [0.22, 0.55] },
  { key: 'goals', label: 'Units prioritize their own goals', node: 'or-comm', pos: [0.22, 0.74] },
  { key: 'acuity', label: 'Nurse acuity', node: 'pacu-workload', pos: [0.73, 0.84] },
  { key: 'staffing', label: 'Staff scheduling', node: 'pacu-staff', pos: [0.73, 0.91] },
  { key: 'surgery', label: 'Surgery scheduling', node: 'or-scheduling', pos: [0.9, 0.91] },
  { key: 'capacity', label: 'Capacity', node: 'pacu-capacity', pos: [0.9, 0.68] },
  { key: 'policy', label: 'Policy (incl. medication)', node: 'h-policy', pos: [0.9, 0.48] },
  { key: 'bed-availability', label: 'Availability of beds', node: 'pacu-capacity', pos: [0.9, 0.39] },
  { key: 'equipment', label: 'Availability of equipment', node: 'pacu-equipment', pos: [0.9, 0.33] },
  { key: 'transport', label: 'Transportation', node: 'h-transport', pos: [0.38, 0.27] },
  { key: 'family', label: 'Family', node: 'in-family', pos: [0.16, 0.27] },
  { key: 'stay', label: 'Extended stay', node: 'pacu-stay', pos: [0.56, 0.2] },
  { key: 'temp', label: 'Temporary nurses', node: 'h-temp', pos: [0.73, 0.2] },
]

export const MATRIX_TAKEAWAY =
  'Framed as root causes, communication between units and patient readiness sit in the high-impact, low-effort corner — which is where our interventions aim.'

export const DMAIC_DETAIL = [
  {
    step: 'Define',
    tools: 'Weekly alignment with hosts · workflow mind map',
    text: 'Scoped the problem system-wide (OR → PACU → inpatient) rather than unit by unit, and mapped the people, systems and equipment at every hand-off.',
  },
  {
    step: 'Measure',
    tools: '90-day Tableau extract · issue tree',
    text: 'Quantified holds for Zayed 3, Zayed 5 and Weinberg 3 by hour, reason, site and destination, and listed every contributor in a mutually exclusive tree.',
  },
  {
    step: 'Analyze',
    tools: 'Interviews · observation · impact matrix',
    text: 'Compared the numbers with what staff described and what we saw, then ranked fixes by impact and effort.',
  },
  {
    step: 'Improve',
    tools: 'Benchmarks · stakeholder feedback',
    text: 'Designed three interventions on existing equipment and checked them with frontline staff for fit with current workflows.',
  },
  {
    step: 'Control',
    tools: 'Epic events · 7-week review',
    text: 'Proposed a phased roll-out whose tap events double as measurements, reviewed after the first seven weeks.',
  },
]
