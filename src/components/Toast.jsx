import { CC, DISPLAY } from '../tokens'
import { Acorn } from './Acorn'

export function Toast({ message }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(16px + var(--sat))', left: 20, right: 20,
      zIndex: 100,
      background: CC.moss, color: '#fff',
      borderRadius: 16, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 22px rgba(0,0,0,0.25)',
      animation: 'slideDown 0.3s ease',
    }}>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
      <Acorn size={20} color={CC.mossSoft} />
      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: DISPLAY }}>{message}</span>
    </div>
  )
}
