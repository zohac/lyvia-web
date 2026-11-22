import { ApiFetchError } from '../../../services/api/api-error'

/**
 * The client content endpoints answer `404` for two very different states:
 * `CONTENT_NOT_FOUND` (masked existence — a missing, unpublished or unshared
 * content) and `CLIENT_PROFILE_NOT_FOUND` (the authenticated user has no client
 * profile). Telling the second one « Ce contenu est introuvable » sends the
 * reader looking for a content that never existed; the two are told apart here.
 */
const CLIENT_PROFILE_NOT_FOUND = 'CLIENT_PROFILE_NOT_FOUND'

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
    if (err.apiError.code === CLIENT_PROFILE_NOT_FOUND) {
      return 'Votre espace cliente est introuvable. Contactez votre coach.'
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

/**
 * True when the API masked a missing/unreadable content. A `404
 * CLIENT_PROFILE_NOT_FOUND` is NOT a missing content: it is a broken account
 * and must reach the error state, not the « Contenu introuvable » one.
 */
export function isClientContentNotFound(err: unknown): boolean {
  return err instanceof ApiFetchError
    && err.apiError.statusCode === 404
    && err.apiError.code !== CLIENT_PROFILE_NOT_FOUND
}
