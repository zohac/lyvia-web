<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { ContentBlock, ImageBlockData, ProviderPageResponse } from '~/features/pages/api/pages.contract'
import type { GuidedDestination } from '~/features/pages/domain/guided-links'
import { isImageBlock, isTextBlock, readImageBlockData, readTextBlockHtml } from '~/features/pages/domain/content-blocks'
import { usePageEditor } from '~/features/pages/usePageEditor'
import PageEditorTextBlock from '~/components/organisms/PageEditorTextBlock.vue'
import BlockImageEditor from '~/components/organisms/BlockImageEditor.vue'
import ConfirmActionModal from '~/components/molecules/ConfirmActionModal.vue'
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
  clearError,
  save
} = usePageEditor(props.page)

const blockToRemove = ref<number | null>(null)
const autofocusIndex = ref<number | null>(null)

watch(
  () => props.page,
  page => reset(page)
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
  // The block consumes `autofocus` on mount; clear it so a later removal never
  // re-triggers focus on an unrelated block sharing the same index.
  void nextTick(() => {
    autofocusIndex.value = null
  })
}

function addImage() {
  addImageBlock()
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
  removeBlock(blockToRemove.value)
  blockToRemove.value = null
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
        :key="index"
        class="space-y-2"
      >
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
