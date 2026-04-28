import { useState } from 'react'
import { CC, DISPLAY, FONT } from '../tokens'
import { Squirrel } from '../components/Squirrel'
import { Acorn }    from '../components/Acorn'

const COLORS = { 'อาหาร': CC.amber, 'เดินทาง': CC.moss, 'ช้อป': CC.walnut, 'บ้าน': '#A89968', 'อื่นๆ': CC.ember, 'กาแฟ': CC.ember }
const ICONS  = { 'อาหาร': '🍜',     'เดินทาง': '🚇',    'ช้อป': '🛍️',      'บ้าน': '🏠',      'อื่นๆ': '✨',     'กาแฟ': '☕' }

const PERIODS = [
  { id: 'week',    l: 'สัปดาห์' },
  { id: 'month',   l: 'เดือน' },
  { id: '6months', l: '6 เดือน' },
  { id: 'year',    l: 'ปี' },
]

function periodStart(id) {
  const d = new Date()
  if (id === 'week')    { d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0) }
  if (id === 'month')   { d.setDate(1); d.setHours(0, 0, 0, 0) }
  if (id === '6months') { d.setMonth(d.getMonth() - 5); d.setDate(1); d.setHours(0, 0, 0, 0) }
  if (id === 'year')    { d.setMonth(0); d.setDate(1); d.setHours(0, 0, 0, 0) }
  return d
}

function periodHeading(id) {
  const now = new Date()
  if (id === 'week')    return '7 วันที่ผ่านมา'
  if (id === '6months') return '6 เดือนที่ผ่านมา'
  if (id === 'year')    return `ปี ${now.getFullYear() + 543}`
  return now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
}

const FA = '#C8920A'

export function ReportsScreen({ txns, familyTxns = [] }) {
  const [period,  setPeriod]  = useState('month')
  const [account, setAccount] = useState('personal') // 'personal' | 'family'

  const source = account === 'family' ? familyTxns : txns

  const txnDate = (t) => new Date(t.id || Date.now())
  const cutoff  = periodStart(period)
  const now     = new Date()

  const filtered  = source.filter(t => { const d = txnDate(t); return d >= cutoff && d <= now })
  const expenses  = filtered.filter(t => t.amt < 0)
  const totalOut  = expenses.reduce((s, t) => s + Math.abs(t.amt), 0)
  const totalIn   = filtered.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0)

  const byCat = {}
  expenses.forEach(t => { byCat[t.cat] = (byCat[t.cat] || 0) + Math.abs(t.amt) })
  const cats = Object.entries(byCat)
    .map(([l, amt]) => ({ l, amt, pct: Math.round((amt / totalOut) * 100), color: COLORS[l] || CC.ink2, ic: ICONS[l] || '✨' }))
    .sort((a, b) => b.amt - a.amt)

  let acc = 0
  const segs = cats.map(c => { const s = acc; acc += c.pct; return { ...c, s, e: acc } })

  const recent = [...filtered].reverse().slice(0, 30)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingBottom: 110 }}>
      <div style={{ height: 'calc(16px + var(--sat))' }} />

      <div style={{ padding: '12px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: CC.walnut, fontStyle: 'italic' }}>นี่คือสิ่งที่คุณใช้ไป</div>
            <div style={{ fontSize: 30, fontWeight: 700, fontFamily: DISPLAY, marginTop: 2, letterSpacing: -0.4 }}>
              {periodHeading(period)}
            </div>
          </div>
          {/* Account switcher */}
          <div style={{ display: 'flex', background: CC.surface, border: `1px solid ${CC.border}`, borderRadius: 100, padding: 3, gap: 2, flexShrink: 0, marginTop: 4 }}>
            {[
              { id: 'personal', label: 'ส่วนตัว' },
              { id: 'family',   label: '🏡 กองกลาง' },
            ].map(a => (
              <button key={a.id} onClick={() => setAccount(a.id)}
                style={{
                  padding: '5px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, border: 'none',
                  background: account === a.id ? (a.id === 'family' ? FA : CC.walnut) : 'transparent',
                  color:      account === a.id ? '#fff' : CC.ink2,
                  transition: 'all 0.2s',
                }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Period tabs */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 100,
                fontSize: 12, fontWeight: period === p.id ? 700 : 500, cursor: 'pointer',
                background: period === p.id ? CC.walnut : CC.surface,
                color:      period === p.id ? '#fff'    : CC.ink2,
                border:     period === p.id ? 'none'    : `1px solid ${CC.border}`,
                fontFamily: FONT,
              }}
            >{p.l}</button>
          ))}
        </div>
      </div>

      {/* Income / Expense summary */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: CC.surface, borderRadius: 18, border: `1px solid ${CC.border}`, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: CC.walnut }}>รับเข้า</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: DISPLAY, color: CC.moss, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            ฿{totalIn.toLocaleString('th-TH')}
          </div>
        </div>
        <div style={{ flex: 1, background: CC.surface, borderRadius: 18, border: `1px solid ${CC.border}`, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: CC.walnut }}>ใช้ออก</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: DISPLAY, color: CC.ember, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            ฿{totalOut.toLocaleString('th-TH')}
          </div>
        </div>
        <div style={{ flex: 1, background: CC.surface, borderRadius: 18, border: `1px solid ${CC.border}`, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: CC.walnut }}>คงเหลือ</div>
          <div style={{
            fontSize: 18, fontWeight: 700, fontFamily: DISPLAY, marginTop: 4, fontVariantNumeric: 'tabular-nums',
            color: totalIn - totalOut >= 0 ? CC.moss : CC.ember,
          }}>
            ฿{Math.abs(totalIn - totalOut).toLocaleString('th-TH')}
          </div>
        </div>
      </div>

      {/* Donut + legend */}
      <div style={{ padding: '16px 20px 0' }}>
        {cats.length === 0 ? (
          <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🌰</div>
            <div style={{ fontSize: 14, color: CC.walnut }}>ยังไม่มีรายการในช่วงนี้</div>
          </div>
        ) : (
          <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: 22, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: 12, top: 12, opacity: 0.4 }}>
              <Squirrel size={56} mood="happy" />
            </div>
            <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600 }}>หลุดจากกรุ</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 16, color: CC.walnut, fontFamily: DISPLAY }}>฿</span>
              <span style={{ fontSize: 32, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums' }}>
                {totalOut.toLocaleString('th-TH')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18 }}>
              <div style={{ width: 130, height: 130, position: 'relative', flexShrink: 0 }}>
                <svg width="130" height="130" viewBox="0 0 130 130">
                  {segs.map((s, i) => {
                    const r = 52, cx = 65, cy = 65
                    const a1 = (s.s / 100) * Math.PI * 2 - Math.PI / 2
                    const a2 = (s.e / 100) * Math.PI * 2 - Math.PI / 2
                    const large = s.pct > 50 ? 1 : 0
                    return (
                      <path key={i}
                        d={`M ${cx} ${cy} L ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r} A ${r} ${r} 0 ${large} 1 ${cx + Math.cos(a2) * r} ${cy + Math.sin(a2) * r} Z`}
                        fill={s.color}
                      />
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

      {/* Category breakdown bars */}
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
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums' }}>
                    ฿{c.amt.toLocaleString('th-TH')}
                  </div>
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
          <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>รายการย้อนหลัง</div>
          <div style={{ fontSize: 12, color: CC.walnut }}>{filtered.length} รายการ</div>
        </div>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}` }}>
          {recent.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: CC.walnut, fontSize: 13 }}>ไม่มีรายการ</div>
          ) : recent.map((t, i) => (
            <div key={t._id || t.id} style={{
              display: 'flex', alignItems: 'center', padding: '13px 18px',
              borderBottom: i < recent.length - 1 ? `1px solid ${CC.border}` : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 18,
                background: t.amt < 0 ? CC.amberSoft : CC.mossSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, marginRight: 12, flexShrink: 0,
              }}>{t.ic}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: CC.walnut, marginTop: 1 }}>
                  {t.cat} · {t.time}
                  {t.note ? ` · ${t.note}` : ''}
                </div>
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums',
                color: t.amt > 0 ? CC.moss : CC.ink, flexShrink: 0,
              }}>
                {t.amt > 0 ? '+' : '−'}฿{Math.abs(t.amt).toLocaleString('th-TH')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 40 }} />
    </div>
  )
}
