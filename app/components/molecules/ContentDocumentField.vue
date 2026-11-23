<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-3">
      <UButton
        size="sm"
        variant="soft"
        color="primary"
        type="button"
        :disabled="blocked"
        :loading="uploading"
        @click="trigger"
      >
        Joindre un document (PDF)
      </UButton>
      <input
        ref="inputRef"
        type="file"
        accept="application/pdf"
        class="hidden"
        @change="onFileSelected"
      >
    </div>

    <div
      v-if="document"
      class="rounded-lg border border-[color:var(--color-brand-subtle)] px-3 py-2"
    >
      <p class="text-sm font-medium text-[color:var(--color-text-primary)]">
        {{ document.filename }}
      </p>
      <p class="text-xs text-[color:var(--color-text-muted)]">
        {{ formatSize(document.sizeBytes) }}
      </p>
      <div class="mt-2 flex gap-2">
        <UButton
          size="sm"
          variant="ghost"
          color="primary"
          type="button"
          :disabled="blocked"
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
          Retirer
        </UButton>
      </div>
    </div>

    <p class="text-xs text-[color:var(--color-text-muted)]">
      Support pédagogique destiné à vos clientes. N'y placez pas de données de santé ni d'informations nominatives.
    </p>

    <p
      v-if="error"
      class="text-sm text-[color:var(--color-error)]"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CONTENT_DOCUMENT_MAX_BYTES,
  CONTENT_DOCUMENT_ALLOWED_MIME_TYPES
} from '../../features/assets/api/asset.contract'
import {
  CONTENT_DOCUMENT_INVALID_MIME_MESSAGE,
  CONTENT_DOCUMENT_TOO_LARGE_MESSAGE,
  formatUploadError,
  uploadAsset,
  validateFileUpload
} from '../../features/assets/use-asset-upload'

const props = defineProps<{
  modelValue: { assetId: string, filename: string, sizeBytes: number } | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { assetId: string, filename: string, sizeBytes: number } | null]
  /**
   * Announced so the page can refuse to save while the PDF is still uploading:
   * the asset id only reaches the form once the upload answers, and a save
   * meanwhile would persist the content without the document the provider chose.
   */
  'uploading': [value: boolean]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref<string | null>(null)

/** Monotonic token: a late response must not overwrite a newer document. */
let uploadToken = 0

const blocked = computed(() => props.disabled === true || uploading.value)
const document = computed(() => props.modelValue)

function trigger() {
  if (blocked.value) return
  inputRef.value?.click()
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file || blocked.value) return

  const token = ++uploadToken
  error.value = null
  const message = validateFileUpload(
    file,
    CONTENT_DOCUMENT_MAX_BYTES,
    [...CONTENT_DOCUMENT_ALLOWED_MIME_TYPES]
  )
  if (message) {
    // The local refusal speaks the same words as the server's (interfaces.md §6).
    error.value = file.size > CONTENT_DOCUMENT_MAX_BYTES
      ? CONTENT_DOCUMENT_TOO_LARGE_MESSAGE
      : CONTENT_DOCUMENT_INVALID_MIME_MESSAGE
    return
  }

  uploading.value = true
  emit('uploading', true)
  try {
    const result = await uploadAsset('content_document', file)
    if (token !== uploadToken) return
    emit('update:modelValue', {
      assetId: result.assetId,
      filename: result.filename ?? file.name,
      sizeBytes: result.sizeBytes ?? file.size
    })
  } catch (e: unknown) {
    if (token !== uploadToken) return
    // One mapper, reading the API code first (`formatUploadError`).
    error.value = formatUploadError(e, 'content_document')
  } finally {
    if (token === uploadToken) {
      uploading.value = false
      emit('uploading', false)
    }
  }
}

function remove() {
  error.value = null
  emit('update:modelValue', null)
}
</script>
