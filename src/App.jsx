import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './lib/firebase'
import { storage } from './lib/storage'
import { CC, FONT, PAPER } from './tokens'

import { LoginScreen }   from './screens/LoginScreen'
import { HomeScreen }    from './screens/HomeScreen'
import { EntryScreen }   from './screens/EntryScreen'
import { WalletsScreen } from './screens/WalletsScreen'
import { ReportsScreen } from './screens/ReportsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TabBar } from './components/TabBar'
import { Toast }  from './components/Toast'

export default function App() {
  const [user, setUser]           = useState(undefined) // undefined = loading
  const [tab, setTab]             = useState('home')
  const [entryOpen, setEntryOpen] = useState(false)
  const [txns, setTxns]           = useState([])
  const [toast, setToast]         = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null))
  }, [])

  useEffect(() => {
    if (!user) return
    storage.seedIfEmpty(user.uid)
    return storage.subscribe(user.uid, setTxns)
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
        {tab === 'home'     && <HomeScreen    txns={txns} user={user} />}
        {tab === 'wallets'  && <WalletsScreen txns={txns} user={user} />}
        {tab === 'reports'  && <ReportsScreen txns={txns} user={user} />}
        {tab === 'settings' && (
          <SettingsScreen
            txns={txns}
            user={user}
            onSignOut={() => signOut(auth)}
            onReset={() => storage.reset(user.uid)}
          />
        )}

        {entryOpen && (
          <EntryScreen
            addTxn={addTxn}
            close={() => setEntryOpen(false)}
          />
        )}

        {!entryOpen && (
          <TabBar
            active={tab}
            onChange={setTab}
            onAdd={() => setEntryOpen(true)}
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
