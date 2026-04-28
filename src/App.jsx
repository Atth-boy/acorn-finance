import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './lib/firebase'
import { storage } from './lib/storage'
import { familyLib } from './lib/family'
import { CC, FONT, PAPER } from './tokens'

const INIT_WALLETS = [
  { id: 'kbank', name: 'กสิกรไทย', sub: 'บัญชีออมทรัพย์', amt: 184320, ic: '🏦', tint: CC.mossSoft,   tone: CC.moss,   isDefault: true },
  { id: 'scb',   name: 'SCB Easy',  sub: 'กระแสรายวัน',    amt: 22150,  ic: '🏦', tint: CC.amberSoft,  tone: CC.amber  },
  { id: 'cash',  name: 'เงินสด',    sub: 'กระเป๋าใบโปรด',  amt: 1850,   ic: '👛', tint: CC.walnutSoft, tone: CC.walnut },
  { id: 'ktc',   name: 'KTC Visa',  sub: 'หนี้บัตรเครดิต', amt: -8420,  ic: '💳', tint: CC.emberSoft,  tone: CC.ember  },
]
const INIT_FIXED = [
  { id: 'rent', name: 'ค่าเช่า',     amt: 8500, cutDay: 1,  ic: '🏠' },
  { id: 'nflx', name: 'Netflix',     amt: 279,  cutDay: 15, ic: '📺' },
  { id: 'ins',  name: 'ประกันชีวิต', amt: 2400, cutDay: 20, ic: '🛡️' },
]

import { LoginScreen }       from './screens/LoginScreen'
import { HomeScreen }        from './screens/HomeScreen'
import { EntryScreen }       from './screens/EntryScreen'
import { FamilyEntryScreen } from './screens/FamilyEntryScreen'
import { WalletsScreen }     from './screens/WalletsScreen'
import { ReportsScreen }     from './screens/ReportsScreen'
import { SettingsScreen }    from './screens/SettingsScreen'
import { TabBar }  from './components/TabBar'
import { Toast }   from './components/Toast'

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

  // Family pot — undefined=loading, null=ไม่มี family, object=มี family
  const [familyData,      setFamilyData]      = useState(undefined)
  const [familyEntryOpen, setFamilyEntryOpen] = useState(false)
  const [familyTxns, setFamilyTxns]           = useState([])
  const familyUnsubRef = useRef(null)

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null))
  }, [])

  useEffect(() => {
    if (!user) return
    storage.seedIfEmpty(user.uid)
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

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const addTxn = async (txn) => {
    await storage.add(user.uid, txn)
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
  const deleteFixed  = (id)      => storage.deleteFixed(user.uid, id)

  const addFamilyTxn = async (txn) => {
    if (!familyData?.code) return
    await familyLib.addTxn(familyData.code, txn)
    setFamilyEntryOpen(false)
    showToast('บันทึกกองกลางแล้ว! 🏡')
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
        {tab === 'home'     && <HomeScreen txns={txns} user={user} wallets={wallets} fixedExpenses={fixedExpenses} />}
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
            onCreateFamily={handleCreateFamily}
            onJoinFamily={handleJoinFamily}
            onPageChange={setWalletSubPage}
          />
        )}
        {tab === 'reports'  && <ReportsScreen txns={txns} familyTxns={familyTxns} user={user} />}
        {tab === 'settings' && (
          <SettingsScreen
            txns={txns}
            user={user}
            onSignOut={() => signOut(auth)}
            onReset={() => storage.reset(user.uid)}
          />
        )}

        {entryOpen && (
          <EntryScreen addTxn={addTxn} close={() => setEntryOpen(false)} wallets={wallets} />
        )}

        {familyEntryOpen && (
          <FamilyEntryScreen addFamilyTxn={addFamilyTxn} close={() => setFamilyEntryOpen(false)} />
        )}

        {!entryOpen && !familyEntryOpen && (
          <TabBar
            active={tab}
            onChange={handleTabChange}
            onAdd={() => setEntryOpen(true)}
            walletSubPage={walletSubPage}
            onFamilyAdd={() => setFamilyEntryOpen(true)}
          />
        )}

        {toast && <Toast message={toast} />}
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: CC.bg, backgroundImage: PAPER, backgroundBlendMode: 'multiply',
      fontSize: 48,
    }}>
      🌰
    </div>
  )
}
