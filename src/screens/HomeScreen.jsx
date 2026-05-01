import { useState } from 'react'
import { CC, DISPLAY, FONT } from '../tokens'
import { Squirrel } from '../components/Squirrel'
import { Acorn }    from '../components/Acorn'
import { Leaf }     from '../components/Leaf'

const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export function HomeScreen({ txns, user, wallets = [], fixedExpenses = [], onDeleteTxn, onEditTxn }) {
  const [chartPeriod,  setChartPeriod]  = useState('week')
  const [showAll,      setShowAll]      = useState(false)
  const [selectedTxn,  setSelectedTxn]  = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [editMode,     setEditMode]     = useState(false)
  const [editLabel,    setEditLabel]    = useState('')
  const [editNote,     setEditNote]     = useState('')
  const [saving,       setSaving]       = useState(false)
  const [editAmt,      setEditAmt]      = useState('')

  const firstName = user?.displayName?.split(' ')[0] || 'คุณ'
  const now        = new Date()
  const todayStr   = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })
  const todayDate  = now.toDateString()
  const curMonth   = now.getMonth()
  const curYear    = now.getFullYear()

  const txnDate = (t) => new Date(t.id || Date.now())

  // Monthly txns for stats (reset each month)
  const monthlyTxns = txns.filter(t => {
    const d = txnDate(t)
    return d.getMonth() === curMonth && d.getFullYear() === curYear
  })

  // Today txns for "วันนี้" section (reset each day)
  const todayTxns = txns.filter(t => txnDate(t).toDateString() === todayDate)

  const totalIn  = monthlyTxns.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0)
  const totalOut = monthlyTxns.filter(t => t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0)
  const defaultWallet = wallets.find(w => w.isDefault)
  const balance  = defaultWallet?.amt ?? 0
  const allToday = [...todayTxns].reverse()
  const recent   = showAll ? allToday : allToday.slice(0, 10)

  const todayDay    = now.getDate()
  const billsDueNow = fixedExpenses.filter(fe => fe.cutDay === todayDay)

  // Last-7-days chart bars
  const weekBars = (() => {
    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayOut = txns
        .filter(t => txnDate(t).toDateString() === d.toDateString() && t.amt < 0)
        .reduce((s, t) => s + Math.abs(t.amt), 0)
      result.push({ raw: dayOut, d: DAY_LABELS[d.getDay()], isToday: i === 0 })
    }
    const max = Math.max(...result.map(b => b.raw), 1)
    return result.map(b => ({ ...b, h: Math.round((b.raw / max) * 85) + 5 }))
  })()

  // 4-week monthly chart bars
  const monthBars = (() => {
    const WEEK_LABELS = ['สป.1', 'สป.2', 'สป.3', 'สป.4']
    const curWeek = Math.floor((now.getDate() - 1) / 7)
    const result = WEEK_LABELS.map((l, wi) => {
      const weekOut = monthlyTxns
        .filter(t => {
          const day = txnDate(t).getDate()
          return day > wi * 7 && day <= (wi + 1) * 7 && t.amt < 0
        })
        .reduce((s, t) => s + Math.abs(t.amt), 0)
      return { raw: weekOut, d: l, isToday: wi === curWeek }
    })
    const max = Math.max(...result.map(b => b.raw), 1)
    return result.map(b => ({ ...b, h: Math.round((b.raw / max) * 85) + 5 }))
  })()

  const bars     = chartPeriod === 'week' ? weekBars : monthBars
  const avgLabel = chartPeriod === 'week'
    ? `เฉลี่ย ฿${Math.round(totalOut / 7).toLocaleString('th-TH')}/วัน`
    : `฿${totalOut.toLocaleString('th-TH')}/เดือน`

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingBottom: 110 }}>
      <div style={{ height: 'calc(16px + var(--sat))' }} />

      {/* Header */}
      <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: CC.walnut, fontStyle: 'italic' }}>วันที่ {todayStr}</div>
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
                "เก็บลูกโอ๊กเพิ่มตามแผนนะ 🌰"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly stats row */}
      <div style={{ padding: '16px 20px 0', display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, background: CC.surface, borderRadius: 18, border: `1px solid ${CC.border}`, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Leaf size={14} color={CC.moss} />
            <div style={{ fontSize: 11, color: CC.walnut, letterSpacing: 0.5 }}>เก็บเข้า</div>
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: DISPLAY, color: CC.moss, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            ฿{totalIn.toLocaleString('th-TH')}
          </div>
          <div style={{ fontSize: 10, color: CC.walnut, marginTop: 2, fontStyle: 'italic' }}>เดือนนี้</div>
        </div>
        <div style={{ flex: 1, background: CC.surface, borderRadius: 18, border: `1px solid ${CC.border}`, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>🍂</span>
            <div style={{ fontSize: 11, color: CC.walnut, letterSpacing: 0.5 }}>หลุดมือ</div>
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: DISPLAY, color: CC.ember, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            ฿{totalOut.toLocaleString('th-TH')}
          </div>
          <div style={{ fontSize: 10, color: CC.walnut, marginTop: 2, fontStyle: 'italic' }}>เดือนนี้</div>
        </div>
      </div>

      {/* Bills due today */}
      {billsDueNow.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ background: CC.emberSoft, borderRadius: 20, border: `1.5px solid ${CC.ember}`, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: CC.ember, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
              🔔 บิลตัดวันนี้
            </div>
            {billsDueNow.map((fe, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: i > 0 ? 8 : 0 }}>
                <span style={{ fontSize: 18 }}>{fe.ic}</span>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{fe.name}</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: CC.ember }}>
                  ฿{fe.amt.toLocaleString('th-TH')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart with week/month toggle */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}`, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: DISPLAY }}>
              {chartPeriod === 'week' ? 'สัปดาห์ที่ผ่านมา' : 'รายสัปดาห์เดือนนี้'}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['week', 'month'].map(p => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  style={{
                    padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', border: 'none', fontFamily: FONT,
                    background: chartPeriod === p ? CC.walnut : CC.bg,
                    color:      chartPeriod === p ? '#fff'    : CC.walnut,
                    transition: 'all 0.15s',
                  }}
                >{p === 'week' ? 'สัปดาห์' : 'เดือน'}</button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, color: CC.walnut, marginBottom: 12 }}>{avgLabel}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', height: 60, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', height: `${b.h}%`,
                    background: b.isToday ? CC.amber : CC.walnutSoft,
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

      {/* Today's transactions */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY }}>วันนี้</div>
          <div style={{ fontSize: 12, color: CC.walnut }}>{allToday.length} รายการ</div>
        </div>
        <div style={{ background: CC.surface, borderRadius: 24, border: `1px solid ${CC.border}` }}>
          {recent.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: CC.walnut, fontSize: 13 }}>
              ยังไม่มีรายการ — กด 🌰 เพื่อเริ่ม
            </div>
          ) : recent.map((t, i) => (
            <button key={t._id || t.id}
              onClick={() => setSelectedTxn(t)}
              style={{
                display: 'flex', alignItems: 'center', padding: '14px 18px', width: '100%',
                borderBottom: i < recent.length - 1 ? `1px solid ${CC.border}` : 'none',
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
              }}>
              <div style={{ width: 38, height: 38, borderRadius: 19, background: t.amt > 0 ? CC.mossSoft : CC.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginRight: 12, flexShrink: 0 }}>
                {t.ic}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: CC.ink }}>{t.label}</div>
                <div style={{ fontSize: 11, color: CC.walnut, marginTop: 2 }}>
                  {t.cat} · {t.time}{t.note ? ` · ${t.note}` : ''}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: t.amt > 0 ? CC.moss : CC.ink, flexShrink: 0 }}>
                {t.amt > 0 ? '+' : '−'}฿{Math.abs(t.amt).toLocaleString('th-TH')}
              </div>
            </button>
          ))}
        </div>
        {allToday.length > 10 && !showAll && (
          <button onClick={() => setShowAll(true)}
            style={{ marginTop: 10, width: '100%', padding: '11px', borderRadius: 16, background: 'none', border: `1px solid ${CC.border}`, color: CC.walnut, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
            ดูทั้งหมด {allToday.length} รายการ
          </button>
        )}
      </div>

      <div style={{ height: 40 }} />

      {/* Transaction detail sheet */}
      {selectedTxn && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(42,31,18,0.55)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setSelectedTxn(null); setEditMode(false) }}>
          <div style={{ width: '100%', background: CC.bg, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: selectedTxn.amt > 0 ? CC.mossSoft : CC.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{selectedTxn.ic}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, fontFamily: DISPLAY }}>{editMode ? editLabel || selectedTxn.label : selectedTxn.label}</div>
                <div style={{ fontSize: 12, color: CC.walnut, marginTop: 2 }}>{selectedTxn.cat} · {selectedTxn.time}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: DISPLAY, fontVariantNumeric: 'tabular-nums', color: selectedTxn.amt > 0 ? CC.moss : CC.ember }}>
                {selectedTxn.amt > 0 ? '+' : '−'}฿{Math.abs(selectedTxn.amt).toLocaleString('th-TH')}
              </div>
            </div>

            {!editMode ? (
              <>
                {selectedTxn.receiptImg && (
                  <div style={{ marginBottom: 14, borderRadius: 12, overflow: 'hidden', maxHeight: 180 }}>
                    <img src={selectedTxn.receiptImg} alt="ใบเสร็จ" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                {selectedTxn.note && (
                  <div style={{ background: CC.surface, borderRadius: 14, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: CC.ink }}>
                    📝 {selectedTxn.note}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => { setEditLabel(selectedTxn.label); setEditNote(selectedTxn.note || ''); setEditAmt(Math.abs(selectedTxn.amt).toString()); setEditMode(true) }}
                    style={{ flex: 1, padding: '13px', borderRadius: 16, border: `1px solid ${CC.border}`, background: CC.surface, color: CC.ink, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                    ✏️ แก้ไข
                  </button>
                  <button
                    onClick={async () => {
                      if (deleting) return
                      setDeleting(true)
                      await onDeleteTxn?.(selectedTxn)
                      setDeleting(false)
                      setSelectedTxn(null)
                    }}
                    disabled={deleting}
                    style={{ flex: 1, padding: '13px', borderRadius: 16, border: 'none', background: CC.emberSoft, color: CC.ember, fontSize: 14, fontWeight: 700, cursor: deleting ? 'default' : 'pointer', fontFamily: FONT }}>
                    {deleting ? '⏳ กำลังลบ...' : '🗑️ ลบ'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>ชื่อรายการ</div>
                <input
                  type="text"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${CC.border}`, background: CC.surface, fontSize: 14, fontFamily: FONT, color: CC.ink, boxSizing: 'border-box', outline: 'none', marginBottom: 12 }}
                />
                <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>จำนวนเงิน (บาท)</div>
                <input
                  type="number"
                  value={editAmt}
                  onChange={e => setEditAmt(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${CC.border}`, background: CC.surface, fontSize: 14, fontFamily: FONT, color: CC.ink, boxSizing: 'border-box', outline: 'none', marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}
                />
                <div style={{ fontSize: 12, color: CC.walnut, marginBottom: 6 }}>หมายเหตุ</div>
                <input
                  type="text"
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="(ไม่มี)"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${CC.border}`, background: CC.surface, fontSize: 14, fontFamily: FONT, color: CC.ink, boxSizing: 'border-box', outline: 'none', marginBottom: 14 }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setEditMode(false)}
                    style={{ flex: 1, padding: '13px', borderRadius: 16, border: `1px solid ${CC.border}`, background: CC.surface, color: CC.walnut, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                    ยกเลิก
                  </button>
                  <button
                    onClick={async () => {
                      if (saving) return
                      setSaving(true)
                      const absAmt = parseFloat(editAmt) || Math.abs(selectedTxn.amt)
                      const newAmt = selectedTxn.amt >= 0 ? absAmt : -absAmt
                      await onEditTxn?.({ ...selectedTxn, label: editLabel.trim() || selectedTxn.label, note: editNote.trim() || null, amt: newAmt }, selectedTxn.amt)
                      setSaving(false)
                      setSelectedTxn(null)
                      setEditMode(false)
                    }}
                    disabled={saving}
                    style={{ flex: 1, padding: '13px', borderRadius: 16, border: 'none', background: CC.walnut, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: FONT }}>
                    {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
