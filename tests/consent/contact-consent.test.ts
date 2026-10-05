import * as assert from 'node:assert/strict'
import test from 'node:test'

import { formatDateShort } from '../../app/composables/useDateFormat'
import {
  CONTACT_CONSENT_CHANNEL_ICON,
  CONTACT_CONSENT_CHANNEL_LABEL,
  formatContactConsentDate,
  getContactConsentState,
  pickContactConsent,
  resolveContactConsent,
  resolveContactConsentLastChange,
  type ContactConsentChannel,
  type ContactConsentPayload,
  type ContactConsentSource
} from '../../app/features/consent/contact-consent'

const OCT_1 = '2026-10-01T09:30:00.000Z'
const OCT_2 = '2026-10-02T10:00:00.000Z'

function payload(overrides: Partial<ContactConsentPayload> = {}): ContactConsentPayload {
  return {
    emailMarketingOptIn: false,
    smsMarketingOptIn: false,
    consentSource: null,
    consentUpdatedAt: null,
    ...overrides
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// The three states must stay separable. Two booleans + a date are not enough:
// `consent_source` is the discriminant (epic CC.1 Design Notes).
// ─────────────────────────────────────────────────────────────────────────────

test('consent state: a granted flag is always "granted", whatever the source', () => {
  for (const source of ['onboarding', 'settings', 'admin', null] as ContactConsentSource[]) {
    assert.equal(getContactConsentState({ optedIn: true, consentSource: source }), 'granted')
  }
})

test('consent state: "onboarding" + false is "never consented", not "not authorized"', () => {
  // The booking always writes consent_source='onboarding', even with no box ticked.
  assert.equal(
    getContactConsentState({ optedIn: false, consentSource: 'onboarding' }),
    'never_consented'
  )
})

test('consent state: "settings"/"admin" + false is "not authorized"', () => {
  for (const source of ['settings', 'admin'] as const) {
    assert.equal(getContactConsentState({ optedIn: false, consentSource: source }), 'not_authorized')
  }
})

test('consent state: null source + false is "never consented" (profile born outside booking)', () => {
  assert.equal(getContactConsentState({ optedIn: false, consentSource: null }), 'never_consented')
})

// ─────────────────────────────────────────────────────────────────────────────
// The wording. "Non autorisé" must never assert that the client chose it —
// `IdentityForm.vue` unticks SMS when the phone field is cleared, and that write
// is byte-for-byte a deliberate untick. Story §Piège.
// ─────────────────────────────────────────────────────────────────────────────

test('label: granted is "Accordé" in the success tone', () => {
  const display = resolveContactConsent({ optedIn: true, consentSource: 'onboarding' })

  assert.equal(display.state, 'granted')
  assert.equal(display.label, 'Accordé')
  assert.equal(display.tone, 'success')
})

test('label: never consented is "Jamais consenti" in the neutral tone', () => {
  const display = resolveContactConsent({ optedIn: false, consentSource: 'onboarding' })

  assert.equal(display.label, 'Jamais consenti')
  assert.equal(display.tone, 'neutral')
})

test('label: settings + false reads "Non autorisé", never "Retiré"', () => {
  // A word asserting a deliberate act would be a claim the data cannot prove.
  const display = resolveContactConsent({ optedIn: false, consentSource: 'settings' })

  assert.equal(display.state, 'not_authorized')
  assert.equal(display.label, 'Non autorisé')
  assert.equal(display.tone, 'warning')
})

test('label: the implicit SMS untick (phone cleared) never reads as an act', () => {
  // IdentityForm emits exactly this payload when the phone field is emptied.
  const display = resolveContactConsent(
    pickContactConsent(payload({ smsMarketingOptIn: false, consentSource: 'settings' }), 'sms')
  )

  assert.equal(display.label, 'Non autorisé')
  assert.ok(!display.label.includes('Retiré'))
})

test('label: the three states never collapse to the same string', () => {
  const labels = [
    resolveContactConsent({ optedIn: true, consentSource: 'onboarding' }).label,
    resolveContactConsent({ optedIn: false, consentSource: 'onboarding' }).label,
    resolveContactConsent({ optedIn: false, consentSource: 'settings' }).label
  ]

  assert.equal(new Set(labels).size, 3)
})

test('a per-channel display carries no date at all', () => {
  // Structural guard: `ContactConsentInput` has no date field, so a
  // profile-level timestamp can never be attributed to one channel.
  const display = resolveContactConsent(
    pickContactConsent(
      payload({ emailMarketingOptIn: true, consentSource: 'settings', consentUpdatedAt: OCT_2 }),
      'email'
    )
  )

  assert.equal(Object.keys(display).sort().join(','), 'label,state,tone')
})

// ─────────────────────────────────────────────────────────────────────────────
// The one date on the screen: profile-level, gated, and worded as a
// profile-level fact.
// ─────────────────────────────────────────────────────────────────────────────

test('last change: a booking that granted nothing shows NO date', () => {
  // Regression guard for AC 2 ("sans date"). The booking writes
  // consent_updated_at unconditionally, so printing it here would read as
  // "withdrawn on <booking day>", a statement the visitor never made.
  const result = resolveContactConsentLastChange(
    payload({ consentSource: 'onboarding', consentUpdatedAt: OCT_1 })
  )

  assert.equal(result, null)
})

test('last change: a profile born outside booking with no grant shows no date', () => {
  assert.equal(
    resolveContactConsentLastChange(payload({ consentUpdatedAt: OCT_1 })),
    null
  )
})

test('last change: a booking that granted email dates the booking, not a change', () => {
  const result = resolveContactConsentLastChange(
    payload({ emailMarketingOptIn: true, consentSource: 'onboarding', consentUpdatedAt: OCT_1 })
  )

  assert.equal(result?.label, 'Consentement enregistré à la réservation')
  assert.equal(result?.dateLabel, formatDateShort(OCT_1))
  assert.equal(result?.originLabel, null)
})

test('last change: a post-booking write dates the last change and names its origin', () => {
  const result = resolveContactConsentLastChange(
    payload({ consentSource: 'settings', consentUpdatedAt: OCT_2 })
  )

  assert.equal(result?.label, 'Dernier changement enregistré')
  assert.equal(result?.dateLabel, formatDateShort(OCT_2))
  assert.equal(result?.originLabel, 'depuis son compte')
})

test('last change: an admin write is attributed to Keova, not to the client', () => {
  const result = resolveContactConsentLastChange(
    payload({ consentSource: 'admin', consentUpdatedAt: OCT_2 })
  )

  assert.equal(result?.originLabel, 'depuis l\'espace Keova')
})

test('last change: a post-booking write with no date degrades to no line', () => {
  assert.equal(resolveContactConsentLastChange(payload({ consentSource: 'settings' })), null)
})

test('last change: an unparsable date degrades to no line instead of "Invalid Date"', () => {
  const result = resolveContactConsentLastChange(
    payload({ consentSource: 'settings', consentUpdatedAt: 'not-a-date' })
  )

  assert.equal(result, null)
})

test('the one date on the screen is unambiguous about which channel it belongs to', () => {
  // A granted email with a later SMS-only change: the foot line states a
  // profile-level fact, so it cannot be read as the email consent's date.
  const result = resolveContactConsentLastChange(
    payload({ emailMarketingOptIn: true, consentSource: 'settings', consentUpdatedAt: OCT_2 })
  )

  assert.equal(result?.label, 'Dernier changement enregistré')
  assert.ok(result?.label.includes('Dernier'))
})

// ─────────────────────────────────────────────────────────────────────────────
// Date formatting: the shared cached-Intl helper, guarded.
// ─────────────────────────────────────────────────────────────────────────────

test('date formatting delegates to the shared helper rather than re-declaring it', () => {
  assert.equal(formatContactConsentDate(OCT_1), formatDateShort(OCT_1))
})

test('date formatting returns null for an unparsable value', () => {
  assert.equal(formatContactConsentDate('not-a-date'), null)
})

// ─────────────────────────────────────────────────────────────────────────────
// Channel selection — both provider screens share the rule
// ─────────────────────────────────────────────────────────────────────────────

test('channels: email and SMS are resolved independently from the same payload', () => {
  const input = payload({
    emailMarketingOptIn: true,
    smsMarketingOptIn: false,
    consentSource: 'onboarding'
  })

  assert.equal(resolveContactConsent(pickContactConsent(input, 'email')).label, 'Accordé')
  assert.equal(resolveContactConsent(pickContactConsent(input, 'sms')).label, 'Jamais consenti')
})

test('channels: pickContactConsent never leaks the other channel flag', () => {
  const input = payload({ emailMarketingOptIn: true, smsMarketingOptIn: false })

  assert.equal(pickContactConsent(input, 'sms').optedIn, false)
  assert.equal(pickContactConsent(input, 'email').optedIn, true)
})

test('channels: every channel has a label and an icon', () => {
  const channels: ContactConsentChannel[] = ['email', 'sms']
  const labels = new Set<string>()
  const icons = new Set<string>()

  for (const channel of channels) {
    assert.equal(typeof CONTACT_CONSENT_CHANNEL_LABEL[channel], 'string')
    assert.notEqual(CONTACT_CONSENT_CHANNEL_LABEL[channel].length, 0)
    assert.equal(typeof CONTACT_CONSENT_CHANNEL_ICON[channel], 'string')
    labels.add(CONTACT_CONSENT_CHANNEL_LABEL[channel])
    icons.add(CONTACT_CONSENT_CHANNEL_ICON[channel])
  }

  // One label and one icon per channel: a third channel cannot silently
  // reuse another channel's wording.
  assert.equal(labels.size, channels.length)
  assert.equal(icons.size, channels.length)
})
