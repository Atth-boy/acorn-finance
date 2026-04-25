import { CC, DISPLAY } from '../tokens'
import { Squirrel } from '../components/Squirrel'
import { Acorn }    from '../components/Acorn'

const WALLETS = [
  { name: 'กสิกรไทย', sub: 'บัญชีออมทรัพย์',  amt: 184320, ic: '🏦', tint: CC.mossSoft,   tone: CC.moss   },
  { name: 'SCB Easy', sub: 'กระแสรายวัน',      amt: 22150,  ic: '🏦', tint: CC.amberSoft,  tone: CC.amber  },
  { name: 'เงินสด',   sub: 'กระเป๋าใบโปรด',    amt: 1850,   ic: '👛', tint: CC.walnutSoft, tone: CC.walnut },
  { name: 'KTC Visa', sub: 'หนี้บัตรเครดิต',   amt: -8420,  ic: '💳', tint: CC.emberSoft,  tone: CC.ember  },
]
const INVEST = [
  { h: 70, l: 'SET100', v: '124k' },
  { h: 95, l: 'PVD',    v: '286k' },
  { h: 50, l: 'ทอง',    v: '45k'  },
  { h: 30, l: 'เงินฝาก', v: '0.9k' },
]

export function WalletsScreen() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingBottom: 110 }}>
      <div style={{ height: 'calc(16px + var(--sat))' }} />

      <div style={{ padding: '12px 24px 0' }}>
        <div style={{ fontSize: 13, color: CC.walnut, fontStyle: 'italic' }}>กรุของคุณ</div>
        <div style={{ fontSize: 30, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -0.4, marginTop: 2 }}>บัญชี & สินทรัพย์</div>
      </div>

      {/* Net worth card */}
      <div style={{ padding: '18px 20px 8px' }}>
        <div style={{
          background: `linear-gradient(160deg, ${CC.walnut}, #4F3320)`,
          color: '#fff', borderRadius: 28, padding: '24px 22px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: 8, top: 8 }}>
            <Squirrel size={88} mood="open" />
          </div>
          <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1, textTransform: 'uppercase' }}>มูลค่าสุทธิ</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
            <span style={{ fontSize: 16, opacity: 0.7, fontFamily: DISPLAY }}>฿</span>
            <span style={{ fontSize: 38, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>656,300</span>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 14 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ width: 16, height: 16, opacity: i < 7 ? 1 : 0.25 }}>
                <Acorn size={16} color={CC.amber} />
              </div>
            ))}
            <div style={{ fontSize: 11, opacity: 0.85, marginLeft: 8 }}>เป้า 750k · 87%</div>
          </div>
        </div>
      </div>

      {/* Wallet list */}
      <div style={{ padding: '20px 20px 8px' }}>
        <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>กระเป๋า</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {WALLETS.map((w, i) => (
            <div key={i} style={{
              background: CC.surface, borderRadius: 20, border: `1px solid ${CC.border}`,
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: w.tint, color: w.tone,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>{w.ic}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY }}>{w.name}</div>
                <div style={{ fontSize: 12, color: CC.walnut, marginTop: 2 }}>{w.sub}</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: w.amt < 0 ? CC.ember : CC.ink }}>
                {w.amt < 0 ? '−' : ''}฿{Math.abs(w.amt).toLocaleString('th-TH')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Investment forest */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>ป่าลงทุน 🌳</div>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: CC.walnut }}>มูลค่าพอร์ต</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums' }}>฿456,400</div>
            </div>
            <div style={{ fontSize: 13, color: CC.moss, fontWeight: 600, padding: '4px 10px', background: CC.mossSoft, borderRadius: 8 }}>+1.6%</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 70, padding: '8px 4px 0', borderTop: `1px dashed ${CC.border}` }}>
            {INVEST.map((t, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 10, color: CC.walnut, fontWeight: 600 }}>{t.v}</div>
                <svg width="32" height={t.h} viewBox={`0 0 32 ${t.h}`} style={{ marginTop: 4 }}>
                  <rect x="14" y={t.h - 12} width="4" height="12" fill={CC.walnut} />
                  <ellipse cx="16" cy={t.h - 18} rx="14" ry={Math.max(10, t.h - 24)} fill={CC.moss} />
                  <ellipse cx="16" cy={t.h - 18} rx="10" ry={Math.max(7,  t.h - 30)} fill="#7A8B53" />
                </svg>
                <div style={{ fontSize: 10, color: CC.walnut, marginTop: 2 }}>{t.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 40 }} />
    </div>
  )
}
