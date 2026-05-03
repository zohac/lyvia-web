/**
 * Behavioral tests for the client dashboard payment banner helpers (Story 0.21).
 *
 * Covers:
 * - Banner visibility based on the consultation state discriminated union
 * - Banner title composition (provider name interpolation, fallback when null)
 * - Banner pay URL includes the appointment id
 * - Greeting subtitle personalization on first visit (no payment history)
 *
 * These tests would fail if:
 * - The banner leaked into onboarding_required / no_consultation / payment_confirmed states
 * - The provider fallback "Votre coach" was removed
 * - The pay URL dropped the appointmentId
 * - The first-visit greeting fired while payments are still loading (pending)
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import type { ConsultationDashboardState } from '../../app/features/consultation/api/next-consultation.contract'
import {
  DEFAULT_GREETING_SUBTITLE,
  DEFAULT_PROVIDER_FALLBACK,
  resolveGreetingSubtitle,
  resolvePaymentBanner
} from '../../app/features/consultation/domain/dashboard-banner'

const SCHEDULED_AT = new Date('2026-04-15T12:00:00Z') // 14:00 Europe/Paris

function awaitingPaymentState(overrides: Partial<Extract<ConsultationDashboardState, { kind: 'awaiting_payment' }>> = {}): ConsultationDashboardState {
  return {
    kind: 'awaiting_payment',
    appointmentId: 'appt-123',
    scheduledAt: SCHEDULED_AT,
    durationMinutes: 60,
    amountCents: 8000,
    currency: 'EUR',
    providerDisplayName: 'Sophie Jouan',
    ...overrides
  }
}

// =============================================================================
// resolvePaymentBanner()
// =============================================================================

test('resolvePaymentBanner: returns null when state is null (loading)', () => {
  assert.equal(resolvePaymentBanner(null), null)
})

test('resolvePaymentBanner: returns null for onboarding_required state', () => {
  assert.equal(resolvePaymentBanner({ kind: 'onboarding_required' }), null)
})

test('resolvePaymentBanner: returns null for no_consultation state', () => {
  assert.equal(resolvePaymentBanner({ kind: 'no_consultation' }), null)
})

test('resolvePaymentBanner: returns null for payment_confirmed state', () => {
  const confirmed: ConsultationDashboardState = {
    kind: 'payment_confirmed',
    appointmentId: 'appt-123',
    scheduledAt: SCHEDULED_AT,
    durationMinutes: 60,
    meetingLink: null,
    providerDisplayName: 'Sophie Jouan',
    hasPendingRequest: false,
    canRequest: true
  }
  assert.equal(resolvePaymentBanner(confirmed), null)
})

test('resolvePaymentBanner: returns banner with provider name and date in title for awaiting_payment', () => {
  const banner = resolvePaymentBanner(awaitingPaymentState())

  assert.ok(banner, 'banner should be present')
  assert.match(banner!.title, /^Sophie Jouan vous a planifié une consultation le /)
  assert.match(banner!.title, /Réglez le paiement pour confirmer votre rendez-vous\.$/)
  // Date is formatted in Europe/Paris (fr-FR) — expect "mercredi 15 avril" at 14:00
  assert.ok(
    banner!.title.includes('avril'),
    `expected "avril" in title, got: ${banner!.title}`
  )
  assert.ok(
    banner!.title.includes('14:00'),
    `expected "14:00" in title, got: ${banner!.title}`
  )
})

test('resolvePaymentBanner: falls back to "Votre coach" when providerDisplayName is null', () => {
  const banner = resolvePaymentBanner(awaitingPaymentState({ providerDisplayName: null }))

  assert.ok(banner)
  assert.match(banner!.title, new RegExp(`^${DEFAULT_PROVIDER_FALLBACK} vous a planifié`))
})

test('resolvePaymentBanner: pay URL targets /client/consultation/pay with appointmentId', () => {
  const banner = resolvePaymentBanner(awaitingPaymentState({ appointmentId: 'abc-def' }))

  assert.ok(banner)
  assert.equal(banner!.url, '/client/consultation/pay?appointmentId=abc-def')
})

// Finding 1 (CR Codex 2026-04-24): AC-3 — montant obligatoire dans le titre.
// Ce test échoue si formatPrice(state.amountCents) disparait de resolvePaymentBanner.
test('resolvePaymentBanner: title includes formatted amount (Finding 1 regression guard)', () => {
  const banner = resolvePaymentBanner(awaitingPaymentState({ amountCents: 8000 }))

  assert.ok(banner)
  // "80,00 €" = output of formatPrice(8000) in fr-FR. NBSP used by Intl (U+202F).
  assert.ok(
    banner!.title.includes('Montant : '),
    `expected "Montant : " segment in title, got: ${banner!.title}`
  )
  assert.match(
    banner!.title,
    /Montant\s*:\s*80,00\s*€\./,
    `expected "Montant : 80,00 €." in title, got: ${banner!.title}`
  )
})

test('resolvePaymentBanner: title stays readable end-to-end with amount, provider, date, time', () => {
  const banner = resolvePaymentBanner(awaitingPaymentState({
    amountCents: 12500,
    providerDisplayName: 'Sophie Jouan',
    appointmentId: 'appt-123'
  }))

  assert.ok(banner)
  // Full ordering: provider → "vous a planifié une consultation le" → date
  //   → "à" → time → "." → "Montant : " → price → "." → action sentence
  // If any segment is dropped or re-ordered, the regex fails.
  assert.match(
    banner!.title,
    /^Sophie Jouan vous a planifié une consultation le [^.]+ à \d{2}:\d{2}\. Montant\s*:\s*125,00\s*€\. Réglez le paiement pour confirmer votre rendez-vous\.$/,
    `title must follow the canonical format, got: ${banner!.title}`
  )
})

// =============================================================================
// resolveGreetingSubtitle()
// =============================================================================

test('resolveGreetingSubtitle: default subtitle when state is null', () => {
  assert.equal(
    resolveGreetingSubtitle({ state: null, paymentsCount: 0, paymentsPending: false }),
    DEFAULT_GREETING_SUBTITLE
  )
})

test('resolveGreetingSubtitle: default subtitle while payments are pending (avoid flash)', () => {
  assert.equal(
    resolveGreetingSubtitle({
      state: awaitingPaymentState(),
      paymentsCount: 0,
      paymentsPending: true
    }),
    DEFAULT_GREETING_SUBTITLE
  )
})

test('resolveGreetingSubtitle: default subtitle when payments already exist (returning client)', () => {
  assert.equal(
    resolveGreetingSubtitle({
      state: awaitingPaymentState(),
      paymentsCount: 3,
      paymentsPending: false
    }),
    DEFAULT_GREETING_SUBTITLE
  )
})

test('resolveGreetingSubtitle: personalized on first visit with awaiting_payment + provider name', () => {
  assert.equal(
    resolveGreetingSubtitle({
      state: awaitingPaymentState(),
      paymentsCount: 0,
      paymentsPending: false
    }),
    'Bienvenue dans votre espace — Sophie Jouan vous accompagne'
  )
})

test('resolveGreetingSubtitle: personalized with fallback when providerDisplayName is null', () => {
  assert.equal(
    resolveGreetingSubtitle({
      state: awaitingPaymentState({ providerDisplayName: null }),
      paymentsCount: 0,
      paymentsPending: false
    }),
    `Bienvenue dans votre espace — ${DEFAULT_PROVIDER_FALLBACK} vous accompagne`
  )
})

test('resolveGreetingSubtitle: default when state is payment_confirmed even with no payments yet', () => {
  const confirmed: ConsultationDashboardState = {
    kind: 'payment_confirmed',
    appointmentId: 'appt-123',
    scheduledAt: SCHEDULED_AT,
    durationMinutes: 60,
    meetingLink: null,
    providerDisplayName: 'Sophie Jouan',
    hasPendingRequest: false,
    canRequest: true
  }

  assert.equal(
    resolveGreetingSubtitle({ state: confirmed, paymentsCount: 0, paymentsPending: false }),
    DEFAULT_GREETING_SUBTITLE
  )
})
