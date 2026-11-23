/**
 * Story diffusion-10 — execution tests for the admin platform-article surface.
 *
 * The two machines (`createAdminContents`, `createAdminContentEditor`) carry the
 * race guards, the mutation-versus-re-read split and the French error copy. They
 * import only `vue` and pure helpers, so every branch is executed here with a
 * fake transport and no Nuxt context. The pure DTO builders and the cover-field
 * upload endpoint injection are executed too — a test that only *reads* a
 * mapping would let a silently dropped field ship green (AGENTS §10/§11).
 */
import * as assert from 'node:assert/strict'
import * as path from 'node:path'
import test, { describe } from 'node:test'
import * as Vue from 'vue'
import { nextTick } from 'vue'

import {
  createAdminContents,
  ADMIN_CONTENTS_PAGE_LIMIT
} from '../../app/features/contents/createAdminContents'
import {
  createAdminContentEditor,
  ADMIN_CONTENT_SAVED_REFRESH_FAILED_MESSAGE,
  type CreateAdminContentEditorDependencies
} from '../../app/features/contents/createAdminContentEditor'
import {
  ADMIN_CONTENT_UPLOAD_ENDPOINT,
  type AdminContentItem,
  type AdminContentStatusFilter,
  type ListAdminContentsParams,
  type ListAdminContentsResponse,
  type UpdateAdminContentRequest
} from '../../app/features/contents/api/admin-contents.contract'
import {
  buildCreateAdminContentCall,
  buildDeleteAdminContentCall,
  buildGetAdminContentCall,
  buildListAdminContentsCall,
  buildPublishAdminContentCall,
  buildUnpublishAdminContentCall,
  buildUpdateAdminContentCall
} from '../../app/features/contents/api/admin-contents.request'
import {
  ADMIN_CONTENT_TYPE,
  ADMIN_CONTENT_PUBLISHED_LABEL,
  buildCreateAdminContentPayload,
  buildUpdateAdminContentPayload,
  formatAdminApprovalCount,
  getAdminStatusBadge,
  getAdminStatusScopeLabel,
  resolveAdminContentServerError,
  validateAdminContentForm
} from '../../app/features/contents/domain/admin-content-form'
import { ApiFetchError } from '../../app/services/api/api-error'
import { renderSfc } from '../helpers/render-sfc'

// ── fixtures ───────────────────────────────────────────────────────────────

function item(overrides: Partial<AdminContentItem> = {}): AdminContentItem {
  return {
    id: 'content-1',
    title: 'Article persisté',
    type: 'article',
    slug: 'article-persiste',
    body: 'Corps persisté',
    coverImageUrl: 'https://cdn.example/cover.jpg',
    isPublished: false,
    publishedAt: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    approvalCount: 3,
    ...overrides
  }
}

function response(ids: string[], nextCursor: string | null = null): ListAdminContentsResponse {
  return { items: ids.map(id => item({ id })), nextCursor }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function lastCall(calls: ListAdminContentsParams[]): ListAdminContentsParams | undefined {
  return calls[calls.length - 1]
}

function apiError(code: string, statusCode = 409): ApiFetchError {
  return new ApiFetchError({ statusCode, code, message: 'Server English message' })
}

// ── request builders ───────────────────────────────────────────────────────

describe('admin content request builders', () => {
  test('every call targets /admin/content — never a provider route', () => {
    const paths = [
      buildListAdminContentsCall().path,
      buildGetAdminContentCall('id').path,
      buildCreateAdminContentCall({ title: 't', type: 'article' }).path,
      buildUpdateAdminContentCall('id', {}).path,
      buildPublishAdminContentCall('id').path,
      buildUnpublishAdminContentCall('id').path,
      buildDeleteAdminContentCall('id').path
    ]

    assert.deepEqual(paths, [
      '/admin/content',
      '/admin/content/id',
      '/admin/content',
      '/admin/content/id',
      '/admin/content/id/publish',
      '/admin/content/id/unpublish',
      '/admin/content/id'
    ])
    assert.equal(paths.some(p => p.includes('/provider/')), false)
  })

  test('only declared query params are forwarded', () => {
    assert.deepEqual(buildListAdminContentsCall().options.query, {})
    assert.deepEqual(
      buildListAdminContentsCall({ status: 'published', limit: 20, cursor: 'c' }).options.query,
      { status: 'published', limit: 20, cursor: 'c' }
    )
    assert.deepEqual(
      buildListAdminContentsCall({ status: 'all' }).options.query,
      { status: 'all' }
    )
  })

  test('mutations use the right verb, authenticated, with the payload on writes', () => {
    const create = buildCreateAdminContentCall({ title: 't', type: 'article' })
    const update = buildUpdateAdminContentCall('id', { title: 'u' })

    assert.equal(create.options.method, 'POST')
    assert.equal(update.options.method, 'PATCH')
    assert.equal(buildDeleteAdminContentCall('id').options.method, 'DELETE')
    assert.equal(buildPublishAdminContentCall('id').options.method, 'POST')
    assert.equal(buildUnpublishAdminContentCall('id').options.method, 'POST')
    assert.equal(create.options.withAuth, true)
    assert.deepEqual(update.options.body, { title: 'u' })
    assert.equal('body' in buildPublishAdminContentCall('id').options, false)
  })
})

// ── pure form rules ────────────────────────────────────────────────────────

describe('admin content form rules', () => {
  test('the create payload fixes type=article and carries no audience or document', () => {
    const payload = buildCreateAdminContentPayload({
      title: '  Un article  ',
      slug: ' un-article ',
      body: '  Un corps ',
      coverImageUrl: ' https://cdn.example/c.webp '
    })

    assert.deepEqual(payload, {
      title: 'Un article',
      type: 'article',
      slug: 'un-article',
      body: 'Un corps',
      coverImageUrl: 'https://cdn.example/c.webp'
    })
    assert.equal('audience' in payload, false)
    assert.equal('document' in payload, false)
    assert.equal('documentAssetId' in payload, false)
    assert.equal(payload.type, ADMIN_CONTENT_TYPE)
  })

  test('empty optional fields are omitted rather than sent', () => {
    const payload = buildCreateAdminContentPayload({ title: 'Titre' })
    assert.deepEqual(payload, { title: 'Titre', type: 'article' })
  })

  test('the update payload carries only changes and clears with null', () => {
    const original = {
      title: 'Titre',
      slug: 'titre',
      body: 'Corps',
      coverImageUrl: 'https://cdn.example/old.webp'
    }

    assert.deepEqual(
      buildUpdateAdminContentPayload({ ...original, title: ' Titre ' }, original),
      {}
    )
    assert.deepEqual(
      buildUpdateAdminContentPayload({ ...original, body: 'Nouveau corps' }, original),
      { body: 'Nouveau corps' }
    )
    assert.deepEqual(
      buildUpdateAdminContentPayload({
        title: 'Titre', slug: 'titre', body: '', coverImageUrl: ''
      }, original),
      { body: null, coverImageUrl: null }
    )
  })

  test('the fixed type never appears in a PATCH and no free URL is invented', () => {
    const payload: UpdateAdminContentRequest = buildUpdateAdminContentPayload(
      { title: 'Autre' },
      { title: 'Titre', slug: 'titre', body: 'Corps', coverImageUrl: null }
    )
    assert.deepEqual(payload, { title: 'Autre' })
    assert.equal('type' in payload, false)
    assert.equal('coverImageUrl' in payload, false)
  })

  test('validation never asks for a type but still guards title, slug and URL', () => {
    assert.deepEqual(validateAdminContentForm({ title: 'Titre', body: 'x' }), {})
    assert.equal(validateAdminContentForm({ title: '  ' }).title, 'Le titre est obligatoire.')
    assert.equal(
      validateAdminContentForm({ title: 'T', slug: 'Pas-Un-Slug' }).slug,
      'Cette adresse est invalide. Utilisez des minuscules, des chiffres et des tirets.'
    )
    assert.equal(
      validateAdminContentForm({ title: 'T', coverImageUrl: 'javascript:alert(1)' }).coverImageUrl,
      'URL d’image invalide. Utilisez une adresse http(s).'
    )
  })

  test('the published label always carries the approval scope', () => {
    assert.equal(ADMIN_CONTENT_PUBLISHED_LABEL,
      'Publié — visible des clientes des praticiennes qui l’ont approuvé.')
    assert.equal(getAdminStatusScopeLabel(true), ADMIN_CONTENT_PUBLISHED_LABEL)
    assert.equal(getAdminStatusScopeLabel(false), 'Brouillon — non visible des clientes.')
    assert.deepEqual(getAdminStatusBadge(true), { color: 'success', label: 'Publié' })
    assert.deepEqual(getAdminStatusBadge(false), { color: 'neutral', label: 'Brouillon' })
    assert.equal(formatAdminApprovalCount(1), '1 praticienne')
    assert.equal(formatAdminApprovalCount(4), '4 praticiennes')
  })

  test('backend codes are mapped to the form field or a French toast copy', () => {
    assert.deepEqual(resolveAdminContentServerError('SLUG_ALREADY_TAKEN'), {
      field: 'slug', message: 'Cette adresse est déjà utilisée.'
    })
    assert.deepEqual(resolveAdminContentServerError('CONTENT_NOT_PUBLISHABLE'), {
      field: null, message: 'Le titre et le contenu sont requis pour publier.'
    })
  })
})

// ── list machine ───────────────────────────────────────────────────────────

describe('createAdminContents', () => {
  test('loads the first page with the page limit and no status filter', async () => {
    const calls: ListAdminContentsParams[] = []
    const contents = createAdminContents({
      list: async (params) => {
        calls.push(params)
        return response(['a'])
      }
    })

    await contents.refresh()

    assert.deepEqual(calls, [{ limit: ADMIN_CONTENTS_PAGE_LIMIT }])
    assert.deepEqual(contents.items.value.map(i => i.id), ['a'])
    assert.equal(contents.pending.value, false)
    contents.dispose()
  })

  test('a status filter change re-issues the request with that status', async () => {
    const calls: ListAdminContentsParams[] = []
    const contents = createAdminContents({
      list: async (params) => {
        calls.push(params)
        return response([])
      }
    })

    await contents.refresh()
    contents.statusFilter.value = 'published' as AdminContentStatusFilter
    await nextTick()

    assert.deepEqual(lastCall(calls), { limit: 20, status: 'published' })
    contents.dispose()
  })

  test('a stale response never overwrites a fresher one', async () => {
    const first = deferred<ListAdminContentsResponse>()
    const second = deferred<ListAdminContentsResponse>()
    const queue = [first.promise, second.promise]
    const contents = createAdminContents({ list: async () => queue.shift()! })

    const stale = contents.refresh()
    const fresh = contents.refresh()
    second.resolve(response(['fresh']))
    await fresh
    first.resolve(response(['stale']))
    await stale

    assert.deepEqual(contents.items.value.map(i => i.id), ['fresh'])
    contents.dispose()
  })

  test('loadMore appends a page 2 and refuses to run twice or while pending', async () => {
    const calls: ListAdminContentsParams[] = []
    const contents = createAdminContents({
      list: async (params) => {
        calls.push(params)
        return response(['a'], 'cursor-2')
      }
    })

    await contents.refresh()
    const firstLoadMore = contents.loadMore()
    const secondLoadMore = contents.loadMore()
    await Promise.all([firstLoadMore, secondLoadMore])

    assert.equal(calls.length, 2)
    assert.deepEqual(lastCall(calls), { limit: 20, cursor: 'cursor-2' })
    assert.deepEqual(contents.items.value.map(i => i.id), ['a', 'a'])
    contents.dispose()
  })

  test('a page 2 from a previous filter is not appended', async () => {
    const page2 = deferred<ListAdminContentsResponse>()
    const contents = createAdminContents({
      list: async params => params.cursor ? page2.promise : response(['a'], 'cursor-2')
    })

    await contents.refresh()
    const pendingPage2 = contents.loadMore()
    contents.statusFilter.value = 'draft'
    await nextTick()
    page2.resolve(response(['stale-page-2']))
    await pendingPage2

    assert.deepEqual(contents.items.value.map(i => i.id), ['a'])
    contents.dispose()
  })

  test('a failed load becomes a French message and clears pending', async () => {
    const contents = createAdminContents({
      list: async () => {
        throw new Error('Failed to fetch')
      }
    })

    await contents.refresh()

    assert.equal(contents.errorMessage.value, 'Impossible de charger les articles. Veuillez réessayer.')
    assert.equal(contents.pending.value, false)
    contents.dispose()
  })

  test('the approval counter is displayed as returned, never recalculated', async () => {
    const contents = createAdminContents({ list: async () => response(['a']) })
    await contents.refresh()

    assert.equal(contents.items.value[0].approvalCount, 3)
    assert.equal(formatAdminApprovalCount(contents.items.value[0].approvalCount), '3 praticiennes')
  })
})

// ── editor machine ─────────────────────────────────────────────────────────

interface Recorder {
  ids: string[]
  updates: Array<{ id: string, payload: UpdateAdminContentRequest }>
  publishes: string[]
  unpublishes: string[]
  deletes: string[]
  notices: Array<{ title: string, color?: string }>
  navigated: string[]
}

function setupEditor(options: {
  id?: () => string
  getContent?: (id: string) => Promise<AdminContentItem>
  updateContent?: CreateAdminContentEditorDependencies['updateContent']
  publishContent?: CreateAdminContentEditorDependencies['publishContent']
  unpublishContent?: CreateAdminContentEditorDependencies['unpublishContent']
  deleteContent?: CreateAdminContentEditorDependencies['deleteContent']
} = {}) {
  const recorder: Recorder = {
    ids: [], updates: [], publishes: [], unpublishes: [], deletes: [], notices: [], navigated: []
  }
  const editor = createAdminContentEditor({
    id: options.id ?? (() => 'content-1'),
    getContent: async (id) => {
      recorder.ids.push(id)
      return options.getContent ? await options.getContent(id) : item({ id })
    },
    updateContent: async (id, payload) => {
      recorder.updates.push({ id, payload })
      return options.updateContent ? await options.updateContent(id, payload) : { contentId: id }
    },
    publishContent: async (id) => {
      recorder.publishes.push(id)
      return options.publishContent
        ? await options.publishContent(id)
        : { contentId: id, alreadyPublished: false }
    },
    unpublishContent: async (id) => {
      recorder.unpublishes.push(id)
      return options.unpublishContent
        ? await options.unpublishContent(id)
        : { contentId: id, alreadyDraft: false }
    },
    deleteContent: async (id) => {
      recorder.deletes.push(id)
      return options.deleteContent ? await options.deleteContent(id) : { contentId: id }
    },
    notify: notice => recorder.notices.push(notice),
    navigate: (path) => {
      recorder.navigated.push(path)
    }
  })
  return { editor, recorder }
}

describe('createAdminContentEditor — load', () => {
  test('fills the form from the persisted row, including the API approval count', async () => {
    const { editor } = setupEditor()

    await editor.load()

    assert.equal(editor.form.title, 'Article persisté')
    assert.equal(editor.form.body, 'Corps persisté')
    assert.equal(editor.form.coverImageUrl, 'https://cdn.example/cover.jpg')
    assert.equal(editor.content.value?.approvalCount, 3)
    assert.equal(editor.statusScopeLabel.value, 'Brouillon — non visible des clientes.')
    assert.equal(editor.loading.value, false)
  })

  test('a stale response for a previous route id never fills the form', async () => {
    const first = deferred<AdminContentItem>()
    const second = deferred<AdminContentItem>()
    let routeId = 'content-A'
    let call = 0
    const { editor } = setupEditor({
      id: () => routeId,
      getContent: async () => (++call === 1 ? first.promise : second.promise)
    })

    const stale = editor.load()
    routeId = 'content-B'
    const fresh = editor.load()
    second.resolve(item({ id: 'content-B', approvalCount: 9 }))
    await fresh
    first.resolve(item({ id: 'content-A' }))
    await stale

    assert.equal(editor.content.value?.id, 'content-B')
    assert.equal(editor.content.value?.approvalCount, 9, 'the API count is trusted')
    assert.equal(editor.form.title, 'Article persisté')
  })

  test('a failed load becomes a French message', async () => {
    const { editor } = setupEditor({
      getContent: async () => {
        throw new Error('English transport message')
      }
    })

    await editor.load()

    assert.equal(editor.loadError.value, 'Impossible de charger l’article.')
    assert.equal(editor.loading.value, false)
  })
})

describe('createAdminContentEditor — save (DR-5)', () => {
  test('a no-op save issues no PATCH', async () => {
    const { editor, recorder } = setupEditor()
    await editor.load()

    await editor.save()

    assert.equal(recorder.updates.length, 0)
    assert.deepEqual(recorder.notices, [{ title: 'Aucune modification à enregistrer', color: 'neutral' }])
  })

  test('a successful save keeps its success toast even when the re-read fails', async () => {
    let reads = 0
    const { editor, recorder } = setupEditor({
      getContent: async (id) => {
        reads += 1
        if (reads > 1) throw new Error('re-read down')
        return item({ id })
      }
    })
    await editor.load()
    editor.form.title = 'Titre modifié'

    await editor.save()

    assert.deepEqual(recorder.updates, [{
      id: 'content-1',
      payload: { title: 'Titre modifié' }
    }])
    assert.equal(recorder.notices[0].title, 'Article enregistré')
    assert.equal(recorder.notices[0].color, 'success')
    assert.equal(recorder.notices[1].title, ADMIN_CONTENT_SAVED_REFRESH_FAILED_MESSAGE)
    assert.equal(recorder.notices[1].color, 'warning')
  })

  test('SLUG_ALREADY_TAKEN lands on the slug field, not on a toast', async () => {
    const { editor, recorder } = setupEditor({
      updateContent: async () => {
        throw apiError('SLUG_ALREADY_TAKEN')
      }
    })
    await editor.load()
    editor.form.slug = 'deja-pris'

    await editor.save()

    assert.equal(editor.errors.value.slug, 'Cette adresse est déjà utilisée.')
    assert.equal(recorder.notices.length, 0)
  })

  test('a local validation error blocks the PATCH', async () => {
    const { editor, recorder } = setupEditor()
    await editor.load()
    editor.form.title = '  '

    await editor.save()

    assert.equal(editor.errors.value.title, 'Le titre est obligatoire.')
    assert.equal(recorder.updates.length, 0)
  })
})

describe('createAdminContentEditor — publish / unpublish / delete', () => {
  test('publish flips the state immediately and the scope label follows', async () => {
    const reRead = deferred<AdminContentItem>()
    let reads = 0
    const { editor, recorder } = setupEditor({
      getContent: async (id) => {
        reads += 1
        return reads === 1 ? item({ id }) : reRead.promise
      }
    })
    await editor.load()

    assert.equal(editor.canPublish.value, true)
    const publishing = editor.publish()
    await new Promise(resolve => setTimeout(resolve, 0))

    // The mutation has resolved but the re-read has not: the admin already sees
    // the published badge and its scope instead of waiting on the network.
    assert.deepEqual(recorder.publishes, ['content-1'])
    assert.equal(editor.content.value?.isPublished, true)
    assert.equal(editor.statusScopeLabel.value, ADMIN_CONTENT_PUBLISHED_LABEL)

    reRead.resolve(item({
      id: 'content-1',
      isPublished: true,
      publishedAt: '2026-11-02T10:00:00.000Z'
    }))
    await publishing

    assert.equal(editor.content.value?.isPublished, true)
    assert.equal(recorder.notices[0].title, 'Article publié')
  })

  test('CONTENT_NOT_PUBLISHABLE refuses the publish with French copy and no state change', async () => {
    const { editor, recorder } = setupEditor({
      publishContent: async () => {
        throw apiError('CONTENT_NOT_PUBLISHABLE', 422)
      }
    })
    await editor.load()

    await editor.publish()

    assert.equal(editor.content.value?.isPublished, false)
    assert.equal(recorder.notices[0].title, 'Le titre et le contenu sont requis pour publier.')
    assert.equal(recorder.notices[0].color, 'error')
  })

  test('a row empty on the server cannot be published even if the form is filled', async () => {
    const { editor } = setupEditor({
      getContent: async id => item({ id, body: '' })
    })
    await editor.load()
    editor.form.body = 'corps non encore enregistré'

    assert.equal(editor.canPublish.value, false, 'publishability is read from the stored row')
  })

  test('unpublish clears the published date immediately', async () => {
    const reRead = deferred<AdminContentItem>()
    let reads = 0
    const { editor, recorder } = setupEditor({
      getContent: async (id) => {
        reads += 1
        return reads === 1
          ? item({ id, isPublished: true, publishedAt: '2026-11-02T10:00:00.000Z' })
          : reRead.promise
      }
    })
    await editor.load()

    const unpublishing = editor.unpublish()
    await new Promise(resolve => setTimeout(resolve, 0))

    assert.deepEqual(recorder.unpublishes, ['content-1'])
    assert.equal(editor.content.value?.isPublished, false)
    assert.equal(editor.content.value?.publishedAt, null)
    assert.equal(editor.statusScopeLabel.value, 'Brouillon — non visible des clientes.')

    reRead.resolve(item({ id: 'content-1' }))
    await unpublishing
    assert.equal(editor.content.value?.isPublished, false)
  })

  test('a confirmed delete navigates back to the list', async () => {
    const { editor, recorder } = setupEditor()
    await editor.load()

    await editor.handleDelete()

    assert.deepEqual(recorder.deletes, ['content-1'])
    assert.deepEqual(recorder.navigated, ['/admin/content'])
    assert.equal(recorder.notices[0].title, 'Article supprimé')
  })

  test('a failed delete does not navigate', async () => {
    const { editor, recorder } = setupEditor({
      deleteContent: async () => {
        throw new Error('network down')
      }
    })
    await editor.load()

    await editor.handleDelete()

    assert.deepEqual(recorder.navigated, [])
    assert.equal(recorder.notices[0].color, 'error')
  })
})

// ── cover field upload endpoint injection ──────────────────────────────────

describe('ContentCoverField upload endpoint', () => {
  const UPLOAD_MODULE = path.resolve(process.cwd(), 'app/features/assets/use-asset-upload.ts')
  const COMP = 'app/components/molecules/ContentCoverField.vue'

  async function capturedEndpoint(uploadEndpoint?: string): Promise<string | undefined> {
    let endpoint: string | undefined
    let state: { handleFile: (file: File) => Promise<void> } = {} as typeof state

    await renderSfc(COMP, {
      props: {
        'modelValue': '',
        ...(uploadEndpoint ? { uploadEndpoint } : {}),
        'onUpdate:modelValue': () => {}
      },
      stubs: {
        UButton: {
          name: 'UButton',
          props: ['onClick'],
          setup: () => () => Vue.h('button')
        }
      },
      mocks: {
        [UPLOAD_MODULE]: {
          uploadAsset: async (_type: string, _file: File, target?: string) => {
            endpoint = target
            return { url: 'https://cdn.example/cover.webp' }
          },
          validateFileUpload: () => null,
          formatUploadError: () => 'Erreur de téléversement'
        }
      },
      inspect: (instance) => {
        state = (instance as unknown as { setupState: typeof state }).setupState
      }
    })

    await state.handleFile(new File([new Uint8Array(10)], 'cover.png', { type: 'image/png' }))
    return endpoint
  }

  test('an admin session uploads through /admin/assets/upload', async () => {
    assert.equal(await capturedEndpoint(ADMIN_CONTENT_UPLOAD_ENDPOINT), '/admin/assets/upload')
  })

  test('provider callers keep the default endpoint', async () => {
    assert.equal(await capturedEndpoint(), undefined)
  })
})
