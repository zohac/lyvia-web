/**
 * Pure helper: extracts paid-ads click IDs from a URL query string.
 *
 * Recognised parameters (all optional):
 *  - gclid / gbraid / wbraid → Google Ads
 *  - msclkid → Microsoft / Bing Ads
 *  - fbclid → Meta (Facebook / Instagram) Ads
 *
 * Empty values, missing params, and unknown keys are all skipped.
 * Returns an empty object when nothing is captured.
 */
const KNOWN_CLICK_ID_KEYS = [
  'gclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'fbclid'
] as const

const MAX_VALUE_LENGTH = 512

export function extractClickIds(search: string): Record<string, string> {
  const params = new URLSearchParams(search)
  const result: Record<string, string> = {}
  for (const key of KNOWN_CLICK_ID_KEYS) {
    const raw = params.get(key)
    if (raw === null) continue
    if (raw.length === 0) continue
    if (raw.length > MAX_VALUE_LENGTH) continue
    result[key] = raw
  }
  return result
}
