import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  addDoc, onSnapshot, query, orderBy, arrayUnion, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

const familyDoc  = (code) => doc(db, 'families', code)
const familyTxns = (code) => collection(db, 'families', code, 'transactions')
const profileDoc = (uid)  => doc(db, 'userProfiles', uid)

export const familyLib = {
  async getUserFamilyCode(uid) {
    const snap = await getDoc(profileDoc(uid))
    return snap.exists() ? (snap.data().familyCode ?? null) : null
  },

  async getFamilyByCode(code) {
    const snap = await getDoc(familyDoc(code))
    return snap.exists() ? { code, ...snap.data() } : null
  },

  async createFamily(code, user) {
    const member = {
      uid: user.uid,
      name: user.displayName || 'ฉัน',
      photoURL: user.photoURL || null,
      isMe: true,
    }
    await setDoc(familyDoc(code), {
      code,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      members: [member],
    })
    await setDoc(profileDoc(user.uid), { familyCode: code }, { merge: true })
    return { code, members: [member], createdBy: user.uid }
  },

  async joinFamily(code, user) {
    const snap = await getDoc(familyDoc(code))
    if (!snap.exists()) return null
    const member = {
      uid: user.uid,
      name: user.displayName || 'ฉัน',
      photoURL: user.photoURL || null,
    }
    await updateDoc(familyDoc(code), { members: arrayUnion(member) })
    await setDoc(profileDoc(user.uid), { familyCode: code }, { merge: true })
    return { code, ...snap.data(), members: [...snap.data().members, member] }
  },

  subscribeTxns(code, callback) {
    const q = query(familyTxns(code), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ ...d.data(), _id: d.id })).reverse())
    })
  },

  async addTxn(code, txn) {
    await addDoc(familyTxns(code), { ...txn, createdAt: serverTimestamp() })
  },

  async leaveFamily(code, uid) {
    const snap = await getDoc(familyDoc(code))
    if (!snap.exists()) return
    const remaining = (snap.data().members || []).filter(m => m.uid !== uid)
    await updateDoc(familyDoc(code), { members: remaining })
    await setDoc(profileDoc(uid), { familyCode: null }, { merge: true })
  },

  async deleteFamily(code, uid) {
    const txnSnap = await getDocs(familyTxns(code))
    const batch = writeBatch(db)
    txnSnap.docs.forEach(d => batch.delete(d.ref))
    batch.delete(familyDoc(code))
    await batch.commit()
    await setDoc(profileDoc(uid), { familyCode: null }, { merge: true })
  },
}
