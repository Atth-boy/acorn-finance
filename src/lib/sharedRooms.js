import {
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
  onSnapshot, query, orderBy, where, arrayUnion, increment,
  serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

const roomDoc  = (code) => doc(db, 'sharedRooms', code)
const txnCol   = (code) => collection(db, 'sharedRooms', code, 'transactions')

const MEMBER_COLORS = ['#5A6B3B', '#7A4F2A', '#C8924A', '#7B4A1A', '#A47148', '#8B5A3C']

export const sharedRoomsLib = {
  genCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase()
  },

  async createRoom(code, { name, type, ic }, user) {
    const member = { uid: user.uid, name: user.displayName || user.email?.replace('@acorn.app', '') || 'ฉัน', bg: MEMBER_COLORS[0] }
    await setDoc(roomDoc(code), {
      code, name, type, ic,
      members: [member],
      memberUids: [user.uid],
      balance: 0,
      lastTxn: null,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    })
  },

  async joinRoom(code, user) {
    const snap = await getDoc(roomDoc(code))
    if (!snap.exists()) return false
    const data = snap.data()
    if ((data.memberUids || []).includes(user.uid)) return true
    const colorIdx = (data.members || []).length % MEMBER_COLORS.length
    const member = { uid: user.uid, name: user.displayName || user.email?.replace('@acorn.app', '') || 'ฉัน', bg: MEMBER_COLORS[colorIdx] }
    await updateDoc(roomDoc(code), {
      members: arrayUnion(member),
      memberUids: arrayUnion(user.uid),
    })
    return true
  },

  subscribeUserRooms(uid, callback) {
    const q = query(collection(db, 'sharedRooms'), where('memberUids', 'array-contains', uid))
    return onSnapshot(q, snap => {
      const rooms = snap.docs.map(d => {
        const data = d.data()
        return {
          ...data,
          id: d.id,
          members: (data.members || []).map(m => ({ ...m, isMe: m.uid === uid })),
        }
      })
      callback(rooms)
    })
  },

  subscribeRoomTxns(code, callback) {
    const q = query(txnCol(code), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ ...d.data(), _id: d.id })))
    })
  },

  async addTxn(code, txn) {
    await addDoc(txnCol(code), { ...txn, createdAt: serverTimestamp() })
    await updateDoc(roomDoc(code), {
      balance: increment(txn.amt),
      lastTxn: { label: txn.label, amt: txn.amt, by: txn.by, ic: txn.ic },
    })
  },

  async leaveRoom(code, uid) {
    const snap = await getDoc(roomDoc(code))
    if (!snap.exists()) return 'not_found'
    const data = snap.data()
    const remainingUids = (data.memberUids || []).filter(u => u !== uid)
    if (remainingUids.length === 0) {
      const txnSnap = await import('firebase/firestore').then(({ getDocs }) => getDocs(txnCol(code)))
      const batch = writeBatch(db)
      txnSnap.docs.forEach(d => batch.delete(d.ref))
      batch.delete(roomDoc(code))
      await batch.commit()
      return 'deleted'
    }
    const remainingMembers = (data.members || []).filter(m => m.uid !== uid)
    await updateDoc(roomDoc(code), { members: remainingMembers, memberUids: remainingUids })
    return 'left'
  },
}
