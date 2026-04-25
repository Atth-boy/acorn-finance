export function Acorn({ size = 18, color = '#7A4F2A' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="15" rx="6" ry="7" fill={color} opacity="0.9" />
      <ellipse cx="12" cy="9"  rx="7" ry="3.5" fill={color} />
      <path d="M12 6 L 12 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
