import {
  collection, addDoc, getDocs, onSnapshot,
  query, orderBy, serverTimestamp, writeBatch, doc,
  setDoc, deleteDoc,
} from 'firebase/firestore'
import { db } from './firebase'

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.getTime()
}

const SEED = [
  { label: 'กาแฟ',       cat: 'กาแฟ',    ic: '☕', amt: -85,   time: '08:30', id: daysAgo(0) },
  { label: 'ก๋วยเตี๋ยว',  cat: 'อาหาร',  ic: '🍜', amt: -65,   time: '12:15', id: daysAgo(0) },
  { label: 'BTS',        cat: 'เดินทาง', ic: '🚇', amt: -44,   time: '17:45', id: daysAgo(0) },
  { label: 'กาแฟ',       cat: 'กาแฟ',    ic: '☕', amt: -90,   time: '09:00', id: daysAgo(1) },
  { label: 'ข้าวมันไก่',  cat: 'อาหาร',  ic: '🍜', amt: -70,   time: '11:30', id: daysAgo(1) },
  { label: 'Grab',       cat: 'เดินทาง', ic: '🚇', amt: -120,  time: '18:20', id: daysAgo(1) },
  { label: 'ช้อปปิ้ง',   cat: 'ช้อป',   ic: '🛍️', amt: -890,  time: '14:00', id: daysAgo(2) },
  { label: 'กาแฟ',       cat: 'กาแฟ',    ic: '☕', amt: -75,   time: '08:15', id: daysAgo(2) },
  { label: 'ค่าน้ำค่าไฟ', cat: 'บ้าน',   ic: '🏠', amt: -1200, time: '10:00', id: daysAgo(3) },
  { label: 'สลัด',       cat: 'อาหาร',  ic: '🍜', amt: -95,   time: '13:00', id: daysAgo(3) },
  { label: 'เงินเดือน',   cat: 'รับเข้า', ic: '💰', amt: 32000, time: '09:00', id: daysAgo(4) },
  { label: 'กาแฟ',       cat: 'กาแฟ',    ic: '☕', amt: -85,   time: '08:30', id: daysAgo(4) },
  { label: 'ก๋วยเตี๋ยว',  cat: 'อาหาร',  ic: '🍜', amt: -55,   time: '12:00', id: daysAgo(5) },
  { label: 'BTS',        cat: 'เดินทาง', ic: '🚇', amt: -44,   time: '17:30', id: daysAgo(5) },
  { label: 'ข้าวผัด',    cat: 'อาหาร',  ic: '🍜', amt: -60,   time: '19:00', id: daysAgo(6) },
]

function txnCol(uid)        { return collection(db, 'users', uid, 'transactions') }
function walletDoc(uid, id) { return doc(db, 'users', uid, 'wallets', id) }
function walletCol(uid)     { return collection(db, 'users', uid, 'wallets') }
function fixedDoc(uid, id)  { return doc(db, 'users', uid, 'fixedExpenses', id) }
function fixedCol(uid)      { return collection(db, 'users', uid, 'fixedExpenses') }

export const storage = {
  subscribe(uid, callback) {
    const q = query(txnCol(uid), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ ...d.data(), _id: d.id })))
    })
  },

  async add(uid, txn) {
    await addDoc(txnCol(uid), { ...txn, createdAt: serverTimestamp() })
  },

  async seedIfEmpty(uid) {
    const snap = await getDocs(txnCol(uid))
    if (!snap.empty) return
    const batch = writeBatch(db)
    SEED.forEach(s => batch.set(doc(txnCol(uid)), { ...s, createdAt: serverTimestamp() }))
    await batch.commit()
  },

  async deleteTxn(uid, txnId) {
    await deleteDoc(doc(db, 'users', uid, 'transactions', txnId))
  },

  async reset(uid) {
    const snap = await getDocs(txnCol(uid))
    const batch = writeBatch(db)
    snap.docs.forEach(d => batch.delete(d.ref))
    SEED.forEach(s => batch.set(doc(txnCol(uid)), { ...s, createdAt: serverTimestamp() }))
    await batch.commit()
  },

  subscribeWallets(uid, callback) {
    return onSnapshot(walletCol(uid), snap => {
      const wallets = snap.docs.map(d => ({ ...d.data(), id: d.id }))
      wallets.sort((a, b) => (a._seq ?? 99) - (b._seq ?? 99))
      callback(wallets)
    })
  },

  subscribeFixed(uid, callback) {
    return onSnapshot(fixedCol(uid), snap => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id }))
      items.sort((a, b) => (a._seq ?? 99) - (b._seq ?? 99))
      callback(items)
    })
  },

  async upsertWallet(uid, wallet) {
    const { id, ...rest } = wallet
    await setDoc(walletDoc(uid, id), rest)
  },

  async deleteWallet(uid, id) {
    await deleteDoc(walletDoc(uid, id))
  },

  async upsertFixed(uid, expense) {
    const { id, ...rest } = expense
    await setDoc(fixedDoc(uid, id), rest)
  },

  async deleteFixed(uid, id) {
    await deleteDoc(fixedDoc(uid, id))
  },

  async seedWalletsIfEmpty(uid, seeds) {
    const snap = await getDocs(walletCol(uid))
    if (!snap.empty) return
    const batch = writeBatch(db)
    seeds.forEach((w, i) => {
      const { id, ...rest } = w
      batch.set(walletDoc(uid, id), { ...rest, _seq: i })
    })
    await batch.commit()
  },

  async seedFixedIfEmpty(uid, seeds) {
    if (!seeds.length) return
    const snap = await getDocs(fixedCol(uid))
    if (!snap.empty) return
    const batch = writeBatch(db)
    seeds.forEach((fe, i) => {
      const { id, ...rest } = fe
      batch.set(fixedDoc(uid, id), { ...rest, _seq: i })
    })
    await batch.commit()
  },

  async resetAll(uid) {
    const [txnSnap, walletSnap, fixedSnap] = await Promise.all([
      getDocs(txnCol(uid)),
      getDocs(walletCol(uid)),
      getDocs(fixedCol(uid)),
    ])
    const batch = writeBatch(db)
    txnSnap.docs.forEach(d => batch.delete(d.ref))
    walletSnap.docs.forEach(d => batch.delete(d.ref))
    fixedSnap.docs.forEach(d => batch.delete(d.ref))
    batch.delete(doc(db, 'users', uid, 'settings', 'prefs'))
    await batch.commit()
  },

  subscribeSettings(uid, callback) {
    return onSnapshot(doc(db, 'users', uid, 'settings', 'prefs'), snap => {
      callback(snap.exists() ? snap.data() : {})
    })
  },

  async setSetting(uid, key, value) {
    await setDoc(doc(db, 'users', uid, 'settings', 'prefs'), { [key]: value }, { merge: true })
  },
}
