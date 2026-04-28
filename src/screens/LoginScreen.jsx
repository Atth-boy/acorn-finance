import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { CC, DISPLAY, FONT, PAPER } from '../tokens'
import { Squirrel } from '../components/Squirrel'

const toEmail = (username) => `${username.trim().toLowerCase()}@acorn.app`

const ERROR_MAP = {
  'auth/user-not-found':      'ไม่พบชื่อผู้ใช้นี้',
  'auth/wrong-password':      'รหัสผ่านไม่ถูกต้อง',
  'auth/invalid-credential':  'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
  'auth/email-already-in-use':'ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว',
  'auth/weak-password':       'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
  'auth/too-many-requests':   'พยายามหลายครั้งเกินไป กรุณารอสักครู่',
}

export function LoginScreen() {
  const [mode,     setMode]     = useState('login')   // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const clearError = () => setError('')

  const validate = () => {
    if (!username.trim())                          return 'กรุณากรอกชื่อผู้ใช้'
    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(username)) return 'ชื่อผู้ใช้ใช้ได้แค่ a-z 0-9 . _ - (3–20 ตัว)'
    if (!password)                                 return 'กรุณากรอกรหัสผ่าน'
    if (mode === 'register' && password !== confirm) return 'รหัสผ่านไม่ตรงกัน'
    return null
  }

  const submit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError('')
    try {
      const email = toEmail(username)
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: username.trim() })
      }
    } catch (e) {
      setError(ERROR_MAP[e.code] || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError(''); setPassword(''); setConfirm('')
  }

  const inp = {
    width: '100%', padding: '13px 16px', borderRadius: 16,
    border: `1.5px solid ${CC.border}`, background: CC.surface,
    fontSize: 15, fontFamily: FONT, color: CC.ink,
    boxSizing: 'border-box', outline: 'none',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: CC.bg, backgroundImage: PAPER, backgroundBlendMode: 'multiply',
      fontFamily: FONT, color: CC.ink,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 32px',
    }}>
      <Squirrel size={110} mood="happy" />

      <div style={{ marginTop: 16, fontSize: 24, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -0.3, textAlign: 'center' }}>
        กระรอกน้อยนักสะสม
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: CC.ink2, fontStyle: 'italic', textAlign: 'center' }}>
        {mode === 'login' ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}
      </div>

      <div style={{ width: '100%', maxWidth: 320, marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="text"
          placeholder="ชื่อผู้ใช้"
          value={username}
          onChange={e => { setUsername(e.target.value); clearError() }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoCapitalize="none"
          autoCorrect="off"
          style={inp}
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={e => { setPassword(e.target.value); clearError() }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={inp}
        />
        {mode === 'register' && (
          <input
            type="password"
            placeholder="ยืนยันรหัสผ่าน"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); clearError() }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={inp}
          />
        )}

        {error && (
          <div style={{ fontSize: 12, color: CC.ember, textAlign: 'center', padding: '4px 0' }}>
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 4, width: '100%', height: 52, borderRadius: 18,
            background: loading ? CC.border : CC.walnut,
            color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            fontFamily: FONT, transition: 'background 0.2s',
            boxShadow: loading ? 'none' : '0 6px 18px rgba(122,79,42,0.35)',
          }}
        >
          {loading ? '⏳ กำลังดำเนินการ...' : mode === 'login' ? '🌰 เข้าสู่ระบบ' : '🐿️ สร้างบัญชี'}
        </button>
      </div>

      <button
        onClick={switchMode}
        style={{
          marginTop: 20, background: 'none', border: 'none',
          color: CC.walnut, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: FONT,
        }}
      >
        {mode === 'login' ? 'ยังไม่มีบัญชี? สร้างใหม่' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
      </button>
    </div>
  )
}
