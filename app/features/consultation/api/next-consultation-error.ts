/**
 * Error mapping for the client next consultation endpoint (RB7).
 *
 * Maps API errors to user-friendly French messages for dashboard display.
 *
 * @see Ticket RF6 - Front : dashboard cliente (CTA paiement RDV assigné)
 */

import { ApiFetchError } from '../../../services/api/api-error'

/**
 * Maps errors from GET /client/consultations/next to user-friendly messages.
 *
 * @param err - The caught error
 * @param fallback - Default message if error type is unknown
 * @returns Localized error message for display
 */
export function mapNextConsultationErrorToMessage(
  err: unknown,
  fallback = 'Impossible de charger vos consultations.'
): string {
  if (err instanceof ApiFetchError) {
    const { statusCode, code } = err.apiError

    if (statusCode === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }

    if (statusCode === 403) {
      if (code === 'FORBIDDEN') {
        return 'Accès refusé. Vous devez être connectée en tant que cliente.'
      }
      return 'Accès refusé.'
    }

    if (statusCode === 404) {
      return 'Votre profil est introuvable. Contactez le support.'
    }

    if (statusCode >= 500) {
      return 'Erreur serveur. Veuillez réessayer dans quelques instants.'
    }

    return fallback
  }

  return fallback
}
