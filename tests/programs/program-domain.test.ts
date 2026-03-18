import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  SUBSCRIPTION_STATUS_META,
  formatProgramInstallments,
  formatSessionsProgress,
  computeSessionsPercent
} from '../../app/features/programs/domain/programs'

// ============================================================================
// SUBSCRIPTION_STATUS_META
// ============================================================================

test('SUBSCRIPTION_STATUS_META: active is success green', () => {
  assert.equal(SUBSCRIPTION_STATUS_META.active.label, 'Active')
  assert.equal(SUBSCRIPTION_STATUS_META.active.color, 'success')
})

test('SUBSCRIPTION_STATUS_META: frozen is warning orange', () => {
  assert.equal(SUBSCRIPTION_STATUS_META.frozen.label, 'Gelée')
  assert.equal(SUBSCRIPTION_STATUS_META.frozen.color, 'warning')
})

test('SUBSCRIPTION_STATUS_META: completed is neutral grey', () => {
  assert.equal(SUBSCRIPTION_STATUS_META.completed.label, 'Terminée')
  assert.equal(SUBSCRIPTION_STATUS_META.completed.color, 'neutral')
})

test('SUBSCRIPTION_STATUS_META: cancelled is error red', () => {
  assert.equal(SUBSCRIPTION_STATUS_META.cancelled.label, 'Annulée')
  assert.equal(SUBSCRIPTION_STATUS_META.cancelled.color, 'error')
})

test('SUBSCRIPTION_STATUS_META: expired is neutral', () => {
  assert.equal(SUBSCRIPTION_STATUS_META.expired.label, 'Expirée')
  assert.equal(SUBSCRIPTION_STATUS_META.expired.color, 'neutral')
})

// ============================================================================
// formatProgramInstallments
// ============================================================================

test('formatProgramInstallments: returns null when no installments', () => {
  const result = formatProgramInstallments({
    allowInstallments: false,
    installmentCount: null,
    monthlyPriceCents: null
  })
  assert.equal(result, null)
})

test('formatProgramInstallments: returns formatted string with installments', () => {
  const result = formatProgramInstallments({
    allowInstallments: true,
    installmentCount: 3,
    monthlyPriceCents: 10000
  })
  assert.notEqual(result, null)
  assert.ok(result!.includes('3 mensualités'))
  assert.ok(result!.includes('/mois'))
})

// ============================================================================
// formatSessionsProgress
// ============================================================================

test('formatSessionsProgress: formats correctly', () => {
  assert.equal(formatSessionsProgress(3, 10), '3/10 séances utilisées')
})

test('formatSessionsProgress: zero used', () => {
  assert.equal(formatSessionsProgress(0, 8), '0/8 séances utilisées')
})

test('formatSessionsProgress: all used', () => {
  assert.equal(formatSessionsProgress(6, 6), '6/6 séances utilisées')
})

// ============================================================================
// computeSessionsPercent
// ============================================================================

test('computeSessionsPercent: returns 0 for 0/10', () => {
  assert.equal(computeSessionsPercent(0, 10), 0)
})

test('computeSessionsPercent: returns 50 for 5/10', () => {
  assert.equal(computeSessionsPercent(5, 10), 50)
})

test('computeSessionsPercent: returns 100 for 10/10', () => {
  assert.equal(computeSessionsPercent(10, 10), 100)
})

test('computeSessionsPercent: caps at 100 even if used > total', () => {
  assert.equal(computeSessionsPercent(12, 10), 100)
})

test('computeSessionsPercent: returns 0 when total is 0', () => {
  assert.equal(computeSessionsPercent(0, 0), 0)
})

test('computeSessionsPercent: rounds correctly (33%)', () => {
  assert.equal(computeSessionsPercent(1, 3), 33)
})

test('computeSessionsPercent: rounds correctly (67%)', () => {
  assert.equal(computeSessionsPercent(2, 3), 67)
})
