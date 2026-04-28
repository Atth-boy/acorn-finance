import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './lib/firebase'
import { storage } from './lib/storage'
import { familyLib } from './lib/family'
import { CC, FONT, PAPER } from './tokens'

const INIT_WALLETS = [
  { id: 'default', name: 'บัญชีหลัก', sub: 'บัญชีออมทรัพย์', amt: 0, ic: '🏦', tint: CC.mossSoft, tone: CC.moss, isDefault: true },
]
const INIT_FIXED = []

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
  const familyUnsubRef  = useRef(null)
  const processedRef    = useRef(new Set())

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null))
  }, [])

  useEffect(() => {
    if (!user) return
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
          await storage.upsertWallet(user.uid, { ...defaultWallet, amt: defaultWallet.amt - fe.amt })
          await storage.deleteFixed(user.uid, fe.id)
        }
      } else if (type === 'monthly') {
        if (fe.lastDeducted !== ymKey && today >= (fe.cutDay ?? 1)) {
          processedRef.current.add(fe.id)
          await storage.upsertWallet(user.uid, { ...defaultWallet, amt: defaultWallet.amt - fe.amt })
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

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const addTxn = async (txn) => {
    await storage.add(user.uid, txn)
    // Sync default wallet balance
    const defaultWallet = wallets.find(w => w.isDefault)
    if (defaultWallet) {
      await storage.upsertWallet(user.uid, { ...defaultWallet, amt: defaultWallet.amt + txn.amt })
    }
    // Saving mode: also add to target savings wallet
    if (txn.mode === 'saving' && txn.walletId) {
      const target = wallets.find(w => w.id === txn.walletId)
      if (target) await storage.upsertWallet(user.uid, { ...target, amt: target.amt + Math.abs(txn.amt) })
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
    await storage.deleteTxn(user.uid, txn._id)
    const defaultWallet = wallets.find(w => w.isDefault)
    if (defaultWallet) {
      await storage.upsertWallet(user.uid, { ...defaultWallet, amt: defaultWallet.amt - txn.amt })
    }
  }

  const editTxn = async (txn) => {
    const { _id, ...rest } = txn
    await storage.updateTxn(user.uid, _id, rest)
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
            onResetAll={async () => {
              await storage.resetAll(user.uid)
              window.location.reload()
            }}
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
