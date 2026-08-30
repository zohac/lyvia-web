/**
 * Unit tests for the payment-link resend button visibility (hotfix-20)
 * and its error-to-message mapping.
 *
 * @see hotfix-20 — the button only shows for an unpaid scheduled consultation:
 *      hidden for paid, cancelled, completed appointments and for discovery
 *      calls (free, `payment_status='not_required'`).
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import { ApiFetchError } from '../../app/services/api/api-error'
import { mapResendPaymentLinkErrorToMessage } from '../../app/features/clients/api/clients-error'
import { canResendPaymentLink, getNotificationChannelLabel } from '../../app/features/clients/domain/clients'

test('canResendPaymentLink: visible for an unpaid scheduled consultation', () => {
  assert.equal(
    canResendPaymentLink({
      type: 'consultation',
      status: 'scheduled',
      paymentStatus: 'unpaid'
    }),
    true
  )
})

test('canResendPaymentLink: hidden for a paid consultation', () => {
  assert.equal(
    canResendPaymentLink({
      type: 'consultation',
      status: 'scheduled',
      paymentStatus: 'paid'
    }),
    false
  )
})

test('canResendPaymentLink: hidden for a cancelled consultation', () => {
  assert.equal(
    canResendPaymentLink({
      type: 'consultation',
      status: 'cancelled',
      paymentStatus: 'unpaid'
    }),
    false
  )
})

test('canResendPaymentLink: hidden for a completed consultation', () => {
  assert.equal(
    canResendPaymentLink({
      type: 'consultation',
      status: 'completed',
      paymentStatus: 'paid'
    }),
    false
  )
})

test('canResendPaymentLink: hidden for a discovery call (free, not_required)', () => {
  assert.equal(
    canResendPaymentLink({
      type: 'discovery',
      status: 'scheduled',
      paymentStatus: 'not_required'
    }),
    false
  )
})

test('canResendPaymentLink: type guard rejects a discovery even with an inconsistent unpaid status', () => {
  assert.equal(
    canResendPaymentLink({
      type: 'discovery',
      status: 'scheduled',
      paymentStatus: 'unpaid'
    }),
    false
  )
})

test('canResendPaymentLink: hidden for a free follow-up', () => {
  assert.equal(
    canResendPaymentLink({
      type: 'free_followup',
      status: 'scheduled',
      paymentStatus: 'not_required'
    }),
    false
  )
})

function buildApiError(statusCode: number, code: string): ApiFetchError {
  return new ApiFetchError({ statusCode, code, message: 'x' })
}

test('mapResendPaymentLinkErrorToMessage: maps the AC-2 conflict codes', () => {
  assert.equal(
    mapResendPaymentLinkErrorToMessage(buildApiError(409, 'NOT_A_CONSULTATION')),
    'Ce rendez-vous n\'est pas une consultation à régler.'
  )
  assert.equal(
    mapResendPaymentLinkErrorToMessage(buildApiError(409, 'APPOINTMENT_NOT_SCHEDULED')),
    'Ce rendez-vous n\'est plus planifié.'
  )
  assert.equal(
    mapResendPaymentLinkErrorToMessage(buildApiError(409, 'ALREADY_PAID')),
    'Cette consultation est déjà réglée.'
  )
})

test('mapResendPaymentLinkErrorToMessage: maps 404 to a not-found message', () => {
  assert.equal(
    mapResendPaymentLinkErrorToMessage(buildApiError(404, 'NOT_FOUND')),
    'Rendez-vous introuvable.'
  )
})

test('mapResendPaymentLinkErrorToMessage: falls back for unknown errors (e.g. SEND_FAILED)', () => {
  assert.equal(
    mapResendPaymentLinkErrorToMessage(buildApiError(502, 'SEND_FAILED')),
    'Impossible de renvoyer le lien de paiement.'
  )
  assert.equal(
    mapResendPaymentLinkErrorToMessage(new Error('boom')),
    'Impossible de renvoyer le lien de paiement.'
  )
})

test('getNotificationChannelLabel: labels a payment-link resend', () => {
  assert.equal(
    getNotificationChannelLabel('consultation_payment_resend'),
    'Lien de paiement renvoyé'
  )
})
