import { computed, ref } from 'vue'
import type {
  ContentBlock,
  ImageBlockData,
  ProviderPageResponse,
  UpdateProviderPageRequest
} from './api/pages.contract'
import {
  appendTextBlock,
  canMoveBlockDown,
  canMoveBlockUp,
  canRemoveBlock,
  removeBlockAt
} from './domain/content-blocks'
import {
  addEditorImageBlock,
  applyCommandStatus,
  applySavedVersion,
  createPageEditorState,
  describeMissingAltBlocks,
  editableSnapshot,
  isPageEditorDirty,
  moveEditorBlock,
  resetPageEditorState,
  resolveMissingAltEditorIndices,
  resolvePageSaveError,
  setEditorBlockHtml,
  setEditorImageBlockData,
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
  publish: (id: string) => Promise<ProviderPageResponse>
  unpublish: (id: string) => Promise<ProviderPageResponse>
}

export type PageSaveOutcome
  = | { ok: true, page: ProviderPageResponse, /** Local edits arrived during the request. */ stale: boolean }
    | { ok: false, error: PageSaveError }

/**
 * V2.2e — Outcome of an explicit publish/unpublish command.
 * `stale` is true when newer local edits survived the pre-publication save and
 * are therefore NOT part of the version that was just published.
 */
export type PageCommandOutcome
  = | { ok: true, page: ProviderPageResponse, stale: boolean }
    | { ok: false, error: PageSaveError }

/** V2.2e — Outcome of preparing the editor for the private preview. */
export type PagePreviewOutcome
  = | { ok: true, stale: boolean }
    | { ok: false, error: PageSaveError }

export function createPageEditor(
  initialPage: ProviderPageResponse,
  deps: PageEditorDependencies
) {
  const state = ref<PageEditorState>(createPageEditorState(initialPage))
  const saving = ref(false)
  const publishing = ref(false)
  const saveError = ref<PageSaveError | null>(null)
  /**
   * V2.2e — Editor block indices flagged by a refused publication (image
   * without `alt`). Empty otherwise; the editor highlights them.
   */
  const missingAltBlockIndices = ref<number[]>([])

  const dirty = computed(() => isPageEditorDirty(state.value))
  const canRemove = computed(() => canRemoveBlock(state.value.blocks))

  /** Resets the editor to a freshly loaded server page. */
  function reset(page: ProviderPageResponse) {
    state.value = resetPageEditorState(page)
    saveError.value = null
    missingAltBlockIndices.value = []
  }

  /**
   * V2.2e — Clears the alt highlight of the edited block only. `saveError` is
   * intentionally NOT cleared here: a 409/session error must stay visible while
   * the coach fixes the content (only an explicit command/reload clears it).
   */
  function clearMissingAltAt(index: number) {
    missingAltBlockIndices.value = missingAltBlockIndices.value.filter(
      flagged => flagged !== index
    )
  }

  /** Structural mutations shift every index → drop the whole highlight. */
  function clearAllMissingAlt() {
    missingAltBlockIndices.value = []
  }

  function setBlocks(blocks: readonly ContentBlock[]) {
    state.value = setPageEditorBlocks(state.value, blocks)
    clearAllMissingAlt()
  }

  function setBlockHtml(index: number, html: string) {
    state.value = setEditorBlockHtml(state.value, index, html)
    clearMissingAltAt(index)
  }

  /** Appends an image block and returns its index (for focus). */
  function addImageBlock(data?: Partial<ImageBlockData>): number {
    state.value = addEditorImageBlock(state.value, data ?? {})
    clearAllMissingAlt()
    return state.value.blocks.length - 1
  }

  function setImageBlockData(index: number, patch: Partial<ImageBlockData>) {
    state.value = setEditorImageBlockData(state.value, index, patch)
    clearMissingAltAt(index)
  }

  /** Appends an empty paragraph and returns its index (for focus). */
  function addBlock(): number {
    state.value = setPageEditorBlocks(state.value, appendTextBlock(state.value.blocks))
    clearAllMissingAlt()
    return state.value.blocks.length - 1
  }

  function removeBlock(index: number) {
    state.value = setPageEditorBlocks(state.value, removeBlockAt(state.value.blocks, index))
    clearAllMissingAlt()
  }

  /** V2.2d — Moves a block; the new array order is the persisted order. */
  function moveBlock(from: number, to: number) {
    state.value = moveEditorBlock(state.value, from, to)
    clearAllMissingAlt()
  }

  function canMoveUp(index: number): boolean {
    return canMoveBlockUp(index)
  }

  function canMoveDown(index: number): boolean {
    return canMoveBlockDown(index, state.value.blocks.length)
  }

  function clearError() {
    saveError.value = null
    missingAltBlockIndices.value = []
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
        ? applySavedVersion(state.value, page, payload)
        : resetPageEditorState(page)
      missingAltBlockIndices.value = []
      return { ok: true, page, stale }
    } catch (error: unknown) {
      const mapped = resolvePageSaveError(error)
      saveError.value = mapped
      return { ok: false, error: mapped }
    } finally {
      saving.value = false
    }
  }

  /**
   * V2.2e — Publishes the page. Unsaved local edits are saved first (reusing
   * `save()`) so the published version is exactly what the coach sees; a save
   * failure aborts the publication. The editor is then re-seeded from the
   * server response (`status`, `version`, `publishedAt`,
   * `hasUnpublishedChanges`).
   */
  async function publish(): Promise<PageCommandOutcome> {
    missingAltBlockIndices.value = []
    saveError.value = null

    if (dirty.value) {
      const saved = await save()
      if (!saved.ok) return { ok: false, error: saved.error }
      // Edits typed during the save are NOT part of the published version and
      // must survive: do not reset their blocks away (stale save).
      if (saved.stale) return await runStatusCommand(() => deps.publish(state.value.id), true, true)
    }

    return await runStatusCommand(() => deps.publish(state.value.id), false)
  }

  /** V2.2e — Unpublishes the page (confirmation is owned by the UI). */
  async function unpublish(): Promise<PageCommandOutcome> {
    missingAltBlockIndices.value = []
    saveError.value = null
    return await runStatusCommand(() => deps.unpublish(state.value.id), dirty.value)
  }

  async function runStatusCommand(
    command: () => Promise<ProviderPageResponse>,
    preserveLocalBlocks: boolean,
    staleBefore = false
  ): Promise<PageCommandOutcome> {
    // Same in-flight protection as `save()`: edits typed while the command is
    // running must never be overwritten by the older server snapshot.
    const snapshotBefore = editableSnapshot(state.value)
    publishing.value = true
    try {
      const page = await command()
      const staleDuringCommand = editableSnapshot(state.value) !== snapshotBefore
      state.value = preserveLocalBlocks || staleDuringCommand
        ? applyCommandStatus(state.value, page)
        : resetPageEditorState(page)
      return { ok: true, page, stale: staleBefore || staleDuringCommand }
    } catch (error: unknown) {
      const mapped = resolvePageSaveError(error)
      const editorIndices = resolveMissingAltEditorIndices(error, state.value.blocks)
      if (editorIndices.length > 0) {
        mapped.missingAltBlockIndices = editorIndices
        mapped.title = 'Publication impossible'
        mapped.message = describeMissingAltBlocks(editorIndices)
      }
      saveError.value = mapped
      missingAltBlockIndices.value = editorIndices
      return { ok: false, error: mapped }
    } finally {
      publishing.value = false
    }
  }

  /**
   * V2.2e — Prepares the editor for the private preview: saves the draft first
   * when `dirty` so the preview shows the current content. Returns the save
   * outcome; the caller only opens the preview on success. `stale` means the
   * very latest keystrokes are not part of the persisted draft.
   */
  async function preparePreview(): Promise<PagePreviewOutcome> {
    if (!dirty.value) return { ok: true, stale: false }

    const saved = await save()
    if (!saved.ok) return { ok: false, error: saved.error }
    return { ok: true, stale: saved.stale }
  }

  return {
    state,
    saving,
    publishing,
    saveError,
    missingAltBlockIndices,
    dirty,
    canRemove,
    reset,
    setBlocks,
    setBlockHtml,
    addBlock,
    addImageBlock,
    setImageBlockData,
    removeBlock,
    moveBlock,
    canMoveUp,
    canMoveDown,
    clearError,
    save,
    publish,
    unpublish,
    preparePreview
  }
}

export type PageEditor = ReturnType<typeof createPageEditor>
