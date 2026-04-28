import { useState } from 'react'
import { CC, DISPLAY, FONT } from '../tokens'
import { Squirrel } from '../components/Squirrel'

const ROWS = [
  { ic: '☁️', l: 'ซิงค์ผ่าน Firebase',   sub: 'เชื่อมต่ออยู่',          tone: CC.moss   },
  { ic: '📤', l: 'ส่งออก CSV / Excel',    sub: 'สำหรับวิเคราะห์ต่อ',    tone: CC.walnut },
  { ic: '🔔', l: 'แจ้งเตือน',             sub: 'ทุก 21:00 น.',           tone: CC.amber  },
  { ic: '🌙', l: 'โหมดมืด',               sub: 'ตามระบบ',               tone: CC.ink2   },
  { ic: '🏷️', l: 'จัดการ Tags',           sub: '3 tags ที่ใช้อยู่',      tone: CC.ember  },
  { ic: '💱', l: 'สกุลเงิน',              sub: 'บาท (THB) เท่านั้น',     tone: CC.moss   },
]

export function SettingsScreen({ txns, user, onSignOut, onReset, onResetAll }) {
  const displayName  = user?.displayName || 'คุณ'
  const photoURL     = user?.photoURL
  const [confirming, setConfirming] = useState(false)
  const [clearing,   setClearing]   = useState(false)

  const handleResetAll = async () => {
    if (!confirming) { setConfirming(true); setTimeout(() => setConfirming(false), 3000); return }
    setClearing(true)
    await onResetAll()
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingBottom: 110 }}>
      <div style={{ height: 'calc(16px + var(--sat))' }} />

      <div style={{ padding: '12px 24px 0' }}>
        <div style={{ fontSize: 13, color: CC.walnut, fontStyle: 'italic' }}>กระรอกน้อย</div>
        <div style={{ fontSize: 30, fontWeight: 700, fontFamily: DISPLAY, marginTop: 2, letterSpacing: -0.4 }}>ตั้งค่า</div>
      </div>

      {/* Profile card */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          {photoURL ? (
            <img src={photoURL} alt="" style={{ width: 64, height: 64, borderRadius: 32, objectFit: 'cover' }} />
          ) : (
            <Squirrel size={64} mood="cheer" />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY }}>{displayName}</div>
            <div style={{ fontSize: 12, color: CC.walnut, marginTop: 2 }}>เก็บมาแล้ว {txns.length + 247} รายการ</div>
            <div style={{ fontSize: 11, color: CC.moss, marginTop: 4, fontWeight: 600 }}>🏆 นักสะสมระดับเงิน</div>
          </div>
        </div>
      </div>

      {/* Settings list */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, overflow: 'hidden' }}>
          {ROWS.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '14px 18px',
              borderBottom: i < ROWS.length - 1 ? `1px solid ${CC.border}` : 'none',
              cursor: 'pointer',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: CC.walnutSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginRight: 12 }}>
                {r.ic}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.l}</div>
                <div style={{ fontSize: 11, color: CC.walnut, marginTop: 2 }}>{r.sub}</div>
              </div>
              <div style={{ color: CC.ink3, fontSize: 18 }}>›</div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onReset}
          style={{
            width: '100%', padding: '14px 0', background: 'transparent',
            border: `1px dashed ${CC.ember}`, borderRadius: 16,
            color: CC.ember, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
          }}
        >🔄 รีเซ็ตรายการตัวอย่าง</button>

        <button
          onClick={handleResetAll}
          disabled={clearing}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 16, fontFamily: FONT,
            border: 'none', fontSize: 13, fontWeight: 700, cursor: clearing ? 'default' : 'pointer',
            background: confirming ? CC.ember : CC.emberSoft,
            color: confirming ? '#fff' : CC.ember,
            transition: 'all 0.2s',
          }}
        >
          {clearing ? '⏳ กำลังล้าง...' : confirming ? '⚠️ กดอีกครั้งเพื่อยืนยัน' : '🗑️ ล้างข้อมูลทั้งหมด'}
        </button>

        <button
          onClick={onSignOut}
          style={{
            width: '100%', padding: '14px 0', background: 'transparent',
            border: `1px solid ${CC.border}`, borderRadius: 16,
            color: CC.ink2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
          }}
        >🚪 ออกจากระบบ</button>
      </div>

      <div style={{ height: 40 }} />
    </div>
  )
}
