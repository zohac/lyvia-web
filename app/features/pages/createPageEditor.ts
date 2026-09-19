import { computed, ref } from 'vue'
import type {
  ContentBlock,
  ProviderPageResponse,
  UpdateProviderPageRequest
} from './api/pages.contract'
import {
  appendTextBlock,
  canRemoveBlock,
  removeBlockAt
} from './domain/content-blocks'
import {
  applySavedVersion,
  createPageEditorState,
  editableSnapshot,
  isPageEditorDirty,
  resetPageEditorState,
  resolvePageSaveError,
  setEditorBlockHtml,
  setPageEditorBlocks,
  toUpdateProviderPageRequest,
  type PageEditorState,
  type PageSaveError
} from './domain/page-editor'

/**
 * V2.2b — Framework-light editor factory (same pattern as `createProviderPages`).
 *
 * It imports only `vue` and pure domain helpers, so the whole save flow (dirty
 * tracking, optimistic locking, 409 mapping, concurrent-edit preservation) is
 * unit-tested with the Node runner. `usePageEditor.ts` is the Nuxt wrapper that
 * injects the real `PUT` transport.
 */

export interface PageEditorDependencies {
  update: (id: string, payload: UpdateProviderPageRequest) => Promise<ProviderPageResponse>
}

export type PageSaveOutcome
  = | { ok: true, page: ProviderPageResponse, /** Local edits arrived during the request. */ stale: boolean }
    | { ok: false, error: PageSaveError }

export function createPageEditor(
  initialPage: ProviderPageResponse,
  deps: PageEditorDependencies
) {
  const state = ref<PageEditorState>(createPageEditorState(initialPage))
  const saving = ref(false)
  const saveError = ref<PageSaveError | null>(null)

  const dirty = computed(() => isPageEditorDirty(state.value))
  const canRemove = computed(() => canRemoveBlock(state.value.blocks))

  /** Resets the editor to a freshly loaded server page. */
  function reset(page: ProviderPageResponse) {
    state.value = resetPageEditorState(page)
    saveError.value = null
  }

  function setBlocks(blocks: readonly ContentBlock[]) {
    state.value = setPageEditorBlocks(state.value, blocks)
  }

  function setBlockHtml(index: number, html: string) {
    state.value = setEditorBlockHtml(state.value, index, html)
  }

  /** Appends an empty paragraph and returns its index (for focus). */
  function addBlock(): number {
    state.value = setPageEditorBlocks(state.value, appendTextBlock(state.value.blocks))
    saveError.value = null
    return state.value.blocks.length - 1
  }

  function removeBlock(index: number) {
    state.value = setPageEditorBlocks(state.value, removeBlockAt(state.value.blocks, index))
  }

  function clearError() {
    saveError.value = null
  }

  async function save(): Promise<PageSaveOutcome> {
    const snapshotBefore = editableSnapshot(state.value)
    const payload = toUpdateProviderPageRequest(state.value)

    saving.value = true
    saveError.value = null

    try {
      const page = await deps.update(state.value.id, payload)
      // Edits typed while the request was in flight must survive: never apply
      // the older server snapshot over newer local content.
      const stale = editableSnapshot(state.value) !== snapshotBefore
      state.value = stale
        ? applySavedVersion(state.value, page.version, payload)
        : resetPageEditorState(page)
      return { ok: true, page, stale }
    } catch (error: unknown) {
      const mapped = resolvePageSaveError(error)
      saveError.value = mapped
      return { ok: false, error: mapped }
    } finally {
      saving.value = false
    }
  }

  return {
    state,
    saving,
    saveError,
    dirty,
    canRemove,
    reset,
    setBlocks,
    setBlockHtml,
    addBlock,
    removeBlock,
    clearError,
    save
  }
}

export type PageEditor = ReturnType<typeof createPageEditor>
