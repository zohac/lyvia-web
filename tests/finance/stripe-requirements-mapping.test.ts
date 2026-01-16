/**
 * Unit tests for Stripe requirements mapping.
 *
 * Tests cover:
 * - mapAllStripeRequirements() severity classification
 * - French translations for common requirement keys
 * - Disabled reason handling
 *
 * @see Ticket SRF1 - Display Stripe requirements with priority
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import { mapAllStripeRequirements } from '../../app/features/finance/domain/finance-state'
import type { StripeConnectStatus } from '../../app/features/finance/api/finance.contract'

function createStripeStatus(overrides: Partial<StripeConnectStatus> = {}): StripeConnectStatus {
  return {
    stripeAccountId: 'acct_123',
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    requirementsDue: [],
    requirementsEventuallyDue: [],
    requirementsPastDue: [],
    disabledReason: null,
    onboardingCompletedAt: null,
    ...overrides
  }
}

// =============================================================================
// Severity classification tests
// =============================================================================

test('mapAllStripeRequirements: returns empty array when no requirements', () => {
  const stripe = createStripeStatus()
  const alerts = mapAllStripeRequirements(stripe)
  assert.equal(alerts.length, 0)
})

test('mapAllStripeRequirements: past_due requirements have critical severity', () => {
  const stripe = createStripeStatus({
    requirementsPastDue: ['external_account']
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.equal(alerts.length, 1)
  assert.equal(alerts[0].severity, 'critical')
})

test('mapAllStripeRequirements: currently_due requirements have warning severity', () => {
  const stripe = createStripeStatus({
    requirementsDue: ['external_account']
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.equal(alerts.length, 1)
  assert.equal(alerts[0].severity, 'warning')
})

test('mapAllStripeRequirements: eventually_due requirements have info severity', () => {
  const stripe = createStripeStatus({
    requirementsEventuallyDue: ['external_account']
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.equal(alerts.length, 1)
  assert.equal(alerts[0].severity, 'info')
})

test('mapAllStripeRequirements: disabled_reason has critical severity', () => {
  const stripe = createStripeStatus({
    disabledReason: 'requirements.past_due'
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.equal(alerts.length, 1)
  assert.equal(alerts[0].severity, 'critical')
})

// =============================================================================
// Priority ordering tests
// =============================================================================

test('mapAllStripeRequirements: alerts are ordered by severity (critical first)', () => {
  const stripe = createStripeStatus({
    requirementsDue: ['business_profile.url'],
    requirementsEventuallyDue: ['company.tax_id'],
    requirementsPastDue: ['external_account']
  })
  const alerts = mapAllStripeRequirements(stripe)

  // Should have 3 alerts: 1 critical, 1 warning, 1 info
  assert.equal(alerts.length, 3)
  assert.equal(alerts[0].severity, 'critical')
  assert.equal(alerts[1].severity, 'warning')
  assert.equal(alerts[2].severity, 'info')
})

test('mapAllStripeRequirements: disabled_reason appears before past_due', () => {
  const stripe = createStripeStatus({
    disabledReason: 'rejected.fraud',
    requirementsPastDue: ['external_account']
  })
  const alerts = mapAllStripeRequirements(stripe)

  assert.equal(alerts.length, 2)
  assert.equal(alerts[0].severity, 'critical')
  assert.ok(alerts[0].message.includes('fraude'))
})

// =============================================================================
// Deduplication tests
// =============================================================================

test('mapAllStripeRequirements: deduplicates same message across severity levels', () => {
  const stripe = createStripeStatus({
    requirementsDue: ['external_account'],
    requirementsEventuallyDue: ['external_account']
  })
  const alerts = mapAllStripeRequirements(stripe)

  // Same requirement key should produce same message, which should be deduplicated
  // The first occurrence (warning) should be kept
  assert.equal(alerts.length, 1)
  assert.equal(alerts[0].severity, 'warning')
})

test('mapAllStripeRequirements: deduplicates similar keys with same message', () => {
  const stripe = createStripeStatus({
    requirementsDue: [
      'individual.first_name',
      'individual.last_name',
      'individual.dob.day',
      'individual.dob.month',
      'individual.dob.year'
    ]
  })
  const alerts = mapAllStripeRequirements(stripe)

  // All these map to the same French message
  assert.equal(alerts.length, 1)
  assert.ok(alerts[0].message.includes('informations personnelles'))
})

// =============================================================================
// French translation tests
// =============================================================================

test('mapAllStripeRequirements: external_account translates to French IBAN message', () => {
  const stripe = createStripeStatus({
    requirementsDue: ['external_account']
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.ok(alerts[0].message.includes('IBAN'))
  assert.ok(alerts[0].message.includes('compte bancaire'))
})

test('mapAllStripeRequirements: verification.document translates to French identity message', () => {
  const stripe = createStripeStatus({
    requirementsDue: ['individual.verification.document']
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.ok(alerts[0].message.includes('identité'))
  assert.ok(alerts[0].message.includes('document officiel'))
})

test('mapAllStripeRequirements: address fields translate to French postal address message', () => {
  const stripe = createStripeStatus({
    requirementsDue: ['individual.address.line1']
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.ok(alerts[0].message.includes('adresse postale'))
})

test('mapAllStripeRequirements: business_profile.url translates to French activity link message', () => {
  const stripe = createStripeStatus({
    requirementsDue: ['business_profile.url']
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.ok(alerts[0].message.includes('lien public'))
  assert.ok(alerts[0].message.includes('activité'))
})

test('mapAllStripeRequirements: unknown keys get generic French fallback', () => {
  const stripe = createStripeStatus({
    requirementsDue: ['some.unknown.requirement']
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.ok(alerts[0].message.includes('Finaliser la vérification'))
})

// =============================================================================
// Disabled reason translation tests
// =============================================================================

test('mapAllStripeRequirements: requirements.past_due disabled reason', () => {
  const stripe = createStripeStatus({
    disabledReason: 'requirements.past_due'
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.ok(alerts[0].message.includes('informations requises'))
  assert.ok(alerts[0].message.includes('temps'))
})

test('mapAllStripeRequirements: rejected.fraud disabled reason', () => {
  const stripe = createStripeStatus({
    disabledReason: 'rejected.fraud'
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.ok(alerts[0].message.includes('fraude'))
})

test('mapAllStripeRequirements: rejected.terms_of_service disabled reason', () => {
  const stripe = createStripeStatus({
    disabledReason: 'rejected.terms_of_service'
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.ok(alerts[0].message.includes('conditions d\'utilisation'))
})

test('mapAllStripeRequirements: under_review disabled reason', () => {
  const stripe = createStripeStatus({
    disabledReason: 'under_review'
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.ok(alerts[0].message.includes('examen'))
})

test('mapAllStripeRequirements: unknown disabled reason gets generic French fallback', () => {
  const stripe = createStripeStatus({
    disabledReason: 'some_unknown_reason'
  })
  const alerts = mapAllStripeRequirements(stripe)
  assert.ok(alerts[0].message.includes('problème'))
  assert.ok(alerts[0].message.includes('support'))
})

// =============================================================================
// SRF1 DoD compliance tests
// =============================================================================

test('SRF1 DoD: no raw Stripe keys exposed in messages', () => {
  const stripe = createStripeStatus({
    requirementsDue: ['external_account', 'individual.verification.document'],
    requirementsEventuallyDue: ['business_profile.mcc'],
    requirementsPastDue: ['company.tax_id'],
    disabledReason: 'requirements.past_due'
  })
  const alerts = mapAllStripeRequirements(stripe)

  for (const alert of alerts) {
    // Ensure no Stripe-style keys appear in messages
    assert.ok(!alert.message.includes('external_account'), `Found raw key in: ${alert.message}`)
    assert.ok(!alert.message.includes('individual.'), `Found raw key in: ${alert.message}`)
    assert.ok(!alert.message.includes('company.'), `Found raw key in: ${alert.message}`)
    assert.ok(!alert.message.includes('business_profile.'), `Found raw key in: ${alert.message}`)
    assert.ok(!alert.message.includes('requirements.past_due'), `Found raw key in: ${alert.message}`)
  }
})

test('SRF1 DoD: all messages are in French', () => {
  const stripe = createStripeStatus({
    requirementsDue: ['external_account'],
    requirementsPastDue: ['individual.verification.document'],
    disabledReason: 'rejected.fraud'
  })
  const alerts = mapAllStripeRequirements(stripe)

  for (const alert of alerts) {
    // Check for French words/patterns
    const hasFrench
      = alert.message.includes('Ajouter')
        || alert.message.includes('Vérifier')
        || alert.message.includes('Compléter')
        || alert.message.includes('Renseigner')
        || alert.message.includes('Finaliser')
        || alert.message.includes('Votre compte')
        || alert.message.includes('informations')
        || alert.message.includes('Fournir')

    assert.ok(hasFrench, `Message should be in French: ${alert.message}`)
  }
})
