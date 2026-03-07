const currencyFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const numberFmt = new Intl.NumberFormat('fr-FR')

export function formatKpiValue(value: number, format?: 'number' | 'currency'): string {
  if (format === 'currency') return currencyFmt.format(value / 100)
  return numberFmt.format(value)
}

export function getDeltaIcon(delta: number): string {
  if (delta > 0) return '↑'
  if (delta < 0) return '↓'
  return '—'
}

export function getDeltaClasses(delta: number): string {
  if (delta > 0) return 'text-green-600'
  if (delta < 0) return 'text-red-600'
  return 'text-stone-400'
}
