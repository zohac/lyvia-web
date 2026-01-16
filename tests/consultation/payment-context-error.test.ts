/**
 * Unit tests for payment context error mapping.
 *
 * Tests cover all error codes for:
 * - mapPaymentContextErrorToMessage() (GET /client/appointments/:id/payment-context)
 * - mapCheckoutErrorToMessage() (POST /payments/consultation-session)
 * - isPaymentAlreadyCompleted() helper
 *
 * @see Ticket RF8 - Front : états d'erreur payment-context
 * @see Ticket HF3 - Front : Gestion erreur "Provider payment not configured"
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import { ApiFetchError } from '../../app/services/api/api-error'
import {
  mapPaymentContextErrorToMessage,
  mapCheckoutErrorToMessage,
  isPaymentAlreadyCompleted
} from '../../app/features/consultation/api/payment-context-error'

// =============================================================================
// Helper: Create ApiFetchError with specific status and code
// =============================================================================

function createApiError(statusCode: number, code: string): ApiFetchError {
  return new ApiFetchError({
    statusCode,
    code,
    message: `Test error: ${code}`
  })
}

// =============================================================================
// mapPaymentContextErrorToMessage() tests
// =============================================================================

test('mapPaymentContextErrorToMessage: returns fallback for non-ApiFetchError', () => {
  const result = mapPaymentContextErrorToMessage(new Error('Generic error'))
  assert.equal(result, 'Impossible de charger les informations de paiement.')
})

test('mapPaymentContextErrorToMessage: returns custom fallback when provided', () => {
  const result = mapPaymentContextErrorToMessage(new Error('Generic'), 'Custom fallback')
  assert.equal(result, 'Custom fallback')
})

test('mapPaymentContextErrorToMessage: handles 401 Unauthorized', () => {
  const error = createApiError(401, 'UNAUTHORIZED')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Votre session a expiré. Veuillez vous reconnecter.')
})

test('mapPaymentContextErrorToMessage: handles 403 Forbidden', () => {
  const error = createApiError(403, 'FORBIDDEN')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Vous n\'avez pas accès à ce rendez-vous.')
})

test('mapPaymentContextErrorToMessage: handles 404 Not Found', () => {
  const error = createApiError(404, 'NOT_FOUND')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Ce rendez-vous est introuvable ou a été annulé.')
})

test('mapPaymentContextErrorToMessage: handles 409 PAYMENT_ALREADY_COMPLETED', () => {
  const error = createApiError(409, 'PAYMENT_ALREADY_COMPLETED')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Ce rendez-vous a déjà été payé.')
})

test('mapPaymentContextErrorToMessage: handles 409 PAYMENT_PENDING', () => {
  const error = createApiError(409, 'PAYMENT_PENDING')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Un paiement est déjà en cours pour ce rendez-vous.')
})

test('mapPaymentContextErrorToMessage: handles 409 unknown code', () => {
  const error = createApiError(409, 'UNKNOWN_CONFLICT')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Une opération est déjà en cours. Veuillez patienter.')
})

test('mapPaymentContextErrorToMessage: handles 422 PRICE_PLAN_INACTIVE', () => {
  const error = createApiError(422, 'PRICE_PLAN_INACTIVE')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Le tarif associé à ce rendez-vous n\'est plus disponible. Contactez votre coach.')
})

test('mapPaymentContextErrorToMessage: handles 422 APPOINTMENT_MISMATCH', () => {
  const error = createApiError(422, 'APPOINTMENT_MISMATCH')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Les informations du rendez-vous ne correspondent pas. Veuillez réessayer.')
})

test('mapPaymentContextErrorToMessage: handles 422 unknown code', () => {
  const error = createApiError(422, 'UNKNOWN_VALIDATION')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Les informations fournies sont invalides.')
})

test('mapPaymentContextErrorToMessage: handles 500 Server Error', () => {
  const error = createApiError(500, 'INTERNAL_SERVER_ERROR')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Erreur serveur. Veuillez réessayer dans quelques instants.')
})

test('mapPaymentContextErrorToMessage: handles 502 Bad Gateway', () => {
  const error = createApiError(502, 'BAD_GATEWAY')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Erreur serveur. Veuillez réessayer dans quelques instants.')
})

test('mapPaymentContextErrorToMessage: returns fallback for unknown status code', () => {
  const error = createApiError(418, 'IM_A_TEAPOT')
  const result = mapPaymentContextErrorToMessage(error)
  assert.equal(result, 'Impossible de charger les informations de paiement.')
})

// =============================================================================
// mapCheckoutErrorToMessage() tests
// =============================================================================

test('mapCheckoutErrorToMessage: returns fallback for non-ApiFetchError', () => {
  const result = mapCheckoutErrorToMessage(new Error('Generic error'))
  assert.equal(result, 'Impossible de créer la session de paiement.')
})

test('mapCheckoutErrorToMessage: returns custom fallback when provided', () => {
  const result = mapCheckoutErrorToMessage(new Error('Generic'), 'Custom checkout fallback')
  assert.equal(result, 'Custom checkout fallback')
})

test('mapCheckoutErrorToMessage: handles 401 Unauthorized', () => {
  const error = createApiError(401, 'UNAUTHORIZED')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Votre session a expiré. Veuillez vous reconnecter.')
})

test('mapCheckoutErrorToMessage: handles 403 ONBOARDING_NOT_COMPLETED', () => {
  const error = createApiError(403, 'ONBOARDING_NOT_COMPLETED')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Vous devez d\'abord effectuer votre appel découverte.')
})

test('mapCheckoutErrorToMessage: handles 403 generic', () => {
  const error = createApiError(403, 'FORBIDDEN')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Accès refusé.')
})

test('mapCheckoutErrorToMessage: handles 409 PAYMENT_ALREADY_COMPLETED', () => {
  const error = createApiError(409, 'PAYMENT_ALREADY_COMPLETED')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Ce rendez-vous a déjà été payé.')
})

test('mapCheckoutErrorToMessage: handles 409 PAYMENT_PENDING', () => {
  const error = createApiError(409, 'PAYMENT_PENDING')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Un paiement est déjà en cours. Veuillez patienter ou reprendre le paiement existant.')
})

test('mapCheckoutErrorToMessage: handles 409 SLOT_ALREADY_BOOKED', () => {
  const error = createApiError(409, 'SLOT_ALREADY_BOOKED')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Ce créneau n\'est plus disponible.')
})

test('mapCheckoutErrorToMessage: handles 409 APPOINTMENT_MISMATCH', () => {
  const error = createApiError(409, 'APPOINTMENT_MISMATCH')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Les informations du rendez-vous ont changé. Veuillez rafraîchir la page.')
})

test('mapCheckoutErrorToMessage: handles 409 unknown code', () => {
  const error = createApiError(409, 'UNKNOWN_CONFLICT')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Une opération est déjà en cours.')
})

// =============================================================================
// HF3: PROVIDER_PAYMENT_NOT_CONFIGURED tests
// =============================================================================

test('mapCheckoutErrorToMessage: handles 422 PROVIDER_PAYMENT_NOT_CONFIGURED (HF3)', () => {
  const error = createApiError(422, 'PROVIDER_PAYMENT_NOT_CONFIGURED')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Le paiement n\'est pas disponible pour ce coach. Veuillez le contacter directement.')
})

test('mapCheckoutErrorToMessage: handles 422 PRICE_PLAN_INACTIVE', () => {
  const error = createApiError(422, 'PRICE_PLAN_INACTIVE')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Le tarif n\'est plus disponible. Contactez votre coach.')
})

test('mapCheckoutErrorToMessage: handles 422 unknown code', () => {
  const error = createApiError(422, 'UNKNOWN_VALIDATION')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Les informations fournies sont invalides.')
})

test('mapCheckoutErrorToMessage: handles 500 Server Error', () => {
  const error = createApiError(500, 'INTERNAL_SERVER_ERROR')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Erreur lors de la connexion à Stripe. Veuillez réessayer.')
})

test('mapCheckoutErrorToMessage: returns fallback for unknown status code', () => {
  const error = createApiError(418, 'IM_A_TEAPOT')
  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Impossible de créer la session de paiement.')
})

// =============================================================================
// isPaymentAlreadyCompleted() tests
// =============================================================================

test('isPaymentAlreadyCompleted: returns true for PAYMENT_ALREADY_COMPLETED', () => {
  const error = createApiError(409, 'PAYMENT_ALREADY_COMPLETED')
  assert.equal(isPaymentAlreadyCompleted(error), true)
})

test('isPaymentAlreadyCompleted: returns false for other codes', () => {
  const error = createApiError(409, 'PAYMENT_PENDING')
  assert.equal(isPaymentAlreadyCompleted(error), false)
})

test('isPaymentAlreadyCompleted: returns false for non-ApiFetchError', () => {
  assert.equal(isPaymentAlreadyCompleted(new Error('Generic')), false)
})

test('isPaymentAlreadyCompleted: returns false for null', () => {
  assert.equal(isPaymentAlreadyCompleted(null), false)
})

test('isPaymentAlreadyCompleted: returns false for undefined', () => {
  assert.equal(isPaymentAlreadyCompleted(undefined), false)
})

// =============================================================================
// HF3 DoD compliance tests
// =============================================================================

test('HF3 DoD: message is user-friendly and actionable for PROVIDER_PAYMENT_NOT_CONFIGURED', () => {
  const error = createApiError(422, 'PROVIDER_PAYMENT_NOT_CONFIGURED')
  const result = mapCheckoutErrorToMessage(error)

  // Message should be in French
  assert.equal(result.includes('paiement'), true)
  // Message should suggest an action (contacting the coach)
  assert.equal(result.includes('contacter'), true)
  // Message should not contain technical jargon
  assert.equal(result.includes('Stripe'), false)
  assert.equal(result.includes('Connect'), false)
  assert.equal(result.includes('422'), false)
})

test('HF3 DoD: error maps to 422 status code correctly', () => {
  // Simulate the exact error the backend returns
  const error = new ApiFetchError({
    statusCode: 422,
    code: 'PROVIDER_PAYMENT_NOT_CONFIGURED',
    message: 'Provider has no Stripe account configured.'
  })

  const result = mapCheckoutErrorToMessage(error)
  assert.equal(result, 'Le paiement n\'est pas disponible pour ce coach. Veuillez le contacter directement.')
})
