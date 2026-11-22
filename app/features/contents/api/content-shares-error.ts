import { ApiFetchError } from '../../../services/api/api-error'
import { mapProviderContentsErrorToMessage } from './contents-error'

/**
 * Error copy for the sharing mutations (Story 5.6).
 *
 * The two codes specific to `POST /provider/content/:id/share` get their own
 * sentence: the generic content mapper answers `VALIDATION_ERROR` with "vérifiez
 * votre saisie", which says nothing about a selection of clients. Everything
 * else (401/403/404) is the content mapper's job.
 */
export function mapContentShareErrorToMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiFetchError) {
    if (err.apiError.code === 'CONTENT_NOT_PRIVATE') {
      return 'Ce contenu est public : le partage ne concerne que les contenus privés.'
    }
    if (err.apiError.code === 'VALIDATION_ERROR') {
      return 'Partage impossible : une ou plusieurs clientes sélectionnées ne sont pas dans votre suivi.'
    }
  }

  return mapProviderContentsErrorToMessage(err, fallback)
}
