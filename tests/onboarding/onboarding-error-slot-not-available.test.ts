/**
 * Behavioral tests for SLOT_NOT_AVAILABLE handling in the discovery booking wizard.
 *
 * Hotfix-16: backend now returns 409 SLOT_NOT_AVAILABLE when a slot is off-grid
 * (engine authoritative). The wizard must:
 *   - recognize the code (not fall back to the generic message)
 *   - return to the slot picker (step 1) and reload availability
 *
 * The wizard branch is gated by `isSlotUnavailableErrorCode(code)`. These tests
 * fail if the code drops back to the generic fallback OR if the slot-unavailable
 * branch stops covering it.
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  isSlotUnavailableErrorCode,
  mapOnboardingErrorCodeToUserMessage
} from '../../app/features/onboarding/api/onboarding-error'

test('isSlotUnavailableErrorCode: SLOT_NOT_AVAILABLE triggers reload + back to step 1', () => {
  assert.equal(isSlotUnavailableErrorCode('SLOT_NOT_AVAILABLE'), true)
})

test('isSlotUnavailableErrorCode: SLOT_ALREADY_BOOKED still triggers reload (regression)', () => {
  assert.equal(isSlotUnavailableErrorCode('SLOT_ALREADY_BOOKED'), true)
})

test('isSlotUnavailableErrorCode: VALIDATION_ERROR keeps its own flow (form errors on step 2)', () => {
  assert.equal(isSlotUnavailableErrorCode('VALIDATION_ERROR'), false)
})

test('isSlotUnavailableErrorCode: unknown codes do not hijack the slot-reload branch', () => {
  assert.equal(isSlotUnavailableErrorCode('UNKNOWN_ERROR_CODE'), false)
  assert.equal(isSlotUnavailableErrorCode(''), false)
})

test('mapOnboardingErrorCodeToUserMessage: SLOT_NOT_AVAILABLE returns dedicated message (not generic fallback)', () => {
  const message = mapOnboardingErrorCodeToUserMessage('SLOT_NOT_AVAILABLE')
  assert.equal(message.title, 'Créneau indisponible')
  // Message must guide the user to pick another slot — not a generic "réessayer".
  assert.match(message.description, /plus disponible/i)
  assert.match(message.description, /choisir/i)
  // Regression guard: must NOT be the default fallback.
  const fallback = mapOnboardingErrorCodeToUserMessage('UNKNOWN_ERROR_CODE')
  assert.notEqual(message.title, fallback.title)
  assert.notEqual(message.description, fallback.description)
})

test('mapOnboardingErrorCodeToUserMessage: SLOT_ALREADY_BOOKED keeps its message (regression)', () => {
  const message = mapOnboardingErrorCodeToUserMessage('SLOT_ALREADY_BOOKED')
  assert.equal(message.title, 'Créneau indisponible')
  assert.match(message.description, /choisir un autre/i)
})
