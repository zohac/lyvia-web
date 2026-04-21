import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildDiscoveryConfigPatch,
  isDiscoveryConfigDirty,
  pickDiscoveryConfig
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
