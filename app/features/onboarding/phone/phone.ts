function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * Best-effort phone normalization for V0.
 *
 * - Keeps `+` prefix when present.
 * - Accepts common French input formats: `06 12 34 56 78` → `+33612345678`.
 * - Never throws; returns a sanitized string.
 */
export function normalizePhone(value: string): string {
  const raw = normalizeWhitespace(value)
  const stripped = raw.replace(/[().-]/g, '').replace(/\s/g, '')

  if (stripped.startsWith('+')) {
    return `+${stripped.slice(1).replace(/\D/g, '')}`
  }

  const digits = stripped.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('0')) {
    return `+33${digits.slice(1)}`
  }

  return digits.length > 0 ? digits : raw
}
