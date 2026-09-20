<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { ContentBlock, ImageBlockData, ProviderPageResponse } from '~/features/pages/api/pages.contract'
import type { GuidedDestination } from '~/features/pages/domain/guided-links'
import { blockTargetIndex, isImageBlock, isTextBlock, readImageBlockData, readTextBlockHtml } from '~/features/pages/domain/content-blocks'
import { describeBlockMove } from '~/features/pages/domain/page-editor'
import { usePageEditor } from '~/features/pages/usePageEditor'
import PageEditorTextBlock from '~/components/organisms/PageEditorTextBlock.vue'
import BlockImageEditor from '~/components/organisms/BlockImageEditor.vue'
import ConfirmActionModal from '~/components/molecules/ConfirmActionModal.vue'
import PageBlockReorderControls from '~/components/molecules/PageBlockReorderControls.vue'
import PageBlockRenderer, { type ContentBlock as RendererContentBlock } from '~/components/molecules/PageBlockRenderer.vue'

/**
 * V2.2b — One-column page content editor.
 *
 * Delegates the draft state and save flow to the framework-free
 * `createPageEditor` factory (injectable transport, unit-tested). A `409
 * PAGE_CONCURRENT_MODIFICATION` never overwrites the local draft — the editor
 * surfaces the dedicated message and offers a reload.
 */
const props = withDefaults(
  defineProps<{
    page: ProviderPageResponse
    destinations?: readonly GuidedDestination[]
  }>(),
  {
    destinations: () => []
  }
)

const emit = defineEmits<{
  (event: 'saved', page: ProviderPageResponse): void
  (event: 'update:dirty', value: boolean): void
  (event: 'reload'): void
}>()

const toast = useToast()

const {
  state,
  saving,
  saveError,
  dirty,
  canRemove,
  reset,
  setBlockHtml,
  addBlock: appendBlock,
  addImageBlock,
  setImageBlockData,
  removeBlock,
  moveBlock: moveEditorBlock,
  canMoveUp,
  canMoveDown,
  clearError,
  save
} = usePageEditor(props.page)

const blockToRemove = ref<number | null>(null)
const autofocusIndex = ref<number | null>(null)

interface ReorderControlsHandle {
  focusButton: (direction: 'up' | 'down') => void
}

/**
 * V2.2d — Stable render keys. Blocks carry no id (positional API contract), so
 * a monotonic counter feeds a keys array kept in sync with `state.blocks`
 * add/remove/move. Never sent to the server; it only prevents Vue from reusing
 * the `contenteditable` DOM of a different block after a reorder.
 */
const blockKeys = ref<string[]>([])
const controlsByKey = new Map<string, ReorderControlsHandle>()
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const moveAnnouncement = ref('')

let blockKeySeq = 0

function nextBlockKey(): string {
  blockKeySeq += 1
  return `block-${blockKeySeq}`
}

function regenerateBlockKeys() {
  blockKeys.value = state.value.blocks.map(() => nextBlockKey())
}

function syncBlockKeys() {
  const count = state.value.blocks.length
  const keys = blockKeys.value
  if (keys.length === count) return
  if (keys.length > count) {
    blockKeys.value = keys.slice(0, count)
    return
  }
  blockKeys.value = [
    ...keys,
    ...Array.from({ length: count - keys.length }, () => nextBlockKey())
  ]
}

function blockKey(index: number): string {
  return blockKeys.value[index] ?? `block-fallback-${index}`
}

function setControlsRef(key: string, instance: unknown) {
  if (instance) {
    controlsByKey.set(key, instance as ReorderControlsHandle)
  } else {
    controlsByKey.delete(key)
  }
}

/**
 * Returns a ref callback that captures the block key **string** at render
 * time. Using `setControlsRef(blockKey(index), ...)` inline would re-evaluate
 * `blockKey(index)` at unmount against the already-reordered `blockKeys`, so a
 * stale index could delete a live block's handle and break focus retention.
 */
function controlsRefFor(key: string) {
  return (instance: unknown) => setControlsRef(key, instance)
}

watch(
  () => props.page,
  (page) => {
    reset(page)
    regenerateBlockKeys()
  },
  { immediate: true }
)

watch(
  () => state.value.blocks.length,
  () => syncBlockKeys()
)

watch(
  dirty,
  value => emit('update:dirty', value),
  { immediate: true }
)

const removeModalOpen = computed({
  get: () => blockToRemove.value !== null,
  set: (open: boolean) => {
    if (!open) blockToRemove.value = null
  }
})

function updateBlockHtml(index: number, html: string) {
  setBlockHtml(index, html)
}

function addBlock() {
  autofocusIndex.value = appendBlock()
  syncBlockKeys()
  // The block consumes `autofocus` on mount; clear it so a later removal never
  // re-triggers focus on an unrelated block sharing the same index.
  void nextTick(() => {
    autofocusIndex.value = null
  })
}

function addImage() {
  addImageBlock()
  syncBlockKeys()
}

function updateImageBlockData(index: number, data: ImageBlockData) {
  setImageBlockData(index, data)
}

function asImageData(block: ContentBlock): ImageBlockData {
  return readImageBlockData(block) ?? { assetId: '' }
}

function isImage(block: ContentBlock): boolean {
  return isImageBlock(block)
}

function requestRemoveBlock(index: number) {
  if (!canRemove.value) return
  blockToRemove.value = index
}

function confirmRemoveBlock() {
  if (blockToRemove.value === null) return
  const index = blockToRemove.value
  const before = state.value.blocks.length
  removeBlock(index)
  // `removeBlock` refuses to remove the last block or an out-of-range index;
  // only splice a key when the block was actually removed, otherwise the keys
  // array would desync from `state.blocks`.
  if (state.value.blocks.length < before) {
    const keys = [...blockKeys.value]
    keys.splice(index, 1)
    blockKeys.value = keys
  }
  blockToRemove.value = null
}

/**
 * V2.2d — Single move path for the buttons and the native mouse drop. The
 * announcement wording is verbatim from the UX spec (§3.3).
 */
async function performMove(
  from: number,
  to: number,
  direction: 'up' | 'down',
  refocus: boolean
) {
  const total = state.value.blocks.length
  if (from === to || from < 0 || to < 0 || from >= total || to >= total) return

  const key = blockKeys.value[from]
  moveEditorBlock(from, to)
  reorderBlockKey(from, to)

  // Clear then set so two consecutive moves producing the same sentence are
  // still re-announced (a ref whose value never changes stays silent).
  const message = describeBlockMove(from, to, total)
  moveAnnouncement.value = ''
  await nextTick()
  moveAnnouncement.value = message

  if (!refocus || !key) return
  controlsByKey.get(key)?.focusButton(direction)
}

function reorderBlockKey(from: number, to: number) {
  const keys = [...blockKeys.value]
  const [moved] = keys.splice(from, 1)
  if (moved === undefined) return
  keys.splice(to, 0, moved)
  blockKeys.value = keys
}

function moveByButton(index: number, direction: 'up' | 'down') {
  const to = blockTargetIndex(index, direction, state.value.blocks.length)
  if (to < 0) return
  void performMove(index, to, direction, true)
}

function onDragStart(index: number, event: DragEvent) {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOver(index: number, event: DragEvent) {
  if (dragIndex.value === null) return
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dragOverIndex.value = index
}

function onDragLeave(index: number, event: DragEvent) {
  if (dragOverIndex.value !== index) return
  const current = event.currentTarget as HTMLElement | null
  const next = event.relatedTarget as Node | null
  // Moving between children of the same block must not clear the indicator.
  if (current && next && current.contains(next)) return
  dragOverIndex.value = null
}

function onDrop(index: number) {
  const from = dragIndex.value
  clearDrag()
  if (from === null || from === index) return
  void performMove(from, index, from < index ? 'down' : 'up', false)
}

function onDragEnd() {
  clearDrag()
}

function clearDrag() {
  dragIndex.value = null
  dragOverIndex.value = null
}

function dropTargetClass(index: number): string {
  if (dragIndex.value === null || dragIndex.value === index || dragOverIndex.value !== index) {
    return ''
  }
  return 'ring-2 ring-[color:var(--color-brand-primary)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)] motion-reduce:transition-none'
}

function asRendererBlocks(block: ContentBlock): RendererContentBlock[] {
  return [block as RendererContentBlock]
}

function reloadFromServer() {
  clearError()
  emit('reload')
}

async function onSave() {
  const outcome = await save()

  if (outcome.ok) {
    // A successful save may reset the state from the server response (orphan
    // blocks dropped), so re-key the blocks to keep keys aligned with positions.
    regenerateBlockKeys()
    toast.add({
      title: 'Page enregistrée',
      description: outcome.stale
        ? 'Vos modifications ont été enregistrées. Les saisies effectuées pendant l\'enregistrement restent à enregistrer.'
        : 'Vos modifications ont été enregistrées.',
      color: 'success'
    })
    emit('saved', outcome.page)
    return
  }

  toast.add({
    title: outcome.error.title,
    description: outcome.error.message,
    color: 'error'
  })
}

defineExpose({ state })
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm tabular-nums text-[color:var(--color-text-muted)]">
        {{ state.blocks.length }} {{ state.blocks.length > 1 ? 'blocs' : 'bloc' }}
      </p>
      <UButton
        color="primary"
        icon="i-lucide-save"
        :loading="saving"
        :disabled="!dirty || saving"
        @click="onSave"
      >
        Enregistrer
      </UButton>
    </div>

    <UAlert
      v-if="saveError"
      color="error"
      variant="soft"
      :icon="saveError.kind === 'conflict' ? 'i-lucide-git-compare' : 'i-lucide-alert-circle'"
      :title="saveError.title"
      :description="saveError.message"
    >
      <template
        v-if="saveError.kind === 'conflict'"
        #actions
      >
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          @click="reloadFromServer"
        >
          Recharger la dernière version
        </UButton>
      </template>
    </UAlert>

    <p
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ moveAnnouncement }}
    </p>

    <AtomsDsEmptyState
      v-if="state.blocks.length === 0"
      icon="i-lucide-text"
      title="Cette page est vide"
      description="Ajoutez un premier paragraphe pour commencer à rédiger le contenu de votre page."
    >
      <template #action>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <UButton
            color="primary"
            icon="i-lucide-plus"
            @click="addBlock"
          >
            Ajouter un paragraphe
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-image-plus"
            @click="addImage"
          >
            Ajouter une image
          </UButton>
        </div>
      </template>
    </AtomsDsEmptyState>

    <div
      v-else
      class="space-y-6"
    >
      <div
        v-for="(block, index) in state.blocks"
        :key="blockKey(index)"
        class="space-y-2 rounded-lg"
        :class="dropTargetClass(index)"
        @dragover.prevent="onDragOver(index, $event)"
        @dragleave="onDragLeave(index, $event)"
        @drop.prevent="onDrop(index)"
      >
        <div
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragend="onDragEnd"
        >
          <PageBlockReorderControls
            :ref="controlsRefFor(blockKey(index))"
            :position="index + 1"
            :can-move-up="canMoveUp(index)"
            :can-move-down="canMoveDown(index)"
            @move-up="moveByButton(index, 'up')"
            @move-down="moveByButton(index, 'down')"
          />
        </div>

        <PageEditorTextBlock
          v-if="isTextBlock(block)"
          :model-value="readTextBlockHtml(block)"
          :destinations="destinations"
          :autofocus="autofocusIndex === index"
          :label="`Contenu du bloc ${index + 1}`"
          @update:model-value="updateBlockHtml(index, $event)"
        />

        <BlockImageEditor
          v-else-if="isImage(block)"
          :model-value="asImageData(block)"
          :label="`Image ${index + 1}`"
          @update:model-value="updateImageBlockData(index, $event)"
          @remove="requestRemoveBlock(index)"
        />

        <div
          v-else
          class="rounded-lg border border-dashed border-[color:var(--color-border-subtle)] p-3"
        >
          <p class="mb-2 text-xs text-[color:var(--color-text-muted)]">
            Ce bloc n'est pas modifiable dans cette version.
          </p>
          <PageBlockRenderer :blocks="asRendererBlocks(block)" />
        </div>

        <div
          v-if="isTextBlock(block)"
          class="flex justify-end"
        >
          <UButton
            color="error"
            variant="ghost"
            size="sm"
            icon="i-lucide-trash-2"
            :disabled="!canRemove"
            @click="requestRemoveBlock(index)"
          >
            Supprimer
          </UButton>
        </div>
      </div>
    </div>

    <div
      v-if="state.blocks.length > 0"
      class="flex flex-wrap gap-2"
    >
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-plus"
        @click="addBlock"
      >
        Ajouter un paragraphe
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-image-plus"
        @click="addImage"
      >
        Ajouter une image
      </UButton>
    </div>

    <ConfirmActionModal
      v-model:open="removeModalOpen"
      title="Supprimer ce bloc ?"
      description="Le contenu de ce bloc sera retiré de la page. Cette action ne sera effective qu'après l'enregistrement."
      confirm-label="Supprimer"
      @confirm="confirmRemoveBlock"
    />
  </div>
</template>
