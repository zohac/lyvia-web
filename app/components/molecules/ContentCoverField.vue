<template>
  <div class="space-y-3">
    <div
      class="rounded-lg border border-dashed border-[color:var(--color-brand-subtle)] p-4 text-center"
      :aria-busy="uploading ? 'true' : 'false'"
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
            :disabled="blocked"
            :loading="uploading"
            @click="trigger"
          >
            Remplacer
          </UButton>
          <UButton
            size="sm"
            variant="ghost"
            color="error"
            type="button"
            :disabled="blocked"
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
          :disabled="blocked"
          :loading="uploading"
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
      v-if="shownError"
      class="text-sm text-[color:var(--color-error)]"
    >
      {{ shownError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
  /** Server-side verdict on the stored URL (the field itself owns upload errors). */
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref<string | null>(null)
const localPreview = ref<string | null>(null)

/**
 * Monotonic token: picking file B while file A is still uploading must not let
 * A's response overwrite B's. Without it the late response of A emits its URL
 * after B's, and the provider's cover is not the one she sees.
 */
let uploadToken = 0

const blocked = computed(() => props.disabled === true || uploading.value)
const shownError = computed(() => uploadError.value ?? props.error ?? null)

function isBlobUrl(url: string | null): boolean {
  return typeof url === 'string' && url.startsWith('blob:')
}

const preview = computed(() => localPreview.value ?? (props.modelValue || null))

function trigger() {
  if (blocked.value) return
  inputRef.value?.click()
}

function onDrop(event: DragEvent) {
  if (props.disabled) return
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
  // A pick or a drop while a previous upload is still running *replaces* it:
  // the monotonic token below drops the abandoned response, so the newer file
  // always wins (the buttons are disabled meanwhile, a drop is not).
  if (props.disabled) return

  const token = ++uploadToken
  uploadError.value = null
  const message = validateFileUpload(
    file,
    CONTENT_COVER_MAX_BYTES,
    [...CONTENT_COVER_ALLOWED_MIME_TYPES]
  )
  if (message) {
    uploadError.value = message
    return
  }

  // Revoke the previous local preview — and only on replacement.
  if (isBlobUrl(localPreview.value)) {
    URL.revokeObjectURL(localPreview.value as string)
  }
  const objectUrl = URL.createObjectURL(file)
  localPreview.value = objectUrl

  uploading.value = true
  try {
    const result = await uploadAsset('content_cover', file)
    if (token !== uploadToken) return
    if (!result.url) {
      // Never clear a stored cover because the server answered without a URL.
      uploadError.value = formatUploadError(new Error('MISSING_URL'), 'content_cover')
      return
    }
    // Revoke the local blob now that the server URL replaces it.
    if (isBlobUrl(localPreview.value)) {
      URL.revokeObjectURL(localPreview.value as string)
    }
    localPreview.value = null
    emit('update:modelValue', result.url)
  } catch (e: unknown) {
    if (token !== uploadToken) return
    uploadError.value = formatUploadError(e, 'content_cover')
    // Keep the local preview so the provider sees what she picked.
  } finally {
    if (token === uploadToken) uploading.value = false
  }
}

function remove() {
  if (isBlobUrl(localPreview.value)) {
    URL.revokeObjectURL(localPreview.value as string)
  }
  localPreview.value = null
  uploadError.value = null
  emit('update:modelValue', '')
}

/**
 * AC4 / AGENTS §11.6: the object URL is **never** revoked on unmount — the live
 * preview still holds it. It is revoked only when the file is replaced or
 * removed. There is deliberately no `onBeforeUnmount` revoke here.
 */
</script>
