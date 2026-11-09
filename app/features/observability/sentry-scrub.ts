/**
 * Pure PII scrubber for Sentry events — front-end side.
 *
 * This module has NO dependency on the Sentry SDK: it operates on plain objects
 * so that the scrub can be exercised (and mutated) by unit tests without
 * initialising Sentry. The SDK is only an adapter that calls these helpers.
 */

export const REDACTED_MARKER = '[REDACTED]'

// The five canonical values shared with obs-2 (see pii-scrub-policy.md).
// They are redacted wherever they appear, in addition to the generic rules.
const CANONICAL_PII_VALUES: readonly string[] = [
  'marie.dupont@example.test',
  'Marie Dupont',
  '+33 6 12 34 56 78',
  'c0ffee-token-de-retrait-0123456789abcdef',
  'Bouffées de chaleur nocturnes depuis trois semaines'
]

// Family 1 — non-ambiguous keys: the whole value is removed.
const NON_AMBIGUOUS_KEYS = new Set([
  'email',
  'firstname',
  'lastname',
  'phone',
  'token',
  'password',
  'symptoms'
])

// Family 3 — ambiguous keys: redacted (never deleted), only inside data scopes.
const AMBIGUOUS_KEYS = new Set(['message', 'content'])

// Roots whose children are treated as "data scope" for family 3.
const DATA_SCOPE_ROOTS = new Set(['data', 'extra', 'contexts', 'context'])

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/g

const URL_KEYS = new Set(['url', 'transaction', 'culprit'])

export type ScrubTarget = Record<string, unknown>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function scrubUrl(raw: unknown): unknown {
  if (typeof raw !== 'string' || raw === '') return raw
  // Absolute URL: keep pathname only.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    try {
      return new URL(raw).pathname || '/'
    } catch {
      // fall through to relative handling
    }
  }
  // Relative (may carry query or fragment).
  return (raw.split('?')[0] ?? '').split('#')[0] || '/'
}

function containsCanonicalPii(value: string): boolean {
  return CANONICAL_PII_VALUES.some(needle => value.includes(needle))
}

function scrubString(value: string): string {
  if (containsCanonicalPii(value)) return REDACTED_MARKER
  let out = value
  if (EMAIL_RE.test(out)) {
    EMAIL_RE.lastIndex = 0
    out = out.replace(EMAIL_RE, REDACTED_MARKER)
  } else {
    EMAIL_RE.lastIndex = 0
  }
  // Reset regex state.
  EMAIL_RE.lastIndex = 0
  if (PHONE_RE.test(out)) {
    PHONE_RE.lastIndex = 0
    out = out.replace(PHONE_RE, REDACTED_MARKER)
  }
  PHONE_RE.lastIndex = 0
  return out
}

function scrubValue(value: unknown, inDataScope: boolean): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return scrubString(value)
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) {
    return value.map(item => scrubValue(item, inDataScope))
  }
  if (!isPlainObject(value)) return value

  const result: Record<string, unknown> = { ...value }
  for (const key of Object.keys(value)) {
    const lower = key.toLowerCase()
    // Family 1 — non-ambiguous keys: deleted entirely.
    if (NON_AMBIGUOUS_KEYS.has(lower)) {
      Reflect.deleteProperty(result, key)
      continue
    }
    // Family 3 — ambiguous keys: redacted, but only inside data scopes.
    if (AMBIGUOUS_KEYS.has(lower) && inDataScope) {
      result[key] = REDACTED_MARKER
      continue
    }
    const childInDataScope = inDataScope || DATA_SCOPE_ROOTS.has(lower)
    // URL scrub for url/transaction/culprit keys.
    if (URL_KEYS.has(lower)) {
      result[key] = scrubUrl(value[key])
      // Still scrub nested PII if the value is an object/array.
      if (typeof result[key] === 'string') {
        // done
      } else {
        result[key] = scrubValue(result[key], childInDataScope)
      }
      continue
    }
    result[key] = scrubValue(value[key], childInDataScope)
  }
  return result
}

export function scrubEvent<T = unknown>(event: T): T {
  if (event === null || event === undefined) return event
  if (typeof event !== 'object' || Array.isArray(event)) return event as T
  // Work on a shallow clone to avoid mutating the caller's reference root.
  const clone = { ...(event as Record<string, unknown>) }
  const scrubbed = scrubValue(clone, false) as Record<string, unknown>
  // Request must never carry a body, headers or cookies.
  if (isPlainObject(scrubbed.request)) {
    const req = scrubbed.request as Record<string, unknown>
    Reflect.deleteProperty(req, 'data')
    Reflect.deleteProperty(req, 'headers')
    Reflect.deleteProperty(req, 'cookies')
    if (typeof req.url === 'string') req.url = scrubUrl(req.url) as string
  }
  if (typeof scrubbed.transaction === 'string') {
    scrubbed.transaction = scrubUrl(scrubbed.transaction) as string
  }
  if (typeof scrubbed.culprit === 'string') {
    scrubbed.culprit = scrubUrl(scrubbed.culprit) as string
  }
  // Never attach an identity.
  Reflect.deleteProperty(scrubbed, 'user')
  // Apply breadcrumb filtering/reduction so the pure scrub covers breadcrumbs too.
  if (Array.isArray(scrubbed.breadcrumbs)) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs
      .map((bc) => scrubBreadcrumb(bc))
      .filter((bc) => bc !== null)
  }
  return scrubbed as T
}

export function scrubBreadcrumb(breadcrumb: unknown): unknown {
  if (!isPlainObject(breadcrumb)) return breadcrumb
  const bc = { ...breadcrumb } as Record<string, unknown>
  const category = typeof bc.category === 'string' ? bc.category : ''
  const level = typeof bc.level === 'string' ? bc.level : ''

  // Drop console breadcrumbs except filtered errors.
  if (category === 'console') {
    if (level !== 'error') return null
  }

  // Reduce fetch/xhr/navigation to method + pathname + status.
  if (category === 'fetch' || category === 'xhr' || category === 'navigation') {
    const data = isPlainObject(bc.data) ? { ...bc.data } : {}
    const method = data.method ?? bc.method
    const url = scrubUrl(data.to ?? data.from ?? data.url ?? data.href ?? bc.url ?? bc.to)
    const status = data.status ?? data.statusCode ?? bc.status
    const reduced: Record<string, unknown> = {}
    if (method !== undefined) reduced.method = method
    reduced.url = url
    if (status !== undefined) reduced.status = status
    bc.data = reduced
    // Remove any free-form message/body fields.
    delete bc.message
    // Still scrub PII in whatever remains.
    return scrubValue(bc, false)
  }

  return scrubValue(bc, false)
}
