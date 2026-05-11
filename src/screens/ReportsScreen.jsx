import { useState, useRef } from 'react'
import { CC, DISPLAY, FONT } from '../tokens'
import { Squirrel } from '../components/Squirrel'
import { Acorn }    from '../components/Acorn'

const CATS = [
  { id: 'food',    ic: '🍜', l: 'อาหาร' },
  { id: 'coffee',  ic: '☕', l: 'กาแฟ' },
  { id: 'transit', ic: '🚇', l: 'เดินทาง' },
  { id: 'shop',    ic: '🛍️', l: 'ช้อป' },
  { id: 'home',    ic: '🏠', l: 'บ้าน' },
  { id: 'other',   ic: '🎁', l: 'อื่นๆ' },
]

const COLORS = { 'อาหาร': CC.amber, 'เดินทาง': CC.moss, 'ช้อป': CC.walnut, 'บ้าน': '#A89968', 'อื่นๆ': CC.ember, 'กาแฟ': CC.ember, 'สาธารณูปโภค': '#7B9EA6', 'สุขภาพ': '#A06B8A', 'ซื้อของ': CC.walnut }
const ICONS  = { 'อาหาร': '🍜', 'เดินทาง': '🚇', 'ช้อป': '🛍️', 'บ้าน': '🏠', 'อื่นๆ': '✨', 'กาแฟ': '☕', 'สาธารณูปโภค': '💡', 'สุขภาพ': '💊', 'ซื้อของ': '🛍️' }

const MONTH_LONG = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
const MONTH_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

const PERIODS = [
  { id: 'day',   l: 'วัน' },
  { id: 'week',  l: 'สัปดาห์' },
  { id: 'month', l: 'เดือน' },
  { id: 'year',  l: 'ปี' },
]

function getPeriodRange(id, date) {
  const d = new Date(date)
  if (id === 'day') {
    return {
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
      end:   new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
    }
  }
  if (id === 'week') {
    const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
    const start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (id === 'month') {
    return {
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end:   new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    }
  }
  return {
    start: new Date(d.getFullYear(), 0, 1),
    end:   new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999),
  }
}

function getHeading(id, date) {
  const d = new Date(date)
  const y = d.getFullYear() + 543
  const m = MONTH_SHORT[d.getMonth()]
  if (id === 'day')  return `${d.getDate()} ${m} ${y}`
  if (id === 'year') return `ปี ${y}`
  if (id === 'month') return `${MONTH_LONG[d.getMonth()]} ${y}`
  const start = new Date(d); start.setDate(d.getDate() - 6)
  const sm = MONTH_SHORT[start.getMonth()]
  if (start.getMonth() === d.getMonth())
    return `${start.getDate()}–${d.getDate()} ${m} ${y}`
  return `${start.getDate()} ${sm} – ${d.getDate()} ${m} ${y}`
}

const FA = '#C8920A'
const today = new Date()

export function ReportsScreen({ txns, familyTxns = [], onEditTxn, onDeleteTxn, onEditFamilyTxn, onDeleteFamilyTxn }) {
  const [period,       setPeriod]       = useState('month')
  const [account,      setAccount]      = useState('personal')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showPicker,   setShowPicker]   = useState(false)
  const [editLocked,   setEditLocked]   = useState(true)
  const [selectedTxn,  setSelectedTxn]  = useState(null)
  const [editMode,     setEditMode]     = useState(false)
  const [editLabel,    setEditLabel]    = useState('')
  const [editNote,     setEditNote]     = useState('')
  const [editAmt,      setEditAmt]      = useState('')
  const [editCat,      setEditCat]      = useState('other')
  const [deleting,     setDeleting]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const dateInputRef = useRef(null)

  const closeSheet = () => { setSelectedTxn(null); setEditMode(false) }

  const openEdit = (t) => {
    setSelectedTxn(t)
    setEditLabel(t.label)
    setEditNote(t.note || '')
    setEditAmt(Math.abs(t.amt).toString())
    setEditCat(CATS.find(c => c.l === t.cat)?.id || 'other')
    setEditMode(true)
  }

  const handleDelete = async (t) => {
    if (deleting) return
    setDeleting(true)
    if (account === 'family') await onDeleteFamilyTxn?.(t)
    else await onDeleteTxn?.(t)
    setDeleting(false)
    closeSheet()
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    const absAmt = parseFloat(editAmt) || 0
    if (absAmt <= 0) { setSaving(false); return }
    const newAmt = selectedTxn.amt >= 0 ? absAmt : -absAmt
    const catObj = CATS.find(c => c.id === editCat)
    const updatedCat = (selectedTxn.amt < 0 && catObj) ? catObj.l : selectedTxn.cat
    const updatedIc  = (selectedTxn.amt < 0 && catObj) ? catObj.ic : selectedTxn.ic
    const updated = { ...selectedTxn, label: editLabel.trim() || selectedTxn.label, note: editNote.trim() || null, amt: newAmt, cat: updatedCat, ic: updatedIc }
    if (account === 'family') await onEditFamilyTxn?.(updated)
    else await onEditTxn?.(updated, selectedTxn.amt)
    setSaving(false)
    closeSheet()
  }

  const source = account === 'family' ? familyTxns : txns
  const txnDate = (t) => new Date(t.id || Date.now())

  const { start, end } = getPeriodRange(period, selectedDate)
  const filtered = source.filter(t => { const d = txnDate(t); return d >= start && d <= end })
  const expenses = filtered.filter(t => t.amt < 0)
  const totalOut = expenses.reduce((s, t) => s + Math.abs(t.amt), 0)
  const totalIn  = filtered.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0)

  const byCat = {}
  expenses.forEach(t => { byCat[t.cat] = (byCat[t.cat] || 0) + Math.abs(t.amt) })
  const cats = Object.entries(byCat)
    .map(([l, amt]) => ({ l, amt, pct: Math.round((amt / totalOut) * 100), color: COLORS[l] || CC.ink2, ic: ICONS[l] || '✨' }))
    .sort((a, b) => b.amt - a.amt)

  let acc = 0
  const segs = cats.map(c => { const s = acc; acc += c.pct; return { ...c, s, e: acc } })
  const recent = [...filtered].reverse().slice(0, 30)

  const navigate = (dir) => {
    setSelectedDate(prev => {
      const d = new Date(prev)
      if (period === 'day')   d.setDate(d.getDate() + dir)
      if (period === 'week')  d.setDate(d.getDate() + dir * 7)
      if (period === 'month') d.setMonth(d.getMonth() + dir)
      if (period === 'year')  d.setFullYear(d.getFullYear() + dir)
      return d > today ? new Date(today) : d
    })
  }

  const isAtToday = (() => {
    const t = today
    if (period === 'day')   return selectedDate.toDateString() === t.toDateString()
    if (period === 'week')  return end >= t
    if (period === 'month') return selectedDate.getMonth() === t.getMonth() && selectedDate.getFullYear() === t.getFullYear()
    if (period === 'year')  return selectedDate.getFullYear() === t.getFullYear()
    return true
  })()

  const todayISO = today.toISOString().slice(0, 10)

  return (
    <>
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingBottom: 110 }}>
      <div style={{ height: 'calc(16px + var(--sat))' }} />

      {/* Header */}
      <div style={{ padding: '12px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: CC.walnut, fontStyle: 'italic' }}>นี่คือสิ่งที่คุณใช้ไป</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => { setEditLocked(v => !v); closeSheet() }}
              title={editLocked ? 'ปลดล็อกแก้ไข' : 'ล็อกการแก้ไข'}
              style={{ width: 30, height: 30, borderRadius: 100, border: `1px solid ${CC.border}`, background: CC.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              {editLocked ? (
                <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke={CC.walnut} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="7" width="12" height="8" rx="2" />
                  <path d="M4 7V5a3 3 0 0 1 6 0v2" />
                </svg>
              ) : (
                <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke={CC.walnut} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="7" width="12" height="8" rx="2" />
                  <path d="M4 7V5a3 3 0 0 1 6 0" />
                </svg>
              )}
            </button>
            <div style={{ display: 'flex', background: CC.surface, border: `1px solid ${CC.border}`, borderRadius: 100, padding: 3, gap: 2 }}>
              {[{ id: 'personal', label: 'ส่วนตัว' }, { id: 'family', label: '🏡 กองกลาง' }].map(a => (
                <button key={a.id} onClick={() => setAccount(a.id)} style={{
                  padding: '5px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, border: 'none',
                  background: account === a.id ? (a.id === 'family' ? FA : CC.walnut) : 'transparent',
                  color: account === a.id ? '#fff' : CC.ink2, transition: 'all 0.2s',
                }}>{a.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Period navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <button onClick={() => navigate(-1)} style={{ background: CC.surface, border: `1px solid ${CC.border}`, borderRadius: 10, width: 32, height: 32, fontSize: 18, color: CC.walnut, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -0.3 }}>
              {getHeading(period, selectedDate)}
            </div>
          </div>
          <button onClick={() => navigate(1)} disabled={isAtToday} style={{ background: CC.surface, border: `1px solid ${CC.border}`, borderRadius: 10, width: 32, height: 32, fontSize: 18, color: isAtToday ? CC.border : CC.walnut, cursor: isAtToday ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>›</button>
        </div>

        {/* Date picker (day period only) */}
        {period === 'day' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: CC.surface, border: `1px solid ${CC.border}`, cursor: 'pointer', fontSize: 12, color: CC.walnut, fontFamily: FONT }}>
              📅 เลือกวัน
              <input type="date" ref={dateInputRef} max={todayISO}
                value={selectedDate.toLocaleDateString('en-CA')}
                onChange={e => { if (e.target.value) setSelectedDate(new Date(e.target.value + 'T12:00:00')) }}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
            </label>
          </div>
        )}
      </div>

      {/* Period tabs */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{
              flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 100,
              fontSize: 12, fontWeight: period === p.id ? 700 : 500, cursor: 'pointer',
              background: period === p.id ? CC.walnut : CC.surface,
              color:      period === p.id ? '#fff'    : CC.ink2,
              border:     period === p.id ? 'none'    : `1px solid ${CC.border}`,
              fontFamily: FONT,
            }}>{p.l}</button>
          ))}
        </div>
      </div>

      {/* Income / Expense summary */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: CC.surface, borderRadius: 18, border: `1px solid ${CC.border}`, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: CC.walnut }}>รับเข้า</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: DISPLAY, color: CC.moss, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>฿{totalIn.toLocaleString('th-TH')}</div>
        </div>
        <div style={{ flex: 1, background: CC.surface, borderRadius: 18, border: `1px solid ${CC.border}`, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: CC.walnut }}>ใช้ออก</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: DISPLAY, color: CC.ember, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>฿{totalOut.toLocaleString('th-TH')}</div>
        </div>
        <div style={{ flex: 1, background: CC.surface, borderRadius: 18, border: `1px solid ${CC.border}`, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: CC.walnut }}>คงเหลือ</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: DISPLAY, marginTop: 4, fontVariantNumeric: 'tabular-nums', color: totalIn - totalOut >= 0 ? CC.moss : CC.ember }}>
            ฿{Math.abs(totalIn - totalOut).toLocaleString('th-TH')}
          </div>
        </div>
      </div>

      {/* Donut */}
      <div style={{ padding: '16px 20px 0' }}>
        {cats.length === 0 ? (
          <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🌰</div>
            <div style={{ fontSize: 14, color: CC.walnut }}>ยังไม่มีรายการในช่วงนี้</div>
          </div>
        ) : (
          <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: 22, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: 12, top: 12, opacity: 0.4 }}><Squirrel size={56} mood="happy" /></div>
            <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600 }}>หลุดจากกรุ</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 16, color: CC.walnut, fontFamily: DISPLAY }}>฿</span>
              <span style={{ fontSize: 32, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums' }}>{totalOut.toLocaleString('th-TH')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18 }}>
              <div style={{ width: 130, height: 130, position: 'relative', flexShrink: 0 }}>
                <svg width="130" height="130" viewBox="0 0 130 130">
                  {segs.map((s, i) => {
                    const r = 52, cx = 65, cy = 65
                    const a1 = (s.s / 100) * Math.PI * 2 - Math.PI / 2
                    const a2 = (s.e / 100) * Math.PI * 2 - Math.PI / 2
                    return (
                      <path key={i}
                        d={`M ${cx} ${cy} L ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r} A ${r} ${r} 0 ${s.pct > 50 ? 1 : 0} 1 ${cx + Math.cos(a2) * r} ${cy + Math.sin(a2) * r} Z`}
                        fill={s.color} />
                    )
                  })}
                  <circle cx="65" cy="65" r="36" fill={CC.surface} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Acorn size={20} color={CC.walnut} />
                  <div style={{ fontSize: 10, color: CC.walnut, marginTop: 4 }}>{cats.length} หมวด</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cats.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{c.ic}</span>
                    <div style={{ flex: 1, fontSize: 12 }}>{c.l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c.color, fontFamily: DISPLAY }}>{c.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category bars */}
      {cats.length > 0 && (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>ทุกหมวด</div>
          <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}` }}>
            {cats.map((c, i) => (
              <div key={i} style={{ padding: '14px 18px', borderBottom: i < cats.length - 1 ? `1px solid ${CC.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{c.ic}</span>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: DISPLAY }}>{c.l}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums' }}>฿{c.amt.toLocaleString('th-TH')}</div>
                </div>
                <div style={{ height: 6, background: CC.bg, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${c.pct}%`, height: '100%', background: c.color, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>รายการ</div>
          <div style={{ fontSize: 12, color: CC.walnut }}>{filtered.length} รายการ</div>
        </div>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}` }}>
          {recent.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: CC.walnut, fontSize: 13 }}>ไม่มีรายการ</div>
          ) : recent.map((t, i) => (
            <div key={t._id || t.id} style={{ display: 'flex', alignItems: 'center', padding: '13px 18px', borderBottom: i < recent.length - 1 ? `1px solid ${CC.border}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: t.amt < 0 ? CC.amberSoft : CC.mossSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginRight: 12, flexShrink: 0 }}>{t.ic}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: CC.walnut, marginTop: 1 }}>{t.cat} · {t.time}{t.note ? ` · ${t.note}` : ''}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: t.amt > 0 ? CC.moss : CC.ink, flexShrink: 0 }}>
                {t.amt > 0 ? '+' : '−'}฿{Math.abs(t.amt).toLocaleString('th-TH')}
              </div>
              {!editLocked && (
                <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                  <button onClick={() => openEdit(t)} style={{ width: 30, height: 30, borderRadius: 10, border: `1px solid ${CC.border}`, background: CC.surface, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                  <button onClick={() => setSelectedTxn(t)} style={{ width: 30, height: 30, borderRadius: 10, border: 'none', background: CC.emberSoft, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 40 }} />
    </div>

    {/* Transaction detail / edit sheet */}
    {selectedTxn && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(42,31,18,0.55)', display: 'flex', alignItems: 'flex-end' }}
        onClick={closeSheet}>
        <div style={{ width: '100%', background: CC.bg, borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
            <button onClick={closeSheet}
              style={{ background: CC.surface, border: `1px solid ${CC.border}`, borderRadius: 20, width: 32, height: 32, fontSize: 18, color: CC.walnut, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
              ×
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: selectedTxn.amt > 0 ? CC.mossSoft : CC.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{selectedTxn.ic}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY }}>{selectedTxn.label}</div>
              <div style={{ fontSize: 12, color: CC.walnut, marginTop: 2 }}>{selectedTxn.cat} · {selectedTxn.time}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: selectedTxn.amt > 0 ? CC.moss : CC.ember }}>
              {selectedTxn.amt > 0 ? '+' : '−'}฿{Math.abs(selectedTxn.amt).toLocaleString('th-TH')}
            </div>
          </div>

          {!editMode ? (
            <>
              {selectedTxn.note && (
                <div style={{ background: CC.surface, borderRadius: 14, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: CC.ink }}>
                  📝 {selectedTxn.note}
                </div>
              )}
              <button
                onClick={async () => {
                  if (deleting) return
                  setDeleting(true)
                  await (account === 'family' ? onDeleteFamilyTxn?.(selectedTxn) : onDeleteTxn?.(selectedTxn))
                  setDeleting(false)
                  closeSheet()
                }}
                disabled={deleting}
                style={{ width: '100%', padding: '13px', borderRadius: 16, border: 'none', background: CC.emberSoft, color: CC.ember, fontSize: 14, fontWeight: 700, cursor: deleting ? 'default' : 'pointer', fontFamily: FONT }}>
                {deleting ? '⏳ กำลังลบ...' : '🗑️ ลบรายการนี้'}
              </button>
            </>
          ) : (
            <>
              {selectedTxn.amt < 0 && selectedTxn.cat !== 'รับเข้า' && (
                <>
                  <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>หมวดหมู่</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5, marginBottom: 12 }}>
                    {CATS.map(c => {
                      const on = c.id === editCat
                      return (
                        <button key={c.id} onClick={() => setEditCat(c.id)} style={{
                          aspectRatio: '1', borderRadius: 10, cursor: 'pointer', padding: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                          background: on ? CC.amber : CC.surface,
                          color: on ? '#fff' : CC.ink,
                          border: on ? 'none' : `1px solid ${CC.border}`,
                          fontFamily: FONT,
                        }}>
                          <span style={{ fontSize: 15 }}>{c.ic}</span>
                          <span style={{ fontSize: 8, fontWeight: 500 }}>{c.l}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
              <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>ชื่อรายการ</div>
              <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} autoFocus
                style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${CC.border}`, background: CC.surface, fontSize: 14, fontFamily: FONT, color: CC.ink, boxSizing: 'border-box', outline: 'none', marginBottom: 12 }} />
              <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>จำนวนเงิน (บาท)</div>
              <input type="number" value={editAmt} onChange={e => setEditAmt(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${CC.border}`, background: CC.surface, fontSize: 14, fontFamily: FONT, color: CC.ink, boxSizing: 'border-box', outline: 'none', marginBottom: 12, fontVariantNumeric: 'tabular-nums' }} />
              <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>หมายเหตุ</div>
              <input type="text" value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="(ไม่มี)"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${CC.border}`, background: CC.surface, fontSize: 14, fontFamily: FONT, color: CC.ink, boxSizing: 'border-box', outline: 'none', marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditMode(false)}
                  style={{ flex: 1, padding: '13px', borderRadius: 16, border: `1px solid ${CC.border}`, background: CC.surface, color: CC.walnut, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                  ยกเลิก
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 1, padding: '13px', borderRadius: 16, border: 'none', background: CC.walnut, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: FONT }}>
                  {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  )
}
