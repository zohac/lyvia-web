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
