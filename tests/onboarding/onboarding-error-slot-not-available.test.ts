/**
 * Behavioral tests for SLOT_NOT_AVAILABLE handling in the discovery booking wizard.
 *
 * Hotfix-16: backend now returns 409 SLOT_NOT_AVAILABLE when a slot is off-grid
 * (engine authoritative). The wizard must:
 *   - recognize the code (not fall back to the generic message)
 *   - return to the slot picker (step 1) and reload availability
 *
 * The wizard branch is routed through `resolveOnboardingErrorRecovery(code)`.
 * These tests fail if the code drops back to the generic fallback OR if the
 * slot-unavailable branch stops returning step-1 + reload + clear-selection.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test from 'node:test'

import {
  isSlotUnavailableErrorCode,
  mapOnboardingErrorCodeToUserMessage,
  resolveOnboardingErrorRecovery
} from '../../app/features/onboarding/api/onboarding-error'

function readDiscoveryBookingWizard(): string {
  return fs.readFileSync(
    path.join(process.cwd(), 'app/components/organisms/DiscoveryBookingWizard.vue'),
    'utf-8'
  )
}

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

test('resolveOnboardingErrorRecovery: SLOT_NOT_AVAILABLE returns the wizard recovery action', () => {
  assert.deepEqual(resolveOnboardingErrorRecovery('SLOT_NOT_AVAILABLE'), {
    targetStep: 1,
    reloadAvailability: true,
    clearSelectedSlot: true,
    applyBackendValidationErrors: false,
    preserveUserMessage: true
  })
})

test('resolveOnboardingErrorRecovery: SLOT_ALREADY_BOOKED keeps the same recovery action', () => {
  assert.deepEqual(resolveOnboardingErrorRecovery('SLOT_ALREADY_BOOKED'), {
    targetStep: 1,
    reloadAvailability: true,
    clearSelectedSlot: true,
    applyBackendValidationErrors: false,
    preserveUserMessage: true
  })
})

test('resolveOnboardingErrorRecovery: VALIDATION_ERROR stays on the form-validation path', () => {
  assert.deepEqual(resolveOnboardingErrorRecovery('VALIDATION_ERROR'), {
    targetStep: 2,
    reloadAvailability: false,
    clearSelectedSlot: false,
    applyBackendValidationErrors: true,
    preserveUserMessage: true
  })
})

test('resolveOnboardingErrorRecovery: unknown errors keep the generic message path only', () => {
  assert.deepEqual(resolveOnboardingErrorRecovery('UNKNOWN_ERROR_CODE'), {
    targetStep: null,
    reloadAvailability: false,
    clearSelectedSlot: false,
    applyBackendValidationErrors: false,
    preserveUserMessage: true
  })
})

test('DiscoveryBookingWizard uses the recovery action for step, reload, selected slot and message wiring', () => {
  const source = readDiscoveryBookingWizard()
  assert.match(source, /resolveOnboardingErrorRecovery\(err\.apiError\.code\)/)
  assert.match(source, /if \(recovery\.clearSelectedSlot\) selectedSlotStartAt\.value = null/)
  assert.match(source, /if \(recovery\.targetStep\) goToStep\(recovery\.targetStep\)/)
  assert.match(source, /if \(recovery\.reloadAvailability\)\s*{\s*await loadAvailability\(\)\s*}/)
  assert.match(source, /if \(recovery\.preserveUserMessage && !systemError\.value\)/)
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
