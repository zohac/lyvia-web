import { ApiFetchError } from '../../../services/api/api-error'

export function mapFinanceErrorToMessage(err: unknown, fallback = 'Une erreur est survenue. Veuillez réessayer.'): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.statusCode === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }
    if (err.apiError.statusCode === 403) {
      return 'Accès refusé. Vous n’avez pas les droits nécessaires.'
    }
    if (err.apiError.statusCode === 404) {
      return 'Ressource introuvable.'
    }

    switch (err.apiError.code) {
      case 'STRIPE_ACCOUNT_CREATION_FAILED':
      case 'STRIPE_API_ERROR':
        return 'Impossible de démarrer la connexion bancaire pour le moment. Réessayez dans quelques instants.'
      case 'VALIDATION_ERROR':
        return 'Certaines informations sont invalides. Veuillez réessayer.'
      default:
        return fallback
    }
  }

  return fallback
}
