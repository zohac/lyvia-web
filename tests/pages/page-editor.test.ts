/**
 * V2.2b — Editor state, dirty tracking, save payload and error mapping.
 *
 * The 409 mapping wording is verbatim from the UX spec (§4.2); paraphrasing it
 * here is a regression.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import type { ProviderPageResponse } from '../../app/features/pages/api/pages.contract'
import {
  applySavedVersion,
  createPageEditorState,
  isPageEditorDirty,
  resetPageEditorState,
  resolvePageSaveError,
  sanitizeContentBlocks,
  setEditorBlockHtml,
  setPageEditorBlocks,
  toUpdateProviderPageRequest
} from '../../app/features/pages/domain/page-editor'
import { appendTextBlock, readTextBlockHtml } from '../../app/features/pages/domain/content-blocks'

function makePage(overrides: Partial<ProviderPageResponse> = {}): ProviderPageResponse {
  return {
    id: 'page-1',
    slug: 'mon-approche',
    title: 'Mon approche',
    contentBlocks: [{ type: 'text', data: { html: '<p>Bonjour</p>' } }],
    publishedSnapshot: null,
    includeInMenu: true,
    menuLabel: 'Approche',
    sortOrder: 2,
    status: 'draft',
    firstPublishedAt: null,
    publishedAt: null,
    seoTitle: 'SEO',
    seoDescription: 'Description',
    hasUnpublishedChanges: false,
    version: 4,
    createdAt: '2026-09-19T00:00:00.000Z',
    updatedAt: '2026-09-19T00:00:00.000Z',
    ...overrides
  }
}

describe('pages/domain — page editor state', () => {
  test('a freshly loaded page is not dirty', () => {
    const state = createPageEditorState(makePage())
    assert.equal(isPageEditorDirty(state), false)
    assert.equal(state.version, 4)
    assert.equal(state.blocks.length, 1)
  })

  test('editing a block makes the state dirty', () => {
    const state = setEditorBlockHtml(createPageEditorState(makePage()), 0, '<p>Modifié</p>')
    assert.equal(isPageEditorDirty(state), true)
    assert.equal(state.blocks[0]?.type, 'text')
  })

  test('adding a block makes the state dirty; reset clears it', () => {
    const base = createPageEditorState(makePage())
    const grown = setPageEditorBlocks(base, appendTextBlock(base.blocks))
    assert.equal(isPageEditorDirty(grown), true)
    assert.equal(isPageEditorDirty(resetPageEditorState(makePage())), false)
  })

  test('state cloning does not mutate the source page blocks', () => {
    const page = makePage()
    const state = createPageEditorState(page)
    setEditorBlockHtml(state, 0, '<p>autre</p>')
    assert.equal((page.contentBlocks[0] as { data: { html: string } }).data.html, '<p>Bonjour</p>')
  })
})

describe('pages/domain — save payload', () => {
  test('carries expectedVersion and preserves non-edited fields', () => {
    const state = setEditorBlockHtml(createPageEditorState(makePage()), 0, '<p>Modifié</p>')
    const payload = toUpdateProviderPageRequest(state)
    assert.equal(payload.expectedVersion, 4)
    assert.equal(payload.title, 'Mon approche')
    assert.equal(payload.slug, 'mon-approche')
    assert.equal(payload.includeInMenu, true)
    assert.equal(payload.menuLabel, 'Approche')
    assert.equal(payload.sortOrder, 2)
    assert.equal(payload.seoTitle, 'SEO')
    assert.equal(payload.seoDescription, 'Description')
    assert.equal(payload.contentBlocks.length, 1)
  })

  test('sanitizes text html before sending and keeps image blocks untouched', () => {
    const state = setEditorBlockHtml(
      createPageEditorState(makePage()),
      0,
      '<p style="color:red">Bonjour <a href="javascript:alert(1)">x</a></p>'
    )
    const payload = toUpdateProviderPageRequest(state)
    assert.deepEqual(payload.contentBlocks[0], { type: 'text', data: { html: '<p>Bonjour x</p>' } })

    const withImage = sanitizeContentBlocks([
      { type: 'image', data: { assetId: '00000000-0000-0000-0000-000000000000' } }
    ])
    assert.equal(withImage[0]?.type, 'image')
  })
})

describe('pages/domain — applySavedVersion', () => {
  test('advances the version and baseline while keeping newer local blocks', () => {
    const state = setEditorBlockHtml(createPageEditorState(makePage()), 0, '<p>local plus récent</p>')
    const sent = toUpdateProviderPageRequest(createPageEditorState(makePage()))

    const next = applySavedVersion(state, 5, sent)

    assert.equal(next.version, 5)
    assert.equal(readTextBlockHtml(next.blocks[0]!), '<p>local plus récent</p>')
    assert.equal(isPageEditorDirty(next), true)
  })
})

describe('pages/domain — image blocks & orphan predicate (V2.2c)', () => {
  test('a freshly loaded image block with a missing url is NOT dirty and NOT orphan', () => {
    const state = createPageEditorState(makePage({
      contentBlocks: [
        { type: 'image', data: { assetId: '00000000-0000-0000-0000-000000000000', url: null } }
      ]
    }))

    assert.equal(isPageEditorDirty(state), false)
    assert.equal((state.blocks[0] as { data: { orphan?: boolean } }).data.orphan, false)
  })

  test('sanitizeContentBlocks drops server orphans and never-uploaded blocks, keeps resolved ones', () => {
    const result = sanitizeContentBlocks([
      { type: 'image', data: { assetId: 'a', orphan: true } },
      { type: 'image', data: { assetId: '', orphan: false } },
      { type: 'image', data: { assetId: 'b', url: null, orphan: false } },
      { type: 'text', data: { html: '<p>Bonjour</p>' } }
    ])

    assert.equal(result.length, 2)
    assert.deepEqual(result[0], { type: 'image', data: { assetId: 'b', url: null, orphan: false } })
    assert.equal(result[1]?.type, 'text')
  })

  test('the save payload excludes orphaned blocks', () => {
    const state = createPageEditorState(makePage({
      contentBlocks: [
        { type: 'text', data: { html: '<p>Bonjour</p>' } },
        { type: 'image', data: { assetId: 'a', orphan: true } }
      ]
    }))

    const payload = toUpdateProviderPageRequest(state)
    assert.equal(payload.contentBlocks.length, 1)
    assert.equal(payload.contentBlocks[0]?.type, 'text')
  })
})

describe('pages/domain — save error mapping', () => {
  test('maps PAGE_CONCURRENT_MODIFICATION with the verbatim conflict copy', () => {
    const mapped = resolvePageSaveError({
      apiError: { statusCode: 409, code: 'PAGE_CONCURRENT_MODIFICATION' }
    })
    assert.equal(mapped.kind, 'conflict')
    assert.equal(mapped.title, 'La page a été modifiée par ailleurs')
    assert.equal(
      mapped.message,
      'Une modification plus récente a été enregistrée depuis un autre onglet ou appareil. Vos modifications actuelles n\'ont pas été écrasées.'
    )
  })

  test('maps a bare 409 without the locking code to network, not conflict', () => {
    assert.equal(resolvePageSaveError({ apiError: { statusCode: 409, code: 'SOMETHING_ELSE' } }).kind, 'network')
    assert.equal(resolvePageSaveError({ apiError: { statusCode: 409 } }).kind, 'network')
  })

  test('maps 401 to the session branch', () => {
    const mapped = resolvePageSaveError({ apiError: { statusCode: 401 } })
    assert.equal(mapped.kind, 'session')
    assert.equal(resolvePageSaveError({ apiError: { code: 'INVALID_REFRESH_TOKEN' } }).kind, 'session')
  })

  test('maps validation, not found, forbidden and network failures', () => {
    assert.equal(resolvePageSaveError({ apiError: { code: 'PAGE_CONTENT_INVALID' } }).kind, 'validation')
    assert.equal(resolvePageSaveError({ apiError: { statusCode: 422 } }).kind, 'validation')
    assert.equal(resolvePageSaveError({ apiError: { statusCode: 400 } }).kind, 'validation')
    assert.equal(resolvePageSaveError({ apiError: { code: 'PAGE_NOT_FOUND' } }).kind, 'not_found')
    assert.equal(resolvePageSaveError({ apiError: { statusCode: 403 } }).kind, 'forbidden')
    assert.equal(resolvePageSaveError(new Error('offline')).kind, 'network')
    assert.equal(resolvePageSaveError(null).kind, 'network')
  })
})
