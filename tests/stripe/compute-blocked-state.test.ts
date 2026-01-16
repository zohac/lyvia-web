/**
 * Unit tests for computeBlockedState function.
 *
 * Tests cover:
 * - Null/undefined status handling
 * - Blocked state when disabledReason is set
 * - Blocked state when requirementsPastDue has items
 * - Non-blocked states
 *
 * @see Ticket SRF2 - Global banner for blocked accounts
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import { computeBlockedState } from '../../app/features/stripe/stripe-blocked-state'
import type { StripeConnectStatus } from '../../app/features/finance/api/finance.contract'

function createStripeStatus(overrides: Partial<StripeConnectStatus> = {}): StripeConnectStatus {
  return {
    stripeAccountId: 'acct_123',
    chargesEnabled: true,
    payoutsEnabled: true,
    detailsSubmitted: true,
    requirementsDue: [],
    requirementsEventuallyDue: [],
    requirementsPastDue: [],
    disabledReason: null,
    onboardingCompletedAt: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

// =============================================================================
// Null/undefined status handling
// =============================================================================

test('computeBlockedState: returns not blocked for null status', () => {
  const result = computeBlockedState(null)
  assert.equal(result.isBlocked, false)
  assert.equal(result.blockMessage, null)
})

test('computeBlockedState: returns not blocked when stripeAccountId is null', () => {
  const status = createStripeStatus({ stripeAccountId: null })
  const result = computeBlockedState(status)
  assert.equal(result.isBlocked, false)
  assert.equal(result.blockMessage, null)
})

// =============================================================================
// Blocked state: disabledReason
// =============================================================================

test('computeBlockedState: blocked when disabledReason is set', () => {
  const status = createStripeStatus({ disabledReason: 'requirements.past_due' })
  const result = computeBlockedState(status)
  assert.equal(result.isBlocked, true)
  assert.ok(result.blockMessage !== null)
  assert.ok(result.blockMessage!.includes('désactivé'))
})

test('computeBlockedState: blocked with fraud rejection', () => {
  const status = createStripeStatus({ disabledReason: 'rejected.fraud' })
  const result = computeBlockedState(status)
  assert.equal(result.isBlocked, true)
  assert.ok(result.blockMessage !== null)
})

test('computeBlockedState: blocked with terms of service rejection', () => {
  const status = createStripeStatus({ disabledReason: 'rejected.terms_of_service' })
  const result = computeBlockedState(status)
  assert.equal(result.isBlocked, true)
})

// =============================================================================
// Blocked state: requirementsPastDue
// =============================================================================

test('computeBlockedState: blocked when requirementsPastDue has items', () => {
  const status = createStripeStatus({
    requirementsPastDue: ['external_account']
  })
  const result = computeBlockedState(status)
  assert.equal(result.isBlocked, true)
  assert.ok(result.blockMessage !== null)
  assert.ok(result.blockMessage!.includes('informations requises'))
})

test('computeBlockedState: blocked when requirementsPastDue has multiple items', () => {
  const status = createStripeStatus({
    requirementsPastDue: ['external_account', 'individual.verification.document']
  })
  const result = computeBlockedState(status)
  assert.equal(result.isBlocked, true)
})

// =============================================================================
// Non-blocked states
// =============================================================================

test('computeBlockedState: not blocked with empty requirements', () => {
  const status = createStripeStatus()
  const result = computeBlockedState(status)
  assert.equal(result.isBlocked, false)
  assert.equal(result.blockMessage, null)
})

test('computeBlockedState: not blocked when only requirementsDue has items (not past_due)', () => {
  const status = createStripeStatus({
    requirementsDue: ['external_account']
  })
  const result = computeBlockedState(status)
  assert.equal(result.isBlocked, false)
  assert.equal(result.blockMessage, null)
})

test('computeBlockedState: not blocked when only requirementsEventuallyDue has items', () => {
  const status = createStripeStatus({
    requirementsEventuallyDue: ['business_profile.url']
  })
  const result = computeBlockedState(status)
  assert.equal(result.isBlocked, false)
  assert.equal(result.blockMessage, null)
})

test('computeBlockedState: not blocked when charges/payouts are disabled but no disabledReason', () => {
  const status = createStripeStatus({
    chargesEnabled: false,
    payoutsEnabled: false
  })
  const result = computeBlockedState(status)
  assert.equal(result.isBlocked, false)
})

// =============================================================================
// Priority tests
// =============================================================================

test('computeBlockedState: disabledReason takes priority over requirementsPastDue', () => {
  const status = createStripeStatus({
    disabledReason: 'rejected.fraud',
    requirementsPastDue: ['external_account']
  })
  const result = computeBlockedState(status)
  assert.equal(result.isBlocked, true)
  // Should show the disabledReason message, not the past_due message
  assert.ok(result.blockMessage!.includes('désactivé'))
})

// =============================================================================
// SRF2 DoD compliance tests
// =============================================================================

test('SRF2 DoD: message is in French when blocked', () => {
  const status = createStripeStatus({ disabledReason: 'requirements.past_due' })
  const result = computeBlockedState(status)
  assert.ok(result.blockMessage !== null)
  // Check for French words
  const msg = result.blockMessage!
  const hasFrench
    = msg.includes('Votre')
      || msg.includes('compte')
      || msg.includes('désactivé')
      || msg.includes('fonctionnalités')
  assert.ok(hasFrench, `Message should be in French: ${msg}`)
})

test('SRF2 DoD: past_due message mentions suspension risk', () => {
  const status = createStripeStatus({
    requirementsPastDue: ['external_account']
  })
  const result = computeBlockedState(status)
  assert.ok(result.blockMessage !== null)
  const msg = result.blockMessage!
  assert.ok(
    msg.includes('suspendus') || msg.includes('temps'),
    `Message should mention suspension: ${msg}`
  )
})

test('SRF2 DoD: no raw Stripe keys in messages', () => {
  const status = createStripeStatus({
    disabledReason: 'requirements.past_due',
    requirementsPastDue: ['external_account', 'individual.verification.document']
  })
  const result = computeBlockedState(status)
  assert.ok(result.blockMessage !== null)
  const msg = result.blockMessage!
  assert.ok(!msg.includes('requirements.past_due'))
  assert.ok(!msg.includes('external_account'))
  assert.ok(!msg.includes('individual.'))
})
