import * as assert from 'node:assert/strict'
import test from 'node:test'

import { formatDateShort } from '../../app/composables/useDateFormat'
import {
  buildContactConsentDateRows,
  CONTACT_CONSENT_CHANNEL_ICON,
  CONTACT_CONSENT_CHANNEL_LABEL,
  formatContactConsentDate,
  getContactConsentState,
  pickContactConsent,
  resolveContactConsent,
  type ContactConsentChannel,
  type ContactConsentPayload
} from '../../app/features/consent/contact-consent'

const MON = '2026-10-12T09:30:00.000Z'
const TUE = '2026-10-13T14:00:00.000Z'

function payload(overrides: Partial<ContactConsentPayload> = {}): ContactConsentPayload {
  return {
    emailMarketingOptIn: false,
    smsMarketingOptIn: false,
    emailConsentUpdatedAt: null,
    smsConsentUpdatedAt: null,
    ...overrides
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// The whole rule of cc-1b: a timestamp means "modified after the profile was
// born". No `consent_source` heuristic, no special case.
// ─────────────────────────────────────────────────────────────────────────────

test('state: a granted flag is "granted", whatever the date', () => {
  // The rule deliberately ignores provenance (`consent_source` = origin): since
  // cc-1b the per-channel date is the whole answer, so the origin is not even an
  // input. The previous version looped over origins it never passed in, so it
  // asserted the same thing sixteen times and its message claimed a coverage it
  // did not have.
  for (const date of [null, MON]) {
    assert.equal(getContactConsentState({ optedIn: true, consentUpdatedAt: date }), 'granted')
  }
})

test('state: false with no date is "never consented"', () => {
  assert.equal(getContactConsentState({ optedIn: false, consentUpdatedAt: null }), 'never_consented')
})

test('state: false with a date is "withdrawn" — a real change after creation', () => {
  assert.equal(getContactConsentState({ optedIn: false, consentUpdatedAt: MON }), 'withdrawn')
})

// ─────────────────────────────────────────────────────────────────────────────
// cc-1b — les lignes « canal + date » de l'écran de préférences, EXÉCUTÉES.
// Le défaut que la story supprime (un canal affichant la date de l'autre) doit
// tomber ici, pas seulement dans une assertion sur le texte du SFC.
// ─────────────────────────────────────────────────────────────────────────────

test('dateRows: chaque ligne porte SA date, jamais celle de l\u2019autre canal', () => {
  const rows = buildContactConsentDateRows({
    emailConsentUpdatedAt: MON,
    smsConsentUpdatedAt: TUE
  })

  assert.deepEqual(
    rows.map(row => [row.channel, row.dateLabel]),
    [
      ['email', formatContactConsentDate(MON)],
      ['sms', formatContactConsentDate(TUE)]
    ]
  )
  // Deux libellés distincts, deux dates distinctes : une inversion est visible.
  assert.equal(rows[0]?.label, 'Email')
  assert.equal(rows[1]?.label, 'SMS')
  assert.notEqual(rows[0]?.dateLabel, rows[1]?.dateLabel)
})

test('dateRows: un canal sans date exploitable est omis', () => {
  assert.deepEqual(
    buildContactConsentDateRows({ emailConsentUpdatedAt: MON, smsConsentUpdatedAt: null })
      .map(row => row.channel),
    ['email']
  )
  assert.deepEqual(
    buildContactConsentDateRows({ emailConsentUpdatedAt: null, smsConsentUpdatedAt: null }),
    []
  )
  assert.deepEqual(buildContactConsentDateRows(null), [])
})

test('dateRows: une date illisible dégrade en absence, pas en ligne', () => {
  assert.deepEqual(
    buildContactConsentDateRows({
      emailConsentUpdatedAt: 'pas-une-date',
      smsConsentUpdatedAt: TUE
    }).map(row => row.channel),
    ['sms']
  )
})

test('state: the origin is not an input any more, so it cannot decide the state', () => {
  // `ContactConsentPayload` no longer carries `consentSource`: the CC.1 heuristic
  // ("settings|admin means modified") had no field to read once the date moved
  // per channel. A booking that granted nothing carries no date, so it reads
  // "Jamais consenti" — and no origin could change that.
  const input = payload()

  assert.equal(resolveContactConsent(pickContactConsent(input, 'email')).label, 'Jamais consenti')
  assert.equal(resolveContactConsent(pickContactConsent(input, 'sms')).label, 'Jamais consenti')

  // Same flags, dated: the only thing that moved the label is the date.
  const dated = payload({ emailConsentUpdatedAt: MON })
  assert.equal(resolveContactConsent(pickContactConsent(dated, 'email')).label, 'Retiré')
})

// ─────────────────────────────────────────────────────────────────────────────
// The wording.
// ─────────────────────────────────────────────────────────────────────────────

test('label: granted is "Accordé" in the success tone, with its date', () => {
  const display = resolveContactConsent({ optedIn: true, consentUpdatedAt: MON })

  assert.equal(display.state, 'granted')
  assert.equal(display.label, 'Accordé')
  assert.equal(display.tone, 'success')
  assert.equal(display.dateLabel, formatDateShort(MON))
})

test('label: never consented is "Jamais consenti", neutral, with no date', () => {
  const display = resolveContactConsent({ optedIn: false, consentUpdatedAt: null })

  assert.equal(display.label, 'Jamais consenti')
  assert.equal(display.tone, 'neutral')
  assert.equal(display.dateLabel, null)
})

test('label: withdrawn is "Retiré" in the warning tone, at its own date', () => {
  const display = resolveContactConsent({ optedIn: false, consentUpdatedAt: MON })

  assert.equal(display.state, 'withdrawn')
  assert.equal(display.label, 'Retiré')
  assert.equal(display.tone, 'warning')
  assert.equal(display.dateLabel, formatDateShort(MON))
})

test('label: "Non autorisé" is gone — "Retiré" no longer overstates the data', () => {
  // CC.1 renamed the state to `not_authorized` because a single profile-level
  // timestamp could not prove a change on one channel. CC.1b gives each channel
  // its own timestamp, so `false` + date on THAT channel is the proof.
  const labels = [
    resolveContactConsent({ optedIn: true, consentUpdatedAt: MON }).label,
    resolveContactConsent({ optedIn: false, consentUpdatedAt: null }).label,
    resolveContactConsent({ optedIn: false, consentUpdatedAt: MON }).label
  ]

  assert.equal(new Set(labels).size, 3)
  assert.ok(!labels.includes('Non autorisé'))
})

test('label: the implicit SMS untick (phone cleared) reads "Retiré" at its date', () => {
  // IdentityForm emits this payload when the phone field is emptied. It is still
  // a real change to the SMS channel, so it is dated like any other.
  const display = resolveContactConsent(
    pickContactConsent(payload({ smsConsentUpdatedAt: MON }), 'sms')
  )

  assert.equal(display.label, 'Retiré')
  assert.equal(display.dateLabel, formatDateShort(MON))
})

// ─────────────────────────────────────────────────────────────────────────────
// The matrix of the spec, channel by channel.
// ─────────────────────────────────────────────────────────────────────────────

test('matrix: PATCH on one channel dates that channel and leaves the other intact', () => {
  // Monday: she unticks email. SMS keeps its own date, untouched.
  const monday = payload({
    emailMarketingOptIn: false,
    smsMarketingOptIn: true,
    emailConsentUpdatedAt: MON,
    smsConsentUpdatedAt: null
  })

  assert.equal(resolveContactConsent(pickContactConsent(monday, 'email')).label, 'Retiré')
  assert.equal(
    resolveContactConsent(pickContactConsent(monday, 'email')).dateLabel,
    formatDateShort(MON)
  )
  assert.equal(resolveContactConsent(pickContactConsent(monday, 'sms')).label, 'Accordé')
  assert.equal(resolveContactConsent(pickContactConsent(monday, 'sms')).dateLabel, null)
})

test('matrix: unticking email Monday then SMS Tuesday gives each its own date', () => {
  // The bug the story exists to fix: both channels used to read Tuesday.
  const tuesday = payload({
    emailMarketingOptIn: false,
    smsMarketingOptIn: false,
    emailConsentUpdatedAt: MON,
    smsConsentUpdatedAt: TUE
  })

  const email = resolveContactConsent(pickContactConsent(tuesday, 'email'))
  const sms = resolveContactConsent(pickContactConsent(tuesday, 'sms'))

  assert.equal(email.label, 'Retiré')
  assert.equal(email.dateLabel, formatDateShort(MON))
  assert.equal(sms.label, 'Retiré')
  assert.equal(sms.dateLabel, formatDateShort(TUE))
  assert.notEqual(email.dateLabel, sms.dateLabel)
})

test('matrix: a fresh booking with email ticked and SMS not leaves SMS undated', () => {
  const fresh = payload({
    emailMarketingOptIn: true,
    smsMarketingOptIn: false,
    emailConsentUpdatedAt: MON,
    smsConsentUpdatedAt: null
  })

  assert.equal(resolveContactConsent(pickContactConsent(fresh, 'email')).label, 'Accordé')
  assert.equal(resolveContactConsent(pickContactConsent(fresh, 'sms')).label, 'Jamais consenti')
  assert.equal(resolveContactConsent(pickContactConsent(fresh, 'sms')).dateLabel, null)
})

test('matrix: re-booking without re-ticking reads "Retiré", never "Jamais consenti"', () => {
  const rebooked = payload({
    emailMarketingOptIn: false,
    smsMarketingOptIn: false,
    emailConsentUpdatedAt: TUE,
    smsConsentUpdatedAt: null
  })

  const email = resolveContactConsent(pickContactConsent(rebooked, 'email'))
  assert.equal(email.label, 'Retiré')
  assert.equal(email.dateLabel, formatDateShort(TUE))
})

test('matrix: untick then re-tick shows "Accordé" with the RE-tick date', () => {
  const regranted = payload({
    emailMarketingOptIn: true,
    smsMarketingOptIn: false,
    emailConsentUpdatedAt: TUE,
    smsConsentUpdatedAt: null
  })

  const email = resolveContactConsent(pickContactConsent(regranted, 'email'))
  assert.equal(email.label, 'Accordé')
  assert.equal(email.dateLabel, formatDateShort(TUE))
})

test('matrix: a granted channel with no date reads "Accordé" without one', () => {
  // Possible only for data written outside the two writers (admin, seeds); the
  // rule must not invent a date for it.
  const display = resolveContactConsent({ optedIn: true, consentUpdatedAt: null })

  assert.equal(display.label, 'Accordé')
  assert.equal(display.dateLabel, null)
})

// ─────────────────────────────────────────────────────────────────────────────
// Per-channel wiring: `pickContactConsent` must carry the channel's own date.
// ─────────────────────────────────────────────────────────────────────────────

test('channels: pickContactConsent gives each channel its own date, never the other', () => {
  const input = payload({
    emailMarketingOptIn: false,
    smsMarketingOptIn: false,
    emailConsentUpdatedAt: MON,
    smsConsentUpdatedAt: TUE
  })

  assert.equal(pickContactConsent(input, 'email').consentUpdatedAt, MON)
  assert.equal(pickContactConsent(input, 'sms').consentUpdatedAt, TUE)
})

test('channels: pickContactConsent never leaks the other channel flag', () => {
  const input = payload({ emailMarketingOptIn: true, smsMarketingOptIn: false })

  assert.equal(pickContactConsent(input, 'sms').optedIn, false)
  assert.equal(pickContactConsent(input, 'email').optedIn, true)
})

test('channels: a dated-but-unticked channel reads differently from an undated one', () => {
  // The list card renders only the label, so the state must already be exact
  // there: the presence of a date is what the label turns on.
  const input = payload({
    emailMarketingOptIn: false,
    smsMarketingOptIn: false,
    emailConsentUpdatedAt: MON,
    smsConsentUpdatedAt: null
  })

  assert.equal(resolveContactConsent(pickContactConsent(input, 'email')).label, 'Retiré')
  assert.equal(resolveContactConsent(pickContactConsent(input, 'sms')).label, 'Jamais consenti')
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

  assert.equal(labels.size, channels.length)
  assert.equal(icons.size, channels.length)
})

// ─────────────────────────────────────────────────────────────────────────────
// Date formatting: the shared cached-Intl helper, guarded.
// ─────────────────────────────────────────────────────────────────────────────

test('date formatting delegates to the shared helper rather than re-declaring it', () => {
  assert.equal(formatContactConsentDate(MON), formatDateShort(MON))
})

test('date formatting returns null for an unparsable value', () => {
  assert.equal(formatContactConsentDate('not-a-date'), null)
})

test('an unparsable channel date degrades to no date instead of "Invalid Date"', () => {
  const display = resolveContactConsent({ optedIn: false, consentUpdatedAt: 'not-a-date' })

  // The state stays truthful — a date exists — but nothing unparsable is shown.
  assert.equal(display.state, 'withdrawn')
  assert.equal(display.dateLabel, null)
})
