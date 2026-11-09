/**
 * Pure PII scrubber for Sentry events — front-end side.
 *
 * This module has NO dependency on the Sentry SDK: it operates on plain objects
 * so that the scrub can be exercised (and mutated) by unit tests without
 * initialising Sentry. The SDK is only an adapter that calls these helpers.
 *
 * Three families, per AC-2:
 *   1. non-ambiguous keys (`email`, `firstName`, …) — the value is deleted;
 *   2. patterned values (email, phone) — redacted wherever they appear, even
 *      under an innocent field name;
 *   3. ambiguous keys (`message`, `content`) — redacted, never deleted, and
 *      only inside data scopes. The event title lives at the root `message`
 *      and must survive.
 */

export const REDACTED_MARKER = '[REDACTED]'

const MAX_DEPTH_MARKER = '[MAX_DEPTH]'
const MAX_DEPTH = 8

// Family 1 — non-ambiguous keys: the whole value is removed.
//
// The inventory is measured on the app, not guessed (2026-11-09):
//   - health content the policy forbids: `fitJson` / `fitForm` / `fitJson` are
//     the fit answers (8 field sites), `problemStatementJson` /
//     `problemStatement` / `problem_statement` the provider's problem statement
//     (56 sites), `notes` the client / appointment session notes
//     (`clients.contract.ts`, `calendar.contract.ts`), `pauseReason` and
//     `reasonText` their free-text variants, `symptom`/`symptoms` the symptom
//     field the policy names explicitly.
//   - identity the policy names: `email`, `firstName`, `lastName`, `phone`,
//     `address` (`onboarding.contract.ts`, provider account).
// Matching is exact on the lowercased key, so each spelling that exists in the
// repo is listed: adding one is a one-line change, and a composite key that is
// not here would silently ship.
const NON_AMBIGUOUS_KEYS = new Set([
  // identity
  'email',
  'firstname',
  'lastname',
  'phone',
  'address',
  'adresse',
  // credentials
  'token',
  'password',
  // health content (§ pii-scrub-policy.md: symptômes, notes de séance,
  // réponses au fit, énoncé de la problématique)
  'symptom',
  'symptoms',
  'fit',
  'fitform',
  'fitjson',
  'fit_json',
  'problemstatement',
  'problemstatementjson',
  'problem_statement',
  'notes',
  'pausereason',
  'reasontext'
])

// Family 3 — ambiguous keys: redacted (never deleted), only inside data scopes.
const AMBIGUOUS_KEYS = new Set(['message', 'content'])

// Roots whose children are treated as a "data scope" for family 3.
const DATA_SCOPE_ROOTS = new Set(['data', 'extra', 'contexts', 'context'])

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const PHONE_CANDIDATE_RE = /\+?\d[\d\s().-]{7,}\d/g
const ISO_DATE_PREFIX_RE = /^\d{4}-\d{2}-\d{2}/
// Bearer-bearing query/fragment parameters carried inside free text.
const SECRET_QUERY_RE = /([?&#](?:token|access|code|key|secret|password|r)=)[^&#\s]+/gi

const URL_KEYS = new Set(['url', 'transaction', 'culprit'])

// Request fields that must never reach Sentry (AC-4).
const FORBIDDEN_REQUEST_FIELDS = ['data', 'headers', 'cookies', 'query_string', 'env'] as const

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

/**
 * Redact phone-like runs. A 9–15 digit run is a phone; dates, versions,
 * error codes and epoch timestamps are diagnostic context and must survive.
 */
function redactPhones(value: string): string {
  return value.replace(PHONE_CANDIDATE_RE, (candidate) => {
    if (ISO_DATE_PREFIX_RE.test(candidate)) return candidate
    const digits = candidate.replace(/\D/g, '')
    const hasPlus = candidate.trimStart().startsWith('+')
    const hasSeparator = /[\s().-]/.test(candidate)
    const minDigits = hasPlus || hasSeparator ? 9 : 10
    const maxDigits = hasPlus || hasSeparator ? 15 : 11
    if (digits.length < minDigits || digits.length > maxDigits) return candidate
    return REDACTED_MARKER
  })
}

function scrubString(value: string): string {
  const withoutEmails = value.replace(EMAIL_RE, REDACTED_MARKER)
  const withoutSecrets = withoutEmails.replace(SECRET_QUERY_RE, `$1${REDACTED_MARKER}`)
  return redactPhones(withoutSecrets)
}

function scrubUrlValue(value: unknown, inDataScope: boolean, depth: number): unknown {
  if (typeof value === 'string') return scrubUrl(value)
  return scrubValue(value, inDataScope, depth + 1)
}

function scrubValue(value: unknown, inDataScope: boolean, depth: number): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return scrubString(value)
  if (typeof value !== 'object') return value
  if (depth >= MAX_DEPTH) return MAX_DEPTH_MARKER
  if (Array.isArray(value)) {
    return value.map(item => scrubValue(item, inDataScope, depth + 1))
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
    if (URL_KEYS.has(lower)) {
      result[key] = scrubUrlValue(value[key], childInDataScope, depth)
      continue
    }
    result[key] = scrubValue(value[key], childInDataScope, depth + 1)
  }
  return result
}

export function scrubEvent<T = unknown>(event: T): T {
  if (event === null || event === undefined) return event
  if (typeof event !== 'object' || Array.isArray(event)) return event as T
  // Work on a clone: the scrub must not mutate the caller's event root.
  const clone = { ...(event as Record<string, unknown>) }
  const scrubbed = scrubValue(clone, false, 0) as Record<string, unknown>

  // Request must never carry a body, headers, cookies or a raw query string.
  if (isPlainObject(scrubbed.request)) {
    const req = scrubbed.request as Record<string, unknown>
    for (const field of FORBIDDEN_REQUEST_FIELDS) {
      Reflect.deleteProperty(req, field)
    }
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

  // The pure scrub covers breadcrumbs too, so an event built elsewhere is safe.
  if (Array.isArray(scrubbed.breadcrumbs)) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs
      .map(breadcrumb => scrubBreadcrumb(breadcrumb))
      .filter(breadcrumb => breadcrumb !== null)
  }
  return scrubbed as T
}

export function scrubBreadcrumb(breadcrumb: unknown): unknown {
  if (!isPlainObject(breadcrumb)) return breadcrumb
  const bc = { ...breadcrumb } as Record<string, unknown>
  const category = typeof bc.category === 'string' ? bc.category : ''

  // Drop console breadcrumbs except errors (AC-4).
  if (category === 'console' && bc.level !== 'error') return null

  // Reduce fetch/xhr/navigation to method + pathname + status.
  if (category === 'fetch' || category === 'xhr' || category === 'navigation') {
    const data = isPlainObject(bc.data) ? bc.data : {}
    const reduced: Record<string, unknown> = {}
    const method = data.method ?? bc.method
    if (method !== undefined) reduced.method = method
    reduced.url = scrubUrl(data.to ?? data.from ?? data.url ?? data.href ?? bc.url ?? bc.to)
    // The SDK emits `status_code` for fetch/xhr breadcrumbs (v11).
    const status = data.status_code ?? data.status ?? data.statusCode ?? bc.status
    if (status !== undefined) reduced.status = status
    bc.data = reduced
    // A free-form message may carry a token or a form value.
    Reflect.deleteProperty(bc, 'message')
    return scrubValue(bc, false, 0)
  }

  return scrubValue(bc, false, 0)
}
