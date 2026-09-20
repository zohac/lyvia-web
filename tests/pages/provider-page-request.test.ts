/**
 * V2.2b — Pure PUT request builder for the page draft.
 *
 * The real transport (`provider-pages.service.ts`) imports Nuxt-bound `apiFetch`
 * and cannot run under `node:test`; extracting the path/method/body construction
 * keeps the persistence contract behaviourally covered (a wrong method would
 * otherwise ship green).
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { buildUpdateProviderPageCall } from '../../app/features/pages/api/provider-pages.request'
import type { UpdateProviderPageRequest } from '../../app/features/pages/api/pages.contract'

const payload: UpdateProviderPageRequest = {
  title: 'Mon accompagnement',
  slug: 'mon-accompagnement',
  contentBlocks: [{ type: 'text', data: { html: '<p>Bonjour</p>' } }],
  includeInMenu: false,
  menuLabel: null,
  sortOrder: 0,
  seoTitle: null,
  seoDescription: null,
  expectedVersion: 3
}

describe('pages/api — update provider page request', () => {
  test('targets PUT /provider/pages/:id with auth and the payload as body', () => {
    const call = buildUpdateProviderPageCall('page-1', payload)

    assert.equal(call.path, '/provider/pages/page-1')
    assert.equal(call.options.method, 'PUT')
    assert.equal(call.options.withAuth, true)
    assert.equal(call.options.body, payload)
    assert.equal(call.options.body.expectedVersion, 3)
  })

  test('keeps a relative path so the Nitro proxy preserves the tenant host', () => {
    const call = buildUpdateProviderPageCall('page-1', payload)

    assert.ok(call.path.startsWith('/provider/pages/'))
    assert.ok(!call.path.startsWith('http'))
  })
})
