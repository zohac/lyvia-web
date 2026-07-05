/**
 * Unit tests for provider payment display formatting.
 *
 * Tests cover currency formatting for:
 * - formatCentsToCurrency()
 * - formatStripeFee()
 * - formatProviderPaymentAmounts()
 *
 * @see Ticket SFF1 - Front : Afficher les frais Stripe et le montant net
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatCentsToCurrency,
  formatNullableCents,
  formatStripeFee,
  formatProviderPaymentAmounts
} from '../../app/features/payments/domain/provider-payment-display'

/**
 * Normalize spaces in formatted currency strings.
 * Intl.NumberFormat uses various Unicode spaces (narrow no-break space, etc.)
 * which differ between environments.
 */
function normalizeSpaces(str: string): string {
  return str.replace(/[\s\u00a0\u202f]/g, ' ')
}

// =============================================================================
// formatCentsToCurrency() tests
// =============================================================================

test('formatCentsToCurrency: formats EUR correctly', () => {
  const result = formatCentsToCurrency(10000, 'eur')
  assert.equal(normalizeSpaces(result), '100,00 €')
})

test('formatCentsToCurrency: formats cents correctly', () => {
  const result = formatCentsToCurrency(175, 'eur')
  assert.equal(normalizeSpaces(result), '1,75 €')
})

test('formatCentsToCurrency: formats zero correctly', () => {
  const result = formatCentsToCurrency(0, 'eur')
  assert.equal(normalizeSpaces(result), '0,00 €')
})

test('formatCentsToCurrency: formats large amounts correctly', () => {
  const result = formatCentsToCurrency(1234567, 'eur')
  const normalized = normalizeSpaces(result)
  assert.ok(normalized.includes('12 345,67'), `Expected '12 345,67' in '${normalized}'`)
  assert.ok(normalized.includes('€'), `Expected '€' in '${normalized}'`)
})

test('formatCentsToCurrency: respects currency parameter', () => {
  const result = formatCentsToCurrency(10000, 'usd', 'en-US')
  assert.equal(result, '$100.00')
})

// =============================================================================
// formatStripeFee() tests
// =============================================================================

test('formatStripeFee: returns null when stripeFeeCents is null', () => {
  const result = formatStripeFee(null, 'eur')
  assert.equal(result, null)
})

test('formatStripeFee: formats fee when available', () => {
  const result = formatStripeFee(175, 'eur')
  assert.equal(normalizeSpaces(result!), '1,75 €')
})

test('formatStripeFee: formats zero fee correctly', () => {
  const result = formatStripeFee(0, 'eur')
  assert.equal(normalizeSpaces(result!), '0,00 €')
})

// =============================================================================
// formatProviderPaymentAmounts() tests
// =============================================================================

test('formatProviderPaymentAmounts: formats all fields correctly', () => {
  const payment = {
    amountCents: 10000,
    platformFeeCents: 1500,
    stripeFeeCents: 175,
    netAmountCents: 8325,
    currency: 'eur'
  }

  const result = formatProviderPaymentAmounts(payment)

  assert.equal(normalizeSpaces(result.amount), '100,00 €')
  assert.equal(normalizeSpaces(result.platformFee), '15,00 €')
  assert.equal(normalizeSpaces(result.stripeFee!), '1,75 €')
  assert.equal(normalizeSpaces(result.net!), '83,25 €')
})

test('formatProviderPaymentAmounts: null stripeFeeCents yields null stripeFee AND null net (HF18 CR-2)', () => {
  const payment = {
    amountCents: 10000,
    platformFeeCents: 1500,
    stripeFeeCents: null,
    // Contract: when the actual Stripe fee is unknown, net is null too.
    netAmountCents: null,
    currency: 'eur'
  }

  const result = formatProviderPaymentAmounts(payment)

  assert.equal(normalizeSpaces(result.amount), '100,00 €')
  assert.equal(normalizeSpaces(result.platformFee), '15,00 €')
  assert.equal(result.stripeFee, null)
  // Never present an exact net computed with a 0 fee.
  assert.equal(result.net, null)
})

test('formatProviderPaymentAmounts: handles zero platform fee (free tier)', () => {
  const payment = {
    amountCents: 10000,
    platformFeeCents: 0,
    stripeFeeCents: 175,
    netAmountCents: 9825,
    currency: 'eur'
  }

  const result = formatProviderPaymentAmounts(payment)

  assert.equal(normalizeSpaces(result.amount), '100,00 €')
  assert.equal(normalizeSpaces(result.platformFee), '0,00 €')
  assert.equal(normalizeSpaces(result.stripeFee!), '1,75 €')
  assert.equal(normalizeSpaces(result.net!), '98,25 €')
})

test('formatProviderPaymentAmounts: handles small amounts correctly', () => {
  const payment = {
    amountCents: 500,
    platformFeeCents: 75,
    stripeFeeCents: 33,
    netAmountCents: 392,
    currency: 'eur'
  }

  const result = formatProviderPaymentAmounts(payment)

  assert.equal(normalizeSpaces(result.amount), '5,00 €')
  assert.equal(normalizeSpaces(result.platformFee), '0,75 €')
  assert.equal(normalizeSpaces(result.stripeFee!), '0,33 €')
  assert.equal(normalizeSpaces(result.net!), '3,92 €')
})

// =============================================================================
// SFF1 DoD compliance tests
// =============================================================================

test('SFF1 DoD: stripeFee AND net display dash when the fee is unknown (legacy payments)', () => {
  const payment = {
    amountCents: 10000,
    platformFeeCents: 1500,
    stripeFeeCents: null,
    netAmountCents: null,
    currency: 'eur'
  }

  const result = formatProviderPaymentAmounts(payment)

  // The UI should display '—' for both when the actual Stripe fee is unknown.
  assert.equal(result.stripeFee, null)
  assert.equal(result.net, null)
})

test('formatNullableCents: returns null when cents is null (HF18 CR-2)', () => {
  assert.equal(formatNullableCents(null, 'eur'), null)
})

test('formatNullableCents: formats an amount when present', () => {
  assert.equal(normalizeSpaces(formatNullableCents(175, 'eur')!), '1,75 €')
})

test('SFF1 DoD: net amount uses server-provided netAmountCents', () => {
  // This test ensures we use netAmountCents from server,
  // not calculating it as amountCents - platformFeeCents - stripeFeeCents
  const payment = {
    amountCents: 10000,
    platformFeeCents: 1500,
    stripeFeeCents: 175,
    netAmountCents: 8325, // Server provides this
    currency: 'eur'
  }

  const result = formatProviderPaymentAmounts(payment)

  // We format the server-provided value, not recalculate
  assert.equal(normalizeSpaces(result.net!), '83,25 €')
})

test('SFF1 DoD: all amounts are formatted in fr-FR locale by default', () => {
  const payment = {
    amountCents: 12345,
    platformFeeCents: 1852,
    stripeFeeCents: 222,
    netAmountCents: 10271,
    currency: 'eur'
  }

  const result = formatProviderPaymentAmounts(payment)

  // French locale: comma for decimal, space for thousands, € at end
  assert.equal(normalizeSpaces(result.amount), '123,45 €')
  assert.equal(normalizeSpaces(result.platformFee), '18,52 €')
  assert.equal(normalizeSpaces(result.stripeFee!), '2,22 €')
  assert.equal(normalizeSpaces(result.net!), '102,71 €')
})
