import { useState, useRef } from 'react'
import { CC, DISPLAY, FONT } from '../tokens'

// Business palette (slate + brass)
const BZ       = '#3A5666'  // slate
const BZ_DEEP  = '#243845'
const BZ_SOFT  = '#D2DAE0'
const BZ_BRASS = '#B07A3A'
const BZ_GOLD  = '#D4A55C'

const BIZ_INCOME_CATS = [
  { id: 'sales',    ic: '🛍️', l: 'ขายสินค้า' },
  { id: 'service',  ic: '🤝', l: 'บริการ' },
  { id: 'shipping', ic: '📦', l: 'ค่าจัดส่ง' },
  { id: 'other_in', ic: '✨', l: 'อื่นๆ' },
]

const BIZ_EXPENSE_CATS = [
  { id: 'stock',     ic: '📦', l: 'สต๊อกสินค้า' },
  { id: 'marketing', ic: '📢', l: 'การตลาด' },
  { id: 'rent',      ic: '🏢', l: 'ค่าเช่า' },
  { id: 'salary',    ic: '👥', l: 'เงินเดือน' },
  { id: 'other_out', ic: '⚡', l: 'อื่นๆ' },
]

const BIZ_EXPENSE_EXTRA = [
  { id: 'packaging',  ic: '🎁', l: 'บรรจุภัณฑ์' },
  { id: 'logistics',  ic: '🚚', l: 'ขนส่ง' },
  { id: 'equipment',  ic: '🖨️', l: 'อุปกรณ์' },
  { id: 'fees',       ic: '💳', l: 'ค่าธรรมเนียม' },
  { id: 'tax',        ic: '📋', l: 'ภาษี' },
  { id: 'utility',    ic: '💡', l: 'สาธารณูปโภค' },
]

const ALL_BIZ_EXPENSE = [...BIZ_EXPENSE_CATS, ...BIZ_EXPENSE_EXTRA]

const MODES = [
  { id: 'daily',    l: 'รายวัน',   ic: '📅' },
  { id: 'schedule', l: 'ตั้งเวลา', ic: '🗓️' },
  { id: 'monthly',  l: 'ทุกเดือน', ic: '📆' },
]

const MONTH_NAMES = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function Briefcase({ size = 22, color = '#fff', accent = BZ_SOFT }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M 12 8 L 12 6.5 Q 12 5 13.5 5 L 18.5 5 Q 20 5 20 6.5 L 20 8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="5" y="9" width="22" height="16" rx="2.5" fill={color}/>
      <rect x="5" y="15" width="22" height="1.5" fill={accent} opacity="0.55"/>
      <rect x="13.5" y="14" width="5" height="3.5" rx="0.6" fill={accent}/>
      <circle cx="16" cy="15.75" r="0.7" fill={color}/>
    </svg>
  )
}

export function BusinessEntryScreen({ addBusinessTxn, close, user }) {
  const [type,         setType]         = useState('expense')
  const [amount,       setAmount]       = useState('0')
  const [expCat,       setExpCat]       = useState('stock')
  const [incCat,       setIncCat]       = useState('sales')
  const [mode,         setMode]         = useState('daily')
  const [note,         setNote]         = useState('')
  const [receipt,      setReceipt]      = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showMoreCats, setShowMoreCats] = useState(false)
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
    const c = type === 'expense'
      ? ALL_BIZ_EXPENSE.find(x => x.id === expCat)
      : BIZ_INCOME_CATS.find(x => x.id === incCat)
    const now = new Date()
    addBusinessTxn({
      id:            now.getTime(),
      label:         note.trim() || c.l,
      cat:           c.l,
      ic:            c.ic,
      amt:           type === 'expense' ? -n : n,
      time:          now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      mode,
      scheduleDate:  scheduleDate ? scheduleDate.toISOString() : null,
      note:          note.trim() || null,
      createdByName: user?.displayName || user?.email?.replace('@acorn.app', '') || 'ไม่ทราบ',
    })
  }

  const disabled = parseFloat(amount) === 0

  const daysInMonth     = (y, m) => new Date(y, m + 1, 0).getDate()
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay()
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
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#EEF2F4', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ height: 'calc(12px + var(--sat))' }} />

        {/* Header */}
        <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={close} style={{ background: 'transparent', border: 'none', fontSize: 26, color: BZ, cursor: 'pointer', padding: 4 }}>×</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, color: BZ_DEEP }}>
            💼 คลังธุรกิจ
          </div>
          <div style={{ width: 34 }} />
        </div>

        {/* Type pills */}
        <div style={{ padding: '4px 20px 8px', display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[
            { id: 'expense', label: '🍂 รายจ่าย', bg: CC.ember },
            { id: 'income',  label: '💰 รายรับ',  bg: BZ_BRASS },
          ].map(tp => (
            <button key={tp.id} onClick={() => setType(tp.id)}
              style={{
                padding: '7px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                background: type === tp.id ? tp.bg : '#F8FAFB',
                color:      type === tp.id ? '#fff' : BZ_DEEP,
                border:     type === tp.id ? 'none' : `1px solid ${BZ_SOFT}`,
              }}>
              {tp.label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ padding: '4px 24px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: BZ_DEEP, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
            {type === 'expense' ? 'จ่ายไป' : 'รับมา'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 20, color: BZ_BRASS, fontFamily: DISPLAY }}>฿</span>
            <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -2, fontVariantNumeric: 'tabular-nums', fontFamily: DISPLAY, color: type === 'expense' ? CC.ink : BZ_BRASS }}>
              {amount}
            </span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: BZ_DEEP, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: '#E0DCC6', borderRadius: 100 }}>
            💼 คลังธุรกิจ
          </div>
        </div>

        {/* Income categories */}
        {type === 'income' && (
          <div style={{ padding: '0 18px 10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
              {BIZ_INCOME_CATS.map(c => {
                const on = c.id === incCat
                return (
                  <button key={c.id} onClick={() => setIncCat(c.id)}
                    style={{
                      aspectRatio: '1', borderRadius: 12, cursor: 'pointer', padding: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      background: on ? BZ_BRASS : '#F8FAFB',
                      color:      on ? '#fff'   : CC.ink,
                      border:     on ? 'none'   : `1px solid ${BZ_SOFT}`,
                      fontFamily: FONT,
                    }}>
                    <span style={{ fontSize: 16 }}>{c.ic}</span>
                    <span style={{ fontSize: 9, fontWeight: 500 }}>{c.l}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Expense categories */}
        {type === 'expense' && (
          <div style={{ padding: '0 18px 10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
              {BIZ_EXPENSE_CATS.map(c => {
                const on = c.id === expCat
                return (
                  <button key={c.id} onClick={() => setExpCat(c.id)}
                    style={{
                      aspectRatio: '1', borderRadius: 12, cursor: 'pointer', padding: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      background: on ? BZ : '#F8FAFB',
                      color:      on ? '#fff' : CC.ink,
                      border:     on ? 'none' : `1px solid ${BZ_SOFT}`,
                      fontFamily: FONT,
                    }}>
                    <span style={{ fontSize: 16 }}>{c.ic}</span>
                    <span style={{ fontSize: 8, fontWeight: 500 }}>{c.l}</span>
                  </button>
                )
              })}
              {(() => {
                const isExtraOn = BIZ_EXPENSE_EXTRA.some(c => c.id === expCat)
                const on = showMoreCats || isExtraOn
                return (
                  <button onClick={() => setShowMoreCats(v => !v)}
                    style={{
                      aspectRatio: '1', borderRadius: 12, cursor: 'pointer', padding: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      background: on ? BZ : '#F8FAFB',
                      color:      on ? '#fff' : CC.ink,
                      border:     on ? 'none' : `1px solid ${BZ_SOFT}`,
                      fontFamily: FONT,
                    }}>
                    <span style={{ fontSize: 14 }}>{showMoreCats ? '▴' : '▾'}</span>
                    <span style={{ fontSize: 8, fontWeight: 500 }}>เพิ่มเติม</span>
                  </button>
                )
              })()}
            </div>
            {showMoreCats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5, marginTop: 5 }}>
                {BIZ_EXPENSE_EXTRA.map(c => {
                  const on = c.id === expCat
                  return (
                    <button key={c.id} onClick={() => setExpCat(c.id)}
                      style={{
                        aspectRatio: '1', borderRadius: 12, cursor: 'pointer', padding: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                        background: on ? BZ : '#F8FAFB',
                        color:      on ? '#fff' : CC.ink,
                        border:     on ? 'none' : `1px solid ${BZ_SOFT}`,
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
            <div style={{ fontSize: 10, color: BZ_DEEP, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>ประเภทการจ่าย</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MODES.map(m => {
                const on = m.id === mode
                return (
                  <button key={m.id} onClick={() => handleModeSelect(m.id)}
                    style={{
                      padding: '7px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 4,
                      background: on ? BZ      : '#F8FAFB',
                      color:      on ? '#fff'  : BZ_DEEP,
                      border:     on ? 'none'  : `1px solid ${BZ_SOFT}`,
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

        {/* Note */}
        <div style={{ padding: '0 18px 8px' }}>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="📝 รายละเอียด / เลขที่ใบสั่งซื้อ..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: `1px solid ${BZ_SOFT}`, background: '#F8FAFB', fontSize: 13, fontFamily: FONT, color: CC.ink, boxSizing: 'border-box', outline: 'none' }} />
        </div>

        {/* Receipt */}
        <div style={{ padding: '0 18px 8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 12, border: `1.5px dashed ${BZ_SOFT}`, background: '#F8FAFB', cursor: 'pointer', fontSize: 12, color: BZ_DEEP, fontFamily: FONT }}>
            <span style={{ fontSize: 16 }}>🧾</span>
            <span>{receipt ? receipt.name : 'แนบใบเสร็จ / invoice'}</span>
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

      {/* Numpad */}
      <div style={{ flexShrink: 0, padding: '6px 12px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[['1','2','3'],['4','5','6'],['7','8','9'],['.','0','⌫']].map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 5 }}>
              {row.map(k => (
                <button key={k} onClick={() => press(k)}
                  style={{ flex: 1, height: 48, background: '#F8FAFB', border: `1px solid ${BZ_SOFT}`, borderRadius: 16, fontSize: 22, fontWeight: 600, color: CC.ink, fontFamily: DISPLAY, cursor: 'pointer' }}>
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
              background: disabled ? CC.border : BZ,
              color: '#fff',
              boxShadow: disabled ? 'none' : '0 4px 14px rgba(58,86,102,0.4)',
            }}>
            <Briefcase size={18} color={BZ_GOLD} accent="#fff" /> บันทึกคลังธุรกิจ
          </button>
        </div>
      </div>

      {/* Calendar */}
      {showCalendar && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(36,56,69,0.55)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowCalendar(false)}>
          <div style={{ width: '100%', background: '#EEF2F4', borderRadius: '24px 24px 0 0', padding: '20px 16px 32px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={prevCalMonth} style={{ background: 'none', border: 'none', fontSize: 22, color: BZ, cursor: 'pointer', padding: '4px 10px' }}>‹</button>
              <div style={{ fontWeight: 700, fontFamily: DISPLAY, fontSize: 16, color: BZ_DEEP }}>{MONTH_NAMES[calMonth]} {calYear + 543}</div>
              <button onClick={nextCalMonth} style={{ background: 'none', border: 'none', fontSize: 22, color: BZ, cursor: 'pointer', padding: '4px 10px' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              {['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: BZ_DEEP, fontWeight: 600, padding: '4px 0' }}>{d}</div>
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
                    style={{ aspectRatio: '1', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: sel ? 700 : 500, background: sel ? BZ : tod ? BZ_SOFT : '#F8FAFB', color: sel ? '#fff' : tod ? BZ_DEEP : CC.ink }}>
                    {day}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setShowCalendar(false)}
              style={{ marginTop: 16, width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: BZ, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>
              ยืนยัน
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
