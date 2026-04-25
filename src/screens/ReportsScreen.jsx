import { CC, DISPLAY } from '../tokens'
import { Squirrel } from '../components/Squirrel'
import { Acorn }    from '../components/Acorn'

const BASELINE = { 'อาหาร': 4280, 'เดินทาง': 2150, 'ช้อปปิ้ง': 3290, 'บ้าน': 1820, 'อื่นๆ': 1044 }
const COLORS   = { 'อาหาร': CC.amber, 'เดินทาง': CC.moss, 'ช้อปปิ้ง': CC.walnut, 'บ้าน': '#A89968', 'อื่นๆ': CC.ember, 'กาแฟ': CC.ember }
const ICONS    = { 'อาหาร': '🍜',     'เดินทาง': '🚇',    'ช้อปปิ้ง': '🛍️',      'บ้าน': '🏠',      'อื่นๆ': '✨',     'กาแฟ': '☕' }

const PERIODS = ['สัปดาห์', 'เดือน', '6 เดือน', 'ปี']

export function ReportsScreen({ txns }) {
  const byCat = {}
  txns.filter(t => t.amt < 0).forEach(t => {
    byCat[t.cat] = (byCat[t.cat] || 0) + Math.abs(t.amt)
  })
  const merged = { ...BASELINE }
  Object.entries(byCat).forEach(([k, v]) => { merged[k] = (merged[k] || 0) + v })

  const total = Object.values(merged).reduce((s, v) => s + v, 0)
  const cats  = Object.entries(merged).map(([l, amt]) => ({
    l, amt,
    pct:   Math.round((amt / total) * 100),
    color: COLORS[l] || CC.ink2,
    ic:    ICONS[l]  || '✨',
  }))

  let acc = 0
  const segs = cats.map(c => { const s = acc; acc += c.pct; return { ...c, s, e: acc } })

  const month = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingBottom: 110 }}>
      <div style={{ height: 'calc(16px + var(--sat))' }} />

      <div style={{ padding: '12px 24px 0' }}>
        <div style={{ fontSize: 13, color: CC.walnut, fontStyle: 'italic' }}>นี่คือสิ่งที่คุณใช้ไป</div>
        <div style={{ fontSize: 30, fontWeight: 700, fontFamily: DISPLAY, marginTop: 2, letterSpacing: -0.4 }}>{month}</div>
      </div>

      {/* Period tabs */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map((p, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 100,
              fontSize: 12, fontWeight: i === 1 ? 700 : 500, cursor: 'pointer',
              background: i === 1 ? CC.walnut  : CC.surface,
              color:      i === 1 ? '#fff'     : CC.ink2,
              border:     i === 1 ? 'none'     : `1px solid ${CC.border}`,
            }}>{p}</div>
          ))}
        </div>
      </div>

      {/* Donut card */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: 22, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 12, top: 12, opacity: 0.5 }}>
            <Squirrel size={56} mood="happy" />
          </div>
          <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600 }}>หลุดจากกรุ</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 16, color: CC.walnut, fontFamily: DISPLAY }}>฿</span>
            <span style={{ fontSize: 32, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums' }}>
              {total.toLocaleString('th-TH')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18 }}>
            <div style={{ width: 140, height: 140, position: 'relative', flexShrink: 0 }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                {segs.map((s, i) => {
                  const r = 56, cx = 70, cy = 70
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
                <circle cx="70" cy="70" r="38" fill={CC.surface} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Acorn size={20} color={CC.walnut} />
                <div style={{ fontSize: 10, color: CC.walnut, marginTop: 4 }}>{cats.length} หมวด</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cats.slice(0, 4).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{c.ic}</span>
                  <div style={{ flex: 1, fontSize: 12 }}>{c.l}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.color, fontFamily: DISPLAY }}>{c.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category list */}
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

      <div style={{ height: 40 }} />
    </div>
  )
}
