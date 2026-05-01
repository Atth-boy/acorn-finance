import { useState, useRef } from 'react'
import { CC, DISPLAY, FONT } from '../tokens'
import { Acorn } from '../components/Acorn'

const CATS = [
  { id: 'food',    ic: '🍜', l: 'อาหาร' },
  { id: 'coffee',  ic: '☕', l: 'กาแฟ' },
  { id: 'transit', ic: '🚇', l: 'เดินทาง' },
  { id: 'shop',    ic: '🛍️', l: 'ช้อป' },
  { id: 'home',    ic: '🏠', l: 'บ้าน' },
  { id: 'other',   ic: '🎁', l: 'อื่นๆ' },
]

const MODES = [
  { id: 'daily',    l: 'รายวัน',   ic: '📅' },
  { id: 'schedule', l: 'ตั้งเวลา', ic: '🗓️' },
  { id: 'monthly',  l: 'ทุกเดือน', ic: '📆' },
  { id: 'saving',   l: 'เก็บออม',  ic: '🏦' },
]

const MONTH_NAMES = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

const now = () => new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        let { width, height } = img
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export function EntryScreen({ addTxn, addScheduledFixed, addMonthlyFixed, close, wallets = [] }) {
  const [type,        setType]        = useState('expense')
  const [amount,      setAmount]      = useState('0')
  const [cat,         setCat]         = useState('food')
  const [mode,        setMode]        = useState('daily')
  const [note,        setNote]        = useState('')
  const [cutDay,      setCutDay]      = useState(String(new Date().getDate()))
  const [submitting,  setSubmitting]  = useState(false)

  const [receipt,        setReceipt]        = useState(null)
  const [showCalendar,   setShowCalendar]   = useState(false)
  const [scheduleDate,   setScheduleDate]   = useState(null)
  const [calYear,        setCalYear]        = useState(new Date().getFullYear())
  const [calMonth,       setCalMonth]       = useState(new Date().getMonth())
  const [showWalletPick, setShowWalletPick] = useState(false)
  const [savedWallet,    setSavedWallet]    = useState(null)

  const fileRef = useRef(null)

  const press = (k) => {
    if (k === '⌫') { setAmount(a => a.length <= 1 ? '0' : a.slice(0, -1)); return }
    if (k === '.') { if (!amount.includes('.')) setAmount(a => a + '.'); return }
    setAmount(a => a === '0' ? k : (a + k).slice(0, 9))
  }

  const handleModeSelect = (m) => {
    setMode(m)
    if (m === 'schedule') setShowCalendar(true)
    if (m === 'saving')   setShowWalletPick(true)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      setReceipt({ url: compressed, name: file.name })
    } catch {
      alert('ไม่สามารถโหลดรูปได้ กรุณาลองใหม่')
    }
  }

  const submit = async () => {
    if (submitting) return
    const n = parseFloat(amount) || 0
    if (n === 0) return
    setSubmitting(true)
    try {
      const c = CATS.find(x => x.id === cat)
      const label = note.trim() || (type === 'income' ? 'รับเงิน' : c.l)

      if (type === 'income') {
        await addTxn({
          id: Date.now(), label, cat: 'รับเข้า', ic: '💰',
          amt: n, time: now(), mode: 'daily', note: note.trim() || null,
          receiptImg: receipt?.url || null,
        })
      } else if (mode === 'schedule') {
        await addScheduledFixed({
          id: Date.now().toString(), name: label, ic: c.ic, amt: n,
          type: 'once', dueDate: scheduleDate ? scheduleDate.toISOString() : new Date().toISOString(),
        })
      } else if (mode === 'monthly') {
        await addMonthlyFixed({
          id: Date.now().toString(), name: label, ic: c.ic, amt: n,
          type: 'monthly', cutDay: Math.min(31, Math.max(1, parseInt(cutDay) || 1)),
        })
      } else {
        await addTxn({
          id: Date.now(), label, cat: c.l, ic: c.ic,
          amt: -n, time: now(), mode, note: note.trim() || null,
          wallet: mode === 'saving' ? savedWallet?.name : null,
          walletId: mode === 'saving' ? savedWallet?.id  : null,
          receiptImg: receipt?.url || null,
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = parseFloat(amount) === 0 || submitting

  const daysInMonth     = (y, m) => new Date(y, m + 1, 0).getDate()
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay()
  const prevCalMonth    = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) } else setCalMonth(m => m-1) }
  const nextCalMonth    = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) } else setCalMonth(m => m+1) }
  const scheduleDateLabel = scheduleDate
    ? `${scheduleDate.getDate()} ${MONTH_NAMES[scheduleDate.getMonth()]} ${scheduleDate.getFullYear()+543}`
    : null

  const inp = {
    padding: '10px 14px', borderRadius: 14,
    border: `1px solid ${CC.border}`, background: CC.surface,
    fontSize: 13, fontFamily: FONT, color: CC.ink, outline: 'none',
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: CC.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── TOP (scrollable if needed) ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ height: 'calc(12px + var(--sat))' }} />

        {/* Header */}
        <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={close} style={{ background: 'transparent', border: 'none', fontSize: 26, color: CC.walnut, cursor: 'pointer', padding: 4 }}>×</button>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY }}>เก็บลูกโอ๊ก</div>
          <div style={{ width: 34 }} />
        </div>

        {/* Type pills */}
        <div style={{ padding: '4px 20px 8px', display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[
            { id: 'expense', label: '🍂 จ่ายออก', bg: CC.ember },
            { id: 'income',  label: '🌰 รับเข้า',  bg: CC.moss  },
          ].map(tp => (
            <button key={tp.id} onClick={() => setType(tp.id)} style={{
              padding: '7px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
              background: type === tp.id ? tp.bg  : CC.surface,
              color:      type === tp.id ? '#fff' : CC.ink2,
              border:     type === tp.id ? 'none' : `1px solid ${CC.border}`,
            }}>{tp.label}</button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ padding: '4px 24px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
            {type === 'expense' ? 'จ่ายไป' : 'รับมา'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 20, color: CC.walnut, fontFamily: DISPLAY }}>฿</span>
            <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -2, fontVariantNumeric: 'tabular-nums', fontFamily: DISPLAY, color: type === 'expense' ? CC.ink : CC.moss }}>{amount}</span>
          </div>
          {type === 'expense' && (() => { const dw = wallets.find(w => w.isDefault); return dw ? (
            <div style={{ marginTop: 2, fontSize: 10, color: CC.walnut, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', background: CC.walnutSoft, borderRadius: 100 }}>
              {dw.ic} {dw.name}
            </div>
          ) : null })()}
        </div>

        {/* Categories — expense only */}
        {type === 'expense' && (
          <div style={{ padding: '0 16px 8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
              {CATS.map(c => {
                const on = c.id === cat
                return (
                  <button key={c.id} onClick={() => setCat(c.id)} style={{
                    aspectRatio: '1', borderRadius: 12, cursor: 'pointer', padding: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                    background: on ? CC.amber : CC.surface,
                    color:      on ? '#fff'   : CC.ink,
                    border:     on ? 'none'   : `1px solid ${CC.border}`,
                    fontFamily: FONT,
                  }}>
                    <span style={{ fontSize: 16 }}>{c.ic}</span>
                    <span style={{ fontSize: 8, fontWeight: 500 }}>{c.l}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Mode pills + supplement — expense only */}
        {type === 'expense' && (
          <div style={{ padding: '0 16px 6px' }}>
            <div style={{ fontSize: 10, color: CC.walnut, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>ประเภทการจ่าย</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {MODES.map(m => {
                const on = m.id === mode
                return (
                  <button key={m.id} onClick={() => handleModeSelect(m.id)} style={{
                    flex: 1, padding: '7px 4px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: FONT, textAlign: 'center',
                    background: on ? CC.walnut : CC.surface,
                    color:      on ? '#fff'    : CC.ink2,
                    border:     on ? 'none'    : `1px solid ${CC.border}`,
                  }}>
                    {m.ic}<br/>{m.l}
                    {m.id === 'schedule' && scheduleDateLabel && on && (
                      <div style={{ fontSize: 9, opacity: 0.8, marginTop: 1 }}>{scheduleDateLabel}</div>
                    )}
                  </button>
                )
              })}
            </div>
            {/* Fixed-height supplement — prevents layout jump */}
            <div style={{ height: 28, marginTop: 5, position: 'relative' }}>
              {mode === 'saving' && savedWallet && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: CC.walnut }}>
                  {savedWallet.ic} โอนเข้า <b>{savedWallet.name}</b>
                </div>
              )}
              {mode === 'monthly' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: CC.walnut }}>วันตัดทุกเดือน:</span>
                  <input type="number" min="1" max="31" value={cutDay}
                    onChange={e => setCutDay(e.target.value)}
                    style={{ ...inp, width: 56, padding: '4px 8px', fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Note */}
        <div style={{ padding: '0 16px 6px' }}>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="📝 รายละเอียด..."
            style={{ ...inp, width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Receipt — compact */}
        <div style={{ padding: '0 16px 6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, border: `1.5px dashed ${CC.border}`, background: CC.surface, cursor: 'pointer', fontSize: 12, color: CC.walnut, fontFamily: FONT }}>
            <span style={{ fontSize: 16 }}>🧾</span>
            <span>{receipt ? receipt.name : 'แนบใบเสร็จ'}</span>
            {receipt && <button onClick={e => { e.preventDefault(); setReceipt(null) }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: CC.ember, fontSize: 14, cursor: 'pointer', padding: 0 }}>×</button>}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
          {receipt && <div style={{ marginTop: 6, borderRadius: 10, overflow: 'hidden', background: '#000' }}><img src={receipt.url} alt="ใบเสร็จ" style={{ width: '100%', objectFit: 'contain', display: 'block' }} /></div>}
        </div>
      </div>

      {/* ── NUMPAD (always visible) ── */}
      <div style={{ flexShrink: 0, padding: '6px 12px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[['1','2','3'],['4','5','6'],['7','8','9'],['.','0','⌫']].map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 5 }}>
              {row.map(k => (
                <button key={k} onClick={() => press(k)} style={{
                  flex: 1, height: 48, background: CC.surface,
                  border: `1px solid ${CC.border}`, borderRadius: 16,
                  fontSize: 22, fontWeight: 600, color: CC.ink,
                  fontFamily: DISPLAY, cursor: 'pointer',
                }}>{k}</button>
              ))}
            </div>
          ))}
          <button onClick={submit} disabled={disabled} style={{
            height: 50, borderRadius: 16, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, cursor: disabled ? 'default' : 'pointer',
            background: disabled ? CC.border : CC.walnut, color: '#fff',
            boxShadow: disabled ? 'none' : '0 4px 14px rgba(122,79,42,0.35)',
          }}>
            <Acorn size={18} color={CC.amberSoft} />
            {submitting ? 'กำลังบันทึก...' : mode === 'schedule' ? 'บันทึกตั้งเวลา' : mode === 'monthly' ? 'บันทึกทุกเดือน' : 'เก็บลงกรุ'}
          </button>
        </div>
      </div>

      {/* Calendar */}
      {showCalendar && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(42,31,18,0.55)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowCalendar(false)}>
          <div style={{ width: '100%', background: CC.bg, borderRadius: '24px 24px 0 0', padding: '20px 16px 32px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button onClick={prevCalMonth} style={{ background: 'none', border: 'none', fontSize: 22, color: CC.walnut, cursor: 'pointer', padding: '4px 10px' }}>‹</button>
              <div style={{ fontWeight: 700, fontFamily: DISPLAY, fontSize: 15 }}>{MONTH_NAMES[calMonth]} {calYear+543}</div>
              <button onClick={nextCalMonth} style={{ background: 'none', border: 'none', fontSize: 22, color: CC.walnut, cursor: 'pointer', padding: '4px 10px' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              {['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, color: CC.walnut, fontWeight: 600, padding: '3px 0' }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: firstDayOfMonth(calYear, calMonth) }).map((_, i) => <div key={`b${i}`} />)}
              {Array.from({ length: daysInMonth(calYear, calMonth) }).map((_, i) => {
                const day = i + 1
                const d   = new Date(calYear, calMonth, day)
                const sel = scheduleDate && d.toDateString() === scheduleDate.toDateString()
                const tod = d.toDateString() === new Date().toDateString()
                return (
                  <button key={day} onClick={() => { setScheduleDate(d); setShowCalendar(false) }} style={{
                    aspectRatio: '1', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: sel ? 700 : 500,
                    background: sel ? CC.walnut : tod ? CC.amberSoft : CC.surface,
                    color:      sel ? '#fff'    : tod ? CC.walnut    : CC.ink,
                  }}>{day}</button>
                )
              })}
            </div>
            <button onClick={() => setShowCalendar(false)} style={{ marginTop: 14, width: '100%', padding: '12px', borderRadius: 14, border: 'none', background: CC.walnut, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>ยืนยัน</button>
          </div>
        </div>
      )}

      {/* Wallet Picker */}
      {showWalletPick && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(42,31,18,0.55)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowWalletPick(false)}>
          <div style={{ width: '100%', background: CC.bg, borderRadius: '24px 24px 0 0', padding: '22px 16px 36px' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 4 }}>เลือกกระเป๋าออม 🏦</div>
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 14 }}>เงินจะถูกบันทึกว่าเข้ากระเป๋านี้</div>
            {(() => {
              const savingsWallets = wallets.filter(w => !w.isDefault && w.amt >= 0)
              if (savingsWallets.length === 0) return (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: CC.ink, marginBottom: 6 }}>ยังไม่มีบัญชีเงินออม</div>
                  <div style={{ fontSize: 12, color: CC.walnut, lineHeight: 1.6 }}>
                    ไปที่หน้า บัญชี → เพิ่มบัญชีออมเงิน{'\n'}(PVD / กองทุน / เงินฝากประจำ / อื่นๆ) ก่อนนะ
                  </div>
                </div>
              )
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {savingsWallets.map(w => {
                    const sel = savedWallet?.id === w.id
                    return (
                      <button key={w.id} onClick={() => { setSavedWallet(w); setShowWalletPick(false) }} style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
                        background: sel ? CC.walnutSoft : CC.surface,
                        border: sel ? `2px solid ${CC.walnut}` : `1px solid ${CC.border}`,
                      }}>
                        <span style={{ fontSize: 22 }}>{w.ic}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: CC.ink }}>{w.name}</div>
                          <div style={{ fontSize: 11, color: CC.walnut, marginTop: 1 }}>{w.sub}</div>
                        </div>
                        {sel && <span style={{ marginLeft: 'auto', fontSize: 16 }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
