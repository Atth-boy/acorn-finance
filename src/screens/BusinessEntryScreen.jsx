import { useState, useRef } from 'react'
import { CC, CCB, DISPLAY, FONT } from '../tokens'
import { BIZ_INCOME_CATS, BIZ_EXPENSE_BASE, BIZ_EXPENSE_EXTRA, BIZ_EXPENSE_CATS } from '../lib/businessCats'

// Local readable aliases for the slate/brass palette
const BZ       = CCB.slate
const BZ_DEEP  = CCB.slateDeep
const BZ_SOFT  = CCB.slateSoft
const BZ_BRASS = CCB.brass
const BZ_GOLD  = CCB.gold

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
  const [note,         setNote]         = useState('')
  const [receipt,      setReceipt]      = useState(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [showMoreCats, setShowMoreCats] = useState(false)

  const fileRef = useRef(null)

  const press = (k) => {
    if (k === '⌫') { setAmount(a => a.length <= 1 ? '0' : a.slice(0, -1)); return }
    if (k === '.') { if (!amount.includes('.')) setAmount(a => a + '.'); return }
    setAmount(a => a === '0' ? k : (a + k).slice(0, 9))
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
      const c = type === 'expense'
        ? BIZ_EXPENSE_CATS.find(x => x.id === expCat)
        : BIZ_INCOME_CATS.find(x => x.id === incCat)
      const now = new Date()
      await addBusinessTxn({
        id:            now.getTime(),
        label:         note.trim() || c.l,
        cat:           c.l,
        ic:            c.ic,
        amt:           type === 'expense' ? -n : n,
        time:          now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        mode:          'daily',
        note:          note.trim() || null,
        receiptImg:    receipt?.url || null,
        createdByName: user?.displayName || user?.email?.replace('@acorn.app', '') || 'ไม่ทราบ',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = parseFloat(amount) === 0 || submitting

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
              {BIZ_EXPENSE_BASE.map(c => {
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
            <Briefcase size={18} color={BZ_GOLD} accent="#fff" />
            {submitting ? 'กำลังบันทึก...' : 'บันทึกคลังธุรกิจ'}
          </button>
        </div>
      </div>
    </div>
  )
}
