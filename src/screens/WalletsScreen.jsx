import { useState, useRef, useEffect } from 'react'
import { sharedRoomsLib } from '../lib/sharedRooms'
import { CC, DISPLAY, FONT, PAPER } from '../tokens'
import { Squirrel } from '../components/Squirrel'
import { Acorn }    from '../components/Acorn'
import { Leaf }     from '../components/Leaf'

// ─── Static data ──────────────────────────────────────────────────────────
const WALLET_TYPES = ['เงินฝากประจำ', 'PVD', 'กองทุน', 'อื่นๆ']
const MONTH_NAMES  = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function daysUntilDate(isoDate) {
  const due = new Date(isoDate); due.setHours(0,0,0,0)
  const now = new Date();        now.setHours(0,0,0,0)
  return Math.ceil((due - now) / 86400000)
}
const ROOM_TYPES = [
  { id: 'trip',  l: 'ทริป',        ic: '🏕️' },
  { id: 'event', l: 'งาน/กิจกรรม', ic: '🎉' },
]
const FAMILY_MOCK_MEMBERS = [
  { name: 'แม่', bg: '#5A6B3B', amt: 4500, share: 0.36 },
  { name: 'พ่อ', bg: '#7A4F2A', amt: 3800, share: 0.31 },
  { name: 'ฉัน', bg: '#8B5A3C', amt: 1800, share: 0.15, isMe: true },
  { name: 'พี่', bg: '#A47148', amt: 1500, share: 0.12 },
  { name: 'น้อง', bg: '#C8924A', amt: 800,  share: 0.06 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────
function genCode() { return Math.random().toString(36).slice(2, 8).toUpperCase() }
function daysUntil(cutDay) {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), cutDay)
  if (next.getDate() <= now.getDate()) next.setMonth(next.getMonth() + 1)
  return Math.ceil((next - now) / (1000 * 60 * 60 * 24))
}
function roomTone(type) {
  if (type === 'trip')  return { bg: CC.amberSoft, accent: CC.amber }
  if (type === 'event') return { bg: CC.mossSoft,  accent: CC.moss  }
  return { bg: CC.walnutSoft, accent: CC.walnut }
}

// ─── Icons ────────────────────────────────────────────────────────────────
function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────
function Avatar({ name, bg = CC.walnut, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: bg, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, fontFamily: FONT,
      border: '2px solid #fff', flexShrink: 0,
    }}>{(name || '?').charAt(0)}</div>
  )
}

function AvatarStack({ members, size = 26, max = 4 }) {
  const visible = members.slice(0, max)
  const rest = members.length - visible.length
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((m, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: visible.length - i }}>
          <Avatar name={m.name} bg={m.bg} size={size} />
        </div>
      ))}
      {rest > 0 && (
        <div style={{
          marginLeft: -8, width: size, height: size, borderRadius: size / 2,
          background: CC.walnut, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700, border: '2px solid #fff', flexShrink: 0,
        }}>+{rest}</div>
      )}
    </div>
  )
}

function AcornJar({ acorns, w = 110, h = 130 }) {
  const positions = []
  const colW = 13, rowH = 13
  const layout = [[0,1,2,3,4],[0,1,2,3],[0,1,2,3,4],[0,1,2,3],[0,1,2,3,4],[0,1,2,3]]
  let idx = 0
  layout.forEach((row, ri) => {
    const offset = (ri % 2) * 6
    row.forEach(c => {
      if (idx < acorns.length) {
        positions.push({ x: 16 + c * colW + offset, y: h - 22 - ri * rowH, member: acorns[idx] })
        idx++
      }
    })
  })
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="jG" x1="0" x2="1">
          <stop offset="0"   stopColor={CC.amberSoft} stopOpacity="0.7"/>
          <stop offset="0.5" stopColor={CC.surface}   stopOpacity="0.95"/>
          <stop offset="1"   stopColor={CC.border}    stopOpacity="0.6"/>
        </linearGradient>
      </defs>
      <rect x="32" y="10" width="46" height="9"  rx="2" fill={CC.border}  stroke={CC.walnut} strokeWidth="1"/>
      <rect x="28" y="5"  width="54" height="7"  rx="3" fill={CC.amber}   stroke={CC.walnut} strokeWidth="0.8"/>
      <path d={`M 26 20 Q 18 28 18 46 L 18 ${h-16} Q 18 ${h-4} 30 ${h-4} L 80 ${h-4} Q 92 ${h-4} 92 ${h-16} L 92 46 Q 92 28 84 20 Z`}
        fill="url(#jG)" stroke={CC.walnut} strokeWidth="1.4"/>
      <path d={`M 24 26 Q 20 34 20 46 L 20 ${h-20}`} stroke="#fff" strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round"/>
      {positions.map((p, i) => (
        <g key={i} transform={`translate(${p.x},${p.y}) rotate(${(i * 37) % 30 - 15})`}>
          <ellipse cx="0" cy="2"  rx="4.5" ry="5.5" fill={p.member.bg || CC.walnut}/>
          <ellipse cx="0" cy="-3" rx="5.5" ry="2.8" fill={CC.walnut}/>
          <line x1="0" y1="-6" x2="0" y2="-8" stroke={CC.walnut} strokeWidth="1.1" strokeLinecap="round"/>
          <ellipse cx="-1.2" cy="2" rx="1.2" ry="2.2" fill="#fff" opacity="0.22"/>
        </g>
      ))}
      <rect x="25" y="55" width="60" height="16" rx="3" fill={CC.surface} stroke={CC.border} strokeWidth="0.8"/>
      <text x="55" y="66" textAnchor="middle" fontSize="7.5" fill={CC.walnut} fontFamily="serif" fontStyle="italic">Family Pool</text>
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────
export function WalletsScreen({ wallets, fixedExpenses, goal = 750000, onSetGoal, onUpsertWallet, onDeleteWallet, onSaveFixed, onDeleteFixed, familyData, familyTxns = [], onCreateFamily, onJoinFamily, onPageChange, rooms = [], onCreateRoom, onJoinRoom, onAddRoomTxn }) {
  const scrollRef = useRef(null)
  const [page, setPage] = useState(0)

  // My Wallets state
  const [showGoalEdit,  setShowGoalEdit]  = useState(false)
  const [goalInput,     setGoalInput]     = useState('')
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [newWalletType, setNewWalletType] = useState(WALLET_TYPES[0])
  const [newWalletName, setNewWalletName] = useState('')
  const [editWallet,    setEditWallet]    = useState(null)
  const [editWName,     setEditWName]     = useState('')
  const [editWSub,      setEditWSub]      = useState('')
  const [editWAmt,      setEditWAmt]      = useState('')
  const [editFixed,     setEditFixed]     = useState(null)
  const [editFName,     setEditFName]     = useState('')
  const [editFAmt,      setEditFAmt]      = useState('')
  const [editFDay,      setEditFDay]      = useState('')
  const [editFDueDate,  setEditFDueDate]  = useState('')

  // Family Pot state
  const [showFamilySetup, setShowFamilySetup] = useState(false)
  const [showJoinFamily, setShowJoinFamily] = useState(false)
  const [joinFamilyCode, setJoinFamilyCode] = useState('')
  const [joinFamilyErr,  setJoinFamilyErr]  = useState('')
  const [joiningFamily,  setJoiningFamily]  = useState(false)
  const [creatingFamily, setCreatingFamily] = useState(false)
  const [copiedFamily,   setCopiedFamily]   = useState(false)

  // Derive members with avatar colors
  const MEMBER_COLORS = ['#7B4A1A', '#5A6B3B', '#C8924A', '#7A4F2A', '#A47148', '#8B5A3C']
  const familyCode    = familyData?.code ?? ''
  const familyMembers = (familyData?.members ?? []).map((m, i) => ({
    ...m, bg: MEMBER_COLORS[i % MEMBER_COLORS.length],
  }))

  // Shared Rooms state
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showJoinRoom,   setShowJoinRoom]   = useState(false)
  const [roomName,       setRoomName]       = useState('')
  const [roomType,       setRoomType]       = useState('trip')
  const [createdCode,    setCreatedCode]    = useState(null)
  const [joinCode,       setJoinCode]       = useState('')
  const [activeRoom,     setActiveRoom]     = useState(null)
  const [addEntryRoom,      setAddEntryRoom]      = useState(null)
  const [entryLabel,        setEntryLabel]        = useState('')
  const [entryAmt,          setEntryAmt]          = useState('')
  const [entryBy,           setEntryBy]           = useState(null)
  const [customMemberName,  setCustomMemberName]  = useState('')
  const [copied,            setCopied]            = useState(false)
  const [showRoomSummary,   setShowRoomSummary]   = useState(false)
  const [activeRoomTxns,    setActiveRoomTxns]    = useState([])
  const roomTxnUnsubRef = useRef(null)

  useEffect(() => {
    roomTxnUnsubRef.current?.()
    roomTxnUnsubRef.current = null
    setActiveRoomTxns([])
    if (!activeRoom) return
    roomTxnUnsubRef.current = sharedRoomsLib.subscribeRoomTxns(activeRoom.code, setActiveRoomTxns)
    return () => roomTxnUnsubRef.current?.()
  }, [activeRoom?.code])

  // Derived
  const totalAmt       = wallets.reduce((s, w) => s + w.amt, 0)
  const goalPct        = Math.min(100, Math.round((totalAmt / goal) * 100))
  const curMonthName   = MONTH_NAMES[new Date().getMonth()]
  const sharedTotal    = rooms.reduce((s, r) => s + r.balance, 0)
  const familyTotal    = familyTxns.reduce((s, t) => s + t.amt, 0)
  const familyTotalIn  = familyTxns.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0)
  const familyTotalOut = familyTxns.filter(t => t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0)

  // AcornJar acorns built from mock member shares
  const familyAcorns = []
  const famTotal = FAMILY_MOCK_MEMBERS.reduce((s, m) => s + m.amt, 0)
  FAMILY_MOCK_MEMBERS.forEach(m => {
    const n = Math.max(1, Math.round((m.amt / famTotal) * 22))
    for (let i = 0; i < n; i++) familyAcorns.push(m)
  })

  // Unique members across all rooms for hero avatar stack
  const allRoomMemberMap = new Map()
  rooms.forEach(r => r.members.forEach(m => allRoomMemberMap.set(m.name, m)))
  const allRoomMembers = Array.from(allRoomMemberMap.values())
  const totalMembersCount = allRoomMembers.length

  const handleScroll = () => {
    if (!scrollRef.current) return
    const p = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth)
    setPage(p)
    onPageChange?.(p)
  }
  const goToPage = (p) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ left: p * scrollRef.current.offsetWidth, behavior: 'smooth' })
  }

  // My Wallets handlers
  const handleSaveGoal = () => {
    const n = parseInt(goalInput.replace(/,/g, ''), 10)
    if (n > 0) onSetGoal(n)
    setShowGoalEdit(false); setGoalInput('')
  }
  const handleAddWallet = () => {
    if (!newWalletName.trim()) return
    onUpsertWallet({
      id: Date.now().toString(), name: newWalletName.trim(), sub: newWalletType, amt: 0,
      ic: newWalletType === 'PVD' ? '🏢' : newWalletType === 'กองทุน' ? '📈' : newWalletType === 'เงินฝากประจำ' ? '💰' : '🗄️',
      tint: CC.mossSoft, tone: CC.moss,
    })
    setNewWalletName(''); setNewWalletType(WALLET_TYPES[0]); setShowAddWallet(false)
  }
  const openEditWallet  = (w) => { setEditWallet(w); setEditWName(w.name); setEditWSub(w.sub); setEditWAmt(Math.abs(w.amt).toString()) }
  const handleSaveWallet = () => {
    const n = parseFloat(editWAmt.replace(/,/g, '')) || 0
    onUpsertWallet({ ...editWallet, name: editWName.trim() || editWallet.name, sub: editWSub.trim(), amt: editWallet.amt < 0 ? -n : n })
    setEditWallet(null)
  }
  const handleDeleteWallet = () => { onDeleteWallet(editWallet.id); setEditWallet(null) }
  const openEditFixed   = (fe) => {
    setEditFixed(fe)
    setEditFName(fe.name)
    setEditFAmt(fe.amt.toString())
    if (fe.type === 'once') {
      const d = new Date(fe.dueDate)
      setEditFDueDate(d.toISOString().slice(0, 10))
    } else {
      setEditFDay((fe.cutDay ?? 1).toString())
    }
  }
  const handleSaveFixed = () => {
    const amt = parseFloat(editFAmt.replace(/,/g, '')) || 0
    if (editFixed.type === 'once') {
      onSaveFixed({ ...editFixed, name: editFName.trim() || editFixed.name, amt, dueDate: new Date(editFDueDate).toISOString() })
    } else {
      const day = Math.min(31, Math.max(1, parseInt(editFDay, 10) || 1))
      onSaveFixed({ ...editFixed, name: editFName.trim() || editFixed.name, amt, cutDay: day })
    }
    setEditFixed(null)
  }
  const handleDeleteFixed = () => { onDeleteFixed(editFixed.id); setEditFixed(null) }

  // Shared Rooms handlers
  const handleCreateRoom = async () => {
    if (!roomName.trim()) return
    const rt = ROOM_TYPES.find(r => r.id === roomType)
    const code = await onCreateRoom(roomName.trim(), roomType, rt.ic)
    setRoomName(''); setShowCreateRoom(false); setCreatedCode({ name: roomName.trim(), code })
  }
  const handleJoinRoom = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    const ok = await onJoinRoom(code)
    if (ok) { setShowJoinRoom(false); setJoinCode('') }
    else { alert(`ไม่พบรหัส ${code}`) }
  }
  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }
  const handleAddEntry = async () => {
    const amt = parseFloat(entryAmt.replace(/,/g, ''))
    if (!amt || !addEntryRoom) return
    const txn = { label: entryLabel || 'รายการ', amt: -Math.abs(amt), by: entryBy || addEntryRoom.members[0]?.name, ic: '💸' }
    await onAddRoomTxn(addEntryRoom.code, txn)
    setEntryLabel(''); setEntryAmt(''); setEntryBy(null); setCustomMemberName(''); setAddEntryRoom(null)
  }

  // Family Pot handlers
  const handleJoinSubmit = async () => {
    if (!joinFamilyCode.trim()) return
    setJoiningFamily(true); setJoinFamilyErr('')
    const ok = await onJoinFamily(joinFamilyCode)
    setJoiningFamily(false)
    if (ok) { setShowJoinFamily(false); setJoinFamilyCode('') }
    else setJoinFamilyErr('ไม่พบรหัสบ้านนี้ กรุณาตรวจสอบอีกครั้ง')
  }
  const handleCreateSubmit = async () => {
    setCreatingFamily(true)
    await onCreateFamily()
    setCreatingFamily(false)
  }
  const handleCopyFamilyCode = () => {
    navigator.clipboard?.writeText(familyCode).catch(() => {})
    setCopiedFamily(true); setTimeout(() => setCopiedFamily(false), 1500)
  }

  // Shared styles
  const overlay = { position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(42,31,18,0.55)', display: 'flex', alignItems: 'flex-end' }
  const sheet   = { width: '100%', background: CC.bg, borderRadius: '24px 24px 0 0', padding: '24px 20px 36px' }
  const inp     = { width: '100%', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${CC.border}`, background: CC.surface, fontSize: 14, fontFamily: FONT, color: CC.ink, boxSizing: 'border-box', outline: 'none' }
  const btnPri  = { marginTop: 14, width: '100%', padding: 14, borderRadius: 16, border: 'none', background: CC.walnut, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }
  const btnGreen= { ...btnPri, background: CC.moss }
  const btnDng  = { marginTop: 10, width: '100%', padding: 14, borderRadius: 16, border: 'none', background: CC.emberSoft, color: CC.ember, fontSize: 15, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }
  const editBtn = { flexShrink: 0, width: 30, height: 30, borderRadius: 10, background: CC.walnutSoft, color: CC.walnut, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 6 }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>

      {/* Page dots */}
      <div style={{ position: 'absolute', top: 'calc(10px + var(--sat))', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 20, pointerEvents: 'none' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: i === page ? 20 : 6, height: 6, borderRadius: 3, transition: 'all 0.3s',
            background: i === page ? (page === 1 ? CC.moss : page === 2 ? CC.amber : CC.walnut) : CC.border,
          }} />
        ))}
      </div>

      {/* Scroll track */}
      <div ref={scrollRef} onScroll={handleScroll} style={{
        display: 'flex', overflowX: 'scroll', scrollSnapType: 'x mandatory',
        scrollBehavior: 'smooth', height: '100%', width: '100%',
        msOverflowStyle: 'none', scrollbarWidth: 'none',
      }}>

        {/* ══════════════════════════════════════
            PAGE 0 — MY WALLETS
        ══════════════════════════════════════ */}
        <div style={{ minWidth: '100%', scrollSnapAlign: 'start', overflowY: 'auto', height: '100%', paddingBottom: 110 }}>
          <div style={{ height: 'calc(28px + var(--sat))' }} />
          <div style={{ padding: '0 24px' }}>
            <div style={{ fontSize: 13, color: CC.walnut, fontStyle: 'italic' }}>กรุของคุณ</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 30, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -0.4, marginTop: 2 }}>บัญชี & สินทรัพย์</div>
              <button onClick={() => goToPage(1)} style={{ background: CC.walnutSoft, border: 'none', borderRadius: 100, padding: '5px 12px', fontSize: 11, color: CC.walnut, fontFamily: FONT, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                🌿 บัญชีร่วม →
              </button>
            </div>
          </div>

          {/* Net worth card */}
          <div style={{ padding: '18px 20px 8px' }}>
            <div style={{ background: `linear-gradient(160deg, ${CC.walnut}, #4F3320)`, color: '#fff', borderRadius: 28, padding: '24px 22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: 8, top: 8 }}>
                <Squirrel size={88} mood="open" />
              </div>
              <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1, textTransform: 'uppercase' }}>มูลค่าสุทธิ</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 16, opacity: 0.7, fontFamily: DISPLAY }}>฿</span>
                <span style={{ fontSize: 38, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>{totalAmt.toLocaleString('th-TH')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} style={{ width: 14, height: 14, opacity: i < Math.round(goalPct / 12.5) ? 1 : 0.25 }}>
                        <Acorn size={14} color={CC.amber} />
                      </div>
                    ))}
                    <div style={{ fontSize: 11, opacity: 0.85, marginLeft: 4 }}>เป้า ฿{goal.toLocaleString('th-TH')} · {goalPct}%</div>
                  </div>
                </div>
                <button onClick={() => { setGoalInput(goal.toString()); setShowGoalEdit(true) }}
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 100, padding: '4px 10px', fontSize: 11, color: '#fff', cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
                  ตั้งเป้า 🎯
                </button>
              </div>
            </div>
          </div>

          {/* Wallet list */}
          <div style={{ padding: '20px 20px 8px' }}>
            <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>กระเป๋า</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {wallets.map((w, i) => (
                <div key={w.id || i} style={{ background: CC.surface, borderRadius: 20, border: `1px solid ${CC.border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: w.tint, color: w.tone, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{w.ic}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY }}>{w.name}</div>
                      {w.isDefault && <span style={{ fontSize: 9, background: CC.amberSoft, color: CC.walnut, borderRadius: 4, padding: '1px 5px', fontWeight: 600, flexShrink: 0 }}>DEFAULT</span>}
                    </div>
                    <div style={{ fontSize: 12, color: CC.walnut, marginTop: 2 }}>{w.sub}</div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: w.amt < 0 ? CC.ember : CC.ink, flexShrink: 0 }}>
                    {w.amt < 0 ? '−' : ''}฿{Math.abs(w.amt).toLocaleString('th-TH')}
                  </div>
                  <button onClick={() => openEditWallet(w)} style={editBtn}><PencilIcon /></button>
                </div>
              ))}
              <button onClick={() => setShowAddWallet(true)}
                style={{ background: CC.surface, borderRadius: 20, border: `1.5px dashed ${CC.border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: CC.walnut, fontSize: 13, fontFamily: FONT, fontWeight: 600 }}>
                <span style={{ fontSize: 18 }}>+</span> เพิ่มบัญชีออมเงิน
              </button>
            </div>
          </div>

          {/* Fixed expenses */}
          <div style={{ padding: '20px 20px 8px' }}>
            <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>หนี้ / ค่าใช้จ่ายคงที่</div>
            {fixedExpenses.length === 0 ? (
              <div style={{ background: CC.surface, borderRadius: 20, border: `1px solid ${CC.border}`, padding: '20px', textAlign: 'center', color: CC.walnut, fontSize: 13 }}>
                ยังไม่มีรายการ — เพิ่มจากหน้าเก็บลูกโอ๊ก (ตั้งเวลา / ทุกเดือน)
              </div>
            ) : (
              <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}` }}>
                {fixedExpenses.map((fe, i) => {
                  const type   = fe.type || 'monthly'
                  const days   = type === 'once' ? daysUntilDate(fe.dueDate) : daysUntil(fe.cutDay)
                  const urgent = days <= 3
                  const dueLabel = type === 'once'
                    ? `${new Date(fe.dueDate).getDate()} ${MONTH_NAMES[new Date(fe.dueDate).getMonth()]}`
                    : `${fe.cutDay} ${curMonthName}`
                  return (
                    <div key={fe.id || i} style={{ padding: '14px 18px', borderBottom: i < fixedExpenses.length - 1 ? `1px solid ${CC.border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, fontSize: 18, flexShrink: 0, background: urgent ? CC.emberSoft : CC.walnutSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fe.ic}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{fe.name}</div>
                        <div style={{ fontSize: 12, color: urgent ? CC.ember : CC.walnut, marginTop: 2 }}>
                          ตัดวันที่ {dueLabel} · {days < 0 ? 'เกินกำหนด' : `อีก ${days} วัน`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: CC.ember }}>฿{fe.amt.toLocaleString('th-TH')}</div>
                        <div style={{ fontSize: 10, color: CC.walnut }}>{type === 'once' ? 'ครั้งเดียว' : 'ทุกเดือน'}</div>
                      </div>
                      <button onClick={() => openEditFixed(fe)} style={editBtn}><PencilIcon /></button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Investment forest — derived from non-default wallets */}
          {(() => {
            const forest = wallets.filter(w => !w.isDefault && w.amt > 0)
            const portfolioTotal = forest.reduce((s, w) => s + w.amt, 0)
            const maxAmt = Math.max(...forest.map(w => w.amt), 1)
            const MIN_H = 28, MAX_H = 95
            const fmtAmt = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`
            const treeColors = [CC.moss, '#7A8B53', '#6B7A45', '#8A9B5A', '#5A7A35']
            return (
              <div style={{ padding: '20px 20px 0' }}>
                <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>ป่าลงทุน 🌳</div>
                <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: 18 }}>
                  {forest.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px 0' }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🌱</div>
                      <div style={{ fontSize: 13, color: CC.walnut, fontWeight: 600 }}>ยังไม่มีบัญชีออมเงิน</div>
                      <div style={{ fontSize: 11, color: CC.walnut, marginTop: 4, opacity: 0.7 }}>เพิ่มบัญชี PVD / กองทุน / เงินฝากข้างบน</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 12, color: CC.walnut }}>มูลค่าพอร์ต</div>
                          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums' }}>฿{portfolioTotal.toLocaleString('th-TH')}</div>
                        </div>
                        <div style={{ fontSize: 12, color: CC.walnut, opacity: 0.6 }}>{forest.length} บัญชี</div>
                      </div>
                      <div style={{ borderTop: `1px dashed ${CC.border}`, paddingTop: 12 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                          {forest.map((w, i) => (
                            <div key={w.id} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: CC.walnut, fontWeight: 600 }}>{fmtAmt(w.amt)}</div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                          {forest.map((w, i) => {
                            const tH = Math.round(MIN_H + ((w.amt / maxAmt) * (MAX_H - MIN_H)))
                            const col = treeColors[i % treeColors.length]
                            const lightCol = col + '99'
                            return (
                              <div key={w.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <svg width="32" height={tH} viewBox={`0 0 32 ${tH}`}>
                                  <rect x="14" y={tH - 12} width="4" height="12" fill={CC.walnut} />
                                  <ellipse cx="16" cy={tH - 18} rx="14" ry={Math.max(10, tH - 24)} fill={col} />
                                  <ellipse cx="16" cy={tH - 18} rx="10" ry={Math.max(7, tH - 30)} fill={lightCol} />
                                </svg>
                                <div style={{ fontSize: 8, color: CC.walnut, textAlign: 'center', lineHeight: 1.3, maxWidth: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })()}
          <div style={{ height: 40 }} />
        </div>

        {/* ══════════════════════════════════════
            PAGE 1 — SHARED HUB (redesigned)
        ══════════════════════════════════════ */}
        <div style={{ minWidth: '100%', scrollSnapAlign: 'start', overflowY: 'auto', height: '100%', background: CC.bg, backgroundImage: PAPER, backgroundBlendMode: 'multiply', paddingBottom: 110 }}>
          <div style={{ height: 'calc(28px + var(--sat))' }} />

          {/* Header nav */}
          <div style={{ padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => goToPage(0)} style={{ background: CC.surface, border: `1px solid ${CC.border}`, borderRadius: 100, padding: '5px 12px', fontSize: 11, color: CC.walnut, fontFamily: FONT, fontWeight: 600, cursor: 'pointer' }}>
                ← บัญชีส่วนตัว
              </button>
              <button onClick={() => goToPage(2)} style={{ background: CC.surface, border: `1px solid ${CC.border}`, borderRadius: 100, padding: '5px 12px', fontSize: 11, color: CC.walnut, fontFamily: FONT, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                🌳 กองกลาง →
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <div style={{ fontSize: 30, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -0.4, color: CC.ink }}>บัญชีร่วม</div>
              <Leaf size={22} color={CC.moss} />
            </div>
          </div>

          {/* Hero — forest green gradient */}
          <div style={{ padding: '14px 20px 0' }}>
            <div style={{ background: 'linear-gradient(160deg, #5A6B3B, #3D5A2C)', borderRadius: 28, padding: '20px 22px', position: 'relative', overflow: 'hidden', color: '#FBF6E9' }}>
              {/* SVG trees */}
              <svg style={{ position: 'absolute', right: -8, top: -4, opacity: 0.28 }} width="160" height="110" viewBox="0 0 160 110">
                <ellipse cx="40"  cy="48" rx="20" ry="30" fill="#7A8B53"/>
                <rect x="37" y="74" width="6" height="18" fill="#3D2818"/>
                <ellipse cx="90"  cy="36" rx="26" ry="36" fill="#7A8B53"/>
                <rect x="87" y="66" width="6" height="24" fill="#3D2818"/>
                <ellipse cx="136" cy="52" rx="18" ry="26" fill="#7A8B53"/>
                <rect x="133" y="74" width="6" height="18" fill="#3D2818"/>
              </svg>
              <svg style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 20, opacity: 0.18 }} viewBox="0 0 400 20" preserveAspectRatio="none">
                <path d="M 0 10 Q 50 2 100 12 T 200 10 T 300 12 T 400 10 L 400 20 L 0 20 Z" fill="#FBF6E9"/>
              </svg>
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>เคลื่อนไหวเดือนนี้</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 16, opacity: 0.8, fontFamily: DISPLAY }}>฿</span>
                  <span style={{ fontSize: 38, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.abs(sharedTotal).toLocaleString('th-TH')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 14, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>ห้อง</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: DISPLAY }}>{rooms.length}</div>
                  </div>
                  <div style={{ width: 1, height: 28, background: 'rgba(251,246,233,0.25)' }}/>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>คนเข้าร่วม</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: DISPLAY }}>{totalMembersCount}</div>
                  </div>
                  <div style={{ flex: 1 }}/>
                  <AvatarStack members={allRoomMembers} size={28}/>
                </div>
              </div>
            </div>
          </div>

          {/* Nudge — owe summary */}
          {sharedTotal !== 0 && (
            <div style={{ padding: '12px 20px 0' }}>
              <div style={{ background: CC.amberSoft, borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${CC.border}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 17, background: CC.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Acorn size={18} color="#fff"/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: CC.walnut, fontWeight: 600, lineHeight: 1.4 }}>
                    ยอดรวมทุกห้อง{' '}
                    <b style={{ color: sharedTotal < 0 ? CC.ember : CC.moss, fontFamily: DISPLAY, fontSize: 13 }}>
                      {sharedTotal < 0 ? '−' : '+'}฿{Math.abs(sharedTotal).toLocaleString('th-TH')}
                    </b>
                  </div>
                  <div style={{ fontSize: 10.5, color: CC.ink2, marginTop: 1 }}>แตะห้องเพื่อดูรายละเอียด</div>
                </div>
                <div style={{ color: CC.walnut, fontSize: 18 }}>›</div>
              </div>
            </div>
          )}

          {/* Room cards */}
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>ห้องของฉัน</div>
              <div style={{ fontSize: 11, color: CC.walnut }}>{rooms.length} ห้อง</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rooms.map(r => {
                const tone = roomTone(r.type)
                const lastTxn = r.txns[0]
                return (
                  <button key={r.id} onClick={() => setActiveRoom(r)}
                    style={{ background: CC.surface, border: `1px solid ${CC.border}`, borderRadius: 22, padding: 0, overflow: 'hidden', textAlign: 'left', fontFamily: FONT, cursor: 'pointer', width: '100%', display: 'block' }}>
                    {/* tone ribbon */}
                    <div style={{ height: 4, background: tone.accent }}/>
                    <div style={{ padding: '14px 16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 50, height: 50, borderRadius: 14, background: tone.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, border: `1px solid ${CC.border}` }}>{r.ic}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY, color: CC.ink }}>{r.name}</div>
                            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: r.balance > 0 ? CC.moss : CC.ink, whiteSpace: 'nowrap' }}>
                              {r.balance > 0 ? '+' : '−'}฿{Math.abs(r.balance).toLocaleString('th-TH')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <AvatarStack members={r.members} size={22}/>
                            <div style={{ fontSize: 11, color: CC.walnut }}>{r.members.length} คน</div>
                            <div style={{ flex: 1 }}/>
                            <div style={{ fontSize: 10, color: CC.walnut, padding: '2px 8px', background: tone.bg, borderRadius: 6, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 600 }}>{r.code}</div>
                          </div>
                        </div>
                      </div>
                      {/* Last activity row */}
                      {lastTxn && (
                        <div style={{ marginTop: 10, padding: '9px 12px', background: CC.bg, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontSize: 14 }}>{lastTxn.ic}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: CC.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastTxn.label} · {lastTxn.by}</div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: lastTxn.amt < 0 ? CC.ember : CC.moss }}>
                            {lastTxn.amt < 0 ? '−' : '+'}฿{Math.abs(lastTxn.amt).toLocaleString('th-TH')}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}

              {/* Create new room */}
              <button onClick={() => setShowCreateRoom(true)}
                style={{ background: CC.surface, border: `1.5px dashed ${CC.border}`, borderRadius: 22, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: CC.walnut, fontFamily: FONT, width: '100%', textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: CC.walnutSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: CC.walnut, flexShrink: 0 }}>+</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: CC.ink, fontFamily: DISPLAY }}>เปิดห้องใหม่</div>
                  <div style={{ fontSize: 11, marginTop: 2, color: CC.walnut }}>ทริป · กิจกรรม · กลุ่มกินข้าว</div>
                </div>
              </button>
              <button onClick={() => setShowJoinRoom(true)}
                style={{ background: 'none', borderRadius: 22, border: `1.5px solid ${CC.border}`, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: CC.walnut, fontSize: 13, fontFamily: FONT, fontWeight: 600 }}>
                🔑 เข้าร่วมด้วยรหัส
              </button>
            </div>
          </div>
          <div style={{ height: 40 }} />
        </div>

        {/* ══════════════════════════════════════
            PAGE 2 — FAMILY POOL
        ══════════════════════════════════════ */}
        <div style={{ minWidth: '100%', scrollSnapAlign: 'start', overflowY: 'auto', height: '100%', background: CC.bg, backgroundImage: PAPER, backgroundBlendMode: 'multiply', paddingBottom: 110 }}>
          <div style={{ height: 'calc(28px + var(--sat))' }} />

          {/* Header nav */}
          <div style={{ padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, color: CC.walnut, fontStyle: 'italic' }}>ร่มเงาของเรา</div>
              <button onClick={() => goToPage(1)} style={{ background: CC.surface, border: `1px solid ${CC.border}`, borderRadius: 100, padding: '5px 12px', fontSize: 11, color: CC.walnut, fontFamily: FONT, fontWeight: 600, cursor: 'pointer' }}>
                ← บัญชีร่วม
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -0.4, color: CC.ink }}>กองกลางครอบครัว</div>
              <span style={{ fontSize: 22 }}>🌳</span>
            </div>
          </div>

          {/* ── Loading ── */}
          {familyData === undefined && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: CC.walnut, fontSize: 13 }}>
              กำลังโหลด...
            </div>
          )}

          {/* ── No family yet ── */}
          {familyData === null && (
            <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <Squirrel size={110} mood="happy"/>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY, color: CC.ink, textAlign: 'center' }}>ยังไม่มีกองกลางครอบครัว</div>
              <div style={{ fontSize: 13, color: CC.walnut, textAlign: 'center', lineHeight: 1.6, maxWidth: 260 }}>
                เชื่อมต่อกับครอบครัวเพื่อบันทึกรายการร่วมกัน
              </div>
              <button
                onClick={() => setShowFamilySetup(true)}
                style={{ width: '100%', maxWidth: 280, padding: '14px', borderRadius: 18, border: 'none', background: CC.walnut, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', boxShadow: '0 4px 14px rgba(122,79,42,0.3)' }}>
                🌳 ตั้งค่ากองกลางครอบครัว
              </button>
            </div>
          )}

          {/* ── Has family ── */}
          {familyData && (
            <>
              {/* Hero — AcornJar + stats */}
              <div style={{ padding: '14px 20px 0' }}>
                <div style={{ background: `linear-gradient(160deg, ${CC.walnutSoft}, ${CC.amberSoft})`, borderRadius: 28, padding: '18px 18px 16px', position: 'relative', overflow: 'hidden', border: `1px solid ${CC.border}` }}>
                  <svg style={{ position: 'absolute', right: -10, top: -10, opacity: 0.14 }} width="110" height="110" viewBox="0 0 110 110">
                    <ellipse cx="55" cy="52" rx="32" ry="44" fill={CC.moss}/>
                    <rect x="51" y="86" width="8" height="20" fill="#3D2818"/>
                  </svg>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', position: 'relative' }}>
                    <div style={{ flexShrink: 0 }}>
                      <AcornJar acorns={familyAcorns} w={110} h={130}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: CC.walnut, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>กองรวม</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 4 }}>
                        <span style={{ fontSize: 14, color: CC.walnut, fontFamily: DISPLAY }}>฿</span>
                        <span style={{ fontSize: 30, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -0.8, fontVariantNumeric: 'tabular-nums', color: CC.ink }}>
                          {Math.abs(familyTotal).toLocaleString('th-TH')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <div style={{ flex: 1, padding: '8px 10px', background: CC.surface, borderRadius: 12, border: `1px solid ${CC.border}` }}>
                          <div style={{ fontSize: 9, color: CC.walnut, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>รับเข้า</div>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: DISPLAY, color: CC.moss, marginTop: 1 }}>+฿{familyTotalIn.toLocaleString('th-TH')}</div>
                        </div>
                        <div style={{ flex: 1, padding: '8px 10px', background: CC.surface, borderRadius: 12, border: `1px solid ${CC.border}` }}>
                          <div style={{ fontSize: 9, color: CC.walnut, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>ใช้ออก</div>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: DISPLAY, color: CC.ember, marginTop: 1 }}>−฿{familyTotalOut.toLocaleString('th-TH')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div style={{ padding: '18px 20px 0' }}>
                <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>สมาชิก · {familyMembers.length} คน</div>
                <div style={{ background: CC.surface, borderRadius: 20, border: `1px solid ${CC.border}`, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {familyMembers.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: CC.bg, borderRadius: 100, padding: '5px 10px 5px 5px', border: `1px solid ${CC.border}` }}>
                        <Avatar name={m.name} bg={m.bg} size={26}/>
                        <div style={{ fontSize: 12, fontWeight: 600, color: CC.ink }}>{m.name}</div>
                        {m.isMe && <div style={{ fontSize: 9, color: CC.walnut }}>(ฉัน)</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent transactions */}
              <div style={{ padding: '18px 20px 0' }}>
                <div style={{ fontSize: 12, color: CC.walnut, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>รายการล่าสุด</div>
                <div style={{ background: CC.surface, borderRadius: 22, border: `1px solid ${CC.border}` }}>
                  {familyTxns.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 20px', color: CC.walnut }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>🌳</div>
                      <div style={{ fontSize: 13 }}>ยังไม่มีรายการ</div>
                      <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>กดปุ่มบ้านด้านล่างเพื่อเพิ่ม</div>
                    </div>
                  ) : familyTxns.slice(0, 15).map((t, i) => (
                    <div key={t._id || i} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < Math.min(familyTxns.length, 15) - 1 ? `1px solid ${CC.border}` : 'none', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: t.amt < 0 ? CC.amberSoft : CC.mossSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{t.ic}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: CC.ink }}>{t.label}</div>
                        <div style={{ fontSize: 11, color: CC.walnut, marginTop: 1 }}>{t.cat} · {t.time}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: t.amt < 0 ? CC.ember : CC.moss, flexShrink: 0 }}>
                        {t.amt > 0 ? '+' : '−'}฿{Math.abs(t.amt).toLocaleString('th-TH')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite card */}
              <div style={{ padding: '18px 20px 0' }}>
                <div style={{ background: CC.surface, borderRadius: 22, border: `1.5px dashed ${CC.amber}`, padding: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: -4, bottom: -10, opacity: 0.45 }}>
                    <Squirrel size={72} mood="wink"/>
                  </div>
                  <div style={{ position: 'relative', maxWidth: '72%' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: DISPLAY, color: CC.ink }}>เชิญสมาชิกเพิ่ม 🏡</div>
                    <div style={{ fontSize: 11, color: CC.walnut, marginTop: 3, lineHeight: 1.5 }}>แชร์รหัสบ้าน <b>{familyCode}</b> ให้ครอบครัวกรอกที่หน้านี้</div>
                    <button onClick={handleCopyFamilyCode}
                      style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: CC.walnut, color: '#fff', border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                      <CopyIcon/> {copiedFamily ? 'คัดลอกแล้ว ✓' : 'คัดลอกรหัส'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ height: 40 }} />
        </div>
      </div>

      {/* ══════════════ MODALS — MY WALLETS ══════════════ */}

      {showGoalEdit && (
        <div style={overlay} onClick={() => setShowGoalEdit(false)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 16 }}>ตั้งเป้าหมายการออม 🎯</div>
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 8 }}>จำนวนเงินเป้าหมาย (บาท)</div>
            <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} placeholder="750000" autoFocus
              style={{ ...inp, fontSize: 20, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums' }} />
            <button onClick={handleSaveGoal} style={btnPri}>บันทึกเป้าหมาย</button>
          </div>
        </div>
      )}

      {showAddWallet && (
        <div style={overlay} onClick={() => setShowAddWallet(false)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 16 }}>เพิ่มบัญชีออมเงิน</div>
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 8 }}>ประเภท</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {WALLET_TYPES.map(t => (
                <button key={t} onClick={() => setNewWalletType(t)}
                  style={{ padding: '7px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, background: newWalletType === t ? CC.walnut : CC.surface, color: newWalletType === t ? '#fff' : CC.ink2, border: newWalletType === t ? 'none' : `1px solid ${CC.border}` }}>
                  {t}
                </button>
              ))}
            </div>
            <input type="text" value={newWalletName} onChange={e => setNewWalletName(e.target.value)} placeholder="เช่น กองทุน K-CASH" autoFocus style={inp} />
            <button onClick={handleAddWallet} style={btnPri}>เพิ่มบัญชี</button>
          </div>
        </div>
      )}

      {editWallet && (
        <div style={overlay} onClick={() => setEditWallet(null)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 16 }}>{editWallet.ic} แก้ไขกระเป๋า</div>
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>ชื่อบัญชี</div>
            <input type="text" value={editWName} onChange={e => setEditWName(e.target.value)} autoFocus style={{ ...inp, marginBottom: 12 }} />
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>คำอธิบาย</div>
            <input type="text" value={editWSub} onChange={e => setEditWSub(e.target.value)} style={{ ...inp, marginBottom: editWallet.isDefault ? 4 : 12 }} />
            {editWallet.isDefault ? (
              <div style={{ fontSize: 11, color: CC.walnut, marginBottom: 4, opacity: 0.7 }}>
                💡 ยอดเงินอัปเดตอัตโนมัติจากการบันทึกรายรับรายจ่าย
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>ยอดเงิน (บาท)</div>
                <input type="number" value={editWAmt} onChange={e => setEditWAmt(e.target.value)} style={{ ...inp, fontVariantNumeric: 'tabular-nums' }} />
              </>
            )}
            <button onClick={handleSaveWallet} style={btnPri}>บันทึก</button>
            {!editWallet.isDefault && (
              <button onClick={handleDeleteWallet} style={btnDng}>ลบกระเป๋านี้</button>
            )}
          </div>
        </div>
      )}

      {editFixed && (
        <div style={overlay} onClick={() => setEditFixed(null)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 16 }}>{editFixed.ic} แก้ไขค่าใช้จ่ายคงที่</div>
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>ชื่อ</div>
            <input type="text" value={editFName} onChange={e => setEditFName(e.target.value)} autoFocus style={{ ...inp, marginBottom: 12 }} />
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>จำนวนเงิน (บาท)</div>
            <input type="number" value={editFAmt} onChange={e => setEditFAmt(e.target.value)} style={{ ...inp, marginBottom: 12, fontVariantNumeric: 'tabular-nums' }} />
            {editFixed.type === 'once' ? (
              <>
                <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>วันที่กำหนดชำระ</div>
                <input type="date" value={editFDueDate} onChange={e => setEditFDueDate(e.target.value)} style={inp} />
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>วันตัดทุกเดือน (1–31)</div>
                <input type="number" min="1" max="31" value={editFDay} onChange={e => setEditFDay(e.target.value)} style={inp} />
              </>
            )}
            <button onClick={handleSaveFixed} style={btnPri}>บันทึก</button>
            <button onClick={handleDeleteFixed} style={btnDng}>ลบรายการนี้</button>
          </div>
        </div>
      )}


      {/* ══════════════ MODALS — SHARED ROOMS ══════════════ */}

      {showCreateRoom && (
        <div style={overlay} onClick={() => setShowCreateRoom(false)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 16, color: CC.ink }}>สร้างบัญชีร่วม 🌿</div>
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 8 }}>ประเภทห้อง</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {ROOM_TYPES.map(t => (
                <button key={t.id} onClick={() => setRoomType(t.id)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 14, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: roomType === t.id ? CC.moss : CC.surface, color: roomType === t.id ? '#fff' : CC.ink2, border: roomType === t.id ? 'none' : `1px solid ${CC.border}` }}>
                  <span style={{ fontSize: 20 }}>{t.ic}</span>{t.l}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 8 }}>ชื่อห้อง</div>
            <input type="text" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="เช่น ทริปเชียงใหม่ 2025" autoFocus style={inp} />
            <button onClick={handleCreateRoom} style={btnGreen}>สร้างห้อง</button>
          </div>
        </div>
      )}

      {showJoinRoom && (
        <div style={overlay} onClick={() => setShowJoinRoom(false)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 6 }}>🔑 เข้าร่วมด้วยรหัส</div>
            <div style={{ fontSize: 13, color: CC.walnut, marginBottom: 16 }}>ขอรหัสจากผู้สร้างห้อง แล้วกรอกด้านล่าง</div>
            <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="เช่น CM2025" autoFocus maxLength={8}
              style={{ ...inp, fontSize: 22, fontFamily: 'monospace', letterSpacing: 4, textAlign: 'center', textTransform: 'uppercase' }} />
            <button onClick={handleJoinRoom} style={btnPri}>เข้าร่วม</button>
          </div>
        </div>
      )}

      {createdCode && (
        <div style={overlay} onClick={() => setCreatedCode(null)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 4 }}>สร้าง "{createdCode.name}" แล้ว!</div>
              <div style={{ fontSize: 13, color: CC.walnut, marginBottom: 20 }}>แชร์รหัสนี้ให้เพื่อนเพื่อเข้าร่วม</div>
              <div style={{ background: CC.bg, border: `2px dashed ${CC.border}`, borderRadius: 18, padding: '18px 24px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: CC.walnut, letterSpacing: 1, marginBottom: 8 }}>รหัสห้อง</div>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 6, color: CC.walnut }}>{createdCode.code}</div>
              </div>
              <button onClick={() => handleCopyCode(createdCode.code)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', borderRadius: 16, border: `1.5px solid ${CC.border}`, background: CC.bg, color: CC.walnut, fontSize: 14, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', marginBottom: 10, boxSizing: 'border-box' }}>
                <CopyIcon /> {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกรหัส'}
              </button>
              <button onClick={() => setCreatedCode(null)} style={btnPri}>เข้าห้องเลย</button>
            </div>
          </div>
        </div>
      )}

      {/* Room detail sheet */}
      {activeRoom && (
        <div style={overlay} onClick={() => { setActiveRoom(null); setShowRoomSummary(false) }}>
          <div style={{ ...sheet, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: roomTone(activeRoom.type).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{activeRoom.ic}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: DISPLAY }}>{activeRoom.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <AvatarStack members={activeRoom.members} size={22}/>
                  <div style={{ fontSize: 11, color: CC.walnut, marginLeft: 4 }}>{activeRoom.members.length} คน</div>
                </div>
              </div>
              {(() => {
                const bal = activeRoomTxns.reduce((s, t) => s + t.amt, 0)
                return (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: bal < 0 ? CC.ember : CC.moss }}>
                      {bal < 0 ? '−' : '+'}฿{Math.abs(bal).toLocaleString('th-TH')}
                    </div>
                    <div style={{ fontSize: 11, color: CC.walnut }}>{bal < 0 ? 'รายจ่ายรวม' : 'คงเหลือ'}</div>
                  </div>
                )
              })()}
            </div>
            {/* Room code + summary toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: CC.bg, border: `1px solid ${CC.border}`, borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: CC.walnut, letterSpacing: 1, marginBottom: 2 }}>รหัสห้อง</div>
                <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 3 }}>{activeRoom.code}</div>
              </div>
              <button onClick={() => setShowRoomSummary(s => !s)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: showRoomSummary ? CC.amberSoft : CC.surface, border: `1px solid ${CC.border}`, borderRadius: 10, padding: '7px 12px', color: CC.walnut, fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>
                💰 สรุป
              </button>
            </div>
            {/* Per-person summary */}
            {showRoomSummary && (() => {
              const byPerson = {}
              activeRoomTxns.forEach(t => {
                if (!byPerson[t.by]) byPerson[t.by] = 0
                byPerson[t.by] += Math.abs(t.amt)
              })
              const total = Object.values(byPerson).reduce((s, a) => s + a, 0)
              return (
                <div style={{ marginBottom: 14, background: CC.amberSoft, borderRadius: 14, padding: '12px 14px', border: `1px solid ${CC.border}` }}>
                  <div style={{ fontSize: 11, color: CC.walnut, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>สรุปค่าใช้จ่ายแต่ละคน</div>
                  {Object.entries(byPerson).map(([name, amt], i, arr) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: i < arr.length - 1 ? `1px solid ${CC.border}` : 'none' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: CC.ink }}>{name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: CC.ember, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums' }}>฿{amt.toLocaleString('th-TH')}</div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: `1px dashed ${CC.border}` }}>
                    <div style={{ fontSize: 12, color: CC.walnut, fontWeight: 600 }}>รวมทั้งหมด</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: CC.ink, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums' }}>฿{total.toLocaleString('th-TH')}</div>
                  </div>
                </div>
              )
            })()}
            {/* Transactions */}
            <div style={{ fontSize: 12, color: CC.walnut, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>รายการ</div>
            {activeRoomTxns.length === 0
              ? <div style={{ textAlign: 'center', color: CC.walnut, fontSize: 13, padding: '20px 0' }}>ยังไม่มีรายการ</div>
              : activeRoomTxns.map((t, i) => (
                <div key={t._id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < activeRoomTxns.length - 1 ? `1px solid ${CC.border}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: CC.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{t.ic}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: CC.walnut }}>จ่ายโดย {t.by}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: t.amt < 0 ? CC.ember : CC.moss }}>
                    {t.amt < 0 ? '−' : '+'}฿{Math.abs(t.amt).toLocaleString('th-TH')}
                  </div>
                </div>
              ))
            }
            <button onClick={() => { setAddEntryRoom(activeRoom); setEntryBy(activeRoom.members[0]?.name) }} style={btnPri}>
              + เพิ่มรายการ
            </button>
          </div>
        </div>
      )}

      {/* Add entry to shared room */}
      {addEntryRoom && (
        <div style={{ ...overlay, zIndex: 110 }} onClick={() => { setAddEntryRoom(null); setCustomMemberName('') }}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 16 }}>+ เพิ่มรายการใน {addEntryRoom.name}</div>
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>รายการ</div>
            <input type="text" value={entryLabel} onChange={e => setEntryLabel(e.target.value)} placeholder="เช่น ค่าอาหารเย็น" autoFocus style={{ ...inp, marginBottom: 12 }} />
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>จำนวนเงิน (บาท)</div>
            <input type="number" value={entryAmt} onChange={e => setEntryAmt(e.target.value)} placeholder="0" style={{ ...inp, marginBottom: 12, fontVariantNumeric: 'tabular-nums' }} />
            <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 8 }}>จ่ายโดย</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {addEntryRoom.members.map((m, i) => (
                <button key={i} onClick={() => setEntryBy(m.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, background: entryBy === m.name ? CC.moss : CC.bg, color: entryBy === m.name ? '#fff' : CC.walnut, border: entryBy === m.name ? 'none' : `1px solid ${CC.border}` }}>
                  <Avatar name={m.name} bg={m.bg} size={20} /> {m.name}
                </button>
              ))}
            </div>
            {/* Custom name input */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <input
                type="text"
                value={customMemberName}
                onChange={e => setCustomMemberName(e.target.value)}
                placeholder="+ ชื่อคนอื่น"
                style={{ ...inp, flex: 1 }}
              />
              <button
                onClick={() => { const n = customMemberName.trim(); if (n) { setEntryBy(n); setCustomMemberName('') } }}
                style={{ padding: '10px 14px', borderRadius: 14, background: CC.walnutSoft, color: CC.walnut, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: FONT, fontWeight: 600, flexShrink: 0 }}>
                เลือก
              </button>
            </div>
            {entryBy && !addEntryRoom.members.find(m => m.name === entryBy) && (
              <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 4 }}>จ่ายโดย: <b style={{ color: CC.ink }}>{entryBy}</b></div>
            )}
            <button onClick={handleAddEntry} style={{ ...btnGreen, marginTop: 10 }}>บันทึกรายการ</button>
          </div>
        </div>
      )}

      {/* Family setup — choice sheet */}
      {showFamilySetup && (
        <div style={overlay} onClick={() => setShowFamilySetup(false)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 6 }}>🌳 ตั้งค่ากองกลางครอบครัว</div>
            <div style={{ fontSize: 13, color: CC.walnut, marginBottom: 20 }}>เลือกว่าต้องการทำอะไร</div>
            <button
              onClick={() => { setShowFamilySetup(false); setShowJoinFamily(true); setJoinFamilyErr('') }}
              style={{ width: '100%', padding: '16px', borderRadius: 18, border: `1.5px solid ${CC.border}`, background: CC.surface, textAlign: 'left', cursor: 'pointer', fontFamily: FONT, marginBottom: 10 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>🔑</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: CC.ink }}>มีรหัสบ้านอยู่แล้ว</div>
              <div style={{ fontSize: 12, color: CC.walnut, marginTop: 2 }}>กรอกรหัสที่ได้รับจากครอบครัว</div>
            </button>
            <button
              onClick={async () => { setShowFamilySetup(false); await handleCreateSubmit() }}
              disabled={creatingFamily}
              style={{ width: '100%', padding: '16px', borderRadius: 18, border: 'none', background: CC.walnutSoft, textAlign: 'left', cursor: creatingFamily ? 'default' : 'pointer', fontFamily: FONT, opacity: creatingFamily ? 0.6 : 1 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>🏡</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: CC.ink }}>{creatingFamily ? 'กำลังสร้าง...' : 'สร้างบ้านใหม่'}</div>
              <div style={{ fontSize: 12, color: CC.walnut, marginTop: 2 }}>เป็นคนแรกในครอบครัว แล้วแชร์รหัสให้คนอื่น</div>
            </button>
          </div>
        </div>
      )}

      {/* Join family modal */}
      {showJoinFamily && (
        <div style={overlay} onClick={() => { setShowJoinFamily(false); setJoinFamilyCode(''); setJoinFamilyErr('') }}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 6 }}>🔑 เข้าร่วมกองกลางครอบครัว</div>
            <div style={{ fontSize: 13, color: CC.walnut, marginBottom: 16 }}>ขอรหัสบ้านจากสมาชิกในครอบครัว</div>
            <input
              type="text"
              value={joinFamilyCode}
              onChange={e => { setJoinFamilyCode(e.target.value.toUpperCase()); setJoinFamilyErr('') }}
              placeholder="รหัสบ้าน เช่น ABC123"
              maxLength={8}
              autoFocus
              style={{ ...inp, fontSize: 22, fontFamily: 'monospace', letterSpacing: 4, textAlign: 'center', textTransform: 'uppercase' }}
            />
            {joinFamilyErr && (
              <div style={{ marginTop: 8, fontSize: 12, color: CC.ember, textAlign: 'center' }}>{joinFamilyErr}</div>
            )}
            <button
              onClick={handleJoinSubmit}
              disabled={joiningFamily || !joinFamilyCode.trim()}
              style={{ ...btnPri, opacity: joiningFamily || !joinFamilyCode.trim() ? 0.5 : 1 }}>
              {joiningFamily ? 'กำลังเข้าร่วม...' : 'เข้าร่วม'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
