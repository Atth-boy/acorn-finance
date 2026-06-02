import { useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { CC, FONT, PAPER } from '../tokens'
import { AnimatedSquirrel } from './AnimatedSquirrel'

// Overlay แจ้ง "มีอัพเดทใหม่" — เด้งกลางจอ พื้นหลัง (หน้าใช้งาน) เบลอ
// ผู้ใช้ "ต้องแตะที่กระรอก" เพื่ออัปเดต (บังคับ ไม่มีปุ่มไว้ทีหลัง)
// โหมด prompt ใน vite.config — บน iOS standalone ตัว SW แทบไม่เช็คอัปเดตเอง
// เลยสั่ง reg.update() ซ้ำตอนเปิดแอปกลับมา + ทุก 1 ชม. เพื่อให้ overlay โผล่ได้จริง
// Component นี้ mount ครั้งเดียวที่ root จึงปล่อย listener ได้ตลอดอายุแอป
export function UpdatePrompt() {
  const [updating,    setUpdating]    = useState(false)
  const [needRestart, setNeedRestart] = useState(false) // iOS activate ไม่ได้ตอนแอปเปิดอยู่
  const [dismissed,   setDismissed]   = useState(false) // ทางหนีเคส iOS: ใช้เวอร์ชันเดิมต่อ
  const regRef = useRef(null)

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_swUrl, reg) {
      if (!reg) return
      regRef.current = reg
      const check = () => { if (navigator.onLine) reg.update() }
      setInterval(check, 60 * 60 * 1000) // กันแอปเปิดค้างนาน ๆ
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check() // สำคัญสุดสำหรับ iOS PWA
      })
      window.addEventListener('focus', check)
    },
  })

  // updateServiceWorker(true) จะ reload ก็ต่อเมื่อได้ event 'controllerchange'
  // แต่ iOS standalone หลายครั้งไม่ยิง event นี้ — แทน reload ทื่อ ๆ (ที่อาจวนเวอร์ชันเดิม)
  // ให้ poll reg.waiting: หาย waiting = SW ใหม่ active แล้ว → reload ปลอดภัย
  //                       ยังมี waiting ครบ 5 ครั้ง = iOS activate ไม่ได้ → บอกให้ปิด-เปิดแอป
  const doUpdate = () => {
    if (updating) return
    setUpdating(true)
    updateServiceWorker(true)
    let tries = 0
    const tick = () => {
      if (!regRef.current?.waiting) { window.location.reload(); return }
      if (++tries >= 5) { setUpdating(false); setNeedRestart(true); return }
      window.setTimeout(tick, 700)
    }
    window.setTimeout(tick, 700)
  }

  if (dismissed) return null

  if (needRestart) {
    return (
      <div role="alertdialog" aria-label="อัปเดตพร้อมแล้ว" style={veil}>
        <div style={card}>
          <AnimatedSquirrel mode="greet" size={150} />
          <p style={title}>อัปเดตพร้อมแล้ว</p>
          <p style={subtitle}>ปิดแอปแล้วเปิดใหม่อีกครั้ง เพื่อใช้เวอร์ชันล่าสุด</p>
          <button
            style={ackBtn}
            onClick={() => { setNeedRestart(false); setDismissed(true) }}
          >
            รับทราบ
          </button>
        </div>
      </div>
    )
  }

  if (!needRefresh) return null

  return (
    <div role="alertdialog" aria-label="มีอัพเดทใหม่" style={veil}>
      <div style={card}>
        <button
          type="button"
          onClick={doUpdate}
          disabled={updating}
          aria-label="แตะกระรอกเพื่ออัปเดต"
          style={{ ...circleBtn, cursor: updating ? 'default' : 'pointer' }}
        >
          <AnimatedSquirrel mode="update" size={168} style={{ marginTop: -4 }} />
          {updating && (
            <span style={spinnerWrap}>
              <span className="update-spin" style={spinner} />
            </span>
          )}
        </button>
        <p style={title}>{updating ? 'กำลังอัปเดต…' : 'มีอัพเดทใหม่'}</p>
        <p style={subtitle}>
          {updating ? 'รอสักครู่ ระบบกำลังโหลดเวอร์ชันล่าสุด' : 'แตะที่กระรอกเพื่ออัปเดต'}
        </p>
      </div>
    </div>
  )
}

const veil = {
  position: 'fixed', inset: 0, zIndex: 9999,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  padding: 24,
  background: 'rgba(42,31,18,0.55)',
  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
}

const card = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', textAlign: 'center', gap: 14,
  maxWidth: 320, fontFamily: FONT,
}

const circleBtn = {
  position: 'relative',
  width: 248, height: 248, borderRadius: '50%',
  border: `4px solid ${CC.amber}`,
  background: CC.surface,
  backgroundImage: PAPER, backgroundBlendMode: 'soft-light',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 0, WebkitTapHighlightColor: 'transparent',
  animation: 'update-ring-glow 1.4s ease-in-out infinite, update-pop-in 0.4s ease-out',
}

const spinnerWrap = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '50%', background: 'rgba(251,246,233,0.6)',
}

const spinner = {
  width: 44, height: 44, borderRadius: '50%',
  border: `4px solid ${CC.amberSoft}`, borderTopColor: CC.walnut,
  display: 'block',
}

const title = {
  color: CC.surface, fontSize: 22, fontWeight: 700, fontFamily: FONT,
}

const subtitle = {
  color: 'rgba(251,246,233,0.9)', fontSize: 16, lineHeight: 1.5, fontFamily: FONT,
}

const ackBtn = {
  marginTop: 4, background: CC.amber, color: CC.surface,
  border: 'none', borderRadius: 12, padding: '12px 28px',
  fontSize: 16, fontWeight: 700, minHeight: 48, cursor: 'pointer', fontFamily: FONT,
}
