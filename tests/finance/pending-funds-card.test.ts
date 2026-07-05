/**
 * Unit tests for the pending-funds card resolution (HF19).
 *
 * @see hotfix-19 — the Finance card must show the real Stripe balance and a
 *      coherent message when the account is connected, keep the shadow
 *      cumulative + "connect your bank" message otherwise, and degrade cleanly
 *      when Stripe is unreachable.
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import { resolvePendingFundsCard } from '../../app/features/finance/domain/finance-state'
import type {
  ProviderFinanceBalance,
  ProviderFinanceSummary,
  StripeConnectStatus
} from '../../app/features/finance/api/finance.contract'

function buildStripe(overrides: Partial<StripeConnectStatus> = {}): StripeConnectStatus {
  return {
    stripeAccountId: 'acct_123',
    chargesEnabled: true,
    payoutsEnabled: false,
    detailsSubmitted: true,
    requirementsDue: [],
    requirementsEventuallyDue: [],
    requirementsPastDue: [],
    disabledReason: null,
    onboardingCompletedAt: null,
    ...overrides
  }
}

function buildSummary(
  stripe: Partial<StripeConnectStatus>,
  balance: ProviderFinanceBalance,
  payouts = { pendingPayoutCents: 6800, pendingPayoutCount: 1 }
): ProviderFinanceSummary {
  return {
    timezone: 'Europe/Paris',
    stripe: buildStripe(stripe),
    payouts,
    balance
  }
}

test('connected: real Stripe pending balance + payout-schedule message, no misleading count', () => {
  const summary = buildSummary(
    { payoutsEnabled: true },
    { source: 'stripe', pendingCents: 12371, currency: 'EUR' }
  )

  const card = resolvePendingFundsCard(summary)

  assert.equal(card.mode, 'connected')
  assert.equal(card.mode === 'connected' && card.amountCents, 12371)
  assert.match(card.message, /calendrier de virement Stripe/)
  // Never the "connect your bank" line when payouts are enabled.
  assert.doesNotMatch(card.message, /sera connecté/)
})

test('connected but Stripe unreachable: unavailable state, no fabricated amount (AC-4)', () => {
  const summary = buildSummary(
    { payoutsEnabled: true },
    { source: 'unavailable', pendingCents: null, currency: 'EUR' }
  )

  const card = resolvePendingFundsCard(summary)

  assert.equal(card.mode, 'unavailable')
  assert.match(card.message, /indisponible/)
})

test('shadow (no Connect account): internal cumulative + "connect your bank" message (AC-3)', () => {
  const summary = buildSummary(
    { payoutsEnabled: false },
    { source: 'shadow', pendingCents: 6800, currency: 'EUR' }
  )

  const card = resolvePendingFundsCard(summary)

  assert.equal(card.mode, 'shadow')
  assert.equal(card.mode === 'shadow' && card.amountCents, 6800)
  assert.equal(card.mode === 'shadow' && card.count, 1)
  assert.match(card.message, /sera connecté/)
})

test('payouts enabled but balance stuck on shadow source: degrades to unavailable, not shadow', () => {
  // Defensive: a connected account must never show the shadow "connect" message.
  const summary = buildSummary(
    { payoutsEnabled: true },
    { source: 'shadow', pendingCents: 6800, currency: 'EUR' }
  )

  const card = resolvePendingFundsCard(summary)

  assert.equal(card.mode, 'unavailable')
})
