/**
 * Error mapping for the appointment payment context endpoint (RB3).
 *
 * Maps API errors to user-friendly French messages for payment page display.
 *
 * @see Ticket RF1 - Front : page paiement consultation (créneau assigné)
 * @see Ticket RF8 - Front : états d'erreur payment-context
 */

import { ApiFetchError } from '../../../services/api/api-error'

/**
 * Error codes specific to payment context and checkout.
 */
export type PaymentContextErrorCode
  = | 'PAYMENT_ALREADY_COMPLETED'
    | 'PAYMENT_PENDING'
    | 'PRICE_PLAN_INACTIVE'
    | 'APPOINTMENT_MISMATCH'
    | 'VALIDATION_ERROR'

/**
 * Maps errors from GET /client/appointments/:id/payment-context to user-friendly messages.
 *
 * @param err - The caught error
 * @param fallback - Default message if error type is unknown
 * @returns Localized error message for display
 */
export function mapPaymentContextErrorToMessage(
  err: unknown,
  fallback = 'Impossible de charger les informations de paiement.'
): string {
  if (err instanceof ApiFetchError) {
    const { statusCode, code } = err.apiError

    if (statusCode === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }

    if (statusCode === 403) {
      return 'Vous n\'avez pas accès à ce rendez-vous.'
    }

    if (statusCode === 404) {
      return 'Ce rendez-vous est introuvable ou a été annulé.'
    }

    if (statusCode === 409) {
      if (code === 'PAYMENT_ALREADY_COMPLETED') {
        return 'Ce rendez-vous a déjà été payé.'
      }
      if (code === 'PAYMENT_PENDING') {
        return 'Un paiement est déjà en cours pour ce rendez-vous.'
      }
      return 'Une opération est déjà en cours. Veuillez patienter.'
    }

    if (statusCode === 422) {
      if (code === 'PRICE_PLAN_INACTIVE') {
        return 'Le tarif associé à ce rendez-vous n\'est plus disponible. Contactez votre coach.'
      }
      if (code === 'APPOINTMENT_MISMATCH') {
        return 'Les informations du rendez-vous ne correspondent pas. Veuillez réessayer.'
      }
      return 'Les informations fournies sont invalides.'
    }

    if (statusCode >= 500) {
      return 'Erreur serveur. Veuillez réessayer dans quelques instants.'
    }

    return fallback
  }

  return fallback
}

/**
 * Checks if the error indicates the payment is already completed.
 *
 * @param err - The caught error
 * @returns True if the appointment was already paid
 */
export function isPaymentAlreadyCompleted(err: unknown): boolean {
  if (err instanceof ApiFetchError) {
    return err.apiError.code === 'PAYMENT_ALREADY_COMPLETED'
  }
  return false
}

/**
 * Maps errors from POST /payments/consultation-session to user-friendly messages.
 *
 * @param err - The caught error
 * @param fallback - Default message if error type is unknown
 * @returns Localized error message for display
 */
export function mapCheckoutErrorToMessage(
  err: unknown,
  fallback = 'Impossible de créer la session de paiement.'
): string {
  if (err instanceof ApiFetchError) {
    const { statusCode, code } = err.apiError

    if (statusCode === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }

    if (statusCode === 403) {
      if (code === 'ONBOARDING_NOT_COMPLETED') {
        return 'Vous devez d\'abord effectuer votre appel découverte.'
      }
      return 'Accès refusé.'
    }

    if (statusCode === 409) {
      if (code === 'PAYMENT_ALREADY_COMPLETED') {
        return 'Ce rendez-vous a déjà été payé.'
      }
      if (code === 'PAYMENT_PENDING') {
        return 'Un paiement est déjà en cours. Veuillez patienter ou reprendre le paiement existant.'
      }
      if (code === 'SLOT_ALREADY_BOOKED') {
        return 'Ce créneau n\'est plus disponible.'
      }
      if (code === 'APPOINTMENT_MISMATCH') {
        return 'Les informations du rendez-vous ont changé. Veuillez rafraîchir la page.'
      }
      return 'Une opération est déjà en cours.'
    }

    if (statusCode === 422) {
      if (code === 'PRICE_PLAN_INACTIVE') {
        return 'Le tarif n\'est plus disponible. Contactez votre coach.'
      }
      return 'Les informations fournies sont invalides.'
    }

    if (statusCode >= 500) {
      return 'Erreur lors de la connexion à Stripe. Veuillez réessayer.'
    }

    return fallback
  }

  return fallback
}
