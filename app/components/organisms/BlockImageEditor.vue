<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ImageBlockData } from '~/features/pages/api/pages.contract'
import {
  formatUploadError,
  validatePageImageDimensions,
  validatePageImageFile
} from '~/features/assets/asset-validators'
import { readImageDimensions, uploadAsset } from '~/features/assets/use-asset-upload'
import { imageBlockDataFromUpload } from '~/features/pages/domain/content-blocks'
import BlockImage from '~/components/atoms/BlockImage.vue'

/**
 * V2.2c — Image block editor: drag & drop / file picker, upload progress,
 * required alt text, optional caption, replace and delete.
 *
 * The block shape is the server one (`ImageBlockData`); the uploaded asset id
 * is only written into the block after a successful upload, so no phantom
 * asset is ever persisted. Alt becomes mandatory at publication (server side),
 * but a draft can be saved without it.
 */
const props = withDefaults(
  defineProps<{
    modelValue: ImageBlockData
    label?: string
    disabled?: boolean
  }>(),
  {
    label: 'Image',
    disabled: false
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: ImageBlockData): void
  (event: 'remove'): void
}>()

const uid = Math.random().toString(36).slice(2, 9)
const altId = `block-image-alt-${uid}`
const captionId = `block-image-caption-${uid}`
const errorId = `block-image-error-${uid}`

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref<string | null>(null)
// dragenter/dragleave fire for every child node; a depth counter prevents the
// drop zone from flickering when the pointer crosses nested elements (BH19).
const dragDepth = ref(0)

const dragActive = computed(() => dragDepth.value > 0)
const hasImage = computed(() => props.modelValue.assetId.trim().length > 0)
const isOrphan = computed(() => props.modelValue.orphan === true)

// Alt is required for publication: an uploaded image without alt is invalid.
const altInvalid = computed(
  () => hasImage.value && (props.modelValue.alt ?? '').trim().length === 0
)
const altErrorId = `${altId}-error`
const altDescribedBy = computed(
  () => (altInvalid.value ? `${altId}-hint ${altErrorId}` : `${altId}-hint`)
)

const alt = computed({
  get: () => props.modelValue.alt ?? '',
  set: value => patch({ alt: value })
})

const caption = computed({
  get: () => props.modelValue.caption ?? '',
  set: value => patch({ caption: value })
})

function patch(partial: Partial<ImageBlockData>) {
  emit('update:modelValue', { ...props.modelValue, ...partial })
}

function openFilePicker() {
  if (props.disabled || uploading.value) return
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Reset so selecting the same file twice still fires `change`.
  input.value = ''
  if (file) void startUpload(file)
}

function onDragEnter() {
  if (props.disabled || uploading.value) return
  dragDepth.value += 1
}

function onDragLeave() {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
}

function onDrop(event: DragEvent) {
  dragDepth.value = 0
  if (props.disabled || uploading.value) return
  const file = event.dataTransfer?.files?.[0]
  if (file) void startUpload(file)
}

/**
 * Single upload entry point. A second drop/selection while an upload is in
 * flight is ignored so two assets can never race (ECH5).
 */
async function startUpload(file: File) {
  if (uploading.value) return

  uploadError.value = null
  const fileError = validatePageImageFile(file)
  if (fileError) {
    uploadError.value = fileError
    return
  }

  uploading.value = true
  try {
    const { width, height } = await readImageDimensions(file)
    const dimensionError = validatePageImageDimensions(width, height)
    if (dimensionError) {
      uploadError.value = dimensionError
      return
    }

    const result = await uploadAsset('page_image', file)
    patch(imageBlockDataFromUpload(result, { width, height }))
  } catch (error: unknown) {
    uploadError.value = formatUploadError(error, 'page_image')
  } finally {
    uploading.value = false
  }
}

function replaceImage() {
  openFilePicker()
}

function removeBlock() {
  emit('remove')
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]">
    <input
      ref="fileInput"
      type="file"
      class="sr-only"
      accept="image/jpeg,image/png,image/webp"
      :aria-label="`Sélectionner une image pour ${label}`"
      @change="onFileChange"
    >

    <div class="space-y-3 p-3">
      <UAlert
        v-if="isOrphan"
        color="warning"
        variant="soft"
        icon="i-lucide-image-off"
        title="Cette image n'est plus disponible"
        description="L'image associée est introuvable. Remplacez-la ou supprimez ce bloc : il ne sera pas enregistré en l'état."
      />

      <template v-if="hasImage">
        <BlockImage :data="modelValue" />

        <div class="flex flex-wrap gap-2">
          <UButton
            color="neutral"
            variant="soft"
            size="sm"
            icon="i-lucide-refresh-cw"
            :disabled="disabled || uploading"
            @click="replaceImage"
          >
            Remplacer l'image
          </UButton>
          <UButton
            color="error"
            variant="ghost"
            size="sm"
            icon="i-lucide-trash-2"
            :disabled="disabled"
            @click="removeBlock"
          >
            Supprimer le bloc
          </UButton>
        </div>
      </template>

      <div
        v-else
        class="space-y-2"
      >
        <div
          class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors"
          :class="dragActive
            ? 'border-[color:var(--color-brand-primary)] bg-[color:var(--color-surface-highlight)]'
            : 'border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted)]'"
          role="button"
          tabindex="0"
          :aria-label="`Téléverser une image : glisser-déposer ou activer pour parcourir`"
          :aria-describedby="uploadError ? errorId : undefined"
          @click="openFilePicker"
          @keydown.enter.prevent="openFilePicker"
          @keydown.space.prevent="openFilePicker"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <UIcon
            name="i-lucide-image-plus"
            class="size-6 text-[color:var(--color-text-muted)]"
          />
          <p class="text-sm text-[color:var(--color-text-secondary)]">
            Glissez-déposez une image ici ou cliquez pour parcourir
          </p>
          <p class="text-xs text-[color:var(--color-text-muted)]">
            JPEG, PNG ou WebP — 5 Mo maximum, 4 000 px par côté, 10 mégapixels.
          </p>
        </div>

        <UButton
          color="error"
          variant="ghost"
          size="sm"
          icon="i-lucide-trash-2"
          :disabled="disabled"
          @click="removeBlock"
        >
          Supprimer le bloc
        </UButton>
      </div>

      <UProgress
        v-if="uploading"
        :model-value="null"
        size="sm"
        aria-label="Téléversement de l'image en cours"
      />

      <p
        v-if="uploadError"
        :id="errorId"
        role="alert"
        class="text-sm text-[color:var(--color-error-600)]"
      >
        {{ uploadError }}
      </p>

      <div class="space-y-1">
        <label
          :for="altId"
          class="block text-sm font-medium text-[color:var(--color-text-secondary)]"
        >
          Description de l'image pour les personnes malvoyantes (texte alternatif)
          <span aria-hidden="true">*</span>
        </label>
        <UInput
          :id="altId"
          v-model="alt"
          class="w-full"
          placeholder="Ex. : Sophie accompagne une cliente lors d'une séance"
          :maxlength="500"
          :disabled="disabled"
          :aria-describedby="altDescribedBy"
          :aria-invalid="altInvalid || undefined"
        />
        <p
          :id="`${altId}-hint`"
          class="text-xs text-[color:var(--color-text-muted)]"
        >
          Nécessaire pour les lecteurs d'écran et le référencement naturel. Obligatoire à la mise en ligne.
        </p>
        <p
          v-if="altInvalid"
          :id="altErrorId"
          role="alert"
          class="text-xs text-[color:var(--color-error-600)]"
        >
          Ajoutez une description de l'image pour pouvoir la mettre en ligne.
        </p>
      </div>

      <div class="space-y-1">
        <label
          :for="captionId"
          class="block text-sm font-medium text-[color:var(--color-text-secondary)]"
        >
          Légende sous l'image (optionnel)
        </label>
        <UInput
          :id="captionId"
          v-model="caption"
          class="w-full"
          placeholder="Ex. : Séance découverte en visio"
          :maxlength="500"
          :disabled="disabled"
        />
      </div>
    </div>
  </div>
</template>
