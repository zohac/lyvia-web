/**
 * Story diffusion-7 — the provider content editor page state machine (AC9, AC1).
 *
 * The page's load token, its save, and its mutation-versus-re-read split used to
 * live inside `app/pages/provider/content/[id].vue`, where tests could only read
 * the source. Extracted into `createProviderContentEditor` with injected
 * transport, every branch AC9 names is *executed* here.
 *
 * Mutations this file kills:
 * - drop `if (token !== loadToken) return` from `load` → the stale-response test
 *   fills the form with the previous content;
 * - move the post-save re-read inside the mutation `try` → a persisted row is
 *   announced as a failure, and the DR-5 test sees an error instead of the
 *   success;
 * - drop `audience` from the payload arguments → the AC1 test sees `{}`;
 * - drop the `CONTENT_SLUG_UNRESOLVABLE` case → the AC10 test reads the generic
 *   sentence;
 * - drop `pending` from the route-change comparison → content A's row lands
 *   under content B's route.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  CONTENT_SAVED_REFRESH_FAILED_MESSAGE,
  createProviderContentEditor,
  type ContentEditorNotice
} from '../../app/features/contents/createProviderContentEditor'
import { CONTENT_SLUG_UNRESOLVABLE_MESSAGE } from '../../app/features/contents/domain/content-form'
import type { ContentItem, UpdateContentRequest } from '../../app/features/contents/api/contents.contract'
import { ApiFetchError } from '../../app/services/api/api-error'

function item(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: 'content-1',
    providerId: 'provider-1',
    title: 'Titre persisté',
    type: 'article',
    slug: 'titre-persiste',
    body: 'Corps persisté',
    coverImageUrl: 'https://cdn.example/cover.jpg',
    audience: 'all',
    document: null,
    isPublished: false,
    publishedAt: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...overrides
  }
}

interface Recorder {
  ids: string[]
  updates: Array<{ id: string, payload: UpdateContentRequest }>
  publishes: string[]
  unpublishes: string[]
  deletes: string[]
  notices: ContentEditorNotice[]
  navigated: string[]
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function setup(options: {
  id?: () => string
  getContent?: (id: string) => Promise<ContentItem>
  updateContent?: (id: string, payload: UpdateContentRequest) => Promise<unknown>
  publishContent?: (id: string) => Promise<unknown>
  unpublishContent?: (id: string) => Promise<unknown>
  deleteContent?: (id: string) => Promise<unknown>
} = {}) {
  const recorder: Recorder = {
    ids: [],
    updates: [],
    publishes: [],
    unpublishes: [],
    deletes: [],
    notices: [],
    navigated: []
  }

  const editor = createProviderContentEditor({
    id: options.id ?? (() => 'content-1'),
    getContent: async (id) => {
      recorder.ids.push(id)
      return options.getContent ? await options.getContent(id) : item({ id })
    },
    updateContent: async (id, payload) => {
      recorder.updates.push({ id, payload })
      return options.updateContent ? await options.updateContent(id, payload) : { contentId: id, changedFields: [] }
    },
    publishContent: async (id) => {
      recorder.publishes.push(id)
      return options.publishContent ? await options.publishContent(id) : { contentId: id }
    },
    unpublishContent: async (id) => {
      recorder.unpublishes.push(id)
      return options.unpublishContent ? await options.unpublishContent(id) : { contentId: id }
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

describe('createProviderContentEditor — load (DR-3)', () => {
  test('fills the form from the persisted row', async () => {
    const { editor } = setup()

    await editor.load()

    assert.equal(editor.form.title, 'Titre persisté')
    assert.equal(editor.form.audience, 'all')
    assert.equal(editor.form.coverImageUrl, 'https://cdn.example/cover.jpg')
    assert.equal(editor.loading.value, false)
    assert.equal(editor.content.value?.id, 'content-1')
  })

  test('a stale response for a previous route id never fills the form', async () => {
    const first = deferred<ContentItem>()
    const second = deferred<ContentItem>()
    const queue = [first.promise, second.promise]
    let routeId = 'content-A'

    const { editor } = setup({
      id: () => routeId,
      getContent: async () => queue.shift()!
    })

    const staleLoad = editor.load()
    routeId = 'content-B'
    const freshLoad = editor.load()

    second.resolve(item({ id: 'content-B', title: 'Titre B', audience: 'selected' }))
    await freshLoad
    first.resolve(item({ id: 'content-A', title: 'Titre A', audience: 'all' }))
    await staleLoad

    assert.equal(editor.form.title, 'Titre B', 'the stale answer must be dropped')
    assert.equal(editor.form.audience, 'selected')
    assert.equal(editor.content.value?.id, 'content-B')
    assert.equal(editor.loading.value, false)
  })

  test('a failed load becomes a French message and never leaves the screen loading', async () => {
    const { editor } = setup({
      getContent: async () => {
        throw new Error('network down')
      }
    })

    await editor.load()

    assert.equal(editor.loadError.value, 'Impossible de charger le contenu.')
    assert.equal(editor.loading.value, false)
  })
})

describe('createProviderContentEditor — save (AC1, AC10, DR-5)', () => {
  test('changing the audience reaches the PATCH body field by field', async () => {
    const { editor, recorder } = setup()

    await editor.load()
    editor.form.audience = 'selected'
    await editor.save()

    assert.deepEqual(recorder.updates, [{ id: 'content-1', payload: { audience: 'selected' } }])
    assert.deepEqual(recorder.notices[0], { title: 'Contenu enregistré', color: 'success' })
  })

  test('changing the title and the body sends exactly those two fields', async () => {
    const { editor, recorder } = setup()

    await editor.load()
    editor.form.title = 'Nouveau titre'
    editor.form.body = '  Nouveau corps  '
    await editor.save()

    assert.deepEqual(recorder.updates[0]?.payload, { title: 'Nouveau titre', body: 'Nouveau corps' })
  })

  test('nothing changed: no request, and the neutral message', async () => {
    const { editor, recorder } = setup()

    await editor.load()
    await editor.save()

    assert.deepEqual(recorder.updates, [])
    assert.deepEqual(recorder.notices, [{ title: 'Aucune modification à enregistrer', color: 'neutral' }])
  })

  test('a successful save whose re-read fails keeps the success and only warns (DR-5)', async () => {
    let reads = 0
    const { editor, recorder } = setup({
      getContent: async (id) => {
        reads += 1
        if (reads > 1) throw new Error('re-read failed')
        return item({ id })
      }
    })

    await editor.load()
    editor.form.title = 'Nouveau titre'
    await editor.save()

    assert.deepEqual(recorder.notices[0], { title: 'Contenu enregistré', color: 'success' })
    assert.deepEqual(recorder.notices[1], { title: CONTENT_SAVED_REFRESH_FAILED_MESSAGE, color: 'warning' })
    assert.equal(recorder.notices.some(notice => notice.color === 'error'), false, 'a persisted row is not an error')
  })

  test('a form-level validation error stops before the request', async () => {
    const { editor, recorder } = setup()

    await editor.load()
    editor.form.title = '   '
    await editor.save()

    assert.deepEqual(recorder.updates, [])
    assert.equal(editor.errors.value.title, 'Le titre est obligatoire.')
  })

  test('a server field error lands on its field, not in a toast', async () => {
    const { editor, recorder } = setup({
      updateContent: async () => {
        throw new ApiFetchError({ statusCode: 409, code: 'SLUG_ALREADY_TAKEN', message: 'taken' })
      }
    })

    await editor.load()
    editor.form.slug = 'autre-adresse'
    await editor.save()

    assert.equal(editor.errors.value.slug, 'Cette adresse est déjà utilisée.')
    assert.deepEqual(recorder.notices, [])
  })

  test('CONTENT_SLUG_UNRESOLVABLE is mapped to its French sentence, not the generic one (AC10)', async () => {
    const { editor, recorder } = setup({
      updateContent: async () => {
        throw new ApiFetchError({ statusCode: 422, code: 'CONTENT_SLUG_UNRESOLVABLE', message: 'slug' })
      }
    })

    await editor.load()
    editor.form.title = 'Titre'
    editor.form.slug = 'titre-2'
    await editor.save()

    assert.deepEqual(recorder.notices, [{ title: CONTENT_SLUG_UNRESOLVABLE_MESSAGE, color: 'error' }])
    assert.equal(
      recorder.notices[0]?.title,
      'Impossible de générer une adresse à partir de ce titre.'
    )
  })

  test('a re-read landing after a route change does not fill the new page', async () => {
    const reRead = deferred<ContentItem>()
    let routeId = 'content-A'
    let reads = 0

    const { editor } = setup({
      id: () => routeId,
      getContent: async () => {
        reads += 1
        if (reads === 1) return item({ id: 'content-A', title: 'Titre A' })
        return reRead.promise
      }
    })

    await editor.load()
    editor.form.title = 'Modifié'
    const saving = editor.save()

    routeId = 'content-B'
    reRead.resolve(item({ id: 'content-B', title: 'Titre B' }))
    await saving

    assert.equal(editor.form.title, 'Modifié', 'another content must not overwrite this form')
  })
})

describe('createProviderContentEditor — publish / unpublish (DR-5)', () => {
  test('a successful publish whose re-read fails keeps the success and warns', async () => {
    let reads = 0
    const { editor, recorder } = setup({
      getContent: async (id) => {
        reads += 1
        if (reads > 1) throw new Error('re-read failed')
        return item({ id, isPublished: false })
      }
    })

    await editor.load()
    await editor.publish()

    assert.deepEqual(recorder.publishes, ['content-1'])
    assert.deepEqual(recorder.notices[0], { title: 'Contenu publié', color: 'success' })
    assert.equal(recorder.notices[1]?.color, 'warning')
    assert.equal(recorder.notices.some(notice => notice.color === 'error'), false)
  })

  test('CONTENT_NOT_PUBLISHABLE is named instead of the generic publish failure', async () => {
    const { editor, recorder } = setup({
      publishContent: async () => {
        throw new ApiFetchError({ statusCode: 422, code: 'CONTENT_NOT_PUBLISHABLE', message: 'empty' })
      }
    })

    await editor.load()
    await editor.publish()

    assert.deepEqual(recorder.notices, [{
      title: 'Le titre et le contenu sont requis pour publier.',
      color: 'error'
    }])
  })

  test('the publish guard reads the persisted row, not unsaved form text', async () => {
    const { editor } = setup({
      getContent: async id => item({ id, title: 'Persisté', body: null })
    })

    await editor.load()
    editor.form.body = 'Texte non enregistré'

    assert.equal(editor.canPublish.value, false, 'the server has never seen the form text')
  })

  test('unpublishing refreshes the persisted state', async () => {
    const { editor, recorder } = setup({
      getContent: async id => item({ id, isPublished: true })
    })

    await editor.load()
    await editor.unpublish()

    assert.deepEqual(recorder.unpublishes, ['content-1'])
    assert.equal(recorder.notices[0]?.title, 'Contenu dépublié')
  })
})

describe('createProviderContentEditor — delete and audience switch', () => {
  test('deleting navigates back to the list', async () => {
    const { editor, recorder } = setup()

    await editor.load()
    await editor.handleDelete()

    assert.deepEqual(recorder.deletes, ['content-1'])
    assert.deepEqual(recorder.navigated, ['/provider/content'])
  })

  test('switching the audience persists it at once, so a tick is allowed', async () => {
    const { editor, recorder } = setup()

    await editor.load()
    assert.equal(editor.persistedAudience.value, 'all')

    await editor.changeAudience('selected')

    assert.equal(editor.form.audience, 'selected')
    assert.equal(editor.persistedAudience.value, 'selected', 'the stored audience drives the checklist')
    assert.deepEqual(recorder.updates, [{ id: 'content-1', payload: { audience: 'selected' } }])
    assert.equal(recorder.notices[0]?.color, 'success')
  })

  test('a refused audience switch rolls the block back to its previous state', async () => {
    const { editor, recorder } = setup({
      updateContent: async () => {
        throw new ApiFetchError({ statusCode: 422, code: 'VALIDATION_ERROR', message: 'nope' })
      }
    })

    await editor.load()
    await editor.changeAudience('selected')

    assert.equal(editor.form.audience, 'all', 'rollback to the stored value')
    assert.equal(editor.persistedAudience.value, 'all')
    assert.deepEqual(recorder.notices, [{ title: 'Impossible de modifier la diffusion.', color: 'error' }])
  })

  test('coming back from "selected" to "all" is persisted too', async () => {
    const { editor, recorder } = setup({
      getContent: async id => item({ id, audience: 'selected' })
    })

    await editor.load()
    await editor.changeAudience('all')

    assert.deepEqual(recorder.updates, [{ id: 'content-1', payload: { audience: 'all' } }])
    assert.equal(editor.persistedAudience.value, 'all')
  })
})
