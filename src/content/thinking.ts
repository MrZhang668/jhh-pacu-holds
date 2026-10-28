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

export const FLOW_ZH: typeof FLOW = {
  stages: ['手术室', 'PACU', '住院病区', '出院'],
  orInputs: ['每日手术量', '护士掌握手术进度的程度', '手术室团队的优先事项'],
  transfer: ['转运距离', '转运人员'],
  nurse: ['患者临时激增', '接收前准备', '转运', '照护患者', '优先事项'],
  bedManager: ['数据管理（系统 / 应用）', '与护士沟通：优先级、频率', '制度政策'],
  bed: ['床位总数', '每张床位的清洁时间', '每日入院量（入、出、合计）', '床位周转'],
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

export const ISSUE_TREE_ZH: TreeNode = {
  id: 'root',
  label: '约翰斯·霍普金斯医院的转运延误（“滞留”）',
  children: [
    {
      id: 'or',
      label: '手术室',
      children: [
        {
          id: 'or-scheduling',
          label: '手术排程',
          children: [
            { id: 'or-er', label: '急诊科额外转入的患者' },
            { id: 'or-complex', label: '复杂病例数量多' },
            { id: 'or-stagger', label: '缺乏错峰安排' },
          ],
        },
        {
          id: 'or-comm',
          label: '与其他科室各自为政 / 沟通',
          children: [
            { id: 'or-eta', label: '没有手术预计结束时间' },
            { id: 'or-notify', label: '没有通知其他科室的系统' },
            { id: 'or-beds', label: '对床位可用情况了解有限' },
          ],
        },
        {
          id: 'or-type',
          label: '手术类型',
          children: [{ id: 'or-aftercare', label: '术后护理流程与医嘱各不相同' }],
        },
      ],
    },
    {
      id: 'pacu',
      label: 'PACU',
      children: [
        {
          id: 'pacu-staff',
          label: '人员排班',
          children: [
            { id: 'pacu-peak', label: '手术室高峰时段人手不足' },
            { id: 'pacu-overlap', label: '交接班期间没有人员重叠' },
          ],
        },
        {
          id: 'pacu-capacity',
          label: '容量',
          children: [
            { id: 'pacu-assign', label: '护士与床位分配缓慢' },
            { id: 'pacu-clean', label: '清洁床位取决于周转时间' },
            { id: 'pacu-resources', label: '资源有限' },
          ],
        },
        {
          id: 'pacu-workload',
          label: '护士工作负荷',
          children: [
            { id: 'pacu-tasks', label: '评估、照护、转运' },
            { id: 'pacu-docs', label: '文书记录' },
          ],
        },
        {
          id: 'pacu-readiness',
          label: '患者准备状态',
          children: [
            { id: 'pacu-vitals', label: '生命体征不稳定，需要更多监护' },
            { id: 'pacu-labs', label: '等待化验结果' },
          ],
        },
        { id: 'pacu-message', label: '未及时收到手术室或住院病区的消息' },
        {
          id: 'pacu-stay',
          label: '停留时间延长',
          children: [
            { id: 'pacu-recovery', label: '恢复缓慢' },
            { id: 'pacu-criteria', label: '未达到转出标准' },
            { id: 'pacu-meds', label: '用药延误' },
          ],
        },
        { id: 'pacu-equipment', label: '设备可用性' },
      ],
    },
    {
      id: 'inpatient',
      label: '住院病区',
      children: [
        { id: 'in-nurse', label: '护士职责繁重' },
        {
          id: 'in-family',
          label: '家属',
          children: [
            { id: 'in-consent', label: '出院知情同意' },
            { id: 'in-language', label: '语言障碍' },
          ],
        },
        { id: 'in-beds', label: '有空床但缺乏管理' },
      ],
    },
    {
      id: 'hospital',
      label: '全院层面',
      children: [
        {
          id: 'h-temp',
          label: '临时护士',
          children: [{ id: 'h-procedures', label: '不熟悉操作流程' }],
        },
        {
          id: 'h-policy',
          label: '制度政策',
          children: [
            { id: 'h-escalation', label: '上报升级没有标准时限，也缺乏跟进落实' },
            { id: 'h-medication', label: '特定药物的给药规定' },
          ],
        },
        {
          id: 'h-transport',
          label: '转运',
          children: [
            { id: 'h-layout', label: '医院布局及科室间的转运时间' },
            { id: 'h-priority', label: '优先级排序' },
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

const MATRIX_LABELS_ZH: Record<string, string> = {
  message: '未及时收到其他科室的消息',
  readiness: '患者准备状态',
  'open-beds': '有空床但缺乏管理',
  goals: '各科室优先考虑自身目标',
  acuity: '护理强度（患者危重程度）',
  staffing: '人员排班',
  surgery: '手术排程',
  capacity: '容量',
  policy: '制度政策（含用药）',
  'bed-availability': '床位可用性',
  equipment: '设备可用性',
  transport: '转运',
  family: '家属',
  stay: '停留时间延长',
  temp: '临时护士',
}

export const MATRIX_ZH: MatrixItem[] = MATRIX.map((m) => ({ ...m, label: MATRIX_LABELS_ZH[m.key] ?? m.label }))

export const MATRIX_TAKEAWAY =
  'Framed as root causes, communication between units and patient readiness sit in the high-impact, low-effort corner — which is where our interventions aim.'

export const MATRIX_TAKEAWAY_ZH =
  '从根本原因的角度看，科室间沟通与患者准备状态位于“高影响、低投入”区域，这正是我们改进措施的着力点。'

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

export const DMAIC_DETAIL_ZH: typeof DMAIC_DETAIL = [
  {
    step: '定义',
    tools: '每周与项目指导方对齐 · 工作流程思维导图',
    text: '从全院系统层面（手术室 → PACU → 住院病区）而非逐个科室界定问题，并梳理每个交接环节涉及的人员、系统与设备。',
  },
  {
    step: '测量',
    tools: '90 天 Tableau 数据提取 · 问题树',
    text: '按时段、滞留原因、院区与去向量化 Zayed 3、Zayed 5 和 Weinberg 3 的滞留情况，并用相互独立的问题树列出所有影响因素。',
  },
  {
    step: '分析',
    tools: '访谈 · 现场观察 · 影响矩阵',
    text: '将数据与员工描述及我们的现场所见相互印证，再按影响与投入对改进方案排序。',
  },
  {
    step: '改进',
    tools: '标杆对比 · 利益相关者反馈',
    text: '基于现有设备设计三项改进措施，并与一线员工确认其与现行工作流程的契合度。',
  },
  {
    step: '控制',
    tools: 'Epic 事件记录 · 7 周复盘',
    text: '提出分阶段推行方案，触碰事件本身即可作为测量数据，并在前七周后进行复盘。',
  },
]
