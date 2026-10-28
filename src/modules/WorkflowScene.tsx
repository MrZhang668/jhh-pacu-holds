import { useState, type ReactNode } from 'react'
import { FLOW, FLOW_ZH } from '../content/thinking'
import { useL, useT } from '../state/lang'
import { Bed, BoardCard, Monitor, Packet, Patient, Person, Scene, Sign, Watcher, type Spot } from './SceneFlow'

// Appendix A as an illustrated walk: one patient goes OR → PACU → inpatient unit → home, one step per
// click. What loads each step sits behind icon badges on the people and places it belongs to.

const W = 1000
const H = 420

const STEPS = [
  { caption: 'Surgery ends. The OR team calls the PACU to send the patient over.', action: 'Move to the PACU' },
  { caption: 'Transfer 1 · A transporter wheels the patient from the OR to the PACU.', action: 'Arrive in the PACU' },
  { caption: 'Recovery · PACU nurses watch the patient until they are ready to move up.', action: 'Ready to move' },
  {
    caption: 'Hold · Ready to leave, but the unit bed is not clean or assigned and no nurse is free. The patient waits in the PACU.',
    action: 'Free a bed and a nurse',
  },
  { caption: 'Transfer 2 · The bed is cleaned and assigned and a nurse is free: the patient moves to the unit.', action: 'Discharge' },
  { caption: 'Discharge · The patient goes home and the bed turns over for the next admission.', action: 'Replay' },
]

const STEPS_ZH: typeof STEPS = [
  { caption: '手术结束。手术室团队致电 PACU，准备将患者送过去。', action: '转往 PACU' },
  { caption: '转运 1 · 转运员将患者从手术室推往 PACU。', action: '到达 PACU' },
  { caption: '恢复 · PACU 护士持续观察患者，直到其可以转往病区。', action: '可以转出' },
  {
    caption: '滞留 · 患者已可离开，但病区床位尚未清洁或分配，也没有空闲的护士。患者只能在 PACU 等待。',
    action: '腾出床位和护士',
  },
  { caption: '转运 2 · 床位已清洁并分配，护士也已空出：患者转入病区。', action: '出院' },
  { caption: '出院 · 患者回家，床位完成周转，迎接下一位入院患者。', action: '重播' },
]

const HOLD = 3

// where the patient's bed is at each step (left edge)
const GURNEY_X = [25, 190, 300, 300, 600, 600]

// small line icons for the badges (24 × 24, drawn in currentColor)
const icon = (body: ReactNode) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {body}
  </svg>
)
const CALENDAR = icon(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17.5h2" />
  </>,
)
const STRETCHER = icon(
  <>
    <path d="M2.5 11h15l3-3M5 11v5M16 11v5" />
    <circle cx="5" cy="18.5" r="1.8" />
    <circle cx="16" cy="18.5" r="1.8" />
    <circle cx="7" cy="7.5" r="1.8" />
  </>,
)
const NURSE = icon(
  <>
    <path d="M7.5 7.5V5.5q4.5-3 9 0v2z" />
    <path d="M12 4.2v2.4M10.8 5.4h2.4" />
    <circle cx="12" cy="10.5" r="3" />
    <path d="M5.5 21c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
  </>,
)
const PHONE = icon(
  <>
    <rect x="7" y="2.5" width="10" height="19" rx="2" />
    <path d="M10 6h4M10 9.5h4M10 13h2.5M11 18.5h2" />
  </>,
)
const BED = icon(
  <>
    <path d="M3 19V7M3 15h18v4M10 15v-4h8.5a2.5 2.5 0 0 1 2.5 2.5V15" />
    <circle cx="6.5" cy="12" r="1.8" />
  </>,
)

const SPOT_TITLES = { or: 'OR load', transfer: 'Transfer', pacu: 'PACU nurses', manager: 'Bed manager', beds: 'Beds', unit: 'Inpatient nurses' }
const SPOT_TITLES_ZH: typeof SPOT_TITLES = {
  or: '手术室负荷',
  transfer: '转运',
  pacu: 'PACU 护士',
  manager: '床位管理员',
  beds: '床位',
  unit: '住院病区护士',
}

const spots = (step: number, flow: typeof FLOW, title: typeof SPOT_TITLES): Spot[] => [
  { key: 'or', x: 150, y: 118, title: title.or, items: flow.orInputs, icon: CALENDAR, active: step === 0 },
  { key: 'transfer', x: 230, y: 236, title: title.transfer, items: flow.transfer, icon: STRETCHER, active: step === 1 || step === 4 },
  { key: 'pacu', x: 470, y: 176, title: title.pacu, items: flow.nurse, icon: NURSE, active: step === 2 || step === HOLD },
  { key: 'manager', x: 716, y: 34, title: title.manager, items: flow.bedManager, icon: PHONE, active: step === HOLD || step === 4 },
  { key: 'beds', x: 675, y: 346, title: title.beds, items: flow.bed, icon: BED, active: step >= HOLD },
  { key: 'unit', x: 848, y: 288, title: title.unit, items: flow.nurse, icon: NURSE, active: step === HOLD || step === 4 },
]

// a Chinese character in the small bold label is about as wide as two Latin glyphs
const labelWidth = (label: string) => [...label].reduce((w, c) => w + (/[\u2e80-\u9fff\uff00-\uffef]/.test(c) ? 13 : 7), 0)

/** A blocker on the path: red with a cross during the hold, green with a tick once it clears. */
function Blocker({ x, y, label, cleared }: { x: number; y: number; label: string; cleared: boolean }) {
  const w = labelWidth(label) + 34
  return (
    <g className="sc-fade">
      <rect className="sc-line thin" fill={cleared ? '#dcefe1' : '#f6dcd7'} x={x - w / 2} y={y - 13} width={w} height="26" rx="13" />
      <circle cx={x - w / 2 + 13} cy={y} r="8" fill={cleared ? '#3b8a5a' : '#c0392b'} />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={cleared ? `M${x - w / 2 + 9} ${y}l3 3 5-6` : `M${x - w / 2 + 10} ${y - 3}l6 6m0-6l-6 6`}
      />
      <text className="sc-small strong" x={x - w / 2 + 26} y={y + 4.5}>
        {label}
      </text>
    </g>
  )
}

export function WorkflowScene() {
  const t = useT()
  const steps = useL(STEPS, STEPS_ZH)
  const flow = useL(FLOW, FLOW_ZH)
  const titles = useL(SPOT_TITLES, SPOT_TITLES_ZH)
  const [step, setStep] = useState(0)
  const done = step === steps.length - 1
  const s = steps[step]
  const gx = GURNEY_X[step]
  const moving = step === 1 || step === 4
  const holding = step === HOLD
  const toPacu = 'M440 150C440 140 470 144 470 130'
  const toUnit = 'M600 130C600 144 640 140 640 150'
  return (
    <Scene
      label={t(
        'Illustration of a surgical patient’s path: operating room, transfer, PACU, a hold waiting for a clean, assigned bed and a free nurse, the inpatient unit, then home. Icons open what loads each step.',
        '手术患者流转路径示意图：手术室、转运、PACU、等待已清洁并分配的床位及空闲护士的滞留、住院病区，最后出院回家。点击图标可查看影响各环节的因素。',
      )}
      spots={spots(step, flow, titles)}
      caption={s.caption}
      step={step}
      steps={steps.length - 1}
      action={s.action}
      onAction={() => setStep(done ? 0 : step + 1)}
      onReset={() => setStep(0)}
      w={W}
      h={H}
    >
      <rect x="0" y="0" width={W} height={H} fill="#f7f6f2" />
      <path stroke="#c9d3dd" strokeWidth="2" d="M10 380H990" />

      {/* rooms, with the corridors between them left open */}
      <rect fill="#e9eef3" x="10" y="150" width="180" height="230" rx="4" />
      <rect fill="#e9eef3" x="560" y="150" width="240" height="230" rx="4" />
      <rect fill="#e9eef3" x="830" y="150" width="160" height="230" rx="4" />
      <rect className={`sc-hold${holding ? ' is-on' : ''}`} x="270" y="150" width="230" height="236" rx="10" />
      <Sign x={60} y={176} text={t('OR', '手术室')} w={70} />
      <Sign x={360} y={176} text="PACU" />
      <Sign x={640} y={176} text={t('Inpatient', '住院病区')} w={130} />
      <Sign x={910} y={176} text={t('Home', '回家')} w={92} />

      {/* operating room: the light over the table, and the surgeon behind it */}
      <path className="sc-line" fill="none" d="M150 136v56" />
      <path className="sc-line" fill="#e4ecf5" d="M126 214q24-26 48 0z" />
      <g className="sc-move" style={{ opacity: step === 0 ? 1 : 0.25 }}>
        <Person x={96} y={380} scrub="#86b2dc" skin="#e0b48f" cap="#3d63a8" />
      </g>

      {/* PACU: vitals monitor and the PACU nurse */}
      <rect className="sc-line" fill="#2a3446" x="282" y="204" width="56" height="40" rx="5" />
      <path fill="none" stroke={step >= 2 && step <= HOLD ? '#5ed39a' : '#5b6577'} strokeWidth="2" d="M287 226h10l5-11 6 20 5-9h20" />
      <Person
        x={474}
        y={380}
        scrub="#3d63a8"
        skin="#c68c63"
        hair="#2b1d16"
        reach={step >= 2 && step <= HOLD ? [452, 300] : undefined}
      />

      {/* inpatient room: its bed waits to be cleaned until the hold clears */}
      <g className="sc-move" style={{ opacity: step < 4 ? 1 : 0 }}>
        <Bed x={600} y={300} w={150} />
        <path className="sc-line" fill="#e4e0d8" d="M618 300q16-34 50-12t48-6q20 4 30 18z" />
      </g>
      {holding && (
        <g className="sc-fade">
          <path className="sc-line" fill="none" stroke="#8a7966" strokeWidth="5" d="M560 200l18 150" />
          <path className="sc-line" fill="#ffcf01" d="M566 346h28l6 30h-40z" />
          <Person x={588} y={380} scrub="#3b8a87" skin="#9a6544" hair="#1f1611" reach={[624, 292]} />
        </g>
      )}
      <Person
        x={790}
        y={380}
        scrub="#5f8fc4"
        skin="#f1d3b6"
        hair="#4a2f22"
        reach={step === 4 ? [752, 300] : undefined}
      />

      {/* the way home */}
      <rect className="sc-line" fill="#cfe0f1" x="872" y="214" width="70" height="166" rx="3" />
      <path className="sc-line" fill="none" d="M884 236l20-14 20 14M890 236v18h28v-18" />
      {done && (
        <g className="sc-fade">
          <Person x={960} y={380} scrub="#c98b5a" skin="#f1d3b6" hair="#5a3a22" />
        </g>
      )}

      {/* the patient's bed, pushed by a transporter between units */}
      <g className="sc-move" style={{ transform: `translateX(${gx}px)` }}>
        <g className="sc-move" style={{ opacity: moving ? 1 : 0 }}>
          <Person x={-28} y={380} scrub="#7a8aa0" skin="#e0b48f" hair="#3b2a20" reach={[6, 302]} />
        </g>
        <Bed x={0} y={300} w={150} />
        <g className="sc-move" style={{ opacity: done ? 0 : 1 }}>
          <Patient x={0} y={300} w={150} />
        </g>
      </g>

      {/* the hold: a clock that keeps running while the PACU bed stays full */}
      {holding && (
        <g className="sc-fade">
          <circle cx="398" cy="236" r="22" fill="#fff" className="sc-line" />
          <path className="sc-line" fill="none" d="M398 236v-12" />
          <g className="sc-spin" style={{ transformOrigin: '398px 236px' }}>
            <path className="sc-line" fill="none" stroke="#e8b400" strokeWidth="3" d="M398 236h13" />
          </g>
          <circle cx="398" cy="236" r="3" fill="#1f3a68" />
        </g>
      )}

      {/* what the patient waits on */}
      {step >= HOLD && step < 5 && (
        <>
          <Blocker
            x={530}
            y={142}
            label={step === HOLD ? t('No bed assigned', '未分配床位') : t('Bed assigned', '已分配床位')}
            cleared={step > HOLD}
          />
          <Blocker x={676} y={232} label={step === HOLD ? t('Bed not clean', '床位未清洁') : t('Bed clean', '床位已清洁')} cleared={step > HOLD} />
          <Blocker x={790} y={196} label={step === HOLD ? t('Nurse busy', '护士忙碌') : t('Nurse free', '护士空闲')} cleared={step > HOLD} />
        </>
      )}

      {/* Command Center: the bed board, watched by the bed manager */}
      <Monitor x={420} y={8} w={220} h={122} title={t('Bed board', '床位看板')}>
        {['PACU', t('Unit bed', '病区床位')].map((c, i) => (
          <g key={i}>
            <rect fill={i === 1 && step === 4 ? '#dcefe1' : '#f0f3f7'} x={430 + i * 102} y="58" width="96" height="62" rx="5" />
            <text className="sc-small muted" x={478 + i * 102} y="74" textAnchor="middle">
              {c}
            </text>
          </g>
        ))}
        {step >= 2 && !done && <BoardCard x={step >= 4 ? 542 : 440} y={80} label={t('Pt A', '患者 A')} tone={step >= 4 ? 'green' : step === HOLD ? 'gold' : 'blue'} />}
      </Monitor>
      <Watcher x={688} y={134} />
      <path className="sc-wire" d={toPacu} />
      <path className="sc-wire" d={toUnit} />
      <Packet run={holding ? 1 : 0} path={toPacu} />
      <Packet run={step === 4 ? 1 : 0} path={toUnit} />
    </Scene>
  )
}
