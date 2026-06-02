import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './lib/firebase'
import { storage } from './lib/storage'
import { familyLib } from './lib/family'
import { businessLib } from './lib/business'
import { sharedRoomsLib } from './lib/sharedRooms'
import { CC, FONT, PAPER } from './tokens'

// ข้อความจริง (รอด minify) — ใช้เป็น marker เวอร์ชัน เพื่อให้ bundle เปลี่ยน hash
// เวลามี deploy ใหม่ → service worker ใหม่ → prompt อัปเดตเด้ง
const APP_VERSION = 'v0.1.3'

const INIT_WALLETS = [
  { id: 'default', name: 'บัญชีหลัก', sub: 'บัญชีออมทรัพย์', amt: 0, ic: '🏦', tint: CC.mossSoft, tone: CC.moss, isDefault: true },
]
const INIT_FIXED = []

import { LoginScreen }         from './screens/LoginScreen'
import { HomeScreen }          from './screens/HomeScreen'
import { EntryScreen }         from './screens/EntryScreen'
import { FamilyEntryScreen }   from './screens/FamilyEntryScreen'
import { BusinessEntryScreen } from './screens/BusinessEntryScreen'
import { WalletsScreen }       from './screens/WalletsScreen'
import { ReportsScreen }       from './screens/ReportsScreen'
import { SettingsScreen }      from './screens/SettingsScreen'
import { TabBar }  from './components/TabBar'
import { Toast }   from './components/Toast'
import { AnimatedSquirrel } from './components/AnimatedSquirrel'
import { UpdatePrompt } from './components/UpdatePrompt'

export default function App() {
  const [user, setUser]               = useState(undefined)
  const [tab, setTab]                 = useState('home')
  const [entryOpen, setEntryOpen]     = useState(false)
  const [txns, setTxns]               = useState([])
  const [toast, setToast]             = useState(null)

  // Shared wallet & fixed expense state — persisted in Firestore
  const [wallets,       setWallets]       = useState([])
  const [fixedExpenses, setFixedExpenses] = useState([])
  const [goal,          setGoal]          = useState(750000)

  // Wallet sub-page (0 = personal, 1 = shared rooms, 2 = family pot)
  const [walletSubPage, setWalletSubPage] = useState(0)
  const [rooms,         setRooms]         = useState([])
  const roomsUnsubRef = useRef(null)

  // Family pot — undefined=loading, null=ไม่มี family, object=มี family
  const [familyData,      setFamilyData]      = useState(undefined)
  const [familyEntryOpen, setFamilyEntryOpen] = useState(false)
  const [familyTxns, setFamilyTxns]           = useState([])
  const familyUnsubRef  = useRef(null)
  const processedRef    = useRef(new Set())

  // Business pool — undefined=loading, null=ไม่มี business, object=มี business
  const [businessData,      setBusinessData]      = useState(undefined)
  const [businessEntryOpen, setBusinessEntryOpen] = useState(false)
  const [businessTxns,      setBusinessTxns]      = useState([])
  const businessUnsubRef    = useRef(null)  // txns
  const businessDocUnsubRef = useRef(null)  // members/name (live)

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null))
  }, [])

  useEffect(() => {
    if (!user) {
      setTxns([]); setWallets([]); setFixedExpenses([])
      setGoal(750000); setFamilyData(null); setFamilyTxns([]); setRooms([])
      setBusinessData(null); setBusinessTxns([])
      processedRef.current = new Set()
      return
    }
    storage.seedWalletsIfEmpty(user.uid, INIT_WALLETS)
    storage.seedFixedIfEmpty(user.uid, INIT_FIXED)
    const unsubTxns     = storage.subscribe(user.uid, setTxns)
    const unsubWallets  = storage.subscribeWallets(user.uid, setWallets)
    const unsubFixed    = storage.subscribeFixed(user.uid, setFixedExpenses)
    const unsubSettings = storage.subscribeSettings(user.uid, s => {
      if (s.goal) setGoal(s.goal)
    })
    return () => { unsubTxns(); unsubWallets(); unsubFixed(); unsubSettings() }
  }, [user])

  // Process due scheduled / monthly fixed expenses
  useEffect(() => {
    if (!user || !wallets.length) return
    const defaultWallet = wallets.find(w => w.isDefault)
    if (!defaultWallet) return
    const now      = new Date()
    const today    = now.getDate()
    const ymKey    = `${now.getFullYear()}-${now.getMonth()}`
    fixedExpenses.forEach(async fe => {
      if (processedRef.current.has(fe.id)) return
      const type = fe.type || 'monthly'
      if (type === 'once') {
        const due = new Date(fe.dueDate); due.setHours(0,0,0,0)
        const todayD = new Date(); todayD.setHours(0,0,0,0)
        if (due <= todayD) {
          processedRef.current.add(fe.id)
          const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
          await storage.add(user.uid, {
            id: new Date(fe.dueDate).getTime(), label: fe.name, cat: 'ตั้งเวลา', ic: fe.ic,
            amt: -fe.amt, time: timeStr, mode: 'schedule', note: null, receiptImg: null,
          })
          await storage.incrementWalletAmt(user.uid, defaultWallet.id, -fe.amt)
          await storage.deleteFixed(user.uid, fe.id)
        }
      } else if (type === 'monthly') {
        if (fe.lastDeducted !== ymKey && today >= (fe.cutDay ?? 1)) {
          processedRef.current.add(fe.id)
          const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
          await storage.add(user.uid, {
            id: Date.now(), label: fe.name, cat: 'ทุกเดือน', ic: fe.ic,
            amt: -fe.amt, time: timeStr, mode: 'monthly', note: null, receiptImg: null,
          })
          await storage.incrementWalletAmt(user.uid, defaultWallet.id, -fe.amt)
          await storage.upsertFixed(user.uid, { ...fe, lastDeducted: ymKey })
        }
      }
    })
  }, [user, fixedExpenses, wallets])

  useEffect(() => {
    if (!user) return
    familyLib.getUserFamilyCode(user.uid).then(async code => {
      if (!code) { setFamilyData(null); return }
      const data = await familyLib.getFamilyByCode(code)
      if (!data) { setFamilyData(null); return }
      setFamilyData(data)
      familyUnsubRef.current = familyLib.subscribeTxns(code, setFamilyTxns)
    })
    return () => familyUnsubRef.current?.()
  }, [user])

  useEffect(() => {
    if (!user) return
    businessLib.getUserBusinessCode(user.uid).then(code => {
      if (!code) { setBusinessData(null); return }
      businessDocUnsubRef.current = businessLib.subscribeBusiness(code, setBusinessData)
      businessUnsubRef.current    = businessLib.subscribeTxns(code, setBusinessTxns)
    })
    return () => {
      businessDocUnsubRef.current?.()
      businessUnsubRef.current?.()
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    roomsUnsubRef.current = sharedRoomsLib.subscribeUserRooms(user.uid, setRooms)
    return () => { roomsUnsubRef.current?.(); setRooms([]) }
  }, [user])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const addTxn = async (txn) => {
    let finalTxn = txn
    if (txn.receiptImg?.startsWith('data:')) {
      const { url, path } = await storage.uploadReceipt(user.uid, txn.receiptImg, txn.id)
      finalTxn = { ...txn, receiptImg: url, receiptPath: path }
    }
    await storage.add(user.uid, finalTxn)
    // Sync default wallet balance
    const defaultWallet = wallets.find(w => w.isDefault)
    if (defaultWallet) {
      await storage.incrementWalletAmt(user.uid, defaultWallet.id, txn.amt)
    }
    // Saving mode: also add to target savings wallet
    if (txn.mode === 'saving' && txn.walletId) {
      await storage.incrementWalletAmt(user.uid, txn.walletId, Math.abs(txn.amt))
    }
    setEntryOpen(false)
    showToast('เก็บลงกรุแล้ว! 🌰')
  }

  const saveGoal = (g) => {
    setGoal(g)
    storage.setSetting(user.uid, 'goal', g)
  }

  const upsertWallet = (wallet) => {
    let w = wallet
    if (w._seq === undefined) {
      const maxSeq = wallets.reduce((m, x) => Math.max(m, x._seq ?? 0), -1)
      w = { ...w, _seq: maxSeq + 1 }
    }
    return storage.upsertWallet(user.uid, w)
  }
  const deleteWallet = (id)     => storage.deleteWallet(user.uid, id)
  const upsertFixed = (expense) => {
    let fe = expense
    if (fe._seq === undefined) {
      const maxSeq = fixedExpenses.reduce((m, x) => Math.max(m, x._seq ?? 0), -1)
      fe = { ...fe, _seq: maxSeq + 1 }
    }
    return storage.upsertFixed(user.uid, fe)
  }
  const deleteFixed  = (id) => storage.deleteFixed(user.uid, id)

  const deleteTxn = async (txn) => {
    await storage.deleteTxn(user.uid, txn._id, txn.receiptPath)
    const defaultWallet = wallets.find(w => w.isDefault)
    if (defaultWallet) {
      await storage.incrementWalletAmt(user.uid, defaultWallet.id, -txn.amt)
    }
    if (txn.mode === 'saving' && txn.walletId) {
      await storage.incrementWalletAmt(user.uid, txn.walletId, -Math.abs(txn.amt))
    }
  }

  const editTxn = async (txn, oldAmt) => {
    const { _id, ...rest } = txn
    await storage.updateTxn(user.uid, _id, rest)
    if (oldAmt !== undefined && txn.amt !== oldAmt) {
      const diff = txn.amt - oldAmt
      const defaultWallet = wallets.find(w => w.isDefault)
      if (defaultWallet) {
        await storage.incrementWalletAmt(user.uid, defaultWallet.id, diff)
      }
      if (txn.mode === 'saving' && txn.walletId) {
        const savingsDiff = Math.abs(txn.amt) - Math.abs(oldAmt)
        await storage.incrementWalletAmt(user.uid, txn.walletId, savingsDiff)
      }
    }
  }

  const addScheduledFixed = async (item) => {
    await upsertFixed(item)
    setEntryOpen(false)
    setTab('wallets')
    showToast('บันทึกรายการตั้งเวลาแล้ว 📅')
  }

  const addMonthlyFixed = async (item) => {
    await upsertFixed(item)
    setEntryOpen(false)
    setTab('wallets')
    showToast('บันทึกรายการประจำเดือนแล้ว 📆')
  }

  const addFamilyTxn = async (txn) => {
    if (!familyData?.code) return
    await familyLib.addTxn(familyData.code, txn)
    setFamilyEntryOpen(false)
    showToast('บันทึกกองกลางแล้ว! 🏡')
  }

  const editFamilyTxn = async (txn) => {
    if (!familyData?.code) return
    const { _id, ...rest } = txn
    await familyLib.updateFamilyTxn(familyData.code, _id, rest)
  }

  const deleteFamilyTxn = async (txn) => {
    if (!familyData?.code) return
    await familyLib.deleteFamilyTxn(familyData.code, txn._id)
  }

  const handleCreateFamily = async () => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const data = await familyLib.createFamily(code, user)
    setFamilyData(data)
    familyUnsubRef.current?.()
    familyUnsubRef.current = familyLib.subscribeTxns(code, setFamilyTxns)
  }

  const handleJoinFamily = async (code) => {
    const data = await familyLib.joinFamily(code.trim().toUpperCase(), user)
    if (!data) return false
    setFamilyData(data)
    familyUnsubRef.current?.()
    familyUnsubRef.current = familyLib.subscribeTxns(data.code, setFamilyTxns)
    return true
  }

  const handleCreateRoom = async (name, type, ic) => {
    const code = sharedRoomsLib.genCode()
    await sharedRoomsLib.createRoom(code, { name, type, ic }, user)
    return code
  }

  const handleJoinRoom = async (code) => {
    return await sharedRoomsLib.joinRoom(code.trim().toUpperCase(), user)
  }

  const handleLeaveRoom = async (code) => {
    return await sharedRoomsLib.leaveRoom(code, user.uid)
  }

  const handleAddRoomTxn = async (code, txn) => {
    await sharedRoomsLib.addTxn(code, txn)
  }

  const handleUserRefresh = () => {
    if (auth.currentUser) setUser(u => ({ ...u, displayName: auth.currentUser.displayName }))
  }

  const handleFamilyLeft = () => {
    familyUnsubRef.current?.()
    familyUnsubRef.current = null
    setFamilyData(null)
    setFamilyTxns([])
  }

  const addBusinessTxn = async (txn) => {
    if (!businessData?.code) return
    let finalTxn = txn
    if (txn.receiptImg?.startsWith('data:')) {
      const { url, path } = await businessLib.uploadReceipt(businessData.code, txn.receiptImg, txn.id)
      finalTxn = { ...txn, receiptImg: url, receiptPath: path }
    }
    await businessLib.addTxn(businessData.code, finalTxn)
    setBusinessEntryOpen(false)
    showToast('บันทึกคลังธุรกิจแล้ว! 💼')
  }

  const editBusinessTxn = async (txn) => {
    if (!businessData?.code) return
    const { _id, ...rest } = txn
    await businessLib.updateBusinessTxn(businessData.code, _id, rest)
  }

  const deleteBusinessTxn = async (txn) => {
    if (!businessData?.code) return
    await businessLib.deleteBusinessTxn(businessData.code, txn._id, txn.receiptPath)
  }

  const handleCreateBusiness = async (name) => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const data = await businessLib.createBusiness(code, user, name)
    setBusinessData(data)
    businessDocUnsubRef.current?.()
    businessUnsubRef.current?.()
    businessDocUnsubRef.current = businessLib.subscribeBusiness(code, setBusinessData)
    businessUnsubRef.current    = businessLib.subscribeTxns(code, setBusinessTxns)
  }

  const handleJoinBusiness = async (code) => {
    const data = await businessLib.joinBusiness(code.trim().toUpperCase(), user)
    if (!data) return false
    setBusinessData(data)
    businessDocUnsubRef.current?.()
    businessUnsubRef.current?.()
    businessDocUnsubRef.current = businessLib.subscribeBusiness(data.code, setBusinessData)
    businessUnsubRef.current    = businessLib.subscribeTxns(data.code, setBusinessTxns)
    return true
  }

  const handleBusinessLeft = () => {
    businessDocUnsubRef.current?.()
    businessUnsubRef.current?.()
    businessDocUnsubRef.current = null
    businessUnsubRef.current    = null
    setBusinessData(null)
    setBusinessTxns([])
  }

  const handleTabChange = (newTab) => {
    if (newTab !== 'wallets') setWalletSubPage(0)
    setTab(newTab)
  }

  if (user === undefined) return <LoadingScreen />
  if (!user) return <LoginScreen />

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#2A1F12',
      display: 'flex', justifyContent: 'center',
      fontFamily: FONT,
    }}>
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 430,
        height: '100%',
        background: CC.bg,
        backgroundImage: PAPER,
        backgroundBlendMode: 'multiply',
        overflow: 'hidden',
        color: CC.ink,
      }}>
        {tab === 'home'     && <HomeScreen txns={txns} user={user} wallets={wallets} fixedExpenses={fixedExpenses} onDeleteTxn={deleteTxn} onEditTxn={editTxn} />}
        {tab === 'wallets'  && (
          <WalletsScreen
            txns={txns}
            user={user}
            wallets={wallets}
            fixedExpenses={fixedExpenses}
            goal={goal}
            onSetGoal={saveGoal}
            onUpsertWallet={upsertWallet}
            onDeleteWallet={deleteWallet}
            onSaveFixed={upsertFixed}
            onDeleteFixed={deleteFixed}
            familyData={familyData}
            familyTxns={familyTxns}
            onEditFamilyTxn={editFamilyTxn}
            onDeleteFamilyTxn={deleteFamilyTxn}
            onCreateFamily={handleCreateFamily}
            onJoinFamily={handleJoinFamily}
            businessData={businessData}
            businessTxns={businessTxns}
            onEditBusinessTxn={editBusinessTxn}
            onDeleteBusinessTxn={deleteBusinessTxn}
            onCreateBusiness={handleCreateBusiness}
            onJoinBusiness={handleJoinBusiness}
            onPageChange={setWalletSubPage}
            rooms={rooms}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onAddRoomTxn={handleAddRoomTxn}
          />
        )}
        {tab === 'reports'  && <ReportsScreen txns={txns} familyTxns={familyTxns} businessTxns={businessTxns} user={user} onEditTxn={editTxn} onDeleteTxn={deleteTxn} onEditFamilyTxn={editFamilyTxn} onDeleteFamilyTxn={deleteFamilyTxn} onEditBusinessTxn={editBusinessTxn} onDeleteBusinessTxn={deleteBusinessTxn} />}
        {tab === 'settings' && (
          <SettingsScreen
            txns={txns}
            user={user}
            onSignOut={() => signOut(auth)}
            onReset={() => storage.reset(user.uid)}
            onResetAll={async () => {
              await storage.resetAll(user.uid)
              window.location.reload()
            }}
            rooms={rooms}
            onLeaveRoom={handleLeaveRoom}
            familyData={familyData}
            onLeaveFamily={handleFamilyLeft}
            businessData={businessData}
            onLeaveBusiness={handleBusinessLeft}
            onUserRefresh={handleUserRefresh}
          />
        )}

        {entryOpen && (
          <EntryScreen
            addTxn={addTxn}
            addScheduledFixed={addScheduledFixed}
            addMonthlyFixed={addMonthlyFixed}
            close={() => setEntryOpen(false)}
            wallets={wallets}
          />
        )}

        {familyEntryOpen && (
          <FamilyEntryScreen addFamilyTxn={addFamilyTxn} close={() => setFamilyEntryOpen(false)} user={user} />
        )}

        {businessEntryOpen && (
          <BusinessEntryScreen addBusinessTxn={addBusinessTxn} close={() => setBusinessEntryOpen(false)} user={user} />
        )}

        {!entryOpen && !familyEntryOpen && !businessEntryOpen && (
          <TabBar
            active={tab}
            onChange={handleTabChange}
            onAdd={() => setEntryOpen(true)}
            walletSubPage={walletSubPage}
            onFamilyAdd={() => setFamilyEntryOpen(true)}
            onBusinessAdd={() => setBusinessEntryOpen(true)}
          />
        )}

        {toast && <Toast message={toast} />}
      </div>

      <UpdatePrompt />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 18,
      background: CC.bg, backgroundImage: PAPER, backgroundBlendMode: 'multiply',
      fontFamily: FONT, padding: 24, textAlign: 'center',
    }}>
      <AnimatedSquirrel mode="greet" size={200} />
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: CC.walnut, letterSpacing: 0.3 }}>
          ยินดีต้อนรับ
        </div>
        <div style={{ fontSize: 17, fontWeight: 500, color: CC.ink2, marginTop: 4 }}>
          มาเก็บลูกโอ๊กกัน
        </div>
      </div>
      <div style={{
        position: 'absolute', bottom: 'calc(var(--sab) + 14px)',
        fontSize: 11, color: CC.ink3, letterSpacing: 0.5,
      }}>
        {APP_VERSION}
      </div>
    </div>
  )
}
