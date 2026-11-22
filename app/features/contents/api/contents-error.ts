import { ApiFetchError } from '../../../services/api/api-error'

/**
 * Error copy for the provider content screens (Story 5.5).
 *
 * Same shape as the sibling mappers (`clients-error.ts`, `calendar-error.ts`):
 * map by status/code to a fixed French sentence and never echo the transport
 * or backend message — the API answers in English (`Content not found.`,
 * `Invalid refresh token`), and a provider-facing error state must not surface
 * that. The fallback is the caller's French sentence.
 */
export function mapProviderContentsErrorToMessage(
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

/**
 * Error copy for a failed content *mutation* (save, publish, delete), where the
 * fallback differs from the load path.
 */
export function mapProviderContentMutationErrorToMessage(
  err: unknown,
  fallback: string
): string {
  if (err instanceof ApiFetchError && err.apiError.statusCode === 404) {
    return 'Ce contenu est introuvable.'
  }

  return mapProviderContentsErrorToMessage(err, fallback)
}
