import { useState } from 'react'
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { familyLib } from '../lib/family'
import { CC, DISPLAY, FONT } from '../tokens'
import { Squirrel } from '../components/Squirrel'

export function SettingsScreen({ txns, user, onSignOut, onReset, onResetAll, rooms = [], onRoomsChange, familyData, onLeaveFamily, onUserRefresh }) {
  // Section 1 — profile
  const [editingName, setEditingName] = useState(false)
  const [newName,     setNewName]     = useState('')
  const [savingName,  setSavingName]  = useState(false)

  // Section 2 — shared rooms
  const [leavingRoom, setLeavingRoom] = useState(null)

  // Section 3 — family
  const [showLeaveFamily,  setShowLeaveFamily]  = useState(false)
  const [leavingFamily,    setLeavingFamily]    = useState(false)

  // Section 4 — password
  const [showPwd,    setShowPwd]    = useState(false)
  const [curPwd,     setCurPwd]     = useState('')
  const [newPwd,     setNewPwd]     = useState('')
  const [confPwd,    setConfPwd]    = useState('')
  const [pwdErr,     setPwdErr]     = useState('')
  const [pwdOk,      setPwdOk]      = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  // Danger zone
  const [confirming, setConfirming] = useState(false)
  const [clearing,   setClearing]   = useState(false)

  const displayName      = user?.displayName || 'คุณ'
  const username         = user?.email?.replace('@acorn.app', '') || ''
  const familyMemberCount = familyData?.members?.length ?? 0
  const isFamilyLast     = familyMemberCount <= 1

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveName = async () => {
    if (!newName.trim() || savingName) return
    setSavingName(true)
    await updateProfile(auth.currentUser, { displayName: newName.trim() }).catch(() => {})
    onUserRefresh()
    setSavingName(false)
    setEditingName(false)
  }

  const handleLeaveRoom = (room) => setLeavingRoom(room)

  const confirmLeaveRoom = () => {
    if (!leavingRoom) return
    if (leavingRoom.members.length <= 1) {
      onRoomsChange(rs => rs.filter(r => r.id !== leavingRoom.id))
    } else {
      onRoomsChange(rs => rs.map(r => r.id === leavingRoom.id
        ? { ...r, members: r.members.filter(m => !m.isMe) }
        : r
      ))
    }
    setLeavingRoom(null)
  }

  const handleLeaveFamily = async () => {
    if (leavingFamily) return
    setLeavingFamily(true)
    try {
      if (isFamilyLast) {
        await familyLib.deleteFamily(familyData.code, user.uid)
      } else {
        await familyLib.leaveFamily(familyData.code, user.uid)
      }
      onLeaveFamily()
    } catch {}
    setLeavingFamily(false)
    setShowLeaveFamily(false)
  }

  const handleChangePassword = async () => {
    setPwdErr('')
    if (!curPwd || !newPwd || !confPwd) { setPwdErr('กรุณากรอกให้ครบทุกช่อง'); return }
    if (newPwd !== confPwd) { setPwdErr('รหัสผ่านใหม่ไม่ตรงกัน'); return }
    if (newPwd.length < 6)  { setPwdErr('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    setChangingPwd(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, curPwd)
      await reauthenticateWithCredential(auth.currentUser, cred)
      await updatePassword(auth.currentUser, newPwd)
      setPwdOk(true)
      setCurPwd(''); setNewPwd(''); setConfPwd('')
      setTimeout(() => { setPwdOk(false); setShowPwd(false) }, 2000)
    } catch (e) {
      const code = e.code || ''
      if (code.includes('wrong-password') || code.includes('invalid-credential')) {
        setPwdErr('รหัสผ่านเดิมไม่ถูกต้อง')
      } else {
        setPwdErr('เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    }
    setChangingPwd(false)
  }

  const handleResetAll = async () => {
    if (!confirming) { setConfirming(true); setTimeout(() => setConfirming(false), 3000); return }
    setClearing(true)
    await onResetAll()
  }

  const closePwd = () => { setShowPwd(false); setPwdErr(''); setPwdOk(false); setCurPwd(''); setNewPwd(''); setConfPwd('') }

  // ── Shared styles ──────────────────────────────────────────────────────────
  const inp     = { width: '100%', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${CC.border}`, background: CC.surface, fontSize: 14, fontFamily: FONT, color: CC.ink, boxSizing: 'border-box', outline: 'none' }
  const overlay = { position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(42,31,18,0.55)', display: 'flex', alignItems: 'flex-end' }
  const sheet   = { width: '100%', background: CC.bg, borderRadius: '24px 24px 0 0', padding: '24px 20px 44px' }
  const btnPri  = { width: '100%', padding: 14, borderRadius: 16, border: 'none', background: CC.walnut, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', marginTop: 12 }
  const btnDng  = { ...btnPri, background: CC.emberSoft, color: CC.ember }
  const btnGhost= { ...btnPri, background: 'none', border: `1px solid ${CC.border}`, color: CC.walnut }
  const sectionLabel = { fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingBottom: 110 }}>
      <div style={{ height: 'calc(16px + var(--sat))' }} />

      <div style={{ padding: '12px 24px 0' }}>
        <div style={{ fontSize: 13, color: CC.walnut, fontStyle: 'italic' }}>กระรอกน้อย</div>
        <div style={{ fontSize: 30, fontWeight: 700, fontFamily: DISPLAY, marginTop: 2, letterSpacing: -0.4 }}>ตั้งค่า</div>
      </div>

      {/* ── 1. บัญชีผู้ใช้ ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={sectionLabel}>บัญชีผู้ใช้</div>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Squirrel size={60} mood="cheer" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY }}>{displayName}</div>
              <div style={{ fontSize: 12, color: CC.walnut, marginTop: 2 }}>@{username}</div>
              <div style={{ fontSize: 11, color: CC.walnut, marginTop: 1 }}>เก็บมาแล้ว {txns.length} รายการ</div>
            </div>
            <button
              onClick={() => { setNewName(displayName); setEditingName(true) }}
              style={{ padding: '7px 14px', borderRadius: 12, border: `1px solid ${CC.border}`, background: CC.bg, color: CC.walnut, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
              ✏️ แก้ชื่อ
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. บัญชีร่วม ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={sectionLabel}>บัญชีร่วม</div>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, overflow: 'hidden' }}>
          {rooms.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: CC.walnut, fontSize: 13 }}>
              ยังไม่ได้เข้าร่วมบัญชีร่วมใดๆ
            </div>
          ) : rooms.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: i < rooms.length - 1 ? `1px solid ${CC.border}` : 'none', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: CC.walnutSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{r.ic}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: CC.walnut, marginTop: 2 }}>{r.members.length} สมาชิก · #{r.code}</div>
              </div>
              <button
                onClick={() => handleLeaveRoom(r)}
                style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: CC.emberSoft, color: CC.ember, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
                ออก
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. กองกลางครอบครัว ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={sectionLabel}>กองกลางครอบครัว</div>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: '16px 18px' }}>
          {!familyData ? (
            <div style={{ textAlign: 'center', color: CC.walnut, fontSize: 13 }}>
              ยังไม่ได้เข้าร่วมกองกลางครอบครัว
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: CC.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🌳</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>รหัสบ้าน #{familyData.code}</div>
                <div style={{ fontSize: 11, color: CC.walnut, marginTop: 2 }}>{familyMemberCount} สมาชิก</div>
              </div>
              <button
                onClick={() => setShowLeaveFamily(true)}
                style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: CC.emberSoft, color: CC.ember, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
                ออก
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. เปลี่ยนรหัสผ่าน ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={sectionLabel}>รหัสผ่าน</div>
        <button
          onClick={() => setShowPwd(true)}
          style={{ width: '100%', background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', fontFamily: FONT }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: CC.walnutSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔒</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: CC.ink }}>เปลี่ยนรหัสผ่าน</div>
            <div style={{ fontSize: 11, color: CC.walnut, marginTop: 2 }}>ต้องยืนยันรหัสเดิมก่อน</div>
          </div>
          <div style={{ color: CC.walnut, fontSize: 18 }}>›</div>
        </button>
      </div>

      {/* ── Danger zone ── */}
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onReset} style={{ width: '100%', padding: '14px 0', background: 'transparent', border: `1px dashed ${CC.ember}`, borderRadius: 16, color: CC.ember, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
          🔄 รีเซ็ตรายการตัวอย่าง
        </button>
        <button onClick={handleResetAll} disabled={clearing} style={{ width: '100%', padding: '14px 0', borderRadius: 16, fontFamily: FONT, border: 'none', fontSize: 13, fontWeight: 700, cursor: clearing ? 'default' : 'pointer', background: confirming ? CC.ember : CC.emberSoft, color: confirming ? '#fff' : CC.ember, transition: 'all 0.2s' }}>
          {clearing ? '⏳ กำลังล้าง...' : confirming ? '⚠️ กดอีกครั้งเพื่อยืนยัน' : '🗑️ ล้างข้อมูลทั้งหมด'}
        </button>
        <button onClick={onSignOut} style={{ width: '100%', padding: '14px 0', background: 'transparent', border: `1px solid ${CC.border}`, borderRadius: 16, color: CC.ink2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
          🚪 ออกจากระบบ
        </button>
      </div>

      <div style={{ height: 40 }} />

      {/* Modal — แก้ชื่อ */}
      {editingName && (
        <div style={overlay} onClick={() => setEditingName(false)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 4 }}>✏️ เปลี่ยนชื่อที่แสดง</div>
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 14 }}>ชื่อนี้แสดงในแอป — ไม่กระทบ ID (@{username})</div>
            <input
              type="text" value={newName} onChange={e => setNewName(e.target.value)}
              autoFocus placeholder="ชื่อที่แสดง" style={inp}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
            />
            <button onClick={handleSaveName} disabled={savingName || !newName.trim()} style={{ ...btnPri, opacity: savingName || !newName.trim() ? 0.5 : 1 }}>
              {savingName ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button onClick={() => setEditingName(false)} style={btnGhost}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Modal — ยืนยันออกจากห้อง */}
      {leavingRoom && (
        <div style={overlay} onClick={() => setLeavingRoom(null)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>{leavingRoom.ic}</div>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, textAlign: 'center', marginBottom: 10 }}>
              {leavingRoom.members.length <= 1 ? `ลบห้อง "${leavingRoom.name}"?` : `ออกจากห้อง "${leavingRoom.name}"?`}
            </div>
            <div style={{ fontSize: 13, color: CC.walnut, textAlign: 'center', lineHeight: 1.7, marginBottom: 4 }}>
              {leavingRoom.members.length <= 1
                ? 'คุณเป็นสมาชิกคนสุดท้าย การออกจะเป็นการลบห้องนี้ถาวร'
                : 'ห้องยังคงอยู่สำหรับสมาชิกคนอื่น'
              }
            </div>
            <button onClick={confirmLeaveRoom} style={{ ...btnPri, background: CC.ember }}>
              {leavingRoom.members.length <= 1 ? '🗑️ ลบห้องนี้' : '🚪 ออกจากห้อง'}
            </button>
            <button onClick={() => setLeavingRoom(null)} style={btnGhost}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Modal — ยืนยันออกจากกองกลาง */}
      {showLeaveFamily && (
        <div style={overlay} onClick={() => setShowLeaveFamily(false)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🌳</div>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, textAlign: 'center', marginBottom: 10 }}>
              {isFamilyLast ? 'ลบกองกลางครอบครัว?' : 'ออกจากกองกลางครอบครัว?'}
            </div>
            <div style={{ fontSize: 13, color: CC.walnut, textAlign: 'center', lineHeight: 1.7, marginBottom: 4 }}>
              {isFamilyLast
                ? 'คุณเป็นสมาชิกคนสุดท้าย การออกจะเป็นการลบกองกลางนี้ถาวร'
                : 'กองกลางยังคงอยู่สำหรับสมาชิกคนอื่น คุณสามารถเข้าร่วมใหม่ได้ภายหลัง'
              }
            </div>
            <button onClick={handleLeaveFamily} disabled={leavingFamily} style={{ ...btnPri, background: CC.ember, opacity: leavingFamily ? 0.6 : 1 }}>
              {leavingFamily ? 'กำลังดำเนินการ...' : isFamilyLast ? '🗑️ ลบกองกลาง' : '🚪 ออกจากกองกลาง'}
            </button>
            <button onClick={() => setShowLeaveFamily(false)} style={btnGhost}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Modal — เปลี่ยนรหัสผ่าน */}
      {showPwd && (
        <div style={overlay} onClick={closePwd}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 16 }}>🔒 เปลี่ยนรหัสผ่าน</div>
            {pwdOk ? (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 16, color: CC.moss, fontWeight: 700 }}>
                ✓ เปลี่ยนรหัสผ่านสำเร็จ!
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>รหัสผ่านเดิม</div>
                <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} placeholder="••••••" style={{ ...inp, marginBottom: 12 }} />
                <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>รหัสผ่านใหม่</div>
                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••••" style={{ ...inp, marginBottom: 12 }} />
                <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>ยืนยันรหัสผ่านใหม่</div>
                <input type="password" value={confPwd} onChange={e => setConfPwd(e.target.value)} placeholder="••••••" style={inp} />
                {pwdErr && <div style={{ marginTop: 10, fontSize: 12, color: CC.ember, textAlign: 'center' }}>{pwdErr}</div>}
                <button onClick={handleChangePassword} disabled={changingPwd} style={{ ...btnPri, opacity: changingPwd ? 0.6 : 1 }}>
                  {changingPwd ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                </button>
                <button onClick={closePwd} style={btnGhost}>ยกเลิก</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
