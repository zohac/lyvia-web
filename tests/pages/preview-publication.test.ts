/**
 * V2.2e — Preview & publication cycle.
 *
 * Pure rules (alt mapping, status application, request builders) are tested
 * behaviourally; the component surfaces are guarded by source inspection, the
 * way the sibling page specs do it (the Node runner has no DOM harness).
 */
import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test, { describe } from 'node:test'

import type { ContentBlock, ProviderPageResponse } from '../../app/features/pages/api/pages.contract'
import {
  buildProviderPagePreviewCall,
  buildPublishProviderPageCall,
  buildUnpublishProviderPageCall
} from '../../app/features/pages/api/provider-pages.request'
import { createPageEditor, type PageEditorDependencies } from '../../app/features/pages/createPageEditor'
import { readTextBlockHtml } from '../../app/features/pages/domain/content-blocks'
import {
  applyCommandStatus,
  applySavedVersion,
  describeMissingAltBlocks,
  extractMissingAltBlockIndices,
  mapSanitizedBlockIndicesToEditorIndices,
  resolveMissingAltEditorIndices,
  resolvePageSaveError,
  toUpdateProviderPageRequest
} from '../../app/features/pages/domain/page-editor'
import { buildPreviewHeaderOverrides } from '../../app/features/pages/domain/preview-header-overrides'
import { publishPreviewPage } from '../../app/features/pages/domain/preview-publish'

const ROOT = process.cwd()

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8')
}

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

function makeDeps(partial: Partial<PageEditorDependencies> = {}): PageEditorDependencies {
  return {
    update: async () => makePage(),
    publish: async () => makePage(),
    unpublish: async () => makePage(),
    ...partial
  }
}

const MISSING_ALT_ERROR = {
  apiError: {
    statusCode: 400,
    code: 'PAGE_CONTENT_INVALID',
    message: 'Chaque image doit avoir un texte alternatif avant la publication.',
    details: { missingAltBlockIndices: [1] }
  }
}

describe('pages/api — publication request builders (V2.2e)', () => {
  test('preview targets GET /provider/pages/:id/preview', () => {
    const call = buildProviderPagePreviewCall('page-1')
    assert.equal(call.path, '/provider/pages/page-1/preview')
    assert.equal(call.options.method, 'GET')
    assert.equal(call.options.withAuth, true)
  })

  test('publish targets PATCH /provider/pages/:id/publish', () => {
    const call = buildPublishProviderPageCall('page-1')
    assert.equal(call.path, '/provider/pages/page-1/publish')
    assert.equal(call.options.method, 'PATCH')
    assert.equal(call.options.withAuth, true)
  })

  test('unpublish targets PATCH /provider/pages/:id/unpublish', () => {
    const call = buildUnpublishProviderPageCall('page-1')
    assert.equal(call.path, '/provider/pages/page-1/unpublish')
    assert.equal(call.options.method, 'PATCH')
    assert.equal(call.options.withAuth, true)
  })
})

describe('pages/domain — missing alt mapping (V2.2e)', () => {
  test('extracts only integer, non-negative indices from details', () => {
    assert.deepEqual(extractMissingAltBlockIndices(MISSING_ALT_ERROR), [1])
    assert.deepEqual(
      extractMissingAltBlockIndices({
        apiError: { code: 'PAGE_CONTENT_INVALID', details: { missingAltBlockIndices: [0, -1, 2.5, 'x', 3] } }
      }),
      [0, 3]
    )
    assert.deepEqual(extractMissingAltBlockIndices(new Error('offline')), [])
    assert.deepEqual(
      extractMissingAltBlockIndices({ apiError: { code: 'PAGE_CONTENT_INVALID' } }),
      []
    )
  })

  test('maps sanitized indices back to editor positions through the save filter', () => {
    const blocks = [
      { type: 'text', data: { html: '<p>a</p>' } },
      { type: 'image', data: { assetId: '', orphan: false } },
      { type: 'image', data: { assetId: 'b', orphan: false } }
    ] as const

    // The empty-asset block is excluded from the payload, so sanitized index 1
    // is the third block (editor index 2).
    assert.deepEqual(mapSanitizedBlockIndicesToEditorIndices([1], blocks), [2])
    assert.deepEqual(mapSanitizedBlockIndicesToEditorIndices([0, 1], blocks), [0, 2])
    assert.deepEqual(mapSanitizedBlockIndicesToEditorIndices([9], blocks), [])
  })

  test('an orphan image block is excluded from the mapping too', () => {
    const blocks = [
      { type: 'image', data: { assetId: 'a', orphan: true } },
      { type: 'image', data: { assetId: 'b', orphan: false } }
    ] as const
    assert.deepEqual(mapSanitizedBlockIndicesToEditorIndices([0], blocks), [1])
  })

  test('resolveMissingAltEditorIndices goes end-to-end from the API error', () => {
    const blocks = [
      { type: 'text', data: { html: '<p>a</p>' } },
      { type: 'image', data: { assetId: 'a', orphan: false } }
    ] as const
    assert.deepEqual(resolveMissingAltEditorIndices(MISSING_ALT_ERROR, blocks), [1])
  })

  test('describeMissingAltBlocks names the flagged blocks (1-based) verbatim', () => {
    assert.equal(describeMissingAltBlocks([]), '')
    assert.match(describeMissingAltBlocks([1]), /Le bloc 2 contient/)
    assert.match(describeMissingAltBlocks([0, 2]), /Les blocs 1 et 3 contiennent/)
    assert.match(describeMissingAltBlocks([0, 2]), /texte alternatif/)
  })
})

describe('pages/domain — publication status application (V2.2e)', () => {
  test('applyCommandStatus preserves local blocks and recomputes the flag', () => {
    const base = makePage({
      status: 'published',
      hasUnpublishedChanges: false,
      version: 3,
      publishedAt: '2026-09-10T10:00:00.000Z'
    })
    const state = {
      ...requireState(base),
      blocks: [{ type: 'text', data: { html: '<p>local</p>' } }] as ContentBlock[]
    }

    const next = applyCommandStatus(state, makePage({
      status: 'published',
      hasUnpublishedChanges: false,
      version: 4,
      publishedAt: '2026-09-20T10:00:00.000Z'
    }))

    assert.equal(readTextBlockHtml(next.blocks[0]!), '<p>local</p>')
    assert.equal(next.version, 4)
    assert.equal(next.publishedAt, '2026-09-20T10:00:00.000Z')
    assert.equal(next.hasUnpublishedChanges, true, 'local edits remain unpublished')
  })

  test('applyCommandStatus on an unpublish keeps a draft with no unpublished flag', () => {
    const state = requireState(makePage({ status: 'published', hasUnpublishedChanges: true, version: 2 }))
    const next = applyCommandStatus(state, makePage({ status: 'draft', hasUnpublishedChanges: false, version: 3 }))
    assert.equal(next.status, 'draft')
    assert.equal(next.hasUnpublishedChanges, false)
  })

  test('applySavedVersion advances version/status while keeping newer local blocks', () => {
    const state = requireState(makePage())
    const sent = toUpdateProviderPageRequest(state)
    const edited = {
      ...state,
      blocks: [{ type: 'text', data: { html: '<p>plus récent</p>' } }] as ContentBlock[]
    }

    const next = applySavedVersion(edited, makePage({ version: 5, status: 'published' }), sent)

    assert.equal(next.version, 5)
    assert.equal(next.status, 'published')
    assert.equal(next.hasUnpublishedChanges, true)
    assert.equal(readTextBlockHtml(next.blocks[0]!), '<p>plus récent</p>')
  })
})

/** Small helper: build a real editor state through the public factory. */
function requireState(page: ProviderPageResponse) {
  const editor = createPageEditor(page, makeDeps())
  return editor.state.value
}

describe('pages/domain — save error mapping (V2.2e)', () => {
  test('PAGE_CONTENT_INVALID with missing alt exposes the indices and the wording', () => {
    const mapped = resolvePageSaveError(MISSING_ALT_ERROR)
    assert.equal(mapped.kind, 'validation')
    assert.equal(mapped.title, 'Publication impossible')
    assert.deepEqual(mapped.missingAltBlockIndices, [1])
  })

  test('PAGE_CONTENT_INVALID without missing alt keeps the generic save wording', () => {
    const mapped = resolvePageSaveError({
      apiError: { statusCode: 400, code: 'PAGE_CONTENT_INVALID' }
    })
    assert.equal(mapped.title, 'Enregistrement impossible')
    assert.equal(mapped.missingAltBlockIndices, undefined)
  })
})

describe('createPageEditor — publish/unpublish (V2.2e)', () => {
  test('publish resets the editor from the server response', async () => {
    const published = makePage({
      status: 'published',
      hasUnpublishedChanges: false,
      version: 2,
      publishedAt: '2026-09-20T10:00:00.000Z'
    })
    const editor = createPageEditor(makePage(), makeDeps({
      publish: async id => (id === 'page-1' ? published : makePage())
    }))

    assert.equal(editor.publishing.value, false)
    const outcome = await editor.publish()

    assert.equal(outcome.ok, true)
    assert.equal(editor.state.value.status, 'published')
    assert.equal(editor.state.value.hasUnpublishedChanges, false)
    assert.equal(editor.state.value.version, 2)
    assert.equal(editor.publishing.value, false)
  })

  test('publish saves pending edits before publishing', async () => {
    const calls: string[] = []
    const editor = createPageEditor(makePage(), makeDeps({
      update: async () => {
        calls.push('update')
        return makePage({ version: 2 })
      },
      publish: async () => {
        calls.push('publish')
        return makePage({ status: 'published', version: 3 })
      }
    }))

    editor.setBlockHtml(0, '<p>Nouveau contenu</p>')
    assert.equal(editor.dirty.value, true)

    const outcome = await editor.publish()

    assert.equal(outcome.ok, true)
    assert.deepEqual(calls, ['update', 'publish'])
    assert.equal(editor.state.value.status, 'published')
    assert.equal(editor.dirty.value, false)
  })

  test('a refused publication signals the blocks and keeps the input', async () => {
    const editor = createPageEditor(
      makePage({
        contentBlocks: [
          { type: 'text', data: { html: '<p>a</p>' } },
          { type: 'image', data: { assetId: 'asset-1', url: '/x.webp' } }
        ]
      }),
      makeDeps({
        publish: async () => {
          throw MISSING_ALT_ERROR
        }
      })
    )

    const outcome = await editor.publish()

    assert.equal(outcome.ok, false)
    if (!outcome.ok) {
      assert.equal(outcome.error.title, 'Publication impossible')
      assert.match(outcome.error.message, /bloc 2/)
    }
    assert.deepEqual(editor.missingAltBlockIndices.value, [1])
    assert.equal(editor.state.value.status, 'draft')
    assert.equal(editor.state.value.blocks.length, 2, 'input is preserved')
  })

  test('unpublish resets the status to draft', async () => {
    const editor = createPageEditor(
      makePage({ status: 'published', hasUnpublishedChanges: false, version: 2 }),
      makeDeps({ unpublish: async () => makePage({ status: 'draft', version: 3 }) })
    )

    const outcome = await editor.unpublish()

    assert.equal(outcome.ok, true)
    assert.equal(editor.state.value.status, 'draft')
    assert.equal(editor.state.value.version, 3)
  })

  test('a failed unpublish surfaces an error and keeps the published state', async () => {
    const editor = createPageEditor(
      makePage({ status: 'published', version: 2 }),
      makeDeps({
        unpublish: async () => {
          throw { apiError: { statusCode: 403, code: 'PAGE_FORBIDDEN' } }
        }
      })
    )

    const outcome = await editor.unpublish()

    assert.equal(outcome.ok, false)
    assert.equal(editor.state.value.status, 'published')
    assert.equal(editor.saveError.value?.kind, 'forbidden')
  })

  test('a stale pre-publication save keeps the edits typed during the save', async () => {
    const editor = createPageEditor(makePage(), makeDeps({
      update: async () => {
        // Simulate the coach typing while the pre-publication PUT is in flight.
        editor.setBlockHtml(0, '<p>Saisie pendant le save</p>')
        return makePage({ version: 2 })
      },
      publish: async () => makePage({ status: 'published', version: 3 })
    }))

    editor.setBlockHtml(0, '<p>Initial</p>')
    const outcome = await editor.publish()

    assert.equal(outcome.ok, true)
    if (outcome.ok) assert.equal(outcome.stale, true, 'the outcome must flag the stale pre-save')
    assert.equal(readTextBlockHtml(editor.state.value.blocks[0]!), '<p>Saisie pendant le save</p>')
    assert.equal(editor.state.value.status, 'published')
    assert.equal(editor.state.value.hasUnpublishedChanges, true)
  })

  test('unpublish with unsaved edits preserves them', async () => {
    const editor = createPageEditor(
      makePage({ status: 'published', hasUnpublishedChanges: false, version: 2 }),
      makeDeps({ unpublish: async () => makePage({ status: 'draft', version: 3 }) })
    )

    editor.setBlockHtml(0, '<p>Brouillon local</p>')
    const outcome = await editor.unpublish()

    assert.equal(outcome.ok, true)
    assert.equal(readTextBlockHtml(editor.state.value.blocks[0]!), '<p>Brouillon local</p>')
    assert.equal(editor.state.value.status, 'draft')
    assert.equal(editor.dirty.value, true)
  })

  test('a publish keeps edits typed while the command is in flight', async () => {
    const editor = createPageEditor(makePage(), makeDeps({
      publish: async () => {
        editor.setBlockHtml(0, '<p>Frappe pendant publish</p>')
        return makePage({ status: 'published', version: 3 })
      }
    }))

    const outcome = await editor.publish()

    assert.equal(outcome.ok, true)
    if (outcome.ok) assert.equal(outcome.stale, true)
    assert.equal(readTextBlockHtml(editor.state.value.blocks[0]!), '<p>Frappe pendant publish</p>')
    assert.equal(editor.state.value.status, 'published')
    assert.equal(editor.state.value.hasUnpublishedChanges, true)
  })

  test('preparePreview saves before previewing and aborts on failure', async () => {
    const calls: string[] = []
    const editor = createPageEditor(makePage(), makeDeps({
      update: async () => {
        calls.push('update')
        return makePage({ version: 2 })
      }
    }))

    // Not dirty → no save.
    const clean = await editor.preparePreview()
    assert.equal(clean.ok, true)
    if (clean.ok) assert.equal(clean.stale, false)
    assert.deepEqual(calls, [])

    editor.setBlockHtml(0, '<p>Modifié</p>')
    const saved = await editor.preparePreview()
    assert.equal(saved.ok, true)
    assert.deepEqual(calls, ['update'])

    const failing = createPageEditor(makePage(), makeDeps({
      update: async () => {
        throw { apiError: { statusCode: 409, code: 'PAGE_CONCURRENT_MODIFICATION' } }
      }
    }))
    failing.setBlockHtml(0, '<p>x</p>')
    const aborted = await failing.preparePreview()
    assert.equal(aborted.ok, false)
    if (!aborted.ok) assert.equal(aborted.error.kind, 'conflict')
  })
})

describe('pages/domain — preview publish helper (V2.2e)', () => {
  test('publishes then reloads the list', async () => {
    const calls: string[] = []
    const result = await publishPreviewPage('page-1', {
      publish: async (id) => {
        calls.push(`publish:${id}`)
      },
      reload: async () => {
        calls.push('reload')
      }
    })

    assert.equal(result.ok, true)
    assert.deepEqual(calls, ['publish:page-1', 'reload'])
  })

  test('maps a publish failure and still reloads', async () => {
    const calls: string[] = []
    const result = await publishPreviewPage('page-1', {
      publish: async () => {
        throw { apiError: { statusCode: 400, code: 'PAGE_CONTENT_INVALID' } }
      },
      reload: async () => {
        calls.push('reload')
      }
    })

    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.error.title, 'Enregistrement impossible')
    assert.deepEqual(calls, ['reload'])
  })
})

describe('pages/domain — preview header overrides (V2.2e)', () => {
  test('builds the white-label envelope from the account', () => {
    const overrides = buildPreviewHeaderOverrides({
      brandName: 'Sophie',
      firstname: 'Sophie',
      logoUrl: '/logo.webp'
    })
    assert.equal(overrides?.variant, 'white-label')
    assert.equal(overrides?.brandLabel, 'Sophie')
    assert.equal(overrides?.brandLogoSrc, '/logo.webp')
    assert.deepEqual(overrides?.navLinks, [])
  })

  test('falls back to the firstname then to a generic label', () => {
    assert.equal(buildPreviewHeaderOverrides({ firstname: 'Sophie' })?.brandLabel, 'Sophie')
    assert.equal(buildPreviewHeaderOverrides({})?.brandLabel, 'Votre coach')
  })

  test('returns null until the account is resolved', () => {
    assert.equal(buildPreviewHeaderOverrides(null), null)
    assert.equal(buildPreviewHeaderOverrides(undefined), null)
  })
})

describe('pages/preview — component wiring (V2.2e)', () => {
  test('PagePreviewBanner shows the verbatim private-preview wording', () => {
    const banner = read('app/components/molecules/PagePreviewBanner.vue')
    assert.ok(banner.includes(
      'Mode prévisualisation — Cette version est privée et n\'est pas encore visible sur votre site public.'
    ))
    assert.ok(banner.includes('Revenir à l\'éditeur'))
    assert.ok(banner.includes('Mettre en ligne'))
    assert.match(banner, /@click="emit\('publish'\)"/)
    assert.ok(banner.includes('aria-label="Mode prévisualisation"'))
    assert.ok(banner.includes('--color-crepuscule-950'))
    assert.ok(banner.includes('--color-text-inverse'))
  })

  test('ProviderPagePreviewOverlay reuses the public renderer and envelope', () => {
    const overlay = read('app/components/organisms/ProviderPagePreviewOverlay.vue')
    assert.ok(overlay.includes('getProviderPagePreview'))
    assert.ok(overlay.includes('PageBlockRenderer'))
    assert.ok(overlay.includes('PublicHeader'))
    assert.ok(overlay.includes('PublicFooter'))
    assert.match(overlay, /:overrides="headerOverrides"/)
    assert.ok(overlay.includes('aria-modal="true"'))
    assert.ok(overlay.includes('@keydown.escape'))
  })

  test('the preview overlay triggers zero tracking/analytics call', () => {
    const overlay = read('app/components/organisms/ProviderPagePreviewOverlay.vue')
    for (const forbidden of ['analytics', 'gtag', 'dataLayer', 'plausible', 'trackEvent', 'useLandingAnalytics']) {
      assert.ok(!overlay.includes(forbidden), `overlay must not reference ${forbidden}`)
    }
  })

  test('ProviderPageEditor exposes the publication action bar and badge', () => {
    const editor = read('app/components/organisms/ProviderPageEditor.vue')
    assert.ok(editor.includes('resolvePageStatus'))
    assert.ok(editor.includes('PAGE_STATUS_META'))
    assert.ok(editor.includes('Prévisualiser'))
    assert.ok(editor.includes('Enregistrer'))
    assert.ok(editor.includes('Mettre en ligne'))
    assert.ok(editor.includes('Publier les modifications'))
    assert.ok(editor.includes('Dépublier'))
    assert.ok(editor.includes('unpublishModalOpen'))
    assert.match(editor, /@click="onPreview"/)
    assert.match(editor, /@confirm="confirmUnpublish"/)
    assert.match(editor, /defineExpose\(\{ state, requestPublish \}\)/)
  })

  test('the editor flags blocks the server reported as missing alt', () => {
    const editor = read('app/components/organisms/ProviderPageEditor.vue')
    assert.ok(editor.includes('missingAltBlockIndices'))
    assert.ok(editor.includes('isMissingAlt(index)'))
    assert.ok(editor.includes('--color-error-500'))
  })

  test('the publication command never resets public/global state', () => {
    const overlay = read('app/components/organisms/ProviderPagePreviewOverlay.vue')
    assert.ok(!overlay.includes('setPublicHeader'))
  })
})

describe('pages/preview — page wiring (V2.2e)', () => {
  test('[id].vue mounts the overlay and feeds it brand overrides', () => {
    const page = read('app/pages/provider/pages/[id].vue')
    assert.ok(page.includes('ProviderPagePreviewOverlay'))
    assert.ok(page.includes('headerOverrides'))
    assert.match(page, /@preview="previewOpen = true"/)
    assert.match(page, /:page-id="pageId"/)
  })

  test('index.vue adds a per-row Prévisualiser action opening the overlay', () => {
    const page = read('app/pages/provider/pages/index.vue')
    assert.ok(page.includes('ProviderPagePreviewOverlay'))
    assert.ok(page.includes('Prévisualiser'))
    assert.ok(page.includes('openPreview'))
    assert.match(page, /:page-id="previewPageId"/)
    assert.match(page, /previewPageId\.value = page\.id/)
    assert.match(page, /previewOpen\.value = true/)
  })
})

describe('pages/preview — design tokens (V2.2e)', () => {
  test('the new components only reference declared CSS variables', () => {
    const shared = read('app/assets/css/shared.css')
    for (const file of [
      read('app/components/molecules/PagePreviewBanner.vue'),
      read('app/components/organisms/ProviderPagePreviewOverlay.vue'),
      read('app/components/organisms/ProviderPageEditor.vue')
    ]) {
      const vars = [...file.matchAll(/var\((--[a-z0-9-]+)/g)].map(match => match[1]!)
      assert.ok(vars.length > 0)
      for (const name of new Set(vars)) {
        assert.ok(shared.includes(`${name}:`), `${name} must exist in shared.css`)
      }
    }
  })
})
