import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildDiscoveryConfigPatch,
  isDiscoveryConfigDirty,
  pickDiscoveryConfig,
  resolveDiscoverySaveOutcome
} from '../../app/features/scheduling/domain/discovery-config'

const fullAccount = {
  defaultDiscoveryDurationMinutes: 30,
  discoveryBufferAfterMinutes: 20,
  minBookingNoticeHours: 12
}

/**
 * AC-5 #1 — "render with the value returned by the API". The scheduling page
 * hydrates via `pickDiscoveryConfig`, so proving the mapping covers the
 * render contract without needing a full DOM mount.
 */
test('pickDiscoveryConfig: returns each field from the account when all are provided', () => {
  const values = pickDiscoveryConfig(fullAccount)
  assert.deepStrictEqual(values, {
    duration: 30,
    buffer: 20,
    minBookingNoticeHours: 12
  })
})

test('pickDiscoveryConfig: falls back to SQL-aligned defaults when account is null', () => {
  const values = pickDiscoveryConfig(null)
  // Defaults mirror provider_profiles columns: 15/15/6.
  assert.deepStrictEqual(values, {
    duration: 15,
    buffer: 15,
    minBookingNoticeHours: 6
  })
})

test('isDiscoveryConfigDirty: stays clean when every field matches the saved snapshot', () => {
  const saved = { duration: 15, buffer: 15, minBookingNoticeHours: 6 }
  assert.equal(isDiscoveryConfigDirty({ ...saved }, saved), false)
})

test('isDiscoveryConfigDirty: flips to true when only minBookingNoticeHours changes (AC-3)', () => {
  const saved = { duration: 15, buffer: 15, minBookingNoticeHours: 6 }
  const current = { ...saved, minBookingNoticeHours: 12 }
  assert.equal(isDiscoveryConfigDirty(current, saved), true)
})

/**
 * AC-5 #3 — "save triggers a PATCH with { minBookingNoticeHours: <new value> }".
 * The scheduling page calls `providerAccount.updateAccount(buildDiscoveryConfigPatch(...))`,
 * so asserting the patch shape proves the payload sent to the backend.
 */
test('buildDiscoveryConfigPatch: emits all 3 scheduling fields with their API names (AC-3)', () => {
  const patch = buildDiscoveryConfigPatch({
    duration: 15,
    buffer: 15,
    minBookingNoticeHours: 12
  })
  assert.deepStrictEqual(patch, {
    defaultDiscoveryDurationMinutes: 15,
    discoveryBufferAfterMinutes: 15,
    minBookingNoticeHours: 12
  })
})

test('buildDiscoveryConfigPatch: carries the chosen notice (24) through to the PATCH body', () => {
  const patch = buildDiscoveryConfigPatch({
    duration: 30,
    buffer: 10,
    minBookingNoticeHours: 24
  })
  assert.equal(patch.minBookingNoticeHours, 24)
})

// ────────────────────────────────────────────────────────────────────
// resolveDiscoverySaveOutcome — Review AI 2026-04-22, Finding 1.
// Before this helper, `saveDiscovery()` kept the user-entered value on
// screen when the PATCH failed, silently lying about what was persisted.
// These tests pin the rollback contract so a future refactor that drops
// the helper (or only updates one ref) fails the suite.
// ────────────────────────────────────────────────────────────────────

test('resolveDiscoverySaveOutcome: on success promotes current values as the new saved snapshot', () => {
  const saved = { duration: 15, buffer: 15, minBookingNoticeHours: 6 }
  const current = { duration: 20, buffer: 10, minBookingNoticeHours: 12 }
  const outcome = resolveDiscoverySaveOutcome(true, current, saved)

  assert.equal(outcome.status, 'success')
  assert.deepStrictEqual(outcome.displayValues, current)
  assert.deepStrictEqual(outcome.savedValues, current)
})

test('resolveDiscoverySaveOutcome: on failure rolls the UI back to the last persisted values', () => {
  const saved = { duration: 15, buffer: 15, minBookingNoticeHours: 6 }
  const current = { duration: 20, buffer: 10, minBookingNoticeHours: 12 }
  const outcome = resolveDiscoverySaveOutcome(false, current, saved)

  // The provider must see `saved`, NEVER the rejected draft. If this
  // inverts to `current`, the UI lies about what the backend accepted.
  assert.equal(outcome.status, 'error')
  assert.deepStrictEqual(outcome.displayValues, saved)
  assert.deepStrictEqual(outcome.savedValues, saved)
})

test('resolveDiscoverySaveOutcome: rollback applies to ALL 3 fields together, not just minBookingNoticeHours', () => {
  // A partial rollback (e.g. only minBookingNoticeHours reset, duration kept)
  // would leave the page in an inconsistent state vs the backend. The page
  // sends the 3 fields grouped in the PATCH, so all 3 must roll back together.
  const saved = { duration: 15, buffer: 15, minBookingNoticeHours: 6 }
  const current = { duration: 60, buffer: 60, minBookingNoticeHours: 48 }
  const outcome = resolveDiscoverySaveOutcome(false, current, saved)

  assert.equal(outcome.displayValues.duration, 15)
  assert.equal(outcome.displayValues.buffer, 15)
  assert.equal(outcome.displayValues.minBookingNoticeHours, 6)
})

test('resolveDiscoverySaveOutcome: returns fresh objects — caller cannot mutate the saved snapshot by aliasing', () => {
  const saved = { duration: 15, buffer: 15, minBookingNoticeHours: 6 }
  const current = { duration: 48, buffer: 0, minBookingNoticeHours: 48 }
  const outcome = resolveDiscoverySaveOutcome(false, current, saved)

  outcome.displayValues.minBookingNoticeHours = 99
  outcome.savedValues.duration = 99

  assert.equal(saved.minBookingNoticeHours, 6, 'saved must not alias displayValues')
  assert.equal(saved.duration, 15, 'saved must not alias savedValues')
})
