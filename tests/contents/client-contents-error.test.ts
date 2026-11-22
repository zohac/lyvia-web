import * as assert from 'node:assert/strict'
import test from 'node:test'

import { ApiFetchError } from '../../app/services/api/api-error'
import {
  isClientContentNotFound,
  mapClientContentsErrorToMessage
} from '../../app/features/contents/api/client-contents-error'

test('mapClientContentsErrorToMessage returns not-found copy on 404', () => {
  const err = new ApiFetchError({ statusCode: 404, code: 'CONTENT_NOT_FOUND', message: 'Content not found.' })
  assert.equal(mapClientContentsErrorToMessage(err), 'Ce contenu est introuvable.')
})

test('mapClientContentsErrorToMessage returns session-expired copy on 401', () => {
  const err = new ApiFetchError({ statusCode: 401, code: 'X', message: 'unauthorized' })
  assert.equal(mapClientContentsErrorToMessage(err), 'Votre session a expiré. Veuillez vous reconnecter.')
})

test('mapClientContentsErrorToMessage returns access-denied copy on 403', () => {
  const err = new ApiFetchError({ statusCode: 403, code: 'X', message: 'forbidden' })
  assert.equal(mapClientContentsErrorToMessage(err), 'Accès refusé.')
})

test('mapClientContentsErrorToMessage returns validation copy on VALIDATION_ERROR', () => {
  const err = new ApiFetchError({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'invalid' })
  assert.equal(mapClientContentsErrorToMessage(err), 'Certains champs sont invalides. Vérifiez votre saisie.')
})

test('mapClientContentsErrorToMessage uses default fallback for transport/5xx', () => {
  const err = new Error('boom')
  assert.equal(mapClientContentsErrorToMessage(err), 'Impossible de charger les contenus. Veuillez réessayer.')
})

test('mapClientContentsErrorToMessage propagates caller fallback', () => {
  const err = new Error('boom')
  assert.equal(mapClientContentsErrorToMessage(err, 'Custom fallback.'), 'Custom fallback.')
})

test('isClientContentNotFound is true only on 404', () => {
  const notFound = new ApiFetchError({ statusCode: 404, code: 'CONTENT_NOT_FOUND', message: 'Content not found.' })
  const other = new ApiFetchError({ statusCode: 500, code: 'X', message: 'boom' })
  assert.equal(isClientContentNotFound(notFound), true)
  assert.equal(isClientContentNotFound(other), false)
  assert.equal(isClientContentNotFound(new Error('boom')), false)
})

test('isClientContentNotFound does not mask a missing client profile as a missing content', () => {
  const noProfile = new ApiFetchError({ statusCode: 404, code: 'CLIENT_PROFILE_NOT_FOUND', message: 'Client profile not found' })
  assert.equal(isClientContentNotFound(noProfile), false)
})

test('mapClientContentsErrorToMessage names the broken account instead of the content', () => {
  const noProfile = new ApiFetchError({ statusCode: 404, code: 'CLIENT_PROFILE_NOT_FOUND', message: 'Client profile not found' })
  assert.equal(
    mapClientContentsErrorToMessage(noProfile),
    'Votre espace cliente est introuvable. Contactez votre coach.'
  )
})
