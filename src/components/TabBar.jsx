import { CC } from '../tokens'
import { Acorn } from './Acorn'

const TABS = [
  { id: 'home',     ic: '🏡', label: 'บ้าน' },
  { id: 'wallets',  ic: '🏦', label: 'บัญชี' },
  { id: 'fab',      ic: null,  label: '' },
  { id: 'reports',  ic: '📊', label: 'รายงาน' },
  { id: 'settings', ic: '⚙️', label: 'ตั้งค่า' },
]

export function TabBar({ active, onChange, onAdd }) {
  return (
    <>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: 'calc(12px + var(--sab))',
        paddingTop: 10,
        background: CC.surface,
        borderTop: `1px solid ${CC.border}`,
        zIndex: 40,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => t.id !== 'fab' && onChange(t.id)}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                textAlign: 'center',
                color: active === t.id ? CC.walnut : CC.ink3,
                cursor: 'pointer', padding: '4px 0',
              }}
            >
              <div style={{ fontSize: 20, opacity: t.id === 'fab' ? 0 : 1 }}>{t.ic}</div>
              <div style={{ fontSize: 10, marginTop: 2, fontWeight: active === t.id ? 700 : 500 }}>{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onAdd}
        style={{
          position: 'absolute',
          bottom: 'calc(56px + var(--sab))',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 41,
          width: 64, height: 64, borderRadius: 32,
          background: CC.walnut, color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 22px rgba(122,79,42,0.5)',
          cursor: 'pointer',
        }}
      >
        <Acorn size={28} color={CC.amberSoft} />
      </button>
    </>
  )
}
