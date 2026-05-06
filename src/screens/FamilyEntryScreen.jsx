import { useState, useRef } from 'react'
import { CC, DISPLAY, FONT } from '../tokens'

const FA = '#7B4A1A'  // warm mahogany wood
const FA_SOFT = '#D4B888'

const FAMILY_CATS = [
  { id: 'food',   ic: '🍜', l: 'อาหาร' },
  { id: 'util',   ic: '💡', l: 'สาธารณูปโภค' },
  { id: 'home',   ic: '🏠', l: 'บ้าน' },
  { id: 'health', ic: '💊', l: 'สุขภาพ' },
  { id: 'shop',   ic: '🛍️', l: 'ซื้อของ' },
]

const FAMILY_EXTRA_CATS = [
  { id: 'entertain',   ic: '🎬', l: 'บันเทิง' },
  { id: 'travel',      ic: '✈️', l: 'ท่องเที่ยว' },
  { id: 'gift',        ic: '🎁', l: 'ของขวัญ' },
  { id: 'edu',         ic: '📚', l: 'ศึกษา' },
  { id: 'convenience', ic: '🏪', l: 'สะดวกซื้อ' },
  { id: 'bill',        ic: '📄', l: 'bill&fees' },
  { id: 'other',       ic: '🗂️', l: 'อื่นๆ' },
]

const ALL_FAMILY_CATS = [...FAMILY_CATS, ...FAMILY_EXTRA_CATS]

const MODES = [
  { id: 'daily',    l: 'รายวัน',   ic: '📅' },
  { id: 'schedule', l: 'ตั้งเวลา', ic: '🗓️' },
  { id: 'monthly',  l: 'ทุกเดือน', ic: '📆' },
]

const MONTH_NAMES = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function HouseIcon({ size = 22, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M5 16L16 6L27 16" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="8" y="15" width="16" height="13" rx="2" fill={color} opacity="0.85" />
      <rect x="13" y="21" width="6" height="7" rx="1.5" fill="rgba(0,0,0,0.22)" />
    </svg>
  )
}

export function FamilyEntryScreen({ addFamilyTxn, close, user }) {
  const [type,         setType]         = useState('expense')
  const [amount,       setAmount]       = useState('0')
  const [cat,          setCat]          = useState('food')
  const [mode,         setMode]         = useState('daily')
  const [note,         setNote]         = useState('')
  const [receipt,      setReceipt]      = useState(null)
  const [showCalendar,  setShowCalendar]  = useState(false)
  const [showMoreCats,  setShowMoreCats]  = useState(false)
  const [scheduleDate, setScheduleDate] = useState(null)
  const [calYear,      setCalYear]      = useState(new Date().getFullYear())
  const [calMonth,     setCalMonth]     = useState(new Date().getMonth())

  const fileRef = useRef(null)

  const press = (k) => {
    if (k === '⌫') { setAmount(a => a.length <= 1 ? '0' : a.slice(0, -1)); return }
    if (k === '.') { if (!amount.includes('.')) setAmount(a => a + '.'); return }
    setAmount(a => a === '0' ? k : (a + k).slice(0, 9))
  }

  const handleModeSelect = (m) => {
    setMode(m)
    if (m === 'schedule') setShowCalendar(true)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setReceipt({ url: URL.createObjectURL(file), name: file.name })
  }

  const submit = () => {
    const n = parseFloat(amount) || 0
    if (n === 0) return
    const c   = ALL_FAMILY_CATS.find(x => x.id === cat)
    const now = new Date()
    addFamilyTxn({
      id:            now.getTime(),
      label:         type === 'expense' ? c.l : (note.trim() || 'รับเข้า'),
      cat:           type === 'expense' ? c.l : 'รับเข้า',
      ic:            type === 'expense' ? c.ic : '💰',
      amt:           type === 'expense' ? -n : n,
      time:          now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      mode,
      scheduleDate:  scheduleDate ? scheduleDate.toISOString() : null,
      note:          note.trim() || null,
      createdByName: user?.displayName || user?.email?.replace('@acorn.app', '') || 'ไม่ทราบ',
    })
  }

  const disabled = parseFloat(amount) === 0

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
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#F0E8D2', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ height: 'calc(12px + var(--sat))' }} />

        {/* Header */}
        <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={close} style={{ background: 'transparent', border: 'none', fontSize: 26, color: FA, cursor: 'pointer', padding: 4 }}>×</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, fontFamily: DISPLAY }}>
            🌳 กองกลางครอบครัว
          </div>
          <div style={{ width: 34 }} />
        </div>

        {/* Type pills */}
        <div style={{ padding: '4px 20px 8px', display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[
            { id: 'expense', label: '🍂 จ่ายออก', bg: CC.ember },
            { id: 'income',  label: '💰 รับเข้า',  bg: FA     },
          ].map(tp => (
            <button key={tp.id} onClick={() => setType(tp.id)}
              style={{
                padding: '7px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                background: type === tp.id ? tp.bg    : '#F8F2E4',
                color:      type === tp.id ? '#fff'   : '#5A3318',
                border:     type === tp.id ? 'none'   : '1px solid #C8A87A',
              }}>
              {tp.label}
            </button>
          ))}
        </div>

        {/* Amount display */}
        <div style={{ padding: '4px 24px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#5A3318', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
            {type === 'expense' ? 'จ่ายไป' : 'รับมา'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 20, color: FA, fontFamily: DISPLAY }}>฿</span>
            <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -2, fontVariantNumeric: 'tabular-nums', fontFamily: DISPLAY, color: type === 'expense' ? CC.ink : FA }}>
              {amount}
            </span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: '#5A3318', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: '#F0DEB8', borderRadius: 100 }}>
            🏡 กองกลางครอบครัว
          </div>
        </div>

        {/* Category grid — expense only */}
        {type === 'expense' && (
          <div style={{ padding: '0 18px 10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
              {FAMILY_CATS.map(c => {
                const on = c.id === cat
                return (
                  <button key={c.id} onClick={() => setCat(c.id)}
                    style={{
                      aspectRatio: '1', borderRadius: 12, cursor: 'pointer', padding: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      background: on ? FA      : '#F8F2E4',
                      color:      on ? '#fff'  : CC.ink,
                      border:     on ? 'none'  : '1px solid #C8A87A',
                      fontFamily: FONT,
                    }}>
                    <span style={{ fontSize: 16 }}>{c.ic}</span>
                    <span style={{ fontSize: 8, fontWeight: 500 }}>{c.l}</span>
                  </button>
                )
              })}
              {/* ปุ่ม เพิ่มเติม */}
              {(() => {
                const isExtraOn = FAMILY_EXTRA_CATS.some(c => c.id === cat)
                const on = showMoreCats || isExtraOn
                return (
                  <button onClick={() => setShowMoreCats(v => !v)}
                    style={{
                      aspectRatio: '1', borderRadius: 12, cursor: 'pointer', padding: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      background: on ? FA      : '#F8F2E4',
                      color:      on ? '#fff'  : CC.ink,
                      border:     on ? 'none'  : '1px solid #C8A87A',
                      fontFamily: FONT,
                    }}>
                    <span style={{ fontSize: 14 }}>{showMoreCats ? '▴' : '▾'}</span>
                    <span style={{ fontSize: 8, fontWeight: 500 }}>เพิ่มเติม</span>
                  </button>
                )
              })()}
            </div>
            {/* Extra cats */}
            {showMoreCats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginTop: 5 }}>
                {FAMILY_EXTRA_CATS.map(c => {
                  const on = c.id === cat
                  return (
                    <button key={c.id} onClick={() => setCat(c.id)}
                      style={{
                        aspectRatio: '1', borderRadius: 12, cursor: 'pointer', padding: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                        background: on ? FA      : '#F8F2E4',
                        color:      on ? '#fff'  : CC.ink,
                        border:     on ? 'none'  : '1px solid #C8A87A',
                        fontFamily: FONT,
                      }}>
                      <span style={{ fontSize: 16 }}>{c.ic}</span>
                      <span style={{ fontSize: 8, fontWeight: 500 }}>{c.l}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Payment mode — expense only */}
        {type === 'expense' && (
          <div style={{ padding: '0 18px 10px' }}>
            <div style={{ fontSize: 10, color: '#5A3318', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>ประเภทการจ่าย</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MODES.map(m => {
                const on = m.id === mode
                return (
                  <button key={m.id} onClick={() => handleModeSelect(m.id)}
                    style={{
                      padding: '7px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 4,
                      background: on ? FA       : '#F8F2E4',
                      color:      on ? '#fff'   : '#5A3318',
                      border:     on ? 'none'   : '1px solid #C8A87A',
                    }}>
                    <span>{m.ic}</span>
                    {m.l}
                    {m.id === 'schedule' && scheduleDateLabel && on && (
                      <span style={{ opacity: 0.8, fontWeight: 500 }}>· {scheduleDateLabel}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Note input */}
        <div style={{ padding: '0 18px 8px' }}>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="📝 รายละเอียด..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1px solid #C8A87A', background: '#F8F2E4', fontSize: 13, fontFamily: FONT, color: CC.ink, boxSizing: 'border-box', outline: 'none' }} />
        </div>

        {/* Receipt upload */}
        <div style={{ padding: '0 18px 8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 12, border: '1.5px dashed #C8A87A', background: '#F8F2E4', cursor: 'pointer', fontSize: 12, color: '#5A3318', fontFamily: FONT }}>
            <span style={{ fontSize: 16 }}>🧾</span>
            <span>{receipt ? receipt.name : 'แนบใบเสร็จ'}</span>
            {receipt && (
              <button onClick={e => { e.preventDefault(); setReceipt(null) }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: CC.ember, fontSize: 14, cursor: 'pointer', padding: 0 }}>×</button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
          {receipt && (
            <div style={{ marginTop: 6, borderRadius: 10, overflow: 'hidden', background: '#000' }}>
              <img src={receipt.url} alt="ใบเสร็จ" style={{ width: '100%', objectFit: 'contain', display: 'block' }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Numpad (fixed bottom) ── */}
      <div style={{ flexShrink: 0, padding: '6px 12px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[['1','2','3'],['4','5','6'],['7','8','9'],['.','0','⌫']].map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 5 }}>
              {row.map(k => (
                <button key={k} onClick={() => press(k)}
                  style={{ flex: 1, height: 48, background: '#F8F2E4', border: '1px solid #C8A87A', borderRadius: 16, fontSize: 22, fontWeight: 600, color: CC.ink, fontFamily: DISPLAY, cursor: 'pointer' }}>
                  {k}
                </button>
              ))}
            </div>
          ))}

          <button onClick={submit} disabled={disabled}
            style={{
              height: 50, borderRadius: 16, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, cursor: disabled ? 'default' : 'pointer',
              background: disabled ? CC.border : FA,
              color: '#fff',
              boxShadow: disabled ? 'none' : '0 4px 14px rgba(122,79,42,0.35)',
            }}>
            <HouseIcon size={18} color={FA_SOFT} /> บันทึกกองกลาง
          </button>
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(58,46,13,0.55)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowCalendar(false)}>
          <div style={{ width: '100%', background: '#F0E8D2', borderRadius: '24px 24px 0 0', padding: '20px 16px 32px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={prevCalMonth} style={{ background: 'none', border: 'none', fontSize: 22, color: FA, cursor: 'pointer', padding: '4px 10px' }}>‹</button>
              <div style={{ fontWeight: 700, fontFamily: DISPLAY, fontSize: 16 }}>{MONTH_NAMES[calMonth]} {calYear + 543}</div>
              <button onClick={nextCalMonth} style={{ background: 'none', border: 'none', fontSize: 22, color: FA, cursor: 'pointer', padding: '4px 10px' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              {['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#5A3318', fontWeight: 600, padding: '4px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: firstDayOfMonth(calYear, calMonth) }).map((_, i) => <div key={`b-${i}`} />)}
              {Array.from({ length: daysInMonth(calYear, calMonth) }).map((_, i) => {
                const day = i + 1
                const d   = new Date(calYear, calMonth, day)
                const sel = scheduleDate && d.toDateString() === scheduleDate.toDateString()
                const tod = d.toDateString() === new Date().toDateString()
                return (
                  <button key={day} onClick={() => { setScheduleDate(d); setShowCalendar(false) }}
                    style={{ aspectRatio: '1', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: sel ? 700 : 500, background: sel ? FA : tod ? FA_SOFT : '#F8F2E4', color: sel ? '#fff' : tod ? '#5A3318' : CC.ink }}>
                    {day}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setShowCalendar(false)}
              style={{ marginTop: 16, width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: FA, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>
              ยืนยัน
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
