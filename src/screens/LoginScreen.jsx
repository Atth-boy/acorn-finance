import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { CC, DISPLAY, FONT, PAPER } from '../tokens'
import { Squirrel } from '../components/Squirrel'

export function LoginScreen() {
  const login = () => signInWithPopup(auth, googleProvider)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: CC.bg, backgroundImage: PAPER, backgroundBlendMode: 'multiply',
      fontFamily: FONT, color: CC.ink,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, gap: 0,
    }}>
      <Squirrel size={140} mood="happy" />

      <div style={{ marginTop: 20, fontSize: 26, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -0.3, textAlign: 'center' }}>
        กระรอกน้อยนักสะสม
      </div>
      <div style={{ marginTop: 8, fontSize: 14, color: CC.ink2, fontStyle: 'italic', textAlign: 'center' }}>
        เก็บลูกโอ๊กทุกบาท ทุกสตางค์
      </div>

      <button
        onClick={login}
        style={{
          marginTop: 52, width: '100%', maxWidth: 280, height: 52,
          borderRadius: 18, background: CC.walnut, color: '#fff', border: 'none',
          fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
          boxShadow: '0 6px 18px rgba(122,79,42,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        <GoogleIcon />
        เข้าสู่ระบบด้วย Google
      </button>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.1 29.2 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 28.9 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19 19-8.5 19-19c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 28.9 5 24 5 16.3 5 9.7 9.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43c4.8 0 9.2-1.9 12.5-4.9l-5.8-4.9C28.9 34.7 26.6 35.5 24 35.5c-5.1 0-9.5-2.8-11.3-6.9l-6.5 5C9.5 39.3 16.3 43 24 43z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.9 2.4-2.5 4.5-4.5 6l5.8 4.9C42.9 36.4 44 31.5 44 26c0-2-.2-3.9-.4-5.9z" />
    </svg>
  )
}
