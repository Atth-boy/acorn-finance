import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  addDoc, onSnapshot, query, orderBy, arrayUnion, arrayRemove, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, firebaseStorage } from './firebase'

const businessDoc  = (code) => doc(db, 'businesses', code)
const businessTxns = (code) => collection(db, 'businesses', code, 'transactions')
const profileDoc   = (uid)  => doc(db, 'userProfiles', uid)

// Remove user from any business they're currently in — except `exceptCode`.
// Prevents ghost-member orphans when user creates/joins a new business
// without leaving the old one through Settings first.
async function releaseCurrentBusiness(uid, exceptCode) {
  const profileSnap = await getDoc(profileDoc(uid))
  const cur = profileSnap.exists() ? profileSnap.data().businessCode : null
  if (!cur || cur === exceptCode) return
  const bizSnap = await getDoc(businessDoc(cur))
  if (!bizSnap.exists()) return
  const mine = (bizSnap.data().members || []).filter(m => m.uid === uid)
  if (mine.length) await updateDoc(businessDoc(cur), { members: arrayRemove(...mine) })
}

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
    await releaseCurrentBusiness(user.uid, code)
    const member = {
      uid: user.uid,
      name: user.displayName || 'ฉัน',
      photoURL: user.photoURL || null,
      role: 'owner',
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
    await releaseCurrentBusiness(user.uid, code)
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

  subscribeBusiness(code, callback) {
    return onSnapshot(businessDoc(code), snap => {
      if (!snap.exists()) { callback(null); return }
      callback({ code, ...snap.data() })
    })
  },

  async addTxn(code, txn) {
    await addDoc(businessTxns(code), { ...txn, createdAt: serverTimestamp() })
  },

  async uploadReceipt(code, dataUrl, txnId) {
    const path    = `businesses/${code}/receipts/${txnId}`
    const fileRef = ref(firebaseStorage, path)
    await uploadString(fileRef, dataUrl, 'data_url')
    const url = await getDownloadURL(fileRef)
    return { url, path }
  },

  async updateBusinessTxn(code, txnId, updates) {
    await setDoc(doc(db, 'businesses', code, 'transactions', txnId), updates, { merge: true })
  },

  async deleteBusinessTxn(code, txnId, receiptPath) {
    if (receiptPath) {
      try { await deleteObject(ref(firebaseStorage, receiptPath)) } catch {}
    }
    await deleteDoc(doc(db, 'businesses', code, 'transactions', txnId))
  },

  async leaveBusiness(code, uid) {
    const snap = await getDoc(businessDoc(code))
    if (!snap.exists()) return
    // arrayRemove the exact member object(s) matching this uid — atomic against
    // concurrent join/leave by other partners (also clears any duplicate entries).
    const mine = (snap.data().members || []).filter(m => m.uid === uid)
    if (mine.length) await updateDoc(businessDoc(code), { members: arrayRemove(...mine) })
    await setDoc(profileDoc(uid), { businessCode: null }, { merge: true })
  },

  async deleteBusiness(code, uid) {
    // Server-side guard: re-fetch to confirm caller is truly the last member.
    // Prevents accidental wipe when client state is stale (partner joined but UI not updated).
    const snap = await getDoc(businessDoc(code))
    if (!snap.exists()) {
      await setDoc(profileDoc(uid), { businessCode: null }, { merge: true })
      return { ok: true }
    }
    const others = (snap.data().members || []).filter(m => m.uid !== uid)
    if (others.length > 0) return { ok: false, reason: 'has_other_members' }

    const txnSnap = await getDocs(businessTxns(code))
    // Cleanup receipt files before wiping txn docs — best-effort, ignore failures
    await Promise.all(txnSnap.docs.map(async d => {
      const path = d.data().receiptPath
      if (path) { try { await deleteObject(ref(firebaseStorage, path)) } catch {} }
    }))
    const batch = writeBatch(db)
    txnSnap.docs.forEach(d => batch.delete(d.ref))
    batch.delete(businessDoc(code))
    await batch.commit()
    await setDoc(profileDoc(uid), { businessCode: null }, { merge: true })
    return { ok: true }
  },
}
