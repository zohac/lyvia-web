/**
 * Behavioral tests for the admin client hard-delete modal logic (story 0-30).
 *
 * Tests cover:
 * - The blocked vs confirm UI state, depending on the API impact response.
 * - The irreversibility checkbox gate before the destructive button enables.
 * - Error classification when the DELETE call fails (race-condition 409 vs
 *   other errors), so the modal can keep itself open and refresh the impact.
 *
 * These tests fail if the financial guard wording, the checkbox gate, or the
 * 409 race-condition handling regresses.
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyHardDeleteError,
  resolveHardDeleteModalState,
  type ClientDeletionImpact
} from '../../app/features/admin/clients/admin-client-hard-delete-helpers'

const allowedImpact: ClientDeletionImpact = {
  appointmentsCount: 3,
  paymentsCount: 0,
  subscriptionsCount: 0,
  canDelete: true,
  blockReason: null
}

const blockedByPaymentsImpact: ClientDeletionImpact = {
  appointmentsCount: 5,
  paymentsCount: 2,
  subscriptionsCount: 0,
  canDelete: false,
  blockReason: 'HAS_PAYMENTS'
}

const blockedBySubscriptionsImpact: ClientDeletionImpact = {
  appointmentsCount: 0,
  paymentsCount: 0,
  subscriptionsCount: 1,
  canDelete: false,
  blockReason: 'HAS_SUBSCRIPTIONS'
}

// =============================================================================
// resolveHardDeleteModalState — UI state machine
// =============================================================================

test('resolveHardDeleteModalState: impact null → loading mode (no destructive action)', () => {
  const state = resolveHardDeleteModalState(null, true)
  assert.equal(state.mode, 'loading')
  assert.equal(state.canConfirm, false)
})

test('resolveHardDeleteModalState: blocked by payments → blocked mode + double-counter wording', () => {
  const state = resolveHardDeleteModalState(blockedByPaymentsImpact, true)
  assert.equal(state.mode, 'blocked')
  assert.equal(state.headerTitle, 'Suppression impossible')
  assert.equal(state.canConfirm, false)
  assert.ok(state.blockMessage)
  // Double counter (payments AND subscriptions) per AC-3 even when only payments block
  assert.match(state.blockMessage!, /2 paiement\(s\)/)
  assert.match(state.blockMessage!, /0 abonnement\(s\)/)
  assert.match(state.blockMessage!, /Désactiver/)
})

test('resolveHardDeleteModalState: blocked by subscriptions → blocked mode + double-counter wording', () => {
  const state = resolveHardDeleteModalState(blockedBySubscriptionsImpact, true)
  assert.equal(state.mode, 'blocked')
  assert.match(state.blockMessage!, /0 paiement\(s\)/)
  assert.match(state.blockMessage!, /1 abonnement\(s\)/)
})

test('resolveHardDeleteModalState: canDelete + checkbox unchecked → confirm mode but canConfirm=false', () => {
  const state = resolveHardDeleteModalState(allowedImpact, false)
  assert.equal(state.mode, 'confirm')
  assert.equal(state.headerTitle, 'Suppression définitive')
  assert.equal(state.canConfirm, false)
  assert.equal(state.blockMessage, null)
})

test('resolveHardDeleteModalState: canDelete + checkbox checked → canConfirm=true (destructive button enabled)', () => {
  const state = resolveHardDeleteModalState(allowedImpact, true)
  assert.equal(state.mode, 'confirm')
  assert.equal(state.canConfirm, true)
})

// =============================================================================
// classifyHardDeleteError — race-condition vs unknown errors
// =============================================================================

test('classifyHardDeleteError: 409 CLIENT_HAS_FINANCIAL_RECORDS → race-condition (modal stays open, refresh impact)', () => {
  const apiFetchError = {
    apiError: {
      code: 'CLIENT_HAS_FINANCIAL_RECORDS',
      message: 'Cannot hard-delete client with payments or active subscriptions.',
      details: { paymentsCount: 1, subscriptionsCount: 0 }
    }
  }

  const outcome = classifyHardDeleteError(apiFetchError)
  assert.equal(outcome.kind, 'race-condition')
})

test('classifyHardDeleteError: other ApiFetchError → unknown-error with message (toast)', () => {
  class ApiFetchErrorMock extends Error {
    apiError = { code: 'INTERNAL_ERROR', message: 'boom' }
  }
  const err = new ApiFetchErrorMock('boom')

  const outcome = classifyHardDeleteError(err)
  assert.equal(outcome.kind, 'unknown-error')
  // unknown-error preserves the JS message for the toast description
  if (outcome.kind === 'unknown-error') {
    assert.equal(outcome.message, 'boom')
  }
})

test('classifyHardDeleteError: plain Error → unknown-error with .message', () => {
  const outcome = classifyHardDeleteError(new Error('network down'))
  assert.equal(outcome.kind, 'unknown-error')
  if (outcome.kind === 'unknown-error') {
    assert.equal(outcome.message, 'network down')
  }
})

test('classifyHardDeleteError: non-Error throwable → unknown-error with default message', () => {
  const outcome = classifyHardDeleteError('something weird')
  assert.equal(outcome.kind, 'unknown-error')
  if (outcome.kind === 'unknown-error') {
    assert.equal(outcome.message, 'Erreur inattendue')
  }
})

// =============================================================================
// Regression guards
// =============================================================================

test('regression: even when canDelete=true, omitting checkbox keeps the destructive action disabled', () => {
  // Critical UX guarantee: an admin must explicitly tick the checkbox; a
  // single click on the row should never delete a client.
  for (const ack of [false]) {
    const state = resolveHardDeleteModalState(allowedImpact, ack)
    assert.equal(state.canConfirm, false)
  }
})

test('regression: blocked impact never enables canConfirm, regardless of checkbox', () => {
  for (const ack of [false, true]) {
    const blockedState = resolveHardDeleteModalState(
      blockedByPaymentsImpact,
      ack
    )
    assert.equal(blockedState.canConfirm, false)
  }
})
