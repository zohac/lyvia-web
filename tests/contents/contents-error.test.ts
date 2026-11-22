/**
 * Story 5.5 — the load-error copy of the provider content screens.
 *
 * The API answers in English (`Content not found.`, `Invalid refresh token`);
 * a provider-facing error state must never render those strings.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  mapProviderContentMutationErrorToMessage,
  mapProviderContentsErrorToMessage
} from '../../app/features/contents/api/contents-error'
import { ApiFetchError } from '../../app/services/api/api-error'

function apiError(statusCode: number, code: string, message: string) {
  return new ApiFetchError({ statusCode, code, message })
}

describe('mapProviderContentsErrorToMessage', () => {
  test('an expired session asks for a reconnection, whatever the code', () => {
    assert.equal(
      mapProviderContentsErrorToMessage(apiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token')),
      'Votre session a expiré. Veuillez vous reconnecter.'
    )
    assert.equal(
      mapProviderContentsErrorToMessage(apiError(401, 'UNAUTHORIZED', 'Unauthorized')),
      'Votre session a expiré. Veuillez vous reconnecter.'
    )
  })

  test('a forbidden access is refused in French', () => {
    assert.equal(
      mapProviderContentsErrorToMessage(apiError(403, 'FORBIDDEN', 'Forbidden')),
      'Accès refusé.'
    )
  })

  test('an unknown content is named as such', () => {
    assert.equal(
      mapProviderContentsErrorToMessage(apiError(404, 'CONTENT_NOT_FOUND', 'Content not found.')),
      'Ce contenu est introuvable.'
    )
  })

  test('a transport failure never leaks the browser message', () => {
    assert.equal(
      mapProviderContentsErrorToMessage(new TypeError('Failed to fetch')),
      'Impossible de charger les contenus. Veuillez réessayer.'
    )
    assert.equal(
      mapProviderContentsErrorToMessage(apiError(500, 'INTERNAL_ERROR', 'Internal server error')),
      'Impossible de charger les contenus. Veuillez réessayer.'
    )
  })

  test('the caller keeps its own fallback', () => {
    assert.equal(
      mapProviderContentsErrorToMessage(new Error('boom'), 'Impossible de charger le contenu.'),
      'Impossible de charger le contenu.'
    )
  })
})

describe('mapProviderContentMutationErrorToMessage', () => {
  test('a deleted content is reported as missing', () => {
    assert.equal(
      mapProviderContentMutationErrorToMessage(
        apiError(404, 'CONTENT_NOT_FOUND', 'Content not found.'),
        'Impossible d’enregistrer le contenu.'
      ),
      'Ce contenu est introuvable.'
    )
  })

  test('anything else falls back to the mutation fallback', () => {
    assert.equal(
      mapProviderContentMutationErrorToMessage(new Error('Failed to fetch'), 'Impossible de publier.'),
      'Impossible de publier.'
    )
  })
})
