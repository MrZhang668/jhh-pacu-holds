// Interview and observation content for module 01. People appear by role and unit only (spec §13 #3).

/**
 * The people in the meeting illustration and what we concluded from each group.
 * Findings are our own summaries, never interviewees' words. `box` is the
 * clickable area as percentages of the 1672 × 941 image (left, top, width, height).
 */
export interface Person {
  key: 'or' | 'pacu-lead' | 'pacu-floor' | 'inpatient' | 'supervisor' | 'bed'
  title: string
  who: string
  box: readonly [number, number, number, number]
  findings: readonly string[]
}

export const PEOPLE: readonly Person[] = [
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
]

/**
 * Steps of the hand-off chain, with what staff told us goes wrong at each.
 * `lane` places a step on the patient path or in the support lane below it.
 */
export interface Stakeholder {
  key: 'OR' | 'PACU' | 'Inpatient' | 'Command Center' | 'EVS'
  lane: 'flow' | 'support'
  name: string
  short: string
  pain: string
}

export const STAKEHOLDERS: readonly Stakeholder[] = [
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

export const PEOPLE_ZH: readonly Person[] = [
  {
    key: 'or',
    title: '手术室',
    who: '围术期服务护理部副主任',
    box: [2.4, 37, 21.2, 55],
    findings: [
      'ICU 床位紧张，床位分配不得不在不同手术患者之间艰难取舍。',
      '手术排程围绕外科医生的时间安排，而非下游的床位容量。',
      'PACU 没有空位时，患者只能在手术室等待，下一台手术随之推迟。',
      '转运流程中只有少数环节遵循标准化流程。',
    ],
  },
  {
    key: 'pacu-lead',
    title: 'PACU 管理层',
    who: '护理部副主任（麻醉与重症医学）及 Zayed 3、Zayed 5、Weinberg 3 PACU 护士长',
    box: [23.6, 40, 14.8, 34],
    findings: [
      '人员短缺导致 PACU 无法总是开放全部排定的床位。',
      '与床位管理员的协调方式因人而异。',
      '病房清洁需要 45–60 分钟，患者有时会被分配到尚未清洁的床位。',
      '设有 17 张座椅的出院候诊区利用不足。',
    ],
  },
  {
    key: 'pacu-floor',
    title: 'PACU 当班负责护士与床旁护理',
    who: 'Weinberg 3 PACU 的当班负责护士（charge nurse），以及我们在 Weinberg 3 与 Zayed PACU 的现场观察',
    box: [38.4, 40, 19.2, 33],
    findings: [
      '大多数延误可追溯到晚 7 点护士交接班，以及患者本身是否已具备转出条件。',
      'PACU 还要接收从 ICU 和 IMC 降级的患者，床位周转难以预测。',
      '床旁准备最快也需 30–45 分钟；复杂患者和一对一护理患者常常超出 90 分钟的目标。',
      '交接必须面对面进行，因此 7:00 至 7:30 之间几乎没有患者转出。',
    ],
  },
  {
    key: 'inpatient',
    title: '住院病区',
    who: 'Weinberg 4CD、Zayed 11E 与 Zayed 9W 的护士长',
    box: [58, 42.5, 15.8, 30],
    findings: [
      '白班 1:4、夜班 1:6 的护患比决定了病区能否接收患者，而不只是看有没有空床。',
      'Secure Chat 消息堆积、回复缓慢，导致信息更新被遗漏。',
      '出院与清洁延误拖慢了入院；药物常在上午 11 点左右才送到，中午前出院因此很难实现。',
      '护患比和容量更充裕的病区，患者流转更顺畅。',
    ],
  },
  {
    key: 'supervisor',
    title: '护理督导',
    who: '护理督导',
    box: [74.2, 23, 20.4, 23.5],
    findings: [
      '护理人力在全院范围内统筹调配，而非按病区逐一安排。',
      '人员配置与空床同样决定了病区接收 PACU 患者的速度。',
    ],
  },
  {
    key: 'bed',
    title: '指挥中心与床位管理',
    who: '床位管理项目主任、床位管理员及容量管理专员',
    box: [74.2, 47.5, 21.4, 47],
    findings: [
      'Epic 中的患者状态依靠人工更新，因此无法实时掌握患者所在位置。',
      '未在 PACU 登记的患者不会出现在 Epic 中，也就无法发布床位申请。',
      '环境服务部（EVS）没有标准方式通知床位管理员病房已清洁完毕。',
      '床位管理做法因床位管理员而异。',
    ],
  },
]

export const STAKEHOLDERS_ZH: readonly Stakeholder[] = [
  {
    key: 'OR',
    lane: 'flow',
    name: '手术室（OR）',
    short: '手术室',
    pain: '手术排程围绕外科医生的时间安排：需转入 ICU 的手术排在前面，大批量门诊手术排在后面。PACU 没有空位时，患者只能在手术室等待，下一台手术无法开始。',
  },
  {
    key: 'PACU',
    lane: 'flow',
    name: '麻醉后恢复室（PACU）',
    short: 'PACU',
    pain: '恢复床位还要兼作 ICU 和 IMC 降级患者的溢出床位。患者病情危重程度与停留时间各不相同，因此即使患者已达到出室标准，90 分钟的目标也常常无法实现。',
  },
  {
    key: 'Inpatient',
    lane: 'flow',
    name: '住院病区',
    short: '住院病区',
    pain: '晚 7 点交接期间到达的患者与护士交班汇报相冲突；床位申请发布过晚，病区来不及准备；有空床不等于有空闲护士，有时空出的是一张归属较空闲护士、却尚未清洁的床位。',
  },
  {
    key: 'Command Center',
    lane: 'support',
    name: '指挥中心与护理管理层',
    short: '床位管理 · 管理层',
    pain: '未在 PACU 登记的患者不会出现在 Epic 中，也就无法发布床位申请。床位管理做法因床位管理员而异，护理人力在全院范围内统筹平衡，而非按病区逐一安排。',
  },
  {
    key: 'EVS',
    lane: 'support',
    name: '环境服务部（EVS）',
    short: '病房清洁',
    pain: '病房清洁约需 45 分钟，有时长达数小时，而且没有标准方式通知床位管理员病房已就绪。',
  },
]

export const GUIDE_ZH: typeof GUIDE = [
  {
    topic: '转运流程',
    questions: [
      '请为我们介绍一次典型的从 PACU 转入贵病区的过程。',
      '手术室滞留或 PACU 滞留对您工作流程的影响有多频繁？',
      '贵病区的出院情况如何影响你们接收 PACU 患者的能力？',
    ],
  },
  {
    topic: '床位分配',
    questions: [
      '术后转入患者的床位是如何分配的？',
      '是什么让床位难以保持空置或就绪？',
      '多位患者同时准备转入时，您如何确定优先顺序？',
    ],
  },
  {
    topic: '人员配置',
    questions: [
      '护士配置如何影响你们接收患者的速度？',
      '人员配置水平是否与手术高峰时段相匹配？',
      '早 7 点 / 晚 7 点交接班时，转运是否更困难？',
    ],
  },
  {
    topic: '医院政策',
    questions: [
      '与 PACU 和手术室的沟通是如何进行的？交接在哪些环节容易出问题？',
      'Epic 对顺畅转运的支持程度如何？',
      '哪些政策在无意中拖慢了流程？',
    ],
  },
]
