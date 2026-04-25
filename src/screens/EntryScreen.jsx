import { useState } from 'react'
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
const TAGS = [
  { id: 'daily', l: 'รายวัน',       c: CC.mossSoft,   fg: CC.moss   },
  { id: 'house', l: 'บ้านใหม่ 5.5M', c: CC.walnutSoft, fg: CC.walnut },
  { id: 'osaka', l: 'ทริปโอซาก้า',   c: CC.amberSoft,  fg: CC.amber  },
]

export function EntryScreen({ addTxn, close }) {
  const [type,   setType]   = useState('expense')
  const [amount, setAmount] = useState('0')
  const [cat,    setCat]    = useState('food')
  const [tag,    setTag]    = useState('daily')

  const press = (k) => {
    if (k === '⌫') { setAmount(a => a.length <= 1 ? '0' : a.slice(0, -1)); return }
    if (k === '.') { if (!amount.includes('.')) setAmount(a => a + '.'); return }
    setAmount(a => a === '0' ? k : (a + k).slice(0, 9))
  }

  const submit = () => {
    const n = parseFloat(amount) || 0
    if (n === 0) return
    const c = CATS.find(x => x.id === cat)
    const t = TAGS.find(x => x.id === tag)
    const now = new Date()
    addTxn({
      id:    now.getTime(),
      label: c.l,
      cat:   c.l,
      ic:    c.ic,
      amt:   type === 'expense' ? -n : n,
      time:  now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      tag:   t.l,
    })
  }

  const disabled = parseFloat(amount) === 0

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: CC.bg, overflow: 'auto',
    }}>
      <div style={{ height: 'calc(16px + var(--sat))' }} />

      {/* Header */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={close} style={{ background: 'transparent', border: 'none', fontSize: 26, color: CC.walnut, cursor: 'pointer', padding: 4 }}>×</button>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY }}>เก็บลูกโอ๊ก</div>
        <div style={{ width: 34 }} />
      </div>

      {/* Type pills */}
      <div style={{ padding: '6px 20px 10px', display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={() => setType('expense')}
          style={{
            padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
            background: type === 'expense' ? CC.ember : CC.surface,
            color:      type === 'expense' ? '#fff'   : CC.ink2,
            border:     type === 'expense' ? 'none'   : `1px solid ${CC.border}`,
          }}
        >🍂 จ่ายออก</button>
        <button
          onClick={() => setType('income')}
          style={{
            padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
            background: type === 'income' ? CC.moss   : CC.surface,
            color:      type === 'income' ? '#fff'    : CC.ink2,
            border:     type === 'income' ? 'none'    : `1px solid ${CC.border}`,
          }}
        >🌰 รับเข้า</button>
      </div>

      {/* Amount */}
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
        <div style={{
          marginTop: 4, fontSize: 11, color: CC.walnut,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 10px', background: CC.walnutSoft, borderRadius: 100,
        }}>
          🏦 กสิกรไทย ··3421
        </div>
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
                  background: on ? CC.amber   : CC.surface,
                  color:      on ? '#fff'     : CC.ink,
                  border:     on ? 'none'     : `1px solid ${CC.border}`,
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

      {/* Tags */}
      <div style={{ padding: '0 18px 10px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {TAGS.map(t => {
          const on = t.id === tag
          return (
            <button
              key={t.id} onClick={() => setTag(t.id)}
              style={{
                flexShrink: 0, padding: '8px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                background: on ? t.c       : CC.surface,
                color:      on ? t.fg      : CC.ink2,
                border:     on ? 'none'    : `1px solid ${CC.border}`,
              }}
            >🍃 {t.l}</button>
          )
        })}
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
            background:  disabled ? CC.ink3   : CC.walnut,
            color:       '#fff',
            boxShadow:   disabled ? 'none'    : '0 6px 18px rgba(122,79,42,0.35)',
            transition:  'all 0.2s',
          }}
        >
          <Acorn size={20} color={CC.amberSoft} /> เก็บลงกรุ
        </button>
      </div>

      <div style={{ height: 30 }} />
    </div>
  )
}
