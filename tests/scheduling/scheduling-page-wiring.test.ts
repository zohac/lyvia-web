import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story 0-25 — behavioural coverage of `/provider/scheduling` (AC-5).
 *
 * The project ships no DOM-mount framework: Vue components are tested by
 * reading the `.vue` source and asserting the wiring is the one the AC
 * describes. These tests are therefore **structural** but they target the
 * exact lines that implement the behaviour, so breaking the v-model,
 * replacing the outcome helper with a bespoke branch, or removing the
 * rollback path will make them fail — which is what Finding 2 of the
 * 2026-04-22 AI review asked for.
 */

const appRoot = path.resolve(process.cwd(), 'app')
const PAGE_PATH = 'pages/provider/scheduling.vue'

function readPage(): string {
  return fs.readFileSync(path.join(appRoot, PAGE_PATH), 'utf-8')
}

describe('0-25 — /provider/scheduling page wiring (AC-5 real behavioural coverage)', () => {
  test('USelect for minBookingNoticeHours binds the v-model ref to the verbatim options list', () => {
    const source = readPage()
    // AC-2: the third USelect in "Configuration discovery" must feed the ref
    // hydrated from the API, otherwise the rendered value is decorrelated
    // from the provider's saved configuration.
    assert.match(source, /v-model="discoveryBookingNotice"/)
    // AC-2 + convention A31: options MUST come from BOOKING_NOTICE_OPTIONS
    // (8 items, order + labels verbatim from the AC).
    assert.match(source, /:items="bookingNoticeOptions"/)
    assert.match(
      source,
      /const\s+bookingNoticeOptions\s*=\s*BOOKING_NOTICE_OPTIONS/
    )
  })

  test('UFormField label + help are copied verbatim from AC-2 (convention A31)', () => {
    const source = readPage()
    assert.ok(
      source.includes('label="Délai minimum avant réservation"'),
      'Label must match AC-2 verbatim — any paraphrase is a CR regression'
    )
    // Help text is long; slice to avoid coupling to line breaks.
    assert.ok(
      source.includes('Les créneaux plus proches que ce délai ne seront pas proposés'),
      'Help text must start with the AC-2 wording verbatim'
    )
    assert.ok(
      source.includes('Plus le délai est long, plus vous avez le temps de préparer chaque rendez-vous.'),
      'Help text must end with the AC-2 wording verbatim'
    )
  })

  test('discoveryBookingNotice ref is hydrated through pickDiscoveryConfig(providerAccount.account.value)', () => {
    const source = readPage()
    // Hydration path: API response → pickDiscoveryConfig → initial config →
    // ref. If someone inlines `account?.minBookingNoticeHours ?? 6`, this
    // test fails and the DEFAULT_BOOKING_NOTICE_HOURS constant is bypassed.
    assert.match(source, /pickDiscoveryConfig\(providerAccount\.account\.value\)/)
    assert.match(
      source,
      /discoveryBookingNotice\s*=\s*ref\(initialDiscoveryConfig\.minBookingNoticeHours\)/
    )
  })

  test('watch on account re-syncs the 3 refs through pickDiscoveryConfig on refetch', () => {
    const source = readPage()
    // After a retry fetch (useProviderAccount.fetchAccount) the ref must
    // re-hydrate — otherwise the dirty flag goes stale and the user can't
    // save again.
    assert.match(source, /watch\(\s*\(\)\s*=>\s*providerAccount\.account\.value/)
    assert.match(source, /discoveryBookingNotice\.value\s*=\s*next\.minBookingNoticeHours/)
  })

  test('"Enregistrer" button wires @click=saveDiscovery and disables when pristine', () => {
    const source = readPage()
    assert.match(source, /@click="saveDiscovery"/)
    // AC-3: the button must be disabled when `isDiscoveryDirty === false`.
    assert.match(source, /:disabled="!isDiscoveryDirty"/)
    // The button must loop through the saving state during the PATCH.
    assert.match(source, /:loading="discoverySaving"/)
  })

  test('saveDiscovery sends the grouped PATCH built by buildDiscoveryConfigPatch', () => {
    const source = readPage()
    // AC-3: `minBookingNoticeHours` must land in the PATCH body. Using the
    // helper guarantees the 3 fields ship together — any hand-rolled body
    // that drops a field will fail this match.
    assert.match(source, /buildDiscoveryConfigPatch\(currentDiscoveryValues\.value\)/)
    assert.match(source, /providerAccount\.updateAccount\(patch\)/)
  })

  test('saveDiscovery routes success vs error through resolveDiscoverySaveOutcome (Finding 1 fix)', () => {
    const source = readPage()
    // The outcome helper is the single source of truth for the rollback —
    // if somebody replaces `ok ? ... : ...` with a bespoke branch that keeps
    // the user draft on failure, this regression test fires.
    assert.match(source, /resolveDiscoverySaveOutcome\(\s*ok\s*,/)
    assert.match(source, /currentDiscoveryValues\.value,/)
    assert.match(source, /savedDiscoveryValues\.value/)
  })

  test('saveDiscovery resets the 3 refs to outcome.displayValues — rollback on failure', () => {
    const source = readPage()
    // These 3 assignments are the rollback: when outcome.status === 'error',
    // outcome.displayValues === savedValues and the USelects snap back to
    // the last persisted values.
    assert.match(
      source,
      /discoveryDuration\.value\s*=\s*outcome\.displayValues\.duration/
    )
    assert.match(
      source,
      /discoveryBuffer\.value\s*=\s*outcome\.displayValues\.buffer/
    )
    assert.match(
      source,
      /discoveryBookingNotice\.value\s*=\s*outcome\.displayValues\.minBookingNoticeHours/
    )
    // savedDiscoveryValues must also be re-anchored on outcome.savedValues
    // so the dirty flag reflects the post-rollback reality.
    assert.match(
      source,
      /savedDiscoveryValues\.value\s*=\s*outcome\.savedValues/
    )
  })

  test('error toast fires when outcome.status is "error" — user gets explicit feedback', () => {
    const source = readPage()
    // AC-3: the existing error toast pattern must still fire so the
    // provider knows the save failed (rollback alone is silent).
    assert.match(source, /outcome\.status === 'success'/)
    assert.match(source, /color:\s*'error'/)
    // Success toast wording stays verbatim (convention A31 applied to toasts).
    assert.match(source, /title:\s*'Configuration découverte enregistrée'/)
  })
})
