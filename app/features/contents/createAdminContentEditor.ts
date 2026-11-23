import { computed, reactive, ref } from 'vue'
import type {
  AdminContentItem,
  PublishAdminContentResponse,
  UnpublishAdminContentResponse,
  UpdateAdminContentRequest
} from './api/admin-contents.contract'
import { mapProviderContentsErrorToMessage } from './api/contents-error'
import {
  CONTENT_GENERIC_ERROR_MESSAGE,
  isContentPublishable
} from './domain/content-form'
import {
  buildUpdateAdminContentPayload,
  getAdminStatusScopeLabel,
  resolveAdminContentServerError,
  validateAdminContentForm,
  type AdminContentOriginal
} from './domain/admin-content-form'
import type { ContentEditorNotice } from './createProviderContentEditor'
import { ApiFetchError } from '../../services/api/api-error'

export const ADMIN_CONTENT_SAVED_REFRESH_FAILED_MESSAGE
  = 'L’article est enregistré, mais le rechargement a échoué.'

/**
 * Admin platform-article editor state machine (Story diffusion-10).
 *
 * The page only wires this factory to `apiFetch` and toasts. Every branch the
 * story names is executed by `tests/contents/admin-contents.test.ts`:
 * - a GET for a previous route id never fills the form (load token);
 * - a successful mutation whose re-read fails keeps its success toast (DR-5);
 * - publish/unpublish flip `isPublished` immediately and the scope label follows;
 * - `CONTENT_NOT_PUBLISHABLE` and `SLUG_ALREADY_TAKEN` get their French copy.
 */
export interface CreateAdminContentEditorDependencies {
  id: () => string
  getContent: (id: string) => Promise<AdminContentItem>
  updateContent: (id: string, payload: UpdateAdminContentRequest) => Promise<unknown>
  publishContent: (id: string) => Promise<PublishAdminContentResponse>
  unpublishContent: (id: string) => Promise<UnpublishAdminContentResponse>
  deleteContent: (id: string) => Promise<unknown>
  notify: (notice: ContentEditorNotice) => void
  navigate?: (path: string) => unknown
}

export function createAdminContentEditor(deps: CreateAdminContentEditorDependencies) {
  const loading = ref(true)
  const loadError = ref<string | null>(null)
  const content = ref<AdminContentItem | null>(null)
  const original = ref<AdminContentOriginal | null>(null)
  const errors = ref<ReturnType<typeof validateAdminContentForm>>({})

  const saving = ref(false)
  const publishing = ref(false)
  const unpublishing = ref(false)
  const deleting = ref(false)

  const form = reactive({
    title: '',
    slug: '',
    body: '',
    coverImageUrl: ''
  })

  const busy = computed(() =>
    saving.value || publishing.value || unpublishing.value || deleting.value
  )

  /** The server refuses to publish a row whose stored title or body is empty. */
  const canPublish = computed(() =>
    isContentPublishable({ title: content.value?.title, body: content.value?.body })
  )

  /** Label shown next to the state, always carrying the publication scope. */
  const statusScopeLabel = computed(() =>
    getAdminStatusScopeLabel(content.value?.isPublished === true)
  )

  /** Monotonic token: a GET for a previous route id is dropped. */
  let loadToken = 0

  function fillForm(data: AdminContentItem) {
    content.value = data
    original.value = {
      title: data.title,
      slug: data.slug,
      body: data.body,
      coverImageUrl: data.coverImageUrl
    }
    form.title = data.title ?? ''
    form.slug = data.slug ?? ''
    form.body = data.body ?? ''
    form.coverImageUrl = data.coverImageUrl ?? ''
  }

  async function load(): Promise<void> {
    const token = ++loadToken
    loading.value = true
    loadError.value = null
    try {
      const data = await deps.getContent(deps.id())
      if (token !== loadToken) return
      fillForm(data)
    } catch (err) {
      if (token !== loadToken) return
      loadError.value = mapProviderContentsErrorToMessage(
        err,
        'Impossible de charger l’article.'
      )
    } finally {
      if (token === loadToken) loading.value = false
    }
  }

  /** Re-reads the persisted row without discarding unsaved edits. */
  async function refreshServerState(targetId: string): Promise<AdminContentItem> {
    const data = await deps.getContent(targetId)
    if (deps.id() === targetId) {
      content.value = data
      original.value = {
        title: data.title,
        slug: data.slug,
        body: data.body,
        coverImageUrl: data.coverImageUrl
      }
    }
    return data
  }

  /** A successful mutation keeps its success; a failed re-read is only a warning. */
  async function refreshAfterMutation(targetId: string, failureMessage: string): Promise<void> {
    try {
      await refreshServerState(targetId)
    } catch {
      deps.notify({ title: failureMessage, color: 'warning' })
    }
  }

  async function save(): Promise<void> {
    if (busy.value) return

    const validationErrors = validateAdminContentForm(form)
    errors.value = validationErrors
    if (Object.keys(validationErrors).length > 0) return
    if (!original.value) return

    const payload = buildUpdateAdminContentPayload(form, original.value)
    if (Object.keys(payload).length === 0) {
      deps.notify({ title: 'Aucune modification à enregistrer', color: 'neutral' })
      return
    }

    const targetId = deps.id()
    saving.value = true
    try {
      await deps.updateContent(targetId, payload)
      deps.notify({ title: 'Article enregistré', color: 'success' })
      // DR-5: a persisted row must not be announced as a failed save.
      await refreshAfterMutation(targetId, ADMIN_CONTENT_SAVED_REFRESH_FAILED_MESSAGE)
    } catch (err) {
      if (err instanceof ApiFetchError) {
        const mapped = resolveAdminContentServerError(err.apiError.code)
        if (mapped.field) {
          errors.value = { ...errors.value, [mapped.field]: mapped.message }
          return
        }
        deps.notify({ title: mapped.message, color: 'error' })
        return
      }
      deps.notify({ title: CONTENT_GENERIC_ERROR_MESSAGE, color: 'error' })
    } finally {
      saving.value = false
    }
  }

  async function publish(): Promise<void> {
    if (busy.value) return
    const targetId = deps.id()
    publishing.value = true
    try {
      await deps.publishContent(targetId)
      // Immediate state: the admin sees the published badge without waiting for
      // the re-read, then the re-read reconciles dates and the approval counter.
      if (deps.id() === targetId && content.value) {
        content.value = { ...content.value, isPublished: true }
      }
      deps.notify({ title: 'Article publié', color: 'success' })
      await refreshAfterMutation(targetId, 'La publication a réussi, mais le rechargement a échoué.')
    } catch (err) {
      if (err instanceof ApiFetchError && err.apiError.code === 'CONTENT_NOT_PUBLISHABLE') {
        deps.notify({
          title: resolveAdminContentServerError(err.apiError.code).message,
          color: 'error'
        })
      } else {
        deps.notify({
          title: mapProviderContentsErrorToMessage(err, 'Impossible de publier l’article.'),
          color: 'error'
        })
      }
    } finally {
      publishing.value = false
    }
  }

  async function unpublish(): Promise<void> {
    if (busy.value) return
    const targetId = deps.id()
    unpublishing.value = true
    try {
      await deps.unpublishContent(targetId)
      if (deps.id() === targetId && content.value) {
        content.value = { ...content.value, isPublished: false, publishedAt: null }
      }
      deps.notify({ title: 'Article dépublié', color: 'success' })
      await refreshAfterMutation(targetId, 'La dépublication a réussi, mais le rechargement a échoué.')
    } catch (err) {
      deps.notify({
        title: mapProviderContentsErrorToMessage(err, 'Impossible de dépublier l’article.'),
        color: 'error'
      })
    } finally {
      unpublishing.value = false
    }
  }

  async function handleDelete(): Promise<void> {
    if (deleting.value) return
    deleting.value = true
    try {
      await deps.deleteContent(deps.id())
      deps.notify({ title: 'Article supprimé', color: 'success' })
      await deps.navigate?.('/admin/content')
    } catch (err) {
      deps.notify({
        title: mapProviderContentsErrorToMessage(err, 'Impossible de supprimer l’article.'),
        color: 'error'
      })
    } finally {
      deleting.value = false
    }
  }

  return {
    loading,
    loadError,
    content,
    form,
    errors,
    saving,
    publishing,
    unpublishing,
    deleting,
    busy,
    canPublish,
    statusScopeLabel,
    load,
    save,
    publish,
    unpublish,
    handleDelete
  }
}
