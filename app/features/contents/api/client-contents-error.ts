import { ApiFetchError } from '../../../services/api/api-error'

export function mapClientContentsErrorToMessage(
  err: unknown,
  fallback = 'Impossible de charger les contenus. Veuillez réessayer.'
): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.statusCode === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }
    if (err.apiError.statusCode === 403) {
      return 'Accès refusé.'
    }
    if (err.apiError.statusCode === 404) {
      return 'Ce contenu est introuvable.'
    }
    if (err.apiError.code === 'VALIDATION_ERROR') {
      return 'Certains champs sont invalides. Vérifiez votre saisie.'
    }
  }

  return fallback
}

export function isClientContentNotFound(err: unknown): boolean {
  return err instanceof ApiFetchError && err.apiError.statusCode === 404
}
