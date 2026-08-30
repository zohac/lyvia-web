import { ApiFetchError } from '../../../services/api/api-error'

export function mapProviderClientsErrorToMessage(
  err: unknown,
  fallback = 'Impossible de charger la liste des clientes.'
): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.statusCode === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }
    if (err.apiError.statusCode === 403) {
      return 'Accès refusé.'
    }
    if (err.apiError.statusCode === 422) {
      return 'Les filtres ne sont pas valides. Ajustez votre recherche.'
    }
  }

  return fallback
}

export function mapProviderClientDetailErrorToMessage(
  err: unknown,
  fallback = 'Impossible de charger la fiche cliente.'
): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.statusCode === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }
    if (err.apiError.statusCode === 403) {
      return 'Accès refusé.'
    }
    if (err.apiError.statusCode === 404) {
      return 'Cliente introuvable.'
    }
    if (err.apiError.statusCode === 422) {
      return 'La demande est invalide. Vérifiez l\'identifiant.'
    }
  }

  return fallback
}

/**
 * Maps errors from resendConsultationPaymentLink to user-friendly messages (hotfix-20).
 */
export function mapResendPaymentLinkErrorToMessage(
  err: unknown,
  fallback = 'Impossible de renvoyer le lien de paiement.'
): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.code === 'NOT_A_CONSULTATION') {
      return 'Ce rendez-vous n\'est pas une consultation à régler.'
    }
    if (err.apiError.code === 'APPOINTMENT_NOT_SCHEDULED') {
      return 'Ce rendez-vous n\'est plus planifié.'
    }
    if (err.apiError.code === 'ALREADY_PAID') {
      return 'Cette consultation est déjà réglée.'
    }
    if (err.apiError.statusCode === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }
    if (err.apiError.statusCode === 403) {
      return 'Accès refusé.'
    }
    if (err.apiError.statusCode === 404) {
      return 'Rendez-vous introuvable.'
    }
  }

  return fallback
}

/**
 * Maps errors from updateProviderClientProgram to user-friendly messages.
 */
export function mapUpdateProgramErrorToMessage(
  err: unknown,
  fallback = 'Impossible de mettre à jour le mois. Veuillez réessayer.'
): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.statusCode === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }
    if (err.apiError.statusCode === 403) {
      return 'Accès refusé.'
    }
    if (err.apiError.statusCode === 404) {
      return 'Cliente introuvable.'
    }
    if (err.apiError.statusCode === 422) {
      return 'Valeur invalide. Le mois doit être entre 1 et 6, ou vide pour terminer.'
    }
    if (err.apiError.statusCode === 409) {
      return 'Conflit de mise à jour. Rafraîchissez la page et réessayez.'
    }
  }

  return fallback
}
