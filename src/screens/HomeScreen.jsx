import { CC, DISPLAY, PAPER } from '../tokens'
import { Squirrel } from '../components/Squirrel'
import { Acorn }    from '../components/Acorn'
import { Leaf }     from '../components/Leaf'

const DAY_BARS = [
  { h: 35, d: 'จ' }, { h: 60, d: 'อ' }, { h: 28, d: 'พ' },
  { h: 75, d: 'พฤ' }, { h: 50, d: 'ศ' }, { h: 92, d: 'ส' },
]

export function HomeScreen({ txns, user }) {
  const firstName = user?.displayName?.split(' ')[0] || 'คุณ'
  const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })

  const totalIn  = txns.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0)
  const totalOut = txns.filter(t => t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0)
  const balance  = totalIn - totalOut + 12000
  const recent   = [...txns].reverse().slice(0, 4)

  const todayBar = Math.min(95, 22 + txns.filter(t => t.amt < 0).length * 8)
  const bars = [...DAY_BARS, { h: todayBar, d: 'อา' }]

  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'auto', paddingBottom: 110,
    }}>
      <div style={{ height: 'calc(16px + var(--sat))' }} />

      {/* Header */}
      <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: CC.walnut, fontStyle: 'italic' }}>วันที่ {today}</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: DISPLAY, marginTop: 2, letterSpacing: -0.3 }}>
            สวัสดี, {firstName}
          </div>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          background: `linear-gradient(135deg, ${CC.walnutSoft}, ${CC.amberSoft})`,
          borderRadius: 28, padding: 20, position: 'relative', overflow: 'hidden',
          border: `1px solid ${CC.border}`,
        }}>
          <svg style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.15 }} width="140" height="100" viewBox="0 0 140 100">
            <path d="M20 100 L 30 60 L 40 100 Z M 40 100 L 50 50 L 60 100 Z M 70 100 L 82 40 L 94 100 Z M 100 100 L 110 70 L 120 100 Z" fill={CC.moss} />
          </svg>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
            <div style={{ flexShrink: 0 }}>
              <Squirrel size={100} mood="happy" />
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ fontSize: 11, color: CC.walnut, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>
                ลูกโอ๊กในกรุ
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                <span style={{ fontSize: 14, color: CC.walnut }}>฿</span>
                <span style={{ fontSize: 32, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -1, fontVariantNumeric: 'tabular-nums', color: CC.ink }}>
                  {balance.toLocaleString('th-TH')}
                </span>
              </div>
              <div style={{ fontSize: 12, color: CC.walnut, marginTop: 4, fontStyle: 'italic' }}>
                "เก็บเพิ่มอีก ฿{Math.max(0, 40000 - balance).toLocaleString('th-TH')} ตามแผนนะ 🌰"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: '16px 20px 0', display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, background: CC.surface, borderRadius: 18, border: `1px solid ${CC.border}`, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Leaf size={14} color={CC.moss} />
            <div style={{ fontSize: 11, color: CC.walnut, letterSpacing: 0.5 }}>เก็บเข้า</div>
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: DISPLAY, color: CC.moss, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            ฿{totalIn.toLocaleString('th-TH')}
          </div>
        </div>
        <div style={{ flex: 1, background: CC.surface, borderRadius: 18, border: `1px solid ${CC.border}`, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>🍂</span>
            <div style={{ fontSize: 11, color: CC.walnut, letterSpacing: 0.5 }}>หลุดมือ</div>
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: DISPLAY, color: CC.ember, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            ฿{totalOut.toLocaleString('th-TH')}
          </div>
        </div>
      </div>

      {/* Mini chart */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: DISPLAY }}>สัปดาห์ที่ผ่านมา</div>
            <div style={{ fontSize: 11, color: CC.walnut }}>
              เฉลี่ย ฿{Math.round(totalOut / 7).toLocaleString('th-TH')}/วัน
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', height: 60, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', height: `${b.h}%`,
                    background: i === bars.length - 1 ? CC.amber : CC.walnutSoft,
                    borderRadius: '6px 6px 2px 2px',
                    transition: 'height 0.5s',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: CC.walnut }}>{b.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY }}>วันนี้</div>
          <div style={{ fontSize: 12, color: CC.walnut }}>{txns.length} รายการ</div>
        </div>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}` }}>
          {recent.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: CC.walnut, fontSize: 13 }}>
              ยังไม่มีรายการ — กด 🌰 เพื่อเริ่ม
            </div>
          ) : recent.map((t, i) => (
            <div key={t._id || t.id} style={{
              display: 'flex', alignItems: 'center', padding: '14px 18px',
              borderBottom: i < recent.length - 1 ? `1px solid ${CC.border}` : 'none',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 19,
                background: CC.amberSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, marginRight: 12, flexShrink: 0,
              }}>
                {t.ic}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: CC.walnut, marginTop: 2 }}>{t.cat} · {t.time}</div>
              </div>
              <div style={{
                fontSize: 15, fontWeight: 700, fontFamily: DISPLAY,
                fontVariantNumeric: 'tabular-nums',
                color: t.amt > 0 ? CC.moss : CC.ink,
                flexShrink: 0,
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
