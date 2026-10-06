/**
 * Contact-consent display rule (epic CC.1b).
 *
 * Read-only: this module decides how an existing consent state is *worded*, it
 * never writes anything. The provider sees the state she reads it, so the
 * wording must not claim more than the data proves.
 *
 * CC.1b gives the data the granularity it needs. Each channel carries **its own**
 * timestamp, written only when that channel's flag really changes. So the rule is
 * one invariant, with no `consent_source` heuristic and no special case:
 *
 * - **a timestamp means "modified after the profile was born"** — nothing else.
 * - `false` + date → « Retiré », at that channel's own date.
 * - `false` + no date → « Jamais consenti ».
 * - `true` + date → « Accordé », with that date.
 * - `true` + no date → « Accordé », without a date.
 *
 * The booking no longer stamps a date on a channel nobody agreed to, which is
 * what makes the last two cases honest: a visitor who ticked nothing has no
 * withdrawal date to be shown. This is also why the `not_authorized` state of
 * CC.1 is gone — with a per-channel date, `false` + date *is* the proof of a
 * change after creation, so « Retiré » stops being a claim about intent and
 * becomes a fact about the data. `consent_source` remains in the API contract as
 * provenance of the last write, but nothing in the UI reads it to decide a label.
 */

// Relative, not `~/`: this module is compiled by `tsc -p tsconfig.tests.json`
// and executed by the Node test runner, which does not resolve the `~` alias.
// No other module in that include list uses `~/` for the same reason.
import { formatDateShort } from '../../composables/useDateFormat'

export type ContactConsentSource = 'onboarding' | 'settings' | 'admin' | null

/**
 * The three states the provider must be able to tell apart. Two booleans alone
 * cannot: `false` covers both "never ticked" and "ticked then unticked". The
 * per-channel timestamp is what separates them.
 */
export type ContactConsentState = 'granted' | 'never_consented' | 'withdrawn'

export type ContactConsentTone = 'success' | 'warning' | 'neutral'

/**
 * Per-channel input. `consentUpdatedAt` is the **channel's own** timestamp, not
 * a profile-level one — CC.1b is what made that distinction expressible.
 */
export type ContactConsentInput = {
  optedIn: boolean
  consentUpdatedAt: string | null
}

export type ContactConsentDisplay = {
  state: ContactConsentState
  label: string
  tone: ContactConsentTone
  /** `null` when there is nothing to date — never "Invalid Date". */
  dateLabel: string | null
}

const LABEL_BY_STATE: Record<ContactConsentState, string> = {
  granted: 'Accordé',
  never_consented: 'Jamais consenti',
  withdrawn: 'Retiré'
}

const TONE_BY_STATE: Record<ContactConsentState, ContactConsentTone> = {
  granted: 'success',
  never_consented: 'neutral',
  withdrawn: 'warning'
}

/**
 * « Jamais consenti » and « Retiré » are only separable by whether the channel
 * carries a timestamp. There is no origin heuristic and no `consentSource` here:
 * the booking that granted nothing writes no date, so its absence is the signal.
 */
export function getContactConsentState(
  input: ContactConsentInput
): ContactConsentState {
  if (input.optedIn) return 'granted'
  if (input.consentUpdatedAt) return 'withdrawn'
  return 'never_consented'
}

/**
 * Resolves the wording for one channel. The date travels with the channel it
 * belongs to, so it can never be shown as another channel's.
 */
export function resolveContactConsent(
  input: ContactConsentInput
): ContactConsentDisplay {
  const state = getContactConsentState(input)
  const dateLabel = input.consentUpdatedAt
    ? formatContactConsentDate(input.consentUpdatedAt)
    : null

  return {
    state,
    label: LABEL_BY_STATE[state],
    tone: TONE_BY_STATE[state],
    dateLabel
  }
}

export type ContactConsentChannel = 'email' | 'sms'

export const CONTACT_CONSENT_CHANNEL_LABEL: Record<ContactConsentChannel, string> = {
  email: 'Email',
  sms: 'SMS'
}

export const CONTACT_CONSENT_CHANNEL_ICON: Record<ContactConsentChannel, string> = {
  email: 'lucide:mail',
  sms: 'lucide:message-square'
}

/**
 * The consent-bearing shape shared by both provider payloads
 * (`GET /provider/clients/{id}` and `GET /appointments/discovery`). Each carries
 * one timestamp per channel, read from `client_profiles`.
 *
 * No `consentSource` here: the API contracts still declare it as provenance of
 * the last write, but since cc-1b nothing in the UI reads it to decide a label —
 * the per-channel date already answers « Retiré » vs « Jamais consenti ».
 * Carrying it here would invite the next reader to reintroduce the heuristic.
 */
export type ContactConsentPayload = {
  emailMarketingOptIn: boolean
  smsMarketingOptIn: boolean
  emailConsentUpdatedAt: string | null
  smsConsentUpdatedAt: string | null
}

/** Reads one channel — flag **and** its own timestamp — out of a payload. */
export function pickContactConsent(
  input: ContactConsentPayload,
  channel: ContactConsentChannel
): ContactConsentInput {
  return {
    optedIn: channel === 'email'
      ? input.emailMarketingOptIn
      : input.smsMarketingOptIn,
    consentUpdatedAt: channel === 'email'
      ? input.emailConsentUpdatedAt
      : input.smsConsentUpdatedAt
  }
}

/**
 * French short date via the shared cached-`Intl` helper, tolerating an
 * unparsable value. Returns `null` rather than "Invalid Date".
 */
export function formatContactConsentDate(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return formatDateShort(value)
}
