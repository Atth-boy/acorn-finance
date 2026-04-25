export function Leaf({ size = 18, color = '#5A6B3B' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 20 C 4 10, 14 4, 20 4 C 20 14, 14 20, 4 20 Z" fill={color} />
      <path d="M4 20 L 18 6" stroke="#fff" strokeWidth="1.2" opacity="0.5" />
    </svg>
  )
}
