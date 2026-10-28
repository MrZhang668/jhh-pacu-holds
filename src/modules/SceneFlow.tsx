import { useEffect, useState, type ReactNode } from 'react'
import { useMediaQuery } from '../state/hooks'
import { useL, useT } from '../state/lang'

// The two NFC interventions as illustrated scenes: one button walks through the taps, the people and
// screens react, and the detail sits behind info dots instead of in paragraphs. Drawn in the site's
// blue and gold on a light card that stays light at night, like a printed illustration.

const W = 960
const H = 420

// ---------- drawing pieces ----------

interface PersonProps {
  x: number
  /** feet */
  y: number
  scrub: string
  skin: string
  hair?: string
  /** surgical cap colour */
  cap?: string
  /** hand position for the reaching arm */
  reach?: [number, number]
  /** what the reaching hand holds */
  holds?: ReactNode
}

/** A standing figure in scrubs, about 170 units tall. */
export function Person({ x, y, scrub, skin, hair = '#3b2a20', cap, reach, holds }: PersonProps) {
  const top = y - 170
  return (
    <g className="sc-person">
      <path className="sc-line" fill={scrub} d={`M${x - 15} ${y - 4}V${y - 66}h30V${y - 4}`} />
      <path className="sc-line" fill={scrub} d={`M${x - 26} ${y - 62}l-2-58q${28} -20 56 0l-2 58z`} />
      <path className="sc-line" fill="none" stroke={scrub} strokeWidth="10" d={`M${x - 24} ${y - 112}l-8 44`} />
      {reach && <path fill="none" stroke={scrub} strokeWidth="10" strokeLinecap="round" d={`M${x + 22} ${y - 114}L${reach[0]} ${reach[1]}`} />}
      {reach && <circle cx={reach[0]} cy={reach[1]} r="6" fill={skin} className="sc-line" />}
      {reach && holds}
      <circle cx={x} cy={top + 18} r="17" fill={skin} className="sc-line" />
      {cap ? (
        <path className="sc-line" fill={cap} d={`M${x - 18} ${top + 16}q0-20 18-20t18 20z`} />
      ) : (
        <path className="sc-line" fill={hair} d={`M${x - 18} ${top + 18}q-2-22 18-22t18 20q-10-8-22-6t-14 8z`} />
      )}
    </g>
  )
}

/** A bed or gurney seen from the side; its mattress top is at y. */
export function Bed({ x, y, w, rails = true }: { x: number; y: number; w: number; rails?: boolean }) {
  return (
    <g>
      <path className="sc-line" fill="none" d={`M${x + 12} ${y + 20}v${380 - y - 34}M${x + w - 12} ${y + 20}v${380 - y - 34}`} />
      <circle className="sc-line" fill="#fff" cx={x + 12} cy={372} r="7" />
      <circle className="sc-line" fill="#fff" cx={x + w - 12} cy={372} r="7" />
      <rect className="sc-line" fill="#c9d3dd" x={x} y={y + 14} width={w} height="10" rx="3" />
      <rect className="sc-line" fill="#fff" x={x} y={y} width={w} height="16" rx="7" />
      {rails && <path className="sc-line" fill="none" stroke="#e8b400" d={`M${x + w * 0.35} ${y + 4}v-16h${w * 0.45}v16`} />}
    </g>
  )
}

/** A patient lying on a mattress whose top is at y, head to the left. */
export function Patient({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <path className="sc-line" fill="#dbe7f5" d={`M${x + 30} ${y + 2}q${w * 0.3} -34 ${w - 40} -6l4 6z`} />
      <circle className="sc-line" fill="#f1d3b6" cx={x + 18} cy={y - 10} r="13" />
      <path className="sc-line" fill="#86b2dc" d={`M${x + 4} ${y - 12}q2-16 16-14t12 8q-14 0-28 6z`} />
    </g>
  )
}

/** A wall monitor with a dark frame; children are drawn in its screen coordinates. */
export function Monitor({ x, y, w, h, title, children }: { x: number; y: number; w: number; h: number; title: string; children: ReactNode }) {
  return (
    <g>
      <rect className="sc-line" fill="#2a3446" x={x} y={y} width={w} height={h} rx="10" />
      <rect fill="#fbfbf8" x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx="5" />
      <text className="sc-screen-title" x={x + 20} y={y + 32}>
        {title}
      </text>
      <path stroke="#d8dde5" d={`M${x + 16} ${y + 42}H${x + w - 16}`} />
      {children}
    </g>
  )
}

const CARD = (x: number, y: number, rot = -14) => (
  <g transform={`rotate(${rot} ${x} ${y})`}>
    <rect className="sc-line" fill="#fff" x={x - 9} y={y - 13} width="18" height="26" rx="3" />
    <circle cx={x} cy={y - 2} r="4" fill="#ffcf01" />
  </g>
)

/** A wall-mounted NFC reader; pings when a tap lands (key it on the tap to replay). */
function Reader({ x, y, ping, pingKey, bad }: { x: number; y: number; ping: boolean; pingKey: number; bad?: boolean }) {
  return (
    <g>
      <rect className="sc-line" fill="#e9edf3" x={x - 22} y={y - 34} width="44" height="64" rx="8" />
      <rect fill={bad ? '#f3c4bd' : ping ? '#ffe680' : '#cfe0f1'} x={x - 14} y={y - 24} width="28" height="20" rx="3" />
      <path className="sc-line" fill="none" d={`M${x - 6} ${y + 8}a8 8 0 0 1 12 0M${x - 10} ${y + 14}a14 14 0 0 1 20 0`} />
      {ping && (
        <g key={pingKey} className={`sc-ping${bad ? ' is-bad' : ''}`}>
          <path fill="none" d={`M${x + 30} ${y - 22}a14 14 0 0 1 0 22M${x + 38} ${y - 30}a26 26 0 0 1 0 38`} />
          <path fill="none" d={`M${x - 30} ${y - 22}a14 14 0 0 0 0 22M${x - 38} ${y - 30}a26 26 0 0 0 0 38`} />
        </g>
      )}
    </g>
  )
}

/** A dot that runs along a path once (the data leaving the reader). */
export function Packet({ path, run, delay = 0 }: { path: string; run: number; delay?: number }) {
  const still = useMediaQuery('(prefers-reduced-motion: reduce)')
  if (still || run === 0) return null
  return (
    <g key={run}>
      <path className="sc-wire is-live" d={path} />
      <circle r="7" className="sc-packet" opacity="0">
        <animate attributeName="opacity" values="0;1;1;0" dur="1s" begin={`${delay}s`} fill="freeze" />
        <animateMotion path={path} dur="1s" begin={`${delay}s`} fill="freeze" />
      </circle>
    </g>
  )
}

export function Sign({ x, y, text, w = 96 }: { x: number; y: number; text: string; w?: number }) {
  return (
    <g>
      <rect className="sc-line" fill="#e4ecf5" x={x - w / 2} y={y - 20} width={w} height="38" rx="6" />
      <text className="sc-sign" x={x} y={y + 7} textAnchor="middle">
        {text}
      </text>
    </g>
  )
}

/** A card on a status board. */
export function BoardCard({ x, y, label, tone }: { x: number; y: number; label: string; tone: 'blue' | 'gold' | 'green' }) {
  const fill = tone === 'gold' ? '#fff3bf' : tone === 'green' ? '#dcefe1' : '#e4ecf5'
  return (
    <g className="sc-move" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <rect className="sc-line thin" fill={fill} x="0" y="0" width="76" height="34" rx="6" />
      <circle cx="16" cy="13" r="5" fill="#4a6ea7" />
      <path d="M8 27a8 8 0 0 1 16 0" fill="#4a6ea7" />
      <text className="sc-small" x="28" y="22">
        {label}
      </text>
    </g>
  )
}

// ---------- the shell: scene, info dots, caption and the one button ----------

export interface Spot {
  key: string
  x: number
  y: number
  title: string
  text?: string
  /** bullet points shown under the title */
  items?: string[]
  /** an icon badge instead of the plain info dot */
  icon?: ReactNode
  /** badge glows: it matters at the current step */
  active?: boolean
}

interface SceneProps {
  label: string
  spots: Spot[]
  caption: string
  step: number
  steps: number
  action: string
  onAction: () => void
  onReset: () => void
  children: ReactNode
  /** viewBox size; defaults to the intervention scenes' */
  w?: number
  h?: number
}

export function Scene({ label, spots, caption, step, steps, action, onAction, onReset, children, w = W, h = H }: SceneProps) {
  const t = useT()
  const [open, setOpen] = useState<string | null>(null)
  const spot = spots.find((s) => s.key === open)
  return (
    <figure className="scene-flow">
      <div className="sc-scroll">
        <div className="sc-stage">
          <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
            {children}
          </svg>
          {spots.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`sc-dot${s.icon ? ' sc-badge' : ''}${s.active ? ' is-active' : ''}${open === s.key ? ' is-open' : ''}`}
              style={{ left: `${(s.x / w) * 100}%`, top: `${(s.y / h) * 100}%` }}
              aria-label={t(`${s.title}: ${s.text ?? s.items?.join('; ')}`, `${s.title}：${s.text ?? s.items?.join('；')}`)}
              aria-expanded={open === s.key}
              onClick={() => setOpen(open === s.key ? null : s.key)}
              onMouseEnter={() => setOpen(s.key)}
              onMouseLeave={() => setOpen(null)}
              onBlur={() => setOpen(null)}
            >
              {s.icon ?? 'i'}
              {s.icon && (
                <span className="sc-badge-label" aria-hidden="true">
                  {s.title}
                </span>
              )}
            </button>
          ))}
          {spot && (
            <div
              className={`sc-tip${spot.x > w * 0.6 ? ' is-left' : ''}${spot.y > h * 0.55 ? ' is-up' : ''}`}
              style={{ left: `${(spot.x / w) * 100}%`, top: `${(spot.y / h) * 100}%` }}
              role="tooltip"
            >
              <b>{spot.title}</b>
              {spot.text}
              {spot.items && (
                <ul>
                  {spot.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="sc-bar">
        <button type="button" className="demo-button" onClick={onAction}>
          {action}
        </button>
        <ol className="sc-steps" aria-hidden="true">
          {Array.from({ length: steps }, (_, i) => (
            <li key={i} className={i < step ? 'is-done' : undefined} />
          ))}
        </ol>
        <p className="sc-caption" aria-live="polite">
          {caption}
        </p>
        {step > 0 && (
          <button type="button" className="link-button" onClick={onReset}>
            {t('Start over', '重新开始')}
          </button>
        )}
      </div>
    </figure>
  )
}

// ---------- intervention 1: NFC patient tracking ----------

const TRACK = [
  { caption: 'The OR links a reusable NFC card to the patient before surgery.', time: '', event: '', board: 0 },
  { caption: 'Tap 1 · Arrived in PACU. The patient appears on the bed board at once.', time: '14:02', event: 'Arrived in PACU', board: 0 },
  { caption: 'Tap 2 · Ready for transfer. The bed manager assigns a bed right away.', time: '15:31', event: 'Ready for transfer', board: 1 },
  { caption: 'Tap 3 · Departed PACU. The unit is ready; the card is wiped for the next patient.', time: '15:44', event: 'Departed PACU', board: 2 },
]

const TRACK_ZH: typeof TRACK = [
  { caption: '手术室在术前将一张可重复使用的 NFC 卡与患者绑定。', time: '', event: '', board: 0 },
  { caption: '第 1 次触碰 · 已到达 PACU。患者随即出现在床位看板上。', time: '14:02', event: '已到达 PACU', board: 0 },
  { caption: '第 2 次触碰 · 可以转出。床位管理员立即分配床位。', time: '15:31', event: '可以转出', board: 1 },
  { caption: '第 3 次触碰 · 已离开 PACU。病区已准备就绪；卡片清除后供下一位患者使用。', time: '15:44', event: '已离开 PACU', board: 2 },
]

const TRACK_SPOTS: Spot[] = [
  { key: 'or', x: 105, y: 214, title: 'OR team', text: 'Links the card to the patient’s encounter before surgery.' },
  { key: 'nurse', x: 474, y: 190, title: 'PACU nurse', text: 'Taps on arrival, when the patient is ready to move, and on departure — no calls, no typing.' },
  { key: 'hold', x: 576, y: 134, title: 'Where holds build up', text: 'Patients wait here, ready to leave, until a bed and a nurse are free.' },
  { key: 'epic', x: 872, y: 50, title: 'Epic', text: 'Logs every tap with the time and the place. Nobody enters a status by hand.' },
  { key: 'board', x: 872, y: 250, title: 'Command Center · bed manager', text: 'Sees “Ready” the moment it is tapped and assigns a bed. The receiving unit sees the patient coming.' },
]

const TRACK_SPOTS_ZH: Spot[] = [
  { key: 'or', x: 105, y: 214, title: '手术室团队', text: '术前将卡片与患者的就诊记录绑定。' },
  { key: 'nurse', x: 474, y: 190, title: 'PACU 护士', text: '在患者到达、可以转出和离开时各触碰一次，无需打电话，也无需录入。' },
  { key: 'hold', x: 576, y: 134, title: '滞留在此累积', text: '已可离开的患者在此等待，直到床位和护士都空出来。' },
  { key: 'epic', x: 872, y: 50, title: 'Epic', text: '记录每次触碰的时间与地点，无需任何人手动录入状态。' },
  { key: 'board', x: 872, y: 250, title: '指挥中心 · 床位管理员', text: '触碰的那一刻即可看到“就绪”，并分配床位；接收病区也能看到患者即将转入。' },
]

/** Seen from behind at a desk: whoever watches the board. */
export function Watcher({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path className="sc-line" fill="#ffcf01" d={`M${x - 30} ${y}q2-40 30-42t30 42z`} />
      <circle className="sc-line" fill="#f1d3b6" cx={x} cy={y - 54} r="16" />
      <path className="sc-line" fill="#4a2f22" d={`M${x - 16} ${y - 52}q-2-22 16-22t16 22q0 10-4 14q2-16-12-18t-14 10z`} />
    </g>
  )
}

export function TrackingScene() {
  const t = useT()
  const track = useL(TRACK, TRACK_ZH)
  const trackSpots = useL(TRACK_SPOTS, TRACK_SPOTS_ZH)
  const [step, setStep] = useState(0)
  const done = step === track.length - 1
  const s = track[step]
  // where the patient is: on the gurney at the OR, in the PACU bed, then gone to the unit
  const inPacu = step === 1 || step === 2
  const boardCol = [627, 715, 803][s.board]
  const reader = { x: 560, y: 232 }
  const tapping = step > 0 && !done
  const wire = `M${reader.x + 24} ${reader.y - 10}C600 ${reader.y - 10} 592 112 615 112`
  return (
    <Scene
      label={t(
        'Illustration of NFC patient tracking: the PACU nurse taps the patient’s card at the bedside reader, Epic logs it and the bed board updates.',
        'NFC 患者追踪示意图：PACU 护士在床旁读卡器上触碰患者的卡片，Epic 记录该事件，床位看板随之更新。',
      )}
      spots={trackSpots}
      caption={s.caption}
      step={step}
      steps={track.length - 1}
      action={done ? t('Replay', '重播') : step === 0 ? t('Tap the card', '触碰卡片') : t('Tap again', '再次触碰')}
      onAction={() => setStep(done ? 0 : step + 1)}
      onReset={() => setStep(0)}
    >
      <rect x="0" y="0" width={W} height={H} fill="#f7f6f2" />
      <path stroke="#c9d3dd" strokeWidth="2" d="M10 380H950" />

      {/* operating room: doors, and the team bringing the patient out */}
      <rect fill="#e9eef3" x="22" y="150" width="176" height="230" rx="4" />
      <rect className="sc-line" fill="#dfe6ee" x="52" y="196" width="112" height="184" rx="4" />
      <path className="sc-line" d="M108 196v184" />
      <rect className="sc-line" fill="#f7f6f2" x="70" y="222" width="16" height="34" rx="2" />
      <rect className="sc-line" fill="#f7f6f2" x="130" y="222" width="16" height="34" rx="2" />
      <Sign x={108} y={124} text={t('OR', '手术室')} w={78} />
      <g className="sc-move" style={{ opacity: step === 0 ? 1 : 0.18 }}>
        <Person x={210} y={380} scrub="#86b2dc" skin="#e0b48f" cap="#3d63a8" reach={[176, 302]} />
        <rect className="sc-line thin" fill="#fff" x="199" y="219" width="22" height="12" rx="4" />
      </g>
      <g className="sc-move" style={{ opacity: step === 0 ? 1 : 0 }}>
        <Bed x={34} y={318} w={150} rails={false} />
        <Patient x={34} y={318} w={150} />
        {CARD(150, 300, 0)}
      </g>

      {/* PACU bay, outlined in gold: where holds build up */}
      <rect className={`sc-hold${inPacu ? ' is-on' : ''}`} x="238" y="118" width="352" height="272" rx="14" />
      <text className="sc-hold-label" x="256" y="144">
        {t('WHERE HOLDS BUILD UP', '滞留在此累积')}
      </text>
      <Sign x={414} y={88} text="PACU" />
      {/* vitals monitor and IV pole */}
      <rect className="sc-line" fill="#2a3446" x="262" y="168" width="62" height="44" rx="5" />
      <path fill="none" stroke={inPacu ? '#5ed39a' : '#5b6577'} strokeWidth="2" d="M268 192h12l5-12 7 22 5-10h21" />
      <path className="sc-line" fill="none" d="M346 160v220M334 160h24" />
      <path className="sc-line" fill="#e4ecf5" d="M340 164h12v24q-6 6-12 0z" />
      <Bed x={286} y={300} w={180} />
      <g className="sc-move" style={{ opacity: inPacu ? 1 : 0 }}>
        <Patient x={286} y={300} w={180} />
      </g>
      <Person
        x={492}
        y={380}
        scrub="#3d63a8"
        skin="#c68c63"
        hair="#2b1d16"
        reach={tapping ? [reader.x - 26, reader.y] : [508, 300]}
        holds={tapping ? CARD(reader.x - 30, reader.y - 6) : undefined}
      />
      <path className="sc-line" fill="none" d={`M${reader.x} 264V380`} />
      <Reader x={reader.x} y={reader.y} ping={step > 0} pingKey={step} />
      {done && (
        <g className="sc-fade">
          <circle cx="430" cy="232" r="20" fill="#fff" className="sc-line" />
          <path className="sc-line" fill="none" d="M439 227a10 10 0 1 0 2 8M440 220v8h-8" />
          <text className="sc-small muted" x="430" y="268" textAnchor="middle">
            {t('card wiped', '卡片已清除')}
          </text>
        </g>
      )}

      {/* Epic */}
      <Monitor x={615} y={22} w={272} h={180} title="Epic · PACU">
        {track.slice(1, step + 1).map((r, i) => (
          <g key={r.time} className={i === step - 1 ? 'sc-row is-new' : 'sc-row'}>
            <rect x="629" y={70 + i * 38} width="244" height="30" rx="5" />
            <text className="sc-small strong" x="639" y={90 + i * 38}>
              {t('Patient A', '患者 A')}
            </text>
            <text className="sc-small" x="711" y={90 + i * 38}>
              {r.event}
            </text>
            <text className="sc-small muted" x="865" y={90 + i * 38} textAnchor="end">
              {r.time}
            </text>
          </g>
        ))}
        {step === 0 && (
          <text className="sc-small muted" x="751" y="126" textAnchor="middle">
            {t('Not in the PACU yet', '尚未进入 PACU')}
          </text>
        )}
      </Monitor>

      {/* bed board, watched by the bed manager */}
      <Monitor x={615} y={222} w={272} h={150} title={t('Bed board', '床位看板')}>
        {[t('In PACU', '在 PACU'), t('Ready', '就绪'), t('To unit', '转往病区')].map((c, i) => (
          <g key={i}>
            <rect fill={i === 2 && done ? '#dcefe1' : '#f0f3f7'} x={625 + i * 88} y="270" width="84" height="88" rx="5" />
            <text className="sc-small muted" x={667 + i * 88} y="288" textAnchor="middle">
              {c}
            </text>
          </g>
        ))}
        {step > 0 && <BoardCard x={boardCol} y={308} label={t('Pt A', '患者 A')} tone={s.board === 1 ? 'gold' : s.board === 2 ? 'green' : 'blue'} />}
      </Monitor>
      <Watcher x={918} y={384} />

      <path className="sc-wire" d={wire} />
      <path className="sc-wire" d="M751 202V222" />
      <Packet run={step} path={wire} />
      <Packet run={step} path="M751 196V250" delay={0.9} />
    </Scene>
  )
}

// ---------- intervention 3: NFC bed-cleaning status ----------

type Clean = 'dirty' | 'cleaning' | 'ready'

const CLEAN_SPOTS: Spot[] = [
  { key: 'evs', x: 300, y: 130, title: 'EVS staff', text: 'Tap once when cleaning starts and once when the room is done.' },
  { key: 'guard', x: 426, y: 90, title: '7-minute safeguard', text: 'A second tap sooner than 7 minutes is ignored, so a double tap can’t mark a dirty room clean.' },
  { key: 'epic', x: 752, y: 48, title: 'Epic', text: 'Turns the taps into the room’s status — no phone call to the Command Center.' },
  { key: 'board', x: 912, y: 236, title: 'Command Center · bed manager', text: 'Sees “Ready to assign” at once and gives the room to a patient held in the PACU.' },
]

const CLEAN_SPOTS_ZH: Spot[] = [
  { key: 'evs', x: 300, y: 130, title: '环境服务部（EVS）员工', text: '开始清洁时触碰一次，房间清洁完毕时再触碰一次。' },
  { key: 'guard', x: 426, y: 90, title: '7 分钟防误触', text: '7 分钟内的第二次触碰会被忽略，因此误触两下也不会把未清洁的房间标记为已清洁。' },
  { key: 'epic', x: 752, y: 48, title: 'Epic', text: '将触碰转换为房间状态，无需致电指挥中心。' },
  { key: 'board', x: 912, y: 236, title: '指挥中心 · 床位管理员', text: '立即看到“可分配”，并将房间分配给滞留在 PACU 的患者。' },
]

export function CleaningScene() {
  const t = useT()
  const cleanSpots = useL(CLEAN_SPOTS, CLEAN_SPOTS_ZH)
  const [state, setState] = useState<Clean>('dirty')
  const [minutes, setMinutes] = useState(0)
  const [taps, setTaps] = useState(0)
  // the minute of a second tap that came too early, shown until the next tap
  const [ignored, setIgnored] = useState<number | null>(null)
  // the cleaning clock runs at 3 simulated minutes a second
  useEffect(() => {
    if (state !== 'cleaning') return
    const id = window.setInterval(() => setMinutes((m) => m + 1), 333)
    return () => window.clearInterval(id)
  }, [state])

  const reset = () => {
    setState('dirty')
    setMinutes(0)
    setTaps(0)
    setIgnored(null)
  }
  const tap = () => {
    setTaps((t) => t + 1)
    if (state === 'dirty') {
      setState('cleaning')
      setMinutes(0)
      setIgnored(null)
    } else if (state === 'cleaning') {
      if (minutes < 7) setIgnored(minutes)
      else {
        setIgnored(null)
        setState('ready')
      }
    } else reset()
  }

  const step = state === 'dirty' ? 0 : state === 'cleaning' ? 1 : 2
  const caption =
    state === 'dirty'
      ? t('A patient was discharged. The room needs cleaning before anyone can move in.', '一位患者已出院。房间需要清洁后才能接收新患者。')
      : state === 'cleaning'
        ? ignored !== null
          ? t(
              `Second tap after ${ignored} min ignored: under the 7-minute safeguard.`,
              `${ignored} 分钟后的第二次触碰已被忽略：未满 7 分钟防误触时限。`,
            )
          : t(
              `Tap 1 · Cleaning in progress, shown live in Epic. ${minutes} min so far.`,
              `第 1 次触碰 · 正在清洁，Epic 中实时显示。已进行 ${minutes} 分钟。`,
            )
        : t(
            'Tap 2 · Ready to assign. The bed manager gives the room to a held PACU patient.',
            '第 2 次触碰 · 可分配。床位管理员将房间分配给一位滞留在 PACU 的患者。',
          )
  const reader = { x: 340, y: 210 }
  const status = t(
    { dirty: 'Needs cleaning', cleaning: 'Cleaning in progress', ready: 'Ready to assign' },
    { dirty: '待清洁', cleaning: '正在清洁', ready: '可分配' },
  )[state]
  return (
    <Scene
      label={t(
        'Illustration of the NFC bed-cleaning status: EVS staff tap a card at the room’s reader when they start and finish, Epic updates the room’s status and the bed board shows it ready.',
        'NFC 床位清洁状态示意图：环境服务部（EVS）员工在开始和完成清洁时，于房间读卡器上触碰卡片，Epic 更新房间状态，床位看板显示其已就绪。',
      )}
      spots={cleanSpots}
      caption={caption}
      step={step}
      steps={2}
      action={
        state === 'ready' ? t('Replay', '重播') : state === 'dirty' ? t('Tap the EVS card', '触碰 EVS 卡片') : t('Tap again (finished)', '再次触碰（已完成）')
      }
      onAction={tap}
      onReset={reset}
    >
      <rect x="0" y="0" width={W} height={H} fill="#f7f6f2" />
      <path stroke="#c9d3dd" strokeWidth="2" d="M10 380H950" />

      {/* the patient room */}
      <rect fill="#e9eef3" x="24" y="64" width="400" height="316" />
      <Sign x={130} y={42} text={t('Room 7W-12', '7W-12 病房')} w={150} />
      <rect className="sc-line" fill="#dfe6ee" x="370" y="120" width="44" height="260" rx="3" />
      <rect className="sc-line" fill="#cfe0f1" x="60" y="110" width="110" height="80" rx="4" />
      <path className="sc-line" d="M115 110v80M60 150h110" />
      <Bed x={60} y={300} w={210} />
      {state === 'ready' ? (
        <g className="sc-fade">
          <rect className="sc-line" fill="#fff" x="70" y="292" width="50" height="12" rx="5" />
          <path className="sc-line" fill="#e4ecf5" d="M124 300h140v-4q-70-6-140 0z" />
          <path className="sc-spark" d="M170 238l4 11 11 4-11 4-4 11-4-11-11-4 11-4zM226 214l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        </g>
      ) : (
        <g>
          <path className="sc-line" fill="#e4e0d8" d="M90 300q20-40 60-14t60-6q30 4 50 20z" />
          <path className="sc-line" fill="none" d="M120 290q10-10 22 0M190 288q12-8 22 2" />
        </g>
      )}
      {state !== 'dirty' && (
        <g className="sc-fade">
          {state === 'cleaning' && <path className="sc-line" fill="none" stroke="#8a7966" strokeWidth="5" d="M246 190l-28 160" />}
          {state === 'cleaning' && <path className="sc-line" fill="#ffcf01" d="M204 346h28l6 30h-40z" />}
          <Person
            x={290}
            y={380}
            scrub="#3b8a87"
            skin="#9a6544"
            hair="#1f1611"
            reach={state === 'cleaning' && taps > 0 ? [reader.x - 26, reader.y] : [262, 276]}
            holds={state === 'cleaning' ? CARD(reader.x - 30, reader.y - 6, 10) : undefined}
          />
        </g>
      )}
      <Reader x={reader.x} y={reader.y} ping={taps > 0} pingKey={taps} bad={ignored !== null} />

      {/* safeguard clock */}
      <g className={state === 'cleaning' ? 'sc-fade' : 'sc-hide'}>
        <circle cx="395" cy="116" r="28" fill="#fff" className="sc-line" />
        <circle
          cx="395"
          cy="116"
          r="22"
          fill="none"
          stroke={minutes >= 7 ? '#3b8a5a' : '#e8b400'}
          strokeWidth="6"
          strokeDasharray={`${Math.min(1, minutes / 7) * 138.2} 138.2`}
          transform="rotate(-90 395 116)"
        />
        <text className="sc-small strong" x="395" y="121" textAnchor="middle">
          {minutes}′
        </text>
      </g>

      {/* Epic */}
      <Monitor x={470} y={22} w={300} h={170} title={t('Epic · Room 7W-12', 'Epic · 7W-12 病房')}>
        <rect
          className="sc-status"
          fill={state === 'ready' ? '#dcefe1' : state === 'cleaning' ? '#fff3bf' : '#f6dcd7'}
          x="490"
          y="80"
          width="260"
          height="40"
          rx="20"
        />
        <text className="sc-mid" x="620" y="106" textAnchor="middle">
          {status}
        </text>
        {state === 'cleaning' && (
          <text className="sc-small muted" x="620" y="160" textAnchor="middle">
            {t(`started 10:12 · ${minutes} min`, `10:12 开始 · ${minutes} 分钟`)}
          </text>
        )}
      </Monitor>

      {/* bed board and the held patient */}
      <Monitor x={640} y={210} w={290} h={170} title={t('Bed board · Command Center', '床位看板 · 指挥中心')}>
        {[t('Cleaning', '清洁中'), t('Ready', '就绪')].map((c, i) => (
          <g key={i}>
            <rect fill={i === 1 && state === 'ready' ? '#dcefe1' : '#f0f3f7'} x={650 + i * 136} y="262" width="130" height="106" rx="5" />
            <text className="sc-small muted" x={715 + i * 136} y="280" textAnchor="middle">
              {c}
            </text>
          </g>
        ))}
        {state !== 'dirty' && (
          <BoardCard x={state === 'ready' ? 805 : 669} y={296} label="7W-12" tone={state === 'ready' ? 'green' : 'gold'} />
        )}
        {state === 'ready' && (
          <g className="sc-fade">
            <rect fill="#fff3bf" className="sc-line thin" x="790" y="336" width="124" height="26" rx="6" />
            <text className="sc-small" x="852" y="354" textAnchor="middle">
              {t('PACU hold → 7W-12', 'PACU 滞留 → 7W-12')}
            </text>
          </g>
        )}
      </Monitor>

      <path className="sc-wire" d={`M${reader.x + 24} ${reader.y - 10}C430 ${reader.y - 10} 430 100 470 100`} />
      <path className="sc-wire" d="M700 192V210" />
      <Packet run={state === 'dirty' ? 0 : taps} path={`M${reader.x + 24} ${reader.y - 10}C430 ${reader.y - 10} 430 100 470 100`} />
      {ignored === null && <Packet run={state === 'dirty' ? 0 : taps} path="M700 186V240" delay={0.9} />}
    </Scene>
  )
}

// ---------- intervention 2: overlapping shifts ----------

const OVERLAP_SPOTS: Spot[] = [
  { key: 'pacu', x: 120, y: 150, title: 'PACU nurse', text: 'The patient is ready to leave the PACU right at 7 PM, the busiest hour for holds.' },
  { key: 'report', x: 606, y: 150, title: '7–7 nurses (~75%)', text: 'Give report from about 6:45 to 7:15 PM, so nobody on this shift can take a new patient.' },
  { key: 'free', x: 430, y: 168, title: '6–6 nurse (~25%)', text: 'Started at 6 PM and finished report by 6:15, so she is free to receive the patient.' },
  { key: 'rota', x: 912, y: 46, title: 'Paired schedules', text: 'Managers keep most nurses on 7–7 and move about a quarter to 6–6 so the hand-offs never line up.' },
]

const OVERLAP_SPOTS_ZH: Spot[] = [
  { key: 'pacu', x: 120, y: 150, title: 'PACU 护士', text: '患者恰好在晚 7 点可以离开 PACU，而这正是滞留最集中的时段。' },
  { key: 'report', x: 606, y: 150, title: '7–7 班护士（约 75%）', text: '约在晚 6:45 至 7:15 进行交班报告，因此这一班次的护士都无法接收新患者。' },
  { key: 'free', x: 430, y: 168, title: '6–6 班护士（约 25%）', text: '下午 6 点上班，6:15 前已完成交班报告，因此可以接收患者。' },
  { key: 'rota', x: 912, y: 46, title: '错峰排班', text: '护士长让大多数护士保持 7–7 班次，并将约四分之一调整为 6–6 班次，使交接时间不再重叠。' },
]

// schedule screen: 4 PM … 9 PM across the screen
const tx = (h: number) => 740 + ((h - 16) / 5) * 176

export function OverlapScene() {
  const t = useT()
  const overlapSpots = useL(OVERLAP_SPOTS, OVERLAP_SPOTS_ZH)
  const [after, setAfter] = useState(false)
  const [wait, setWait] = useState(0)
  // before the change the held patient's wait keeps growing (a simulated minute every 0.3 s)
  useEffect(() => {
    setWait(0)
    if (after) return
    const id = window.setInterval(() => setWait((m) => Math.min(45, m + 1)), 300)
    return () => window.clearInterval(id)
  }, [after])

  return (
    <Scene
      label={t(
        'Illustration of overlapping shifts: at 7 PM the 7-to-7 nurses are in report, while a nurse on a 6-to-6 shift is free to receive the PACU patient.',
        '错峰班次示意图：晚 7 点，7–7 班护士正在交班报告，而一位 6–6 班护士空闲，可以接收 PACU 患者。',
      )}
      spots={overlapSpots}
      caption={
        after
          ? t(
              'With 6–6 shifts: a nurse who finished report at 6:15 receives the patient at once.',
              '采用 6–6 班次后：一位已在 6:15 完成交班报告的护士立即接收患者。',
            )
          : t(
              `Today, 7 PM: every inpatient nurse is in report. The PACU patient has waited ${wait} min.`,
              `目前，晚 7 点：住院病区所有护士都在交班报告。PACU 患者已等待 ${wait} 分钟。`,
            )
      }
      step={after ? 2 : 0}
      steps={2}
      action={after ? t('Back to all 7–7 shifts', '恢复为全部 7–7 班次') : t('Add 6–6 shifts', '增加 6–6 班次')}
      onAction={() => setAfter(!after)}
      onReset={() => setAfter(false)}
    >
      <rect x="0" y="0" width={W} height={H} fill="#f7f6f2" />
      <path stroke="#c9d3dd" strokeWidth="2" d="M10 380H950" />

      {/* PACU doors */}
      <rect fill="#e9eef3" x="22" y="150" width="160" height="230" rx="4" />
      <rect className="sc-line" fill="#dfe6ee" x="44" y="196" width="116" height="184" rx="4" />
      <path className="sc-line" d="M102 196v184" />
      <rect className="sc-line" fill="#f7f6f2" x="62" y="222" width="16" height="34" rx="2" />
      <Sign x={102} y={124} text="PACU" />

      {/* inpatient unit: an open door, the room behind it */}
      <rect fill="#e9eef3" x="420" y="150" width="190" height="230" rx="4" />
      <rect className="sc-line" fill={after ? '#fff6dd' : '#eef1f5'} x="450" y="196" width="128" height="184" rx="3" />
      <path className="sc-line" fill="#d9b48c" d="M450 196l-34 14v170h34z" />
      <path className="sc-line" fill="none" d="M480 330h80M492 330v40M548 330v40" />
      <rect className="sc-line thin" fill="#dfe6ee" x="520" y="226" width="40" height="28" rx="3" />
      <Sign x={515} y={124} text={t('Inpatient', '住院病区')} w={130} />

      {/* the 7–7 nurses, in report at the station */}
      <Person x={624} y={380} scrub="#3d63a8" skin="#e0b48f" hair="#5a3a22" />
      <Person x={676} y={380} scrub="#3d63a8" skin="#9a6544" hair="#1f1611" />
      <g>
        <rect className="sc-line thin" fill="#fff" x="592" y="172" width="70" height="26" rx="13" />
        <text className="sc-small" x="627" y="190" textAnchor="middle">
          {t('report…', '交班中…')}
        </text>
      </g>

      {/* the patient on the gurney, pushed by the PACU nurse */}
      <g className="sc-move" style={{ transform: `translateX(${after ? 110 : 0}px)` }}>
        <Person x={130} y={380} scrub="#3b8a87" skin="#c68c63" hair="#2b1d16" reach={[168, 300]} />
        <Bed x={160} y={300} w={170} />
        <Patient x={160} y={300} w={170} />
      </g>
      {!after && (
        <g className="sc-fade">
          <circle cx="250" cy="226" r="24" fill="#fff" className="sc-line" />
          <circle
            cx="250"
            cy="226"
            r="18"
            fill="none"
            stroke="#e8b400"
            strokeWidth="5"
            strokeDasharray={`${(wait / 45) * 113} 113`}
            transform="rotate(-90 250 226)"
          />
          <text className="sc-small strong" x="250" y="231" textAnchor="middle">
            {wait}′
          </text>
        </g>
      )}

      {/* the 6–6 nurse comes out to take the patient */}
      <g className="sc-move" style={{ transform: `translateX(${after ? 0 : 90}px)`, opacity: after ? 1 : 0 }}>
        <Person x={430} y={380} scrub="#86b2dc" skin="#f1d3b6" hair="#4a2f22" reach={[402, 286]} />
      </g>

      {/* schedule screen */}
      <Monitor x={722} y={22} w={212} h={196} title={t('Shifts · 7 PM', '班次 · 晚 7 点')}>
        {[17, 18, 19, 20].map((h) => (
          <text key={h} className="sc-small muted" x={tx(h)} y="78" textAnchor="middle">
            {t(`${h - 12} PM`, `${h}时`)}
          </text>
        ))}
        <rect fill="rgba(255,207,1,0.28)" x={tx(18.75)} y="86" width={tx(19.25) - tx(18.75)} height="104" />
        {[
          { label: '7–7', y: 100, end: 19, report: [18.75, 19.25] },
          { label: '6–6', y: 150, end: 18, report: [18, 18.25] },
        ].map((r) => (
          <g key={r.label} className={r.label === '6–6' && !after ? 'sc-dim' : 'sc-undim'}>
            <rect fill="#86b2dc" x={tx(16)} y={r.y} width={tx(r.end) - tx(16)} height="22" rx="4" />
            <rect fill="#2c4672" x={tx(r.end)} y={r.y} width={tx(21) - tx(r.end)} height="22" rx="4" />
            <rect fill="#e8b400" x={tx(r.report[0])} y={r.y - 3} width={tx(r.report[1]) - tx(r.report[0])} height="28" rx="2" />
            <text className="sc-small strong" x="738" y={r.y + 38}>
              {r.label}
            </text>
          </g>
        ))}
        <path stroke="#c0392b" strokeWidth="2" d={`M${tx(19)} 84V196`} />
        {after && (
          <g className="sc-fade">
            <circle cx={tx(19)} cy="161" r="12" fill="#3b8a5a" stroke="#fff" strokeWidth="2" />
            <path fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d={`M${tx(19) - 5} 161l4 4 7-8`} />
          </g>
        )}
      </Monitor>
    </Scene>
  )
}
