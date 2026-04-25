export function Squirrel({ size = 100, mood = 'happy' }) {
  const fur = '#8B5A3C', furLight = '#A47148', belly = '#F0DCB8', cheek = '#E8A87C'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="furG" cx="0.4" cy="0.3">
          <stop offset="0" stopColor={furLight} />
          <stop offset="1" stopColor={fur} />
        </radialGradient>
      </defs>
      <path d="M88 70 C 110 60, 112 30, 92 18 C 80 12, 70 22, 74 36 C 78 48, 84 50, 80 62" fill="url(#furG)" stroke={fur} strokeWidth="1.5" />
      <ellipse cx="55" cy="78" rx="26" ry="28" fill="url(#furG)" />
      <ellipse cx="55" cy="84" rx="15" ry="18" fill={belly} />
      <ellipse cx="42" cy="74" rx="6" ry="9" fill={fur} transform="rotate(-30 42 74)" />
      <ellipse cx="68" cy="74" rx="6" ry="9" fill={fur} transform="rotate(30 68 74)" />
      <circle cx="48" cy="46" r="22" fill="url(#furG)" />
      <ellipse cx="34" cy="30" rx="5" ry="7" fill={fur} transform="rotate(-25 34 30)" />
      <ellipse cx="33" cy="30" rx="2.5" ry="4" fill={cheek} transform="rotate(-25 33 30)" />
      <ellipse cx="60" cy="30" rx="5" ry="7" fill={fur} transform="rotate(20 60 30)" />
      <ellipse cx="61" cy="30" rx="2.5" ry="4" fill={cheek} transform="rotate(20 61 30)" />
      <circle cx="36" cy="52" r="6" fill={cheek} opacity="0.5" />
      <circle cx="60" cy="52" r="6" fill={cheek} opacity="0.5" />
      {mood === 'happy' && <>
        <path d="M40 45 Q 43 42 46 45" stroke="#2a1a0a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M52 45 Q 55 42 58 45" stroke="#2a1a0a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </>}
      {mood === 'wink' && <>
        <circle cx="43" cy="46" r="2" fill="#2a1a0a" />
        <path d="M52 45 Q 55 42 58 45" stroke="#2a1a0a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </>}
      {mood === 'open' && <>
        <circle cx="43" cy="46" r="2.5" fill="#2a1a0a" />
        <circle cx="55" cy="46" r="2.5" fill="#2a1a0a" />
        <circle cx="44" cy="45" r="0.8" fill="#fff" />
        <circle cx="56" cy="45" r="0.8" fill="#fff" />
      </>}
      {mood === 'cheer' && <>
        <path d="M40 45 Q 43 41 46 45" stroke="#2a1a0a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M52 45 Q 55 41 58 45" stroke="#2a1a0a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </>}
      <ellipse cx="49" cy="54" rx="1.8" ry="1.2" fill="#2a1a0a" />
      <path d="M47 56 Q 49 58 51 56" stroke="#2a1a0a" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <ellipse cx="55" cy="86" rx="9" ry="11" fill="#C8924A" />
      <ellipse cx="55" cy="80" rx="10" ry="6" fill="#5a3d20" />
      <path d="M55 73 L 55 70" stroke="#5a3d20" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="51" cy="86" rx="2" ry="4" fill="#E8B86A" opacity="0.6" />
    </svg>
  )
}
