import {
  collection, addDoc, getDocs, onSnapshot,
  query, orderBy, serverTimestamp, writeBatch, doc,
} from 'firebase/firestore'
import { db } from './firebase'

const SEED = [
  { label: 'กาแฟ',      cat: 'กาแฟ',    ic: '☕', amt: -85, time: '08:30', tag: 'รายวัน' },
  { label: 'ก๋วยเตี๋ยว', cat: 'อาหาร',  ic: '🍜', amt: -65, time: '12:15', tag: 'รายวัน' },
  { label: 'BTS',       cat: 'เดินทาง', ic: '🚇', amt: -44, time: '17:45', tag: 'รายวัน' },
]

function txnCol(uid) {
  return collection(db, 'users', uid, 'transactions')
}

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
    SEED.forEach(s => batch.set(doc(txnCol(uid)), { ...s, id: Date.now(), createdAt: serverTimestamp() }))
    await batch.commit()
  },

  async reset(uid) {
    const snap = await getDocs(txnCol(uid))
    const batch = writeBatch(db)
    snap.docs.forEach(d => batch.delete(d.ref))
    SEED.forEach(s => batch.set(doc(txnCol(uid)), { ...s, id: Date.now(), createdAt: serverTimestamp() }))
    await batch.commit()
  },
}
