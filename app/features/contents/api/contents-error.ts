import { ApiFetchError } from '../../../services/api/api-error'

export function mapProviderContentsErrorToMessage(
  err: unknown,
  fallback = 'Impossible de charger les contenus. Veuillez réessayer.'
): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.code === 'UNAUTHORIZED') return 'Session expirée. Veuillez vous reconnecter.'
    if (err.message) return err.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
