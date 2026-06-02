// ───────────────────────────────────────────────────────────────
// AnimatedSquirrel — กระรอกขยับได้ (ยึดทรงต้นฉบับจากแอปแรก)
//
// ใช้งาน:  <AnimatedSquirrel mode="greet"  size={180} />   ← ทักทาย
//          <AnimatedSquirrel mode="update" size={180} />   ← แจ้งอัพเดท
//
// props: mode "greet"|"update" · size px · play bool · loop bool · style obj
//
// หลักการ: ใช้พิกัด viewBox เดียวกับต้นฉบับ (0..120) วางในกรอบ 172×158
// ทุกจุดหมุนอ้างพิกัด viewBox ตรง ๆ (transform-box: view-box) จึงไม่หลุดออกจากตัว
// ───────────────────────────────────────────────────────────────
import { useId, useEffect } from 'react'

const SQ = {
  fur: '#8B5A3C', furLight: '#A47148', belly: '#F0DCB8', cheek: '#E8A87C',
  acorn: '#C8924A', acornCap: '#5a3d20', ink: '#2a1a0a', highlight: '#E8B86A',
  walnut: '#7A4F2A', amber: '#C8924A', cream: '#FBF6E9', border: '#E5D5B8',
  moss: '#5A6B3B', ember: '#A8482E',
}

const SQ_KEYFRAMES = `
/* ใช้ view-box: จุดหมุนอ้างพิกัด viewBox ตรง ๆ — ปลอดภัย ไม่ดีดออกจากตัว */
.sq-root svg [style*="transform-origin"] { transform-box: view-box; }
.sq-paused .sq-anim, .sq-paused .sq-anim * { animation-play-state: paused !important; }

@keyframes sq-breathe { 0%,100%{ transform: scaleY(1) } 50%{ transform: scaleY(1.035) } }
@keyframes sq-tail    { 0%,100%{ transform: rotate(-4deg) } 50%{ transform: rotate(6deg) } }
@keyframes sq-blink   { 0%,90%,100%{ transform: scaleY(1) } 95%{ transform: scaleY(0.12) } }
@keyframes sq-bob      { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-4px) } }
@keyframes sq-wave     { 0%,100%{ transform: rotate(4deg) } 30%{ transform: rotate(-22deg) } 65%{ transform: rotate(-8deg) } }
@keyframes sq-headtilt { 0%,100%{ transform: rotate(0deg) } 50%{ transform: rotate(-3.5deg) } }

@keyframes sq-hop      { 0%{ transform: translateY(0) } 18%{ transform: translateY(-12px) } 38%{ transform: translateY(0) } 52%{ transform: translateY(-6px) } 68%{ transform: translateY(0) } 100%{ transform: translateY(0) } }
@keyframes sq-squash   { 0%,38%,68%,100%{ transform: scaleY(1) } 12%{ transform: scaleY(1.06) } 30%{ transform: scaleY(0.95) } }
@keyframes sq-bell     { 0%,100%{ transform: rotate(0deg) } 18%{ transform: rotate(20deg) } 44%{ transform: rotate(-18deg) } 68%{ transform: rotate(11deg) } 86%{ transform: rotate(-6deg) } }
@keyframes sq-ring     { 0%{ transform: scale(0.5); opacity: 0.85 } 100%{ transform: scale(2); opacity: 0 } }
@keyframes sq-sparkle  { 0%,100%{ transform: scale(0.2); opacity: 0 } 50%{ transform: scale(1); opacity: 1 } }
`

function useSquirrelKeyframes() {
  useEffect(() => {
    if (document.getElementById('sq-anim-styles')) return
    const el = document.createElement('style')
    el.id = 'sq-anim-styles'
    el.textContent = SQ_KEYFRAMES
    document.head.appendChild(el)
  }, [])
}

export function AnimatedSquirrel({ mode = 'greet', size = 160, play = true, loop = true, style }) {
  useSquirrelKeyframes()
  const gid = 'furG-' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const fur = `url(#${gid})`
  const greet = mode === 'greet'
  const it = loop ? 'infinite' : '1'
  const ff = loop ? 'none' : 'forwards'
  const a = (name, dur, extra = '') => play ? `${name} ${dur} ${extra} ${it} ${ff}` : 'none'

  return (
    <div className={`sq-root${play ? '' : ' sq-paused'}`} style={{ width: size, height: size * 0.92, display: 'inline-block', ...style }}>
      <svg width={size} height={size * 0.92} viewBox="0 0 172 158" fill="none" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id={gid} cx="0.4" cy="0.3"><stop offset="0" stopColor={SQ.furLight}/><stop offset="1" stopColor={SQ.fur}/></radialGradient>
        </defs>

        {/* เงาใต้ตัว */}
        <ellipse cx="80" cy="150" rx="34" ry="6" fill={SQ.ink} opacity="0.08"/>

        {/* ── ตัวกระรอก (วาง origin local 0..120) ── */}
        <g transform="translate(26,20)">
          {/* bob (ทักทาย) / hop (อัพเดท) — เลื่อนทั้งตัว */}
          <g className="sq-anim" style={{ animation: greet ? a('sq-bob', '2.6s', 'ease-in-out') : a('sq-hop', '1.8s', 'ease-in-out') }}>
            {/* squash & stretch เฉพาะอัพเดท */}
            <g className="sq-anim" style={{ transformOrigin: '55px 106px', animation: greet ? 'none' : a('sq-squash', '1.8s', 'ease-in-out') }}>

              {/* หาง — แกว่งรอบโคน (82,60) */}
              <g className="sq-anim" style={{ transformOrigin: '82px 60px', animation: a('sq-tail', '3s', 'ease-in-out') }}>
                <path d="M88 70 C 110 60, 112 30, 92 18 C 80 12, 70 22, 74 36 C 78 48, 84 50, 80 62" fill={fur} stroke={SQ.fur} strokeWidth="1.5"/>
                <path d="M92 26 C 95 30, 95 37, 91 41" stroke={SQ.belly} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                <path d="M88 38 C 91 42, 91 47, 87 50" stroke={SQ.belly} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
              </g>

              {/* ลำตัว — หายใจ (scaleY รอบก้น 55,106) */}
              <g className="sq-anim" style={{ transformOrigin: '55px 106px', animation: a('sq-breathe', '3s', 'ease-in-out') }}>
                <ellipse cx="55" cy="78" rx="26" ry="28" fill={fur}/>
                <ellipse cx="55" cy="84" rx="15" ry="18" fill={SQ.belly} stroke={SQ.furLight} strokeWidth="1" strokeOpacity="0.35"/>
              </g>

              {/* แขนซ้าย — แนบข้าง (นิ่งทั้งสองโหมด) */}
              <ellipse cx="42" cy="74" rx="6" ry="9" fill={SQ.fur} transform="rotate(-30 42 74)"/>

              {/* แขนขวา — ทักทาย: ยกโบกรอบไหล่ (68,66) / อัพเดท: แนบข้าง */}
              {greet ? (
                <g className="sq-anim" style={{ transformOrigin: '68px 66px', animation: a('sq-wave', '1s', 'ease-in-out') }}>
                  <ellipse cx="77" cy="54" rx="6" ry="11" fill={SQ.fur} transform="rotate(38 77 54)"/>
                  <circle cx="84" cy="46" r="5" fill={SQ.furLight}/>
                </g>
              ) : (
                <ellipse cx="68" cy="74" rx="6" ry="9" fill={SQ.fur} transform="rotate(30 68 74)"/>
              )}

              {/* ลูกโอ๊กที่กอด */}
              <ellipse cx="55" cy="86" rx="9" ry="11" fill={SQ.acorn}/>
              <ellipse cx="55" cy="80" rx="10" ry="6" fill={SQ.acornCap}/>
              <path d="M55 73 L 55 70" stroke={SQ.acornCap} strokeWidth="2" strokeLinecap="round"/>
              <ellipse cx="51" cy="86" rx="2" ry="4" fill={SQ.highlight} opacity="0.6"/>

              {/* หัว+หู+หน้า เป็นกลุ่มเดียว — เอียงพร้อมกันรอบคอ (48,66) */}
              <g className="sq-anim" style={{ transformOrigin: '48px 66px', animation: greet ? a('sq-headtilt', '2.6s', 'ease-in-out') : 'none' }}>
                {/* หู (แนบหัว นิ่ง) */}
                <ellipse cx="34" cy="30" rx="5" ry="7" fill={SQ.fur} transform="rotate(-25 34 30)"/>
                <ellipse cx="33" cy="30" rx="2.5" ry="4" fill={SQ.cheek} transform="rotate(-25 33 30)"/>
                <ellipse cx="60" cy="30" rx="5" ry="7" fill={SQ.fur} transform="rotate(20 60 30)"/>
                <ellipse cx="61" cy="30" rx="2.5" ry="4" fill={SQ.cheek} transform="rotate(20 61 30)"/>
                {/* หัว */}
                <circle cx="48" cy="46" r="22" fill={fur}/>
                {/* แก้ม */}
                <circle cx="36" cy="52" r="6" fill={SQ.cheek} opacity="0.5"/>
                <circle cx="60" cy="52" r="6" fill={SQ.cheek} opacity="0.5"/>
                {/* ตา */}
                {greet ? (
                  <g className="sq-anim" style={{ transformOrigin: '49px 46px', animation: a('sq-blink', '4s', 'ease-in-out') }}>
                    <circle cx="43" cy="46" r="2.6" fill={SQ.ink}/>
                    <circle cx="55" cy="46" r="2.6" fill={SQ.ink}/>
                    <circle cx="44" cy="45" r="0.9" fill="#fff"/>
                    <circle cx="56" cy="45" r="0.9" fill="#fff"/>
                  </g>
                ) : (
                  <g>
                    <path d="M40 47 Q 43 42 46 47" stroke={SQ.ink} strokeWidth="2.4" strokeLinecap="round" fill="none"/>
                    <path d="M52 47 Q 55 42 58 47" stroke={SQ.ink} strokeWidth="2.4" strokeLinecap="round" fill="none"/>
                  </g>
                )}
                {/* จมูก + ปาก */}
                <ellipse cx="49" cy="54" rx="1.8" ry="1.2" fill={SQ.ink}/>
                {greet
                  ? <path d="M47 56 Q 49 58 51 56" stroke={SQ.ink} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                  : <path d="M45 56 Q 49 60 53 56" stroke={SQ.ink} strokeWidth="1.6" strokeLinecap="round" fill="none"/>}
              </g>
            </g>
          </g>
        </g>

        {/* ── องค์ประกอบโหมดอัพเดท (พิกัด root) ── */}
        {!greet && (
          <g>
            {/* คลื่นเสียงจากกระดิ่ง */}
            <g className="sq-anim" style={{ transformOrigin: '30px 40px', animation: a('sq-ring', '1.4s', 'ease-out') }}>
              <circle cx="30" cy="40" r="15" fill="none" stroke={SQ.amber} strokeWidth="2.5"/>
            </g>
            {/* กระดิ่ง ลอยซ้ายของหัว (พ้นตัว) — แกว่งรอบหัวแขวน (30,22) */}
            <g className="sq-anim" style={{ transformOrigin: '30px 22px', animation: a('sq-bell', '1.4s', 'ease-in-out') }}>
              <path d="M30 22 L 30 30" stroke={SQ.walnut} strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M22 50 C 22 38, 25 30, 30 30 C 35 30, 38 38, 38 50 L 40 54 L 20 54 Z" fill={SQ.amber} stroke={SQ.walnut} strokeWidth="2.2" strokeLinejoin="round"/>
              <ellipse cx="30" cy="56" rx="3.5" ry="2.8" fill={SQ.walnut}/>
            </g>
            {/* ประกายดีใจ */}
            <g className="sq-anim" style={{ transformOrigin: '132px 96px', animation: a('sq-sparkle', '1.5s', 'ease-in-out') }}>
              <path d="M132 90 L 134 96 L 140 98 L 134 100 L 132 106 L 130 100 L 124 98 L 130 96 Z" fill={SQ.amber}/>
            </g>
            <g className="sq-anim" style={{ transformOrigin: '120px 132px', animation: a('sq-sparkle', '1.5s', 'ease-in-out 0.55s') }}>
              <path d="M120 128 L 121 132 L 125 133 L 121 134 L 120 138 L 119 134 L 115 133 L 119 132 Z" fill={SQ.moss}/>
            </g>
          </g>
        )}
      </svg>
    </div>
  )
}
