import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  addDoc, onSnapshot, query, orderBy, arrayUnion, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

const businessDoc  = (code) => doc(db, 'businesses', code)
const businessTxns = (code) => collection(db, 'businesses', code, 'transactions')
const profileDoc   = (uid)  => doc(db, 'userProfiles', uid)

export const businessLib = {
  async getUserBusinessCode(uid) {
    const snap = await getDoc(profileDoc(uid))
    return snap.exists() ? (snap.data().businessCode ?? null) : null
  },

  async getBusinessByCode(code) {
    const snap = await getDoc(businessDoc(code))
    return snap.exists() ? { code, ...snap.data() } : null
  },

  async createBusiness(code, user, name = 'ธุรกิจของฉัน') {
    const member = {
      uid: user.uid,
      name: user.displayName || 'ฉัน',
      photoURL: user.photoURL || null,
      role: 'owner',
      isMe: true,
    }
    await setDoc(businessDoc(code), {
      code,
      name,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      members: [member],
    })
    await setDoc(profileDoc(user.uid), { businessCode: code }, { merge: true })
    return { code, name, members: [member], createdBy: user.uid }
  },

  async joinBusiness(code, user) {
    const snap = await getDoc(businessDoc(code))
    if (!snap.exists()) return null
    const member = {
      uid: user.uid,
      name: user.displayName || 'ฉัน',
      photoURL: user.photoURL || null,
      role: 'partner',
    }
    await updateDoc(businessDoc(code), { members: arrayUnion(member) })
    await setDoc(profileDoc(user.uid), { businessCode: code }, { merge: true })
    return { code, ...snap.data(), members: [...snap.data().members, member] }
  },

  subscribeTxns(code, callback) {
    const q = query(businessTxns(code), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ ...d.data(), _id: d.id })).reverse())
    })
  },

  async addTxn(code, txn) {
    await addDoc(businessTxns(code), { ...txn, createdAt: serverTimestamp() })
  },

  async updateBusinessTxn(code, txnId, updates) {
    await setDoc(doc(db, 'businesses', code, 'transactions', txnId), updates, { merge: true })
  },

  async deleteBusinessTxn(code, txnId) {
    await deleteDoc(doc(db, 'businesses', code, 'transactions', txnId))
  },

  async leaveBusiness(code, uid) {
    const snap = await getDoc(businessDoc(code))
    if (!snap.exists()) return
    const remaining = (snap.data().members || []).filter(m => m.uid !== uid)
    await updateDoc(businessDoc(code), { members: remaining })
    await setDoc(profileDoc(uid), { businessCode: null }, { merge: true })
  },

  async deleteBusiness(code, uid) {
    const txnSnap = await getDocs(businessTxns(code))
    const batch = writeBatch(db)
    txnSnap.docs.forEach(d => batch.delete(d.ref))
    batch.delete(businessDoc(code))
    await batch.commit()
    await setDoc(profileDoc(uid), { businessCode: null }, { merge: true })
  },
}
