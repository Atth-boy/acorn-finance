import { CCB } from '../tokens'

// Single source of truth for business categories.
// Labels (l) must stay unique — ReportsScreen derives its icon map by label.

export const BIZ_INCOME_CATS = [
  { id: 'sales',    ic: '🛍️', l: 'ขายสินค้า', color: CCB.gold },
  { id: 'service',  ic: '🤝', l: 'บริการ',    color: CCB.brass },
  { id: 'shipping', ic: '📦', l: 'ค่าจัดส่ง',  color: '#C8924A' },
  { id: 'other_in', ic: '✨', l: 'อื่นๆ',      color: '#8B5A3C' },
]

// Shown by default in the entry screen
export const BIZ_EXPENSE_BASE = [
  { id: 'stock',     ic: '📦', l: 'สต๊อกสินค้า' },
  { id: 'marketing', ic: '📢', l: 'การตลาด' },
  { id: 'rent',      ic: '🏢', l: 'ค่าเช่า' },
  { id: 'salary',    ic: '👥', l: 'เงินเดือน' },
  { id: 'other_out', ic: '⚡', l: 'อื่นๆ' },
]

// Revealed behind the "เพิ่มเติม" toggle
export const BIZ_EXPENSE_EXTRA = [
  { id: 'packaging', ic: '🎁', l: 'บรรจุภัณฑ์' },
  { id: 'logistics', ic: '🚚', l: 'ขนส่ง' },
  { id: 'equipment', ic: '🖨️', l: 'อุปกรณ์' },
  { id: 'fees',      ic: '💳', l: 'ค่าธรรมเนียม' },
  { id: 'tax',       ic: '📋', l: 'ภาษี' },
  { id: 'utility',   ic: '💡', l: 'สาธารณูปโภค' },
]

// Full expense list (base + extra) — used by Wallets/Reports and entry-screen lookup
export const BIZ_EXPENSE_CATS = [...BIZ_EXPENSE_BASE, ...BIZ_EXPENSE_EXTRA]
