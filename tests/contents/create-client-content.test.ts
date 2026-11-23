import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { createClientContent } from '../../app/features/contents/createClientContent'
import { ApiFetchError } from '../../app/services/api/api-error'
import type { ClientContentDetail } from '../../app/features/contents/api/contents.contract'

function detail(overrides: Partial<ClientContentDetail> = {}): ClientContentDetail {
  return {
    id: 'c1',
    title: 'Respirer pendant la périménopause',
    type: 'article',
    slug: 'respirer-pendant-la-perimenopause',
    body: 'Un paragraphe.\n\nUn second.',
    coverImageUrl: null,
    publishedAt: '2026-02-05T10:00:00.000Z',
    providerName: 'Sophie Jouan',
    providerSlug: 'sophie-jouan',
    source: 'provider',
    document: null,
    ...overrides
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (err: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('createClientContent — the three exclusive states', () => {
  test('a readable content fills the reading state and clears pending', async () => {
    const content = createClientContent({ load: async () => detail() })

    assert.equal(content.pending.value, true, 'the page must show the skeleton before the first response')

    await content.load('respirer-pendant-la-perimenopause')

    assert.equal(content.pending.value, false)
    assert.equal(content.content.value?.title, 'Respirer pendant la périménopause')
    assert.equal(content.notFound.value, false)
    assert.equal(content.errorMessage.value, null)
  })

  test('a masked 404 renders the dedicated not-found state, not a retryable error', async () => {
    const content = createClientContent({
      load: async () => {
        throw new ApiFetchError({ statusCode: 404, code: 'CONTENT_NOT_FOUND', message: 'Content not found.' })
      }
    })

    await content.load('inconnu')

    assert.equal(content.notFound.value, true)
    assert.equal(content.errorMessage.value, null, 'a permanent 404 must not offer a retry loop')
    assert.equal(content.content.value, null)
    assert.equal(content.pending.value, false)
  })

  test('a missing client profile is an error, not a missing content', async () => {
    const content = createClientContent({
      load: async () => {
        throw new ApiFetchError({ statusCode: 404, code: 'CLIENT_PROFILE_NOT_FOUND', message: 'Client profile not found' })
      }
    })

    await content.load('un-slug')

    assert.equal(content.notFound.value, false)
    assert.equal(content.errorMessage.value, 'Votre espace cliente est introuvable. Contactez votre coach.')
  })

  test('a transport or server failure is retryable and keeps the dedicated copy', async () => {
    const content = createClientContent({
      load: async () => {
        throw new Error('boom')
      }
    })

    await content.load('un-slug')

    assert.equal(content.errorMessage.value, 'Impossible de charger le contenu.')
    assert.equal(content.notFound.value, false)
    assert.equal(content.pending.value, false)
  })

  test('a retry clears the previous state before it runs', async () => {
    let fail = true
    const content = createClientContent({
      load: async () => {
        if (fail) throw new ApiFetchError({ statusCode: 404, code: 'CONTENT_NOT_FOUND', message: 'Content not found.' })
        return detail()
      }
    })

    await content.load('slug')
    assert.equal(content.notFound.value, true)

    fail = false
    await content.load('slug')

    assert.equal(content.notFound.value, false)
    assert.equal(content.content.value?.id, 'c1')
  })

  test('a slower response for the previous slug never overwrites the newer one', async () => {
    const first = deferred<ClientContentDetail>()
    const second = deferred<ClientContentDetail>()
    const queue = [first.promise, second.promise]
    const content = createClientContent({ load: async () => queue.shift()! })

    const stale = content.load('ancien-slug')
    const fresh = content.load('nouveau-slug')

    second.resolve(detail({ id: 'new', title: 'Nouveau' }))
    await fresh
    first.resolve(detail({ id: 'old', title: 'Ancien' }))
    await stale

    assert.equal(content.content.value?.id, 'new')
    assert.equal(content.pending.value, false)
  })
})
