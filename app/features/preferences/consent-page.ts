import type { UpdatePublicConsentRequest } from './public-consent.contract'

/**
 * CC.2b — the pure rules of the tokenized withdrawal page.
 *
 * Everything here is a decision, not a rendering: the two page paths (JS and the
 * no-JS Nitro relay) must agree on what a checked box means and where each
 * outcome lands. Duplicating any of it in the `.vue` or in the Nitro handler
 * would let the two diverge silently — the JS path would keep working while the
 * fallback quietly withdrew the wrong thing, which is exactly the kind of bug
 * that survives lint, typecheck and unit tests.
 *
 * Three invariants this module exists to hold:
 *
 * 1. **A checked box is a withdrawal**, never an opt-in. Only an explicit
 *    `false` is ever sent, and only for the channels actually checked. The
 *    reverse (unchecked = "I don't want it") would make a passive re-submission
 *    of the link strip every channel without the visitor meaning to.
 * 2. **Nothing rendered here depends on the token's validity.** A valid token
 *    and an invalid one produce the same state, the same text and the same
 *    redirect. There is deliberately no "expired link" branch anywhere.
 * 3. **No read.** The current state is unknowable without a read that
 *    distinguishes the two cases, so the page always starts unchecked.
 */

/** The two channels the withdrawal page can act on. */
export const CONSENT_WITHDRAWAL_CHANNELS = ['email', 'sms'] as const

export type ConsentWithdrawalChannel = (typeof CONSENT_WITHDRAWAL_CHANNELS)[number]

/** Strict whitelist of the no-JS form's field names. Nothing else is relayed. */
export const CONSENT_SUBMIT_FIELDS = ['token', 'retrait'] as const

/** One of the whitelisted form field names. */
export type ConsentSubmitField = (typeof CONSENT_SUBMIT_FIELDS)[number]

/**
 * The form's own field names, read THROUGH the whitelist.
 *
 * `CONSENT_SUBMIT_FIELDS` used to be a constant no production code read, while
 * `pickConsentSubmitFields` hard-coded `form.get('token')` / `form.getAll('retrait')`.
 * The reads now go through this map, so the whitelist is the single source of
 * truth: a name removed there stops being relayed — and, each value being typed
 * `ConsentSubmitField`, it stops compiling rather than failing silently.
 *
 * Keyed by role, not by position: a positional `[0]`/`[1]` mapping would let a
 * reordered tuple swap `token` and `retrait` behind two identical `string` types.
 */
export const CONSENT_SUBMIT_FIELD: Record<'token' | 'retrait', ConsentSubmitField> = {
  token: 'token',
  retrait: 'retrait'
}

/**
 * The only states a submission can end in, and none of them says anything
 * about the token: a 200, a transport failure and a 429 from the shared
 * rate-limit bucket (LB2-5) are the only observable outcomes of a relay,
 * because the API answers `200 { updated: true }` for every token.
 *
 * `rate-limited` is a state of its own, not a flavour of `error`: a throttled
 * request means the withdrawal did not happen *yet*, while a transport failure
 * says nothing about what happened. Telling the visitor « Trop de tentatives »
 * instead of « vos préférences n'ont pas pu être enregistrées » is what keeps
 * her from reading a shared bucket as a dead link — and from giving up a
 * withdrawal she is entitled to.
 *
 * It remains independent of the token: the bucket counts requests, not tokens,
 * so the same verdict holds for a valid token and for an unknown one.
 */
export type ConsentPageState = 'saved' | 'error' | 'rate-limited'

export const CONSENT_PAGE_STATE_VALUES: readonly ConsentPageState[] = [
  'saved',
  'error',
  'rate-limited'
]

/** What the user checked, on either path. */
export type ConsentWithdrawalSelection = {
  token: string
  channels: ConsentWithdrawalChannel[]
}

/**
 * Neutral wording for a submission that asked for nothing.
 *
 * Not a third state: it is the page's standing explanation of the withdrawal
 * semantics, shown whenever no channel is checked. Exported so the wording is
 * pinned by a test rather than retyped in the template.
 */
export const CONSENT_NOOP_NOTICE
  = 'Aucune case cochée : rien n’est envoyé et rien ne change sur votre profil.'

/**
 * Normalizes the many shapes one channel list arrives in.
 *
 * The no-JS form posts `retrait` as a repeated field (so it arrives as an
 * array), the error redirect re-serializes it as `email,sms` (a string), and the
 * page reads it back from the query. One parser for the three, so a value that
 * round-trips through the relay comes back as the same set.
 */
function flattenChannels(value: unknown): string[] {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) return value.flatMap(entry => flattenChannels(entry))
  if (value instanceof FormData) return flattenChannels(value.getAll(CONSENT_SUBMIT_FIELD.retrait))

  return String(value)
    .split(',')
    .map(entry => entry.trim().toLowerCase())
    .filter(entry => entry.length > 0)
}

/**
 * Keeps only the two known channels, deduplicated and in a stable order.
 *
 * Anything else is dropped rather than rejected: the input is attacker-adjacent
 * (a query string anyone can hand-edit), and an unknown channel has no field to
 * map to, so the correct behaviour is to ignore it.
 */
export function parseConsentWithdrawals(value: unknown): ConsentWithdrawalChannel[] {
  const parsed = flattenChannels(value)

  return CONSENT_WITHDRAWAL_CHANNELS.filter(channel => parsed.includes(channel))
}

/** Serializes back to the `retrait=` form the error redirect carries. */
export function serializeConsentWithdrawals(channels: ConsentWithdrawalChannel[]): string {
  return CONSENT_WITHDRAWAL_CHANNELS.filter(channel => channels.includes(channel)).join(',')
}

/** Whether the visitor actually asked for something. */
export function hasConsentWithdrawal(channels: ConsentWithdrawalChannel[]): boolean {
  return channels.length > 0
}

/**
 * Longest token the API accepts (`@MaxLength(512)` on the cc-2a DTO). A longer
 * value is a malformed body, not an unknown token.
 */
export const CONSENT_TOKEN_MAX_LENGTH = 512

/**
 * Whether a token can be acted on at all.
 *
 * A blank or over-long token is rejected by the API as a malformed body (422),
 * which would surface as `state=error` — a rendering that would then depend on
 * the token's *shape*, breaking the AC that says any token renders the same
 * neutral state. An unusable token is therefore treated as "nothing to send".
 */
export function isUsableConsentToken(token: string): boolean {
  return token.length > 0 && token.length <= CONSENT_TOKEN_MAX_LENGTH
}

/**
 * Whether a submission asks for nothing: no channel ticked, or no actionable
 * token. Both paths short-circuit on this, so a re-opened or hand-edited link
 * can neither cause a write nor produce a state that depends on the token.
 */
export function isPassiveConsentSubmission(input: {
  token: string
  channels: ConsentWithdrawalChannel[]
}): boolean {
  return !hasConsentWithdrawal(input.channels) || !isUsableConsentToken(input.token)
}

/**
 * Maps checked channels to the API body: an explicit `false` per checked
 * channel, and **nothing** for an unchecked one.
 *
 * The absence is the whole point. Sending `true` would make this page an
 * opt-in, and sending the unchecked channel's current value is impossible —
 * there is no read to know it.
 */
export function buildConsentWithdrawalPatch(
  token: string,
  channels: ConsentWithdrawalChannel[]
): UpdatePublicConsentRequest {
  return {
    token,
    ...(channels.includes('email') ? { emailMarketingOptIn: false } : {}),
    ...(channels.includes('sms') ? { smsMarketingOptIn: false } : {})
  }
}

/**
 * Reads the `state` query parameter.
 *
 * Anything unrecognised — including a hand-edited value — reads as `null`, i.e.
 * the neutral initial state. A crafted `state=expired` must not be able to put
 * a token-flavoured sentence on the page, which is why this is a closed set and
 * not a passthrough.
 */
export function readConsentPageState(value: unknown): ConsentPageState | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return null

  return CONSENT_PAGE_STATE_VALUES.includes(raw as ConsentPageState)
    ? (raw as ConsentPageState)
    : null
}

/** Reads the token out of a query or a form, tolerating an array value. */
export function readConsentToken(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw.trim() : ''
}

/**
 * The 303 target of the no-JS relay.
 *
 * Carries the token back (it is the page's own input, and the page is
 * `no-store`) and, on every outcome that asks the visitor to try again, the
 * checked channels so the boxes can be re-checked rather than silently
 * cleared. On success the selection is deliberately dropped: nothing is left
 * to retry.
 *
 * Only `saved`, `error` and `rate-limited` are ever produced. A passive
 * submission gets no `state` at all, which is the neutral page — see
 * `CONSENT_NOOP_NOTICE`.
 */
export function consentRedirectTarget(input: {
  token: string
  state: ConsentPageState | null
  channels: ConsentWithdrawalChannel[]
}): string {
  const params = new URLSearchParams()

  const token = input.token
  if (token) params.set('token', token)
  if (input.state) params.set('state', input.state)
  // The selection is re-carried on every failure — a transport error AND a
  // throttled request. Losing it would make the visitor redo the gesture,
  // and the AC requires the values to survive an error.
  if (input.state !== null && input.state !== 'saved' && input.channels.length > 0) {
    params.set('retrait', serializeConsentWithdrawals(input.channels))
  }

  const query = params.toString()
  return query.length > 0 ? `/preferences?${query}` : '/preferences'
}
