export function eurosToCents(raw: string): number | null {
  const normalized = raw.replace(',', '.').trim()
  if (!normalized) return null

  const value = Number(normalized)
  if (!Number.isFinite(value)) return null
  if (value <= 0) return null

  return Math.round(value * 100)
}
