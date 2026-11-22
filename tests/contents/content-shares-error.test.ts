/**
 * Story 5.6 — the sharing-mutation copy.
 *
 * `POST /provider/content/:id/share` has two 422 codes of its own
 * (`CONTENT_NOT_PRIVATE`, `VALIDATION_ERROR`) and a masked 404; a provider who
 * cannot share must read why, in French, not "Impossible de partager."
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { mapContentShareErrorToMessage } from '../../app/features/contents/api/content-shares-error'
import { ApiFetchError } from '../../app/services/api/api-error'

function apiError(statusCode: number, code: string, message: string) {
  return new ApiFetchError({ statusCode, code, message })
}

describe('mapContentShareErrorToMessage', () => {
  test('sharing a content that is no longer private says so', () => {
    assert.equal(
      mapContentShareErrorToMessage(
        apiError(422, 'CONTENT_NOT_PRIVATE', 'Content is not private.'),
        'Impossible de partager.'
      ),
      'Ce contenu est public : le partage ne concerne que les contenus privés.'
    )
  })

  test('a rejected client is named as a selection problem, not a form field', () => {
    assert.equal(
      mapContentShareErrorToMessage(
        apiError(422, 'VALIDATION_ERROR', 'Either clientProfileIds or all must be provided.'),
        'Impossible de partager.'
      ),
      'Partage impossible : une ou plusieurs clientes sélectionnées ne sont pas dans votre suivi.'
    )
  })

  test('a masked 404 is reported as a missing content', () => {
    assert.equal(
      mapContentShareErrorToMessage(
        apiError(404, 'CONTENT_NOT_FOUND', 'Content not found.'),
        'Impossible de partager.'
      ),
      'Ce contenu est introuvable.'
    )
  })

  test('a transport failure falls back to the caller\'s French sentence', () => {
    assert.equal(
      mapContentShareErrorToMessage(new TypeError('Failed to fetch'), 'Impossible de retirer le partage.'),
      'Impossible de retirer le partage.'
    )
  })
})
