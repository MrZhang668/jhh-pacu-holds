// Module 04: the three interventions and worldwide examples. From the final report.

export interface Solution {
  key: 'tracking' | 'overlap' | 'cleaning'
  n: string
  title: string
  /** one line on the intervention's card */
  teaser: string
  summary: string
  how: string[]
  roles: { who: string; does: string }[]
}

export const SOLUTIONS: Solution[] = [
  {
    key: 'tracking',
    n: '1',
    title: 'NFC patient tracking',
    teaser: 'A tap at the bedside puts every PACU patient on the bed manager’s board.',
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
  },
  {
    key: 'overlap',
    n: '2',
    title: 'Overlapping shifts',
    teaser: 'Nurses on 6-to-6 shifts take PACU arrivals while the 7 PM report runs.',
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
  },
  {
    key: 'cleaning',
    n: '3',
    title: 'NFC bed-cleaning status',
    teaser: 'Two taps tell the Command Center the moment a room is clean.',
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
  },
]

export const SOLUTIONS_ZH: typeof SOLUTIONS = [
  {
    key: 'tracking',
    n: '1',
    title: 'NFC 患者追踪',
    teaser: '在床旁轻触一下，每位 PACU 患者即出现在床位管理员的看板上。',
    summary:
      '每位手术患者领取一张可重复使用的 NFC 卡。在床旁读卡器上轻触，即可在 Epic 中自动记录到达和离开时间，患者一进入麻醉后恢复室（PACU），床位管理员就能看到。',
    how: [
      '患者进入手术室（OR）前，将其就诊记录与卡片绑定。',
      '在每个护理区域到达和离开时轻触——与护士签到的手势相同。',
      'Epic 记录时间和位置，并更新状态看板。',
    ],
    roles: [
      { who: 'PACU 护士长', does: '批准工作流程变更、培训员工、跟踪推广使用情况' },
      { who: '指挥中心负责人', does: '提交 Epic 工单，申请卡片绑定和位置自动更新' },
      { who: 'Epic 分析师', does: '开发“轻触更新位置”功能，并将卡片 ID 与就诊记录对应' },
    ],
  },
  {
    key: 'overlap',
    n: '2',
    title: '错峰班次',
    teaser: '“6 点至 6 点”班次的护士在晚 7 点交接班期间接收 PACU 转入患者。',
    summary:
      '约四分之一的住院病区护士改为上午 6 点至下午 6 点 / 下午 6 点至次日上午 6 点班次。他们在 6:15 前完成自己的交接，因此在 7 点交接班期间有人可以接收 PACU 患者。',
    how: [
      '约 75% 的护士保持“7 点至 7 点”班次，约 25% 改为“6 点至 6 点”。',
      '“7 点至 7 点”护士交接时，由“6 点至 6 点”护士负责接收转入患者并支援其他病区。',
      '公布新排班，并说明这一小时重叠为何重要。',
    ],
    roles: [
      { who: '住院病区护士长', does: '制定配套排班，并为重叠时段安排人手' },
      { who: '当班负责护士（charge nurse）', does: '将 PACU 转入患者分派给未在交接的护士' },
    ],
  },
  {
    key: 'cleaning',
    n: '3',
    title: 'NFC 床位清洁状态',
    teaser: '轻触两下，房间一清洁完毕，指挥中心即刻知晓。',
    summary:
      '环境服务部（EVS）员工在开始和结束清洁房间时各轻触一次卡片。指挥中心可实时看到“清洁中”和“可分配”状态，无需等待电话通知。',
    how: [
      '第一次轻触：“清洁中”。第二次轻触：“清洁完成——可分配”。',
      '距第一次轻触不足 7 分钟的第二次轻触将被忽略，因此连续误触无法伪造已清洁的房间。',
      '状态一变更，床位管理员即可分配该房间。',
    ],
    roles: [
      { who: 'EVS 主管', does: '将卡片纳入清洁流程，并培训每个班次的员工' },
      { who: '指挥中心负责人', does: '提交 Epic 工单，申请两次轻触逻辑' },
      { who: 'Epic 分析师', does: '开发状态变更、7 分钟防误触机制和看板' },
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

export const EXAMPLES_ZH: typeof EXAMPLES = [
  {
    place: 'Mount Alvernia Hospital，新加坡',
    lat: 1.35,
    lon: 103.84,
    effect: '−34%',
    measure: '清洁响应时间',
    what: '出院时投放 NFC 标签，触发保洁提醒并更新床位可用状态。',
  },
  {
    place: 'Aalborg University Hospital，丹麦',
    lat: 57.05,
    lon: 9.92,
    effect: '−20%',
    measure: '任务启动时间',
    what: '护士轻触 NFC 标签，一键申请床位清洁或撤床。',
  },
  {
    place: '台湾地区的医院',
    lat: 23.7,
    lon: 121.0,
    effect: '−30%',
    measure: '入院办理时间',
    what: '通过 RFID/NFC 标签在护士的移动设备上追踪入院和转科。',
  },
  {
    place: 'MaineHealth，美国缅因州',
    lat: 43.66,
    lon: -70.26,
    effect: '−15 至 20%',
    measure: '交接期间的打断次数',
    what: '错峰床旁交接班：护理助理比护士提前一小时交接。',
  },
]

export const HOME = { place: 'The Johns Hopkins Hospital, Baltimore', lat: 39.3, lon: -76.59 }
export const HOME_ZH: typeof HOME = { place: '约翰斯·霍普金斯医院，巴尔的摩', lat: 39.3, lon: -76.59 }
