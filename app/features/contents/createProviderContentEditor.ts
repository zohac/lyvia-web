import { computed, reactive, ref } from 'vue'
import type {
  ContentAudience,
  ContentItem,
  ContentType,
  UpdateContentRequest
} from './api/contents.contract'
import {
  CONTENT_GENERIC_ERROR_MESSAGE,
  isContentPublishable,
  resolveContentServerError,
  validateContentForm,
  type ContentFormErrors
} from './domain/content-form'
import { buildUpdateContentPayload } from './domain/content-payload'
import { mapProviderContentsErrorToMessage } from './api/contents-error'
import { ApiFetchError } from '../../services/api/api-error'

/**
 * State machine of the provider content editor page (Story diffusion-7, AC9).
 *
 * Extracted from `app/pages/provider/content/[id].vue` for the reason the
 * workspace already records twice (`docs/project-context.md` → « Une couche de
 * mutation déplacée doit être EXÉCUTÉE par un test »): the branches that matter
 * — a stale GET that must not fill the form, and a successful save whose
 * re-read fails — were only ever *read* by tests, never executed. They are
 * executed here by `tests/contents/create-provider-content-editor.test.ts`.
 *
 * Guards, and the retro item each one closes:
 * - `loadToken` (DR-3): a response for a previous route id never fills the form.
 * - the save's re-read lives in its own `try` (DR-5): the success toast stays,
 *   and the refresh failure gets its own non-alarming message.
 * - `publish`/`unpublish` re-read the persisted state the same way, for the
 *   same reason: a failed refresh after a successful publish used to be
 *   reported as a failed publish.
 */

export interface ContentEditorNotice {
  title: string
  color: 'success' | 'warning' | 'error' | 'neutral'
}

export interface ContentEditorDocument {
  assetId: string
  filename: string
  sizeBytes: number
}

export interface CreateProviderContentEditorDependencies {
  /** Current route id. */
  id: () => string
  getContent: (id: string) => Promise<ContentItem>
  updateContent: (id: string, payload: UpdateContentRequest) => Promise<unknown>
  publishContent: (id: string) => Promise<unknown>
  unpublishContent: (id: string) => Promise<unknown>
  deleteContent: (id: string) => Promise<unknown>
  notify: (notice: ContentEditorNotice) => void
  navigate?: (path: string) => unknown
}

export const CONTENT_SAVED_REFRESH_FAILED_MESSAGE
  = 'Le contenu est enregistré, mais le rechargement a échoué.'

export function createProviderContentEditor(deps: CreateProviderContentEditorDependencies) {
  const loading = ref(true)
  const loadError = ref<string | null>(null)
  const content = ref<ContentItem | null>(null)
  const original = ref<ContentItem | null>(null)
  const errors = ref<ContentFormErrors>({})

  const saving = ref(false)
  const publishing = ref(false)
  const unpublishing = ref(false)
  const deleting = ref(false)
  const audienceSaving = ref(false)
  /**
   * True while the document field uploads a PDF. The save button is disabled
   * and `save()` refuses during that window: the asset id only reaches the form
   * when the upload answers, so a PATCH sent meanwhile would persist the row
   * *without* the document the provider just chose (AC2).
   */
  const documentUploading = ref(false)

  const form = reactive({
    title: '',
    type: '' as ContentType | '',
    body: '',
    coverImageUrl: '',
    audience: 'selected' as ContentAudience,
    slug: '',
    document: null as ContentEditorDocument | null
  })

  const busy = computed(() =>
    saving.value
    || publishing.value
    || unpublishing.value
    || deleting.value
    || audienceSaving.value
    || documentUploading.value
  )

  /** Bound to the document field's `uploading` event by the page. */
  function setDocumentUploading(value: boolean): void {
    documentUploading.value = value
  }

  /**
   * The audience as the server stores it. The checklist may only be rendered in
   * `selected` — `POST /provider/content/:id/share` answers 422
   * `CONTENT_NOT_PRIVATE` while the stored audience is still `all`, so a tick on
   * a form-only change would fail every time.
   */
  const persistedAudience = computed<ContentAudience>(() => content.value?.audience ?? 'selected')

  /**
   * The server refuses to publish a row whose *stored* title or body is empty
   * (`CONTENT_NOT_PUBLISHABLE`), so the guard reads the persisted content — not
   * the form, whose unsaved text the server has never seen.
   */
  const canPublish = computed(() =>
    isContentPublishable({ title: content.value?.title, body: content.value?.body })
  )

  /** Monotonic token: a GET for a previous route id is dropped (DR-3). */
  let loadToken = 0

  function fillForm(data: ContentItem) {
    content.value = data
    original.value = { ...data }
    form.title = data.title ?? ''
    form.type = data.type ?? ''
    form.body = data.body ?? ''
    form.coverImageUrl = data.coverImageUrl ?? ''
    form.audience = (data.audience ?? 'selected') as ContentAudience
    form.slug = data.slug ?? ''
    form.document = data.document
      ? { assetId: '', filename: data.document.filename, sizeBytes: data.document.sizeBytes }
      : null
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
      loadError.value = mapProviderContentsErrorToMessage(err, 'Impossible de charger le contenu.')
    } finally {
      if (token === loadToken) loading.value = false
    }
  }

  /**
   * Re-reads the persisted row without touching the form, so publishing or
   * unpublishing never discards edits the provider has not saved.
   */
  async function refreshServerState(): Promise<void> {
    const data = await deps.getContent(deps.id())
    content.value = data
    original.value = { ...data }
  }

  /**
   * Switching the audience is persisted at once, before the checklist can be
   * used.
   *
   * AC1 keeps `audience` in the content payload — it still travels with the
   * save — but a tick needs the *stored* audience to be `selected`:
   * `ShareContentUseCase` refuses anything else with `422 CONTENT_NOT_PRIVATE`.
   * A form-only switch therefore leaves the list decorative, and every tick
   * answers an error the provider cannot act on. The immediate write with its
   * rollback is the same pattern `interfaces.md` §5 gives for notification
   * settings, and the toast is the one §7 asks for on an audience change.
   */
  async function changeAudience(next: ContentAudience): Promise<void> {
    const previous = form.audience
    if (next === previous) return
    form.audience = next
    if (!original.value || original.value.audience === next) return

    const targetId = deps.id()
    audienceSaving.value = true
    try {
      await deps.updateContent(targetId, { audience: next })
      if (deps.id() !== targetId) return
      if (content.value) content.value = { ...content.value, audience: next }
      if (original.value) original.value = { ...original.value, audience: next }
      deps.notify({ title: 'Diffusion de vos contenus mise à jour', color: 'success' })
    } catch {
      if (deps.id() !== targetId) return
      form.audience = previous
      deps.notify({ title: 'Impossible de modifier la diffusion.', color: 'error' })
    } finally {
      if (deps.id() === targetId) audienceSaving.value = false
    }
  }

  async function save(): Promise<void> {
    // One PATCH at a time, and never while the document field is still
    // uploading: the asset id is not in the form yet, so the document would be
    // saved as detached. `busy` also covers publish/unpublish/delete.
    if (busy.value) return

    const validationErrors = validateContentForm(form)
    errors.value = validationErrors
    if (Object.keys(validationErrors).length > 0) return
    if (!original.value) return

    const payload = buildUpdateContentPayload(form, original.value)

    if (Object.keys(payload).length === 0) {
      deps.notify({ title: 'Aucune modification à enregistrer', color: 'neutral' })
      return
    }

    saving.value = true
    const targetId = deps.id()
    try {
      await deps.updateContent(targetId, payload)
      deps.notify({ title: 'Contenu enregistré', color: 'success' })
      // DR-5: the re-read is a *separate* failure. Reading it inside this `try`
      // turned a persisted row into "Impossible d'enregistrer" on screen.
      try {
        const refreshed = await deps.getContent(targetId)
        // A route change while the PATCH was in flight must not fill this form
        // with another content's row (DR-3, same class as `load`).
        if (deps.id() === targetId) fillForm(refreshed)
      } catch {
        deps.notify({ title: CONTENT_SAVED_REFRESH_FAILED_MESSAGE, color: 'warning' })
      }
    } catch (err) {
      if (err instanceof ApiFetchError) {
        const mapped = resolveContentServerError(err.apiError.code)
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
    publishing.value = true
    try {
      await deps.publishContent(deps.id())
      deps.notify({ title: 'Contenu publié', color: 'success' })
      await refreshAfterMutation('La publication a réussi, mais le rechargement a échoué.')
    } catch (err) {
      if (err instanceof ApiFetchError && err.apiError.code === 'CONTENT_NOT_PUBLISHABLE') {
        deps.notify({ title: resolveContentServerError(err.apiError.code).message, color: 'error' })
      } else {
        deps.notify({
          title: mapProviderContentsErrorToMessage(err, 'Impossible de publier.'),
          color: 'error'
        })
      }
    } finally {
      publishing.value = false
    }
  }

  async function unpublish(): Promise<void> {
    if (busy.value) return
    unpublishing.value = true
    try {
      await deps.unpublishContent(deps.id())
      deps.notify({ title: 'Contenu dépublié', color: 'success' })
      await refreshAfterMutation('La dépublication a réussi, mais le rechargement a échoué.')
    } catch (err) {
      deps.notify({
        title: mapProviderContentsErrorToMessage(err, 'Impossible de dépublier.'),
        color: 'error'
      })
    } finally {
      unpublishing.value = false
    }
  }

  /** A successful mutation keeps its success; a failed re-read is only a warning. */
  async function refreshAfterMutation(failureMessage: string): Promise<void> {
    try {
      await refreshServerState()
    } catch {
      deps.notify({ title: failureMessage, color: 'warning' })
    }
  }

  async function handleDelete(): Promise<void> {
    if (deleting.value) return
    deleting.value = true
    try {
      await deps.deleteContent(deps.id())
      deps.notify({ title: 'Contenu supprimé', color: 'success' })
      await deps.navigate?.('/provider/content')
    } catch (err) {
      deps.notify({
        title: mapProviderContentsErrorToMessage(err, 'Impossible de supprimer.'),
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
    original,
    form,
    errors,
    saving,
    publishing,
    unpublishing,
    deleting,
    audienceSaving,
    documentUploading,
    setDocumentUploading,
    busy,
    canPublish,
    persistedAudience,
    changeAudience,
    load,
    save,
    publish,
    unpublish,
    handleDelete
  }
}
