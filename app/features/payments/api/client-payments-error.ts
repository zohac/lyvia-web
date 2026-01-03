import { ApiFetchError } from '../../../services/api/api-error'

export function mapClientPaymentsErrorToMessage(err: unknown, fallback = 'Impossible de charger vos paiements.'): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.statusCode === 401) return 'Votre session a expiré. Veuillez vous reconnecter.'
    if (err.apiError.statusCode === 403) return 'Accès refusé.'
    return fallback
  }
  return fallback
}
