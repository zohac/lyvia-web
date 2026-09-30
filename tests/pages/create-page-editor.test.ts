/**
 * V2.2b — Behavioural tests for the save orchestration factory
 * (`createPageEditor`), using a fake transport. No Nuxt context.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import type {
  ProviderPageResponse,
  UpdateProviderPageRequest
} from '../../app/features/pages/api/pages.contract'
import { createPageEditor, type PageEditorDependencies } from '../../app/features/pages/createPageEditor'
import { readTextBlockHtml } from '../../app/features/pages/domain/content-blocks'

function makePage(overrides: Partial<ProviderPageResponse> = {}): ProviderPageResponse {
  return {
    id: 'page-1',
    slug: 'mon-approche',
    title: 'Mon approche',
    contentBlocks: [{ type: 'text', data: { html: '<p>Bonjour</p>' } }],
    publishedSnapshot: null,
    includeInMenu: false,
    menuLabel: null,
    sortOrder: 0,
    status: 'draft',
    firstPublishedAt: null,
    publishedAt: null,
    seoTitle: null,
    seoDescription: null,
    hasUnpublishedChanges: false,
    version: 1,
    createdAt: '2026-09-19T00:00:00.000Z',
    updatedAt: '2026-09-19T00:00:00.000Z',
    ...overrides
  }
}

/** V2.2e — publish/unpublish transports are required by the editor factory. */
function makeDeps(partial: Partial<PageEditorDependencies> = {}): PageEditorDependencies {
  return {
    update: async () => makePage(),
    publish: async () => makePage(),
    unpublish: async () => makePage(),
    ...partial
  }
}

describe('createPageEditor — reordering (V2.2d)', () => {
  function makeThreeBlockEditor() {
    return createPageEditor(
      makePage({
        contentBlocks: [
          { type: 'text', data: { html: '<p>a</p>' } },
          { type: 'text', data: { html: '<p>b</p>' } },
          { type: 'text', data: { html: '<p>c</p>' } }
        ]
      }),
      makeDeps({ update: async () => makePage() })
    )
  }

  test('canMoveDown is false on the last index and true otherwise', () => {
    const editor = makeThreeBlockEditor()
    assert.equal(editor.canMoveDown(0), true)
    assert.equal(editor.canMoveDown(1), true)
    assert.equal(editor.canMoveDown(2), false)
  })

  test('canMoveDown follows the block after a move', () => {
    const editor = makeThreeBlockEditor()
    editor.moveBlock(0, 2) // [a,b,c] → [b,c,a]

    assert.equal(editor.canMoveDown(2), false, 'the moved block is now last')
    assert.equal(editor.canMoveDown(1), true)
    assert.equal(editor.canMoveDown(0), true)
  })

  test('moveBlock reorders state.blocks and marks the editor dirty', () => {
    const editor = makeThreeBlockEditor()
    assert.equal(editor.dirty.value, false)

    editor.moveBlock(0, 2)

    assert.deepEqual(
      editor.state.value.blocks.map(readTextBlockHtml),
      ['<p>b</p>', '<p>c</p>', '<p>a</p>']
    )
    assert.equal(editor.dirty.value, true)
  })
})

describe('createPageEditor — save', () => {
  test('a successful save persists the sanitized payload and clears dirty', async () => {
    const received = { id: '', payload: null as UpdateProviderPageRequest | null }
    const editor = createPageEditor(makePage(), makeDeps({
      update: async (id, payload) => {
        received.id = id
        received.payload = payload
        return makePage({
          version: 2,
          contentBlocks: [{ type: 'text', data: { html: '<p>Modifié</p>' } }]
        })
      }
    }))

    editor.setBlockHtml(0, '<p style="color:red">Modifié</p>')
    assert.equal(editor.dirty.value, true)

    const outcome = await editor.save()

    assert.equal(outcome.ok, true)
    assert.equal(received.id, 'page-1')
    assert.equal(received.payload?.expectedVersion, 1)
    assert.deepEqual(received.payload?.contentBlocks[0], {
      type: 'text',
      data: { html: '<p>Modifié</p>' }
    })
    assert.equal(editor.state.value.version, 2)
    assert.equal(editor.dirty.value, false)
    assert.equal(editor.saving.value, false)
    assert.equal(editor.saveError.value, null)
  })

  test('a 409 conflict is mapped and the local draft is preserved', async () => {
    const editor = createPageEditor(makePage(), makeDeps({
      update: async () => {
        throw { apiError: { statusCode: 409, code: 'PAGE_CONCURRENT_MODIFICATION' } }
      }
    }))

    editor.setBlockHtml(0, '<p>Brouillon local</p>')
    const outcome = await editor.save()

    assert.equal(outcome.ok, false)
    if (!outcome.ok) {
      assert.equal(outcome.error.kind, 'conflict')
      assert.equal(outcome.error.title, 'La page a été modifiée par ailleurs')
    }
    assert.equal(readTextBlockHtml(editor.state.value.blocks[0]!), '<p>Brouillon local</p>')
    assert.equal(editor.dirty.value, true)
    assert.equal(editor.state.value.version, 1)
  })

  test('a network failure is mapped and the local draft is preserved', async () => {
    const editor = createPageEditor(makePage(), makeDeps({
      update: async () => {
        throw new Error('offline')
      }
    }))

    editor.setBlockHtml(0, '<p>Brouillon local</p>')
    const outcome = await editor.save()

    assert.equal(outcome.ok, false)
    if (!outcome.ok) assert.equal(outcome.error.kind, 'network')
    assert.equal(editor.saveError.value?.kind, 'network')
    assert.equal(readTextBlockHtml(editor.state.value.blocks[0]!), '<p>Brouillon local</p>')
  })

  test('edits typed during an in-flight save are never overwritten', async () => {
    const editor = createPageEditor(makePage(), makeDeps({
      update: async () => {
        // Simulate the coach typing while the PUT is in flight.
        editor.setBlockHtml(0, '<p>Saisie plus récente</p>')
        return makePage({
          version: 2,
          contentBlocks: [{ type: 'text', data: { html: '<p>Ancienne saisie</p>' } }]
        })
      }
    }))

    editor.setBlockHtml(0, '<p>Ancienne saisie</p>')
    const outcome = await editor.save()

    assert.equal(outcome.ok, true)
    if (outcome.ok) assert.equal(outcome.stale, true)
    assert.equal(editor.state.value.version, 2)
    assert.equal(readTextBlockHtml(editor.state.value.blocks[0]!), '<p>Saisie plus récente</p>')
    assert.equal(editor.dirty.value, true)
  })
})
