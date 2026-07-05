/**
 * Unit tests for the provider fiche-client net payout formatting (HF18 CR-1/CR-2).
 *
 * @see hotfix-18 — the fiche client must show the exact net ("Vous recevez")
 *      once the Stripe fee is known, and a placeholder while it is unknown.
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import { formatNetAmountCents } from '../../app/features/clients/domain/clients'

function normalizeSpaces(str: string): string {
  return str.replace(/[\s\u00a0\u202f]/g, ' ')
}

test('formatNetAmountCents: formats the exact net when the fee is known', () => {
  assert.equal(normalizeSpaces(formatNetAmountCents(6768, 'EUR')), '67,68 €')
})

test('formatNetAmountCents: returns the placeholder when net is null (fee unknown)', () => {
  assert.equal(formatNetAmountCents(null, 'EUR'), '—')
})

test('formatNetAmountCents: returns the placeholder when net is absent (client-facing shape)', () => {
  assert.equal(formatNetAmountCents(undefined, 'EUR'), '—')
})

test('formatNetAmountCents: handles a zero net', () => {
  assert.equal(normalizeSpaces(formatNetAmountCents(0, 'EUR')), '0,00 €')
})
