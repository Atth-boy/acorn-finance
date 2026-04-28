import { CC } from '../tokens'
import { Acorn } from './Acorn'

const TABS = [
  { id: 'home',     ic: '🏡', label: 'บ้าน' },
  { id: 'wallets',  ic: '🏦', label: 'บัญชี' },
  { id: 'fab',      ic: null,  label: '' },
  { id: 'reports',  ic: '📊', label: 'รายงาน' },
  { id: 'settings', ic: '⚙️', label: 'ตั้งค่า' },
]

function HouseIcon({ size = 28, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M4 17L16 6L28 17" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="7" y="16" width="18" height="13" rx="2.5" fill={color} opacity="0.88" />
      <rect x="13" y="21" width="6" height="8" rx="1.5" fill="rgba(0,0,0,0.22)" />
    </svg>
  )
}

export function TabBar({ active, onChange, onAdd, walletSubPage = 0, onFamilyAdd }) {
  const isShared = active === 'wallets' && walletSubPage === 1
  const isFamily = active === 'wallets' && walletSubPage === 2

  const fabBottom = isShared
    ? 'calc(var(--sab) + 8px)'
    : 'calc(56px + var(--sab))'

  const fabBg = isShared ? '#4A6B2A'
    : isFamily ? '#7B4A1A'
    : CC.walnut

  const fabShadow = isShared
    ? '0 8px 22px rgba(74,107,42,0.4)'
    : isFamily
    ? '0 8px 22px rgba(123,74,26,0.5)'
    : '0 8px 22px rgba(122,79,42,0.5)'

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
        onClick={isShared ? undefined : isFamily ? onFamilyAdd : onAdd}
        style={{
          position: 'absolute',
          bottom: fabBottom,
          left: '50%', transform: 'translateX(-50%)',
          zIndex: isShared ? 39 : 41,
          width: 64, height: 64, borderRadius: 32,
          background: fabBg,
          color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: fabShadow,
          cursor: isShared ? 'default' : 'pointer',
          pointerEvents: isShared ? 'none' : 'auto',
          transition: 'bottom 0.35s cubic-bezier(.4,0,.2,1), background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {isFamily
          ? <HouseIcon size={28} color="#E8D0B0" />
          : <Acorn size={28} color={isShared ? '#A8D890' : CC.amberSoft} />
        }
      </button>
    </>
  )
}
