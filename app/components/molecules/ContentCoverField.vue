<template>
  <div class="space-y-3">
    <div
      class="rounded-lg border border-dashed border-[color:var(--color-brand-subtle)] p-4 text-center"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <input
        ref="inputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onFileSelected"
      >

      <div
        v-if="preview"
        class="space-y-2"
      >
        <img
          :src="preview"
          alt="Aperçu de la couverture"
          class="mx-auto max-h-48 rounded"
        >
        <div class="flex justify-center gap-2">
          <UButton
            size="sm"
            variant="soft"
            color="primary"
            type="button"
            :disabled="disabled || uploading"
            @click="trigger"
          >
            Remplacer
          </UButton>
          <UButton
            size="sm"
            variant="ghost"
            color="error"
            type="button"
            :disabled="disabled || uploading"
            @click="remove"
          >
            Supprimer
          </UButton>
        </div>
      </div>

      <div
        v-else
        class="space-y-2"
      >
        <p class="text-sm text-[color:var(--color-text-muted)]">
          Glissez une image ici ou
        </p>
        <UButton
          size="sm"
          variant="soft"
          color="primary"
          type="button"
          :disabled="disabled || uploading"
          @click="trigger"
        >
          Choisir une image
        </UButton>
        <p class="text-xs text-[color:var(--color-text-muted)]">
          JPEG, PNG, WebP — 5 Mo maximum
        </p>
      </div>
    </div>

    <p
      v-if="error"
      class="text-sm text-[color:var(--color-error)]"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  CONTENT_COVER_MAX_BYTES,
  CONTENT_COVER_ALLOWED_MIME_TYPES
} from '../../features/assets/api/asset.contract'
import {
  formatUploadError,
  uploadAsset,
  validateFileUpload
} from '../../features/assets/use-asset-upload'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref<string | null>(null)
const localPreview = ref<string | null>(null)

function isBlobUrl(url: string | null): boolean {
  return typeof url === 'string' && url.startsWith('blob:')
}

const preview = computed(() => localPreview.value ?? (props.modelValue || null))

function trigger() {
  inputRef.value?.click()
}

function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) handleFile(file)
  target.value = ''
}

async function handleFile(file: File) {
  error.value = null
  const message = validateFileUpload(
    file,
    CONTENT_COVER_MAX_BYTES,
    [...CONTENT_COVER_ALLOWED_MIME_TYPES]
  )
  if (message) {
    error.value = message
    return
  }

  // Revoke previous local preview only on replacement.
  if (isBlobUrl(localPreview.value)) {
    URL.revokeObjectURL(localPreview.value as string)
  }
  const objectUrl = URL.createObjectURL(file)
  localPreview.value = objectUrl

  uploading.value = true
  try {
    const result = await uploadAsset('content_cover', file)
    // Revoke local blob now that server URL is available.
    if (isBlobUrl(localPreview.value)) {
      URL.revokeObjectURL(localPreview.value as string)
    }
    localPreview.value = null
    emit('update:modelValue', result.url ?? '')
  } catch (e: unknown) {
    error.value = formatUploadError(e, 'page_image')
    // Keep local preview so the user sees what they picked.
  } finally {
    uploading.value = false
  }
}

function remove() {
  if (isBlobUrl(localPreview.value)) {
    URL.revokeObjectURL(localPreview.value as string)
  }
  localPreview.value = null
  emit('update:modelValue', '')
}

// Never revoke on unmount (documented trap).
onBeforeUnmount(() => {
  // intentionally no revoke
})
</script>
