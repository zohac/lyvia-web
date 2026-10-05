/**
 * Contact-consent display rule (epic CC.1).
 *
 * Read-only: this module decides how an existing consent state is *worded*, it
 * never writes anything. The provider sees the state she reads it, so the
 * wording must not claim more than the data proves.
 *
 * Two limits of the stored data shape this module. Both are named debts, not
 * design choices — see `deferred-work.md`.
 *
 * 1. `consent_source` and `consent_updated_at` live on `client_profiles`: ONE
 *    value per profile, not per channel. `update-client-preferences.usecase.ts`
 *    hardcodes `source = 'settings'` on every patch whatever the channel, and
 *    `typeorm-client-preferences-command.service.ts` writes a single
 *    `consent_updated_at = now()` for the whole row. A change to one channel
 *    therefore cannot be attributed to the other, and a date attached to a
 *    channel may belong to a change she made on the *other* channel.
 *    **Consequence: no channel row ever carries a date.** The type system
 *    enforces it — `ContactConsentInput` has no date field, so it cannot be
 *    rendered per channel even by mistake. The date is rendered once, at the
 *    foot, worded as a profile-level fact. Debt: `withdrawnExplicitly` will not
 *    close this one; per-channel timestamps would.
 *
 * 2. `settings` is also written by an act the client did not choose:
 *    `IdentityForm.vue` unticks SMS when the phone field is cleared, and the
 *    submitted payload is byte-for-byte a deliberate untick. Nothing in the
 *    payload tells them apart, so the state is named `not_authorized` and never
 *    `withdrawn`: the *fact* (contact not allowed) is provable, the *act* is
 *    not. This is the epic's « retiré » with the attribution removed — see
 *    `deferred-work.md` → `withdrawnExplicitly`.
 *
 * `consent_source` remains the discriminant between "never consented" and
 * "changed after booking": the booking writes `consent_updated_at` and
 * `consent_source = 'onboarding'` unconditionally, even with no box ticked
 * (`typeorm-discovery-booking.service.ts`), so that raw date must never be
 * presented as a consent change.
 */

// Relative, not `~/`: this module is compiled by `tsc -p tsconfig.tests.json`
// and executed by the Node test runner, which does not resolve the `~` alias.
// No other module in that include list uses `~/` for the same reason.
import { formatDateShort } from '../../composables/useDateFormat'

export type ContactConsentSource = 'onboarding' | 'settings' | 'admin' | null

/**
 * The three states the provider must be able to tell apart. Two booleans alone
 * cannot: `false` covers both "never ticked" and "ticked then unticked".
 */
export type ContactConsentState = 'granted' | 'never_consented' | 'not_authorized'

export type ContactConsentTone = 'success' | 'warning' | 'neutral'

/**
 * Per-channel input. Deliberately carries no date: a single profile-level
 * timestamp cannot be attributed to a channel, so it is not offered here.
 */
export type ContactConsentInput = {
  optedIn: boolean
  consentSource: ContactConsentSource
}

export type ContactConsentDisplay = {
  state: ContactConsentState
  label: string
  tone: ContactConsentTone
}

const LABEL_BY_STATE: Record<ContactConsentState, string> = {
  granted: 'Accordé',
  never_consented: 'Jamais consenti',
  not_authorized: 'Non autorisé'
}

const TONE_BY_STATE: Record<ContactConsentState, ContactConsentTone> = {
  granted: 'success',
  never_consented: 'neutral',
  not_authorized: 'warning'
}

/**
 * "Never consented" and "not authorized" are only separable by the origin of
 * the change, never by the flag.
 */
export function getContactConsentState(
  input: ContactConsentInput
): ContactConsentState {
  if (input.optedIn) return 'granted'
  if (input.consentSource === 'settings' || input.consentSource === 'admin') {
    return 'not_authorized'
  }
  return 'never_consented'
}

/** Resolves the wording for one channel. No date: see the module header. */
export function resolveContactConsent(
  input: ContactConsentInput
): ContactConsentDisplay {
  const state = getContactConsentState(input)

  return {
    state,
    label: LABEL_BY_STATE[state],
    tone: TONE_BY_STATE[state]
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
 * (`GET /provider/clients/{id}` and `GET /appointments/discovery`).
 * Both carry the same four fields read from `client_profiles`.
 */
export type ContactConsentPayload = {
  emailMarketingOptIn: boolean
  smsMarketingOptIn: boolean
  consentSource: ContactConsentSource
  consentUpdatedAt: string | null
}

/** Reads one channel out of a consent-bearing payload. */
export function pickContactConsent(
  input: ContactConsentPayload,
  channel: ContactConsentChannel
): ContactConsentInput {
  return {
    optedIn: channel === 'email'
      ? input.emailMarketingOptIn
      : input.smsMarketingOptIn,
    consentSource: input.consentSource
  }
}

export type ContactConsentLastChange = {
  /** What the date measures. Never per channel — see the module header. */
  label: string
  dateLabel: string
  originLabel: string | null
}

const POST_BOOKING_SOURCES = ['settings', 'admin'] as const

type PostBookingSource = (typeof POST_BOOKING_SOURCES)[number]

const ORIGIN_LABEL: Record<PostBookingSource, string> = {
  settings: 'depuis son compte',
  admin: 'depuis l\'espace Keova'
}

function isPostBookingSource(
  source: ContactConsentSource
): source is PostBookingSource {
  return POST_BOOKING_SOURCES.includes(source as PostBookingSource)
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

/**
 * The single place a consent date is shown, and the only place the profile-level
 * timestamp is allowed to appear.
 *
 * Returns `null` — no date at all — when there is nothing to date: a profile
 * that never granted anything and was only ever touched by the booking. That is
 * the case AC 2 requires to read "sans date", and gating on
 * `consentSource !== 'onboarding'` is what keeps the booking instant from
 * masquerading as a withdrawal.
 */
export function resolveContactConsentLastChange(
  input: ContactConsentPayload
): ContactConsentLastChange | null {
  const { consentSource, consentUpdatedAt } = input
  const everGranted = input.emailMarketingOptIn || input.smsMarketingOptIn

  if (!isPostBookingSource(consentSource) && !everGranted) return null
  if (!consentUpdatedAt) return null

  const dateLabel = formatContactConsentDate(consentUpdatedAt)
  if (!dateLabel) return null

  return isPostBookingSource(consentSource)
    ? {
        label: 'Dernier changement enregistré',
        dateLabel,
        originLabel: ORIGIN_LABEL[consentSource]
      }
    : {
        label: 'Consentement enregistré à la réservation',
        dateLabel,
        originLabel: null
      }
}
