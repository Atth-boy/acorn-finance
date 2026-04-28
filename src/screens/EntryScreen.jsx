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

// โหมดประเภทการจ่ายออก
const MODES = [
  { id: 'daily',   l: 'รายวัน',    ic: '📅' },
  { id: 'schedule',l: 'ตั้งเวลา',  ic: '🗓️' },
  { id: 'monthly', l: 'ทุกเดือน',  ic: '📆' },
  { id: 'saving',  l: 'เก็บออม',   ic: '🏦' },
]

const MONTH_NAMES = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

export function EntryScreen({ addTxn, close, wallets = [] }) {
  const [type,   setType]   = useState('expense')
  const [amount, setAmount] = useState('0')
  const [cat,    setCat]    = useState('food')
  const [mode,   setMode]   = useState('daily')
  const [note,   setNote]   = useState('')

  const [receipt,       setReceipt]       = useState(null)
  const [showCalendar,  setShowCalendar]  = useState(false)
  const [scheduleDate,  setScheduleDate]  = useState(null)
  const [calYear,       setCalYear]       = useState(new Date().getFullYear())
  const [calMonth,      setCalMonth]      = useState(new Date().getMonth())
  const [showWalletPick,setShowWalletPick]= useState(false)
  const [savedWallet,   setSavedWallet]   = useState(null)

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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setReceipt({ url: URL.createObjectURL(file), name: file.name })
  }

  const submit = () => {
    const n = parseFloat(amount) || 0
    if (n === 0) return
    const c   = CATS.find(x => x.id === cat)
    const now = new Date()
    addTxn({
      id:           now.getTime(),
      label:        c.l,
      cat:          c.l,
      ic:           c.ic,
      amt:          type === 'expense' ? -n : n,
      time:         now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      mode,
      scheduleDate: scheduleDate ? scheduleDate.toISOString() : null,
      note:         note.trim() || null,
      wallet:       savedWallet?.name || null,
      walletId:     savedWallet?.id   || null,
    })
  }

  const disabled = parseFloat(amount) === 0

  // Calendar helpers
  const daysInMonth      = (y, m) => new Date(y, m + 1, 0).getDate()
  const firstDayOfMonth  = (y, m) => new Date(y, m, 1).getDay()
  const prevCalMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextCalMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const scheduleDateLabel = scheduleDate
    ? `${scheduleDate.getDate()} ${MONTH_NAMES[scheduleDate.getMonth()]} ${scheduleDate.getFullYear() + 543}`
    : null

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: CC.bg, overflow: 'auto' }}>
      <div style={{ height: 'calc(16px + var(--sat))' }} />

      {/* Header */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={close} style={{ background: 'transparent', border: 'none', fontSize: 26, color: CC.walnut, cursor: 'pointer', padding: 4 }}>×</button>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY }}>เก็บลูกโอ๊ก</div>
        <div style={{ width: 34 }} />
      </div>

      {/* Type pills */}
      <div style={{ padding: '6px 20px 10px', display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[
          { id: 'expense', label: '🍂 จ่ายออก', bg: CC.ember },
          { id: 'income',  label: '🌰 รับเข้า',  bg: CC.moss  },
        ].map(tp => (
          <button
            key={tp.id}
            onClick={() => setType(tp.id)}
            style={{
              padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
              background: type === tp.id ? tp.bg    : CC.surface,
              color:      type === tp.id ? '#fff'   : CC.ink2,
              border:     type === tp.id ? 'none'   : `1px solid ${CC.border}`,
            }}
          >{tp.label}</button>
        ))}
      </div>

      {/* Amount display */}
      <div style={{ padding: '8px 24px 14px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
          {type === 'expense' ? 'จ่ายไป' : 'รับมา'}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginTop: 6 }}>
          <span style={{ fontSize: 22, color: CC.walnut, fontFamily: DISPLAY }}>฿</span>
          <span style={{
            fontSize: 56, fontWeight: 700, letterSpacing: -2,
            fontVariantNumeric: 'tabular-nums', fontFamily: DISPLAY,
            color: type === 'expense' ? CC.ink : CC.moss,
          }}>{amount}</span>
        </div>
        {(() => {
          const dw = wallets.find(w => w.isDefault)
          return dw ? (
            <div style={{
              marginTop: 4, fontSize: 11, color: CC.walnut,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '3px 10px', background: CC.walnutSoft, borderRadius: 100,
            }}>
              {dw.ic} {dw.name}
            </div>
          ) : null
        })()}
      </div>

      {/* Category grid */}
      <div style={{ padding: '0 18px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
          {CATS.map(c => {
            const on = c.id === cat
            return (
              <button
                key={c.id} onClick={() => setCat(c.id)}
                style={{
                  aspectRatio: '1', borderRadius: 14, cursor: 'pointer', padding: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                  background: on ? CC.amber : CC.surface,
                  color:      on ? '#fff'   : CC.ink,
                  border:     on ? 'none'   : `1px solid ${CC.border}`,
                  fontFamily: FONT,
                }}
              >
                <span style={{ fontSize: 18 }}>{c.ic}</span>
                <span style={{ fontSize: 9, fontWeight: 500 }}>{c.l}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Payment mode (expense only) */}
      {type === 'expense' && (
        <div style={{ padding: '0 18px 12px' }}>
          <div style={{ fontSize: 11, color: CC.walnut, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            ประเภทการจ่าย
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MODES.map(m => {
              const on = m.id === mode
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeSelect(m.id)}
                  style={{
                    padding: '8px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: FONT,
                    background: on ? CC.walnut : CC.surface,
                    color:      on ? '#fff'    : CC.ink2,
                    border:     on ? 'none'    : `1px solid ${CC.border}`,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <span>{m.ic}</span>
                  {m.l}
                  {m.id === 'schedule' && scheduleDateLabel && on && (
                    <span style={{ opacity: 0.8, fontWeight: 500 }}>· {scheduleDateLabel}</span>
                  )}
                </button>
              )
            })}
          </div>
          {mode === 'saving' && savedWallet && (
            <div style={{ marginTop: 8, fontSize: 12, color: CC.walnut, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{savedWallet.ic}</span> โอนเข้า <strong>{savedWallet.name}</strong>
            </div>
          )}
        </div>
      )}

      {/* Note input */}
      <div style={{ padding: '0 18px 10px' }}>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="📝 เพิ่มรายละเอียด / note..."
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 14,
            border: `1px solid ${CC.border}`, background: CC.surface,
            fontSize: 13, fontFamily: FONT, color: CC.ink,
            boxSizing: 'border-box', outline: 'none',
          }}
        />
      </div>

      {/* Receipt upload */}
      <div style={{ padding: '0 18px 14px' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 14,
          border: `1.5px dashed ${CC.border}`, background: CC.surface,
          cursor: 'pointer', fontSize: 13, color: CC.walnut, fontFamily: FONT,
        }}>
          <span style={{ fontSize: 20 }}>🧾</span>
          <span>{receipt ? receipt.name : 'แนบใบเสร็จ / อัปโหลดรูปภาพ'}</span>
          {receipt && (
            <button
              onClick={e => { e.preventDefault(); setReceipt(null) }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: CC.ember, fontSize: 16, cursor: 'pointer', padding: 0 }}
            >×</button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
        {receipt && (
          <div style={{ marginTop: 8, borderRadius: 12, overflow: 'hidden', maxHeight: 140 }}>
            <img src={receipt.url} alt="ใบเสร็จ" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
      </div>

      {/* Numpad */}
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[['1','2','3'],['4','5','6'],['7','8','9'],['.','0','⌫']].map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 6 }}>
            {row.map(k => (
              <button
                key={k} onClick={() => press(k)}
                style={{
                  flex: 1, height: 52, background: CC.surface,
                  border: `1px solid ${CC.border}`, borderRadius: 18,
                  fontSize: 24, fontWeight: 600, color: CC.ink,
                  fontFamily: DISPLAY, cursor: 'pointer',
                }}
              >{k}</button>
            ))}
          </div>
        ))}

        <button
          onClick={submit} disabled={disabled}
          style={{
            height: 54, borderRadius: 18, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 16, fontWeight: 700, fontFamily: DISPLAY, marginTop: 2, cursor: disabled ? 'default' : 'pointer',
            background: disabled ? CC.ink3 : CC.walnut,
            color: '#fff',
            boxShadow: disabled ? 'none' : '0 6px 18px rgba(122,79,42,0.35)',
            transition: 'all 0.2s',
          }}
        >
          <Acorn size={20} color={CC.amberSoft} /> เก็บลงกรุ
        </button>
      </div>

      <div style={{ height: 30 }} />

      {/* Calendar Popup */}
      {showCalendar && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(42,31,18,0.55)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowCalendar(false)}
        >
          <div
            style={{ width: '100%', background: CC.bg, borderRadius: '24px 24px 0 0', padding: '20px 16px 32px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={prevCalMonth} style={{ background: 'none', border: 'none', fontSize: 22, color: CC.walnut, cursor: 'pointer', padding: '4px 10px' }}>‹</button>
              <div style={{ fontWeight: 700, fontFamily: DISPLAY, fontSize: 16 }}>
                {MONTH_NAMES[calMonth]} {calYear + 543}
              </div>
              <button onClick={nextCalMonth} style={{ background: 'none', border: 'none', fontSize: 22, color: CC.walnut, cursor: 'pointer', padding: '4px 10px' }}>›</button>
            </div>

            {/* Day name row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              {['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: CC.walnut, fontWeight: 600, padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: firstDayOfMonth(calYear, calMonth) }).map((_, i) => <div key={`blank-${i}`} />)}
              {Array.from({ length: daysInMonth(calYear, calMonth) }).map((_, i) => {
                const day = i + 1
                const d   = new Date(calYear, calMonth, day)
                const sel = scheduleDate && d.toDateString() === scheduleDate.toDateString()
                const tod = d.toDateString() === new Date().toDateString()
                return (
                  <button
                    key={day}
                    onClick={() => { setScheduleDate(d); setShowCalendar(false) }}
                    style={{
                      aspectRatio: '1', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: sel ? 700 : 500,
                      background: sel ? CC.walnut : tod ? CC.amberSoft : CC.surface,
                      color:      sel ? '#fff'    : tod ? CC.walnut    : CC.ink,
                    }}
                  >{day}</button>
                )
              })}
            </div>

            <button
              onClick={() => setShowCalendar(false)}
              style={{
                marginTop: 16, width: '100%', padding: '13px', borderRadius: 14,
                border: 'none', background: CC.walnut, color: '#fff',
                fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: 'pointer',
              }}
            >ยืนยัน</button>
          </div>
        </div>
      )}

      {/* Wallet Picker Popup (เก็บออม) */}
      {showWalletPick && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(42,31,18,0.55)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowWalletPick(false)}
        >
          <div
            style={{ width: '100%', background: CC.bg, borderRadius: '24px 24px 0 0', padding: '24px 16px 36px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 6 }}>เลือกกระเป๋าออม 🏦</div>
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 16 }}>เงินจะถูกบันทึกว่าเข้ากระเป๋านี้</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {wallets.filter(w => w.amt >= 0).map(w => {
                const sel = savedWallet?.id === w.id
                return (
                  <button
                    key={w.id}
                    onClick={() => { setSavedWallet(w); setShowWalletPick(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                      fontFamily: FONT,
                      background: sel ? CC.walnutSoft : CC.surface,
                      border: sel ? `2px solid ${CC.walnut}` : `1px solid ${CC.border}`,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{w.ic}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: CC.ink }}>{w.name}</div>
                      <div style={{ fontSize: 12, color: CC.walnut, marginTop: 2 }}>{w.sub}</div>
                    </div>
                    {sel && <span style={{ marginLeft: 'auto', fontSize: 18 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
