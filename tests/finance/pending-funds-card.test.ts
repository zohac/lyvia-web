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

import {
  resolveFinanceDashboardLabel,
  resolvePendingFundsCard
} from '../../app/features/finance/domain/finance-state'
import type {
  ProviderFinanceBalance,
  ProviderFinanceSummary,
  StripeConnectStatus
} from '../../app/features/finance/api/finance.contract'

const fakeFormat = (cents: number): string => `${(cents / 100).toFixed(2)}€`

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

// ── Dashboard status label (HF19 CR Finding 1) ────────────────────────────────

test('dashboard label: connected account NEVER surfaces the obsolete internal cumulative (Finding 1)', () => {
  // Connected account, real Stripe balance 0, but a large stale shadow cumul.
  const summary = buildSummary(
    { payoutsEnabled: true },
    { source: 'stripe', pendingCents: 0, currency: 'EUR' },
    { pendingPayoutCents: 394368, pendingPayoutCount: 58 }
  )

  const label = resolveFinanceDashboardLabel(summary, fakeFormat)

  // Must NOT read "3943,68€ en attente de virement" from the old cumul.
  assert.doesNotMatch(label, /en attente de virement/)
  assert.equal(label, 'Compte Stripe actif')
})

test('dashboard label: connected account with a real positive Stripe pending shows the real amount', () => {
  const summary = buildSummary(
    { payoutsEnabled: true },
    { source: 'stripe', pendingCents: 12371, currency: 'EUR' },
    { pendingPayoutCents: 394368, pendingPayoutCount: 58 }
  )

  const label = resolveFinanceDashboardLabel(summary, fakeFormat)

  assert.equal(label, '123.71€ en attente de virement')
})

test('dashboard label: unavailable balance stays neutral, never a fabricated amount (Finding 1 + AC-4)', () => {
  const summary = buildSummary(
    { payoutsEnabled: true },
    { source: 'unavailable', pendingCents: null, currency: 'EUR' },
    { pendingPayoutCents: 394368, pendingPayoutCount: 58 }
  )

  const label = resolveFinanceDashboardLabel(summary, fakeFormat)

  assert.equal(label, 'Compte Stripe actif')
})

test('dashboard label: shadow account keeps the "à compléter" status', () => {
  const summary = buildSummary(
    { payoutsEnabled: false },
    { source: 'shadow', pendingCents: 6800, currency: 'EUR' }
  )

  const label = resolveFinanceDashboardLabel(summary, fakeFormat)

  assert.equal(label, 'Compte Stripe à compléter.')
})
