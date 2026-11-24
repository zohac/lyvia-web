<template>
  <div class="space-y-2">
    <p class="text-[13px] font-semibold text-[color:var(--color-text-secondary)]">
      Document
    </p>

    <div
      v-if="document"
      class="flex flex-wrap items-center gap-3 rounded-[12px] border border-[color:var(--color-border-subtle)] px-4 py-3"
    >
      <UIcon
        name="i-lucide-file-text"
        class="size-5 shrink-0 text-[color:var(--color-brand-secondary)]"
      />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-[color:var(--color-text-primary)]">
          {{ document.filename }}
        </p>
        <p :class="CONTENT_META_CLASS">
          {{ formatFileSize(document.sizeBytes) }}
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          :size="controlSize === 'compact' ? 'sm' : 'md'"
          variant="ghost"
          color="primary"
          type="button"
          :disabled="blocked"
          @click="trigger"
        >
          Remplacer
        </UButton>
        <UButton
          :size="controlSize === 'compact' ? 'sm' : 'md'"
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

    <div v-else>
      <UButton
        :size="controlSize === 'compact' ? 'sm' : 'md'"
        variant="soft"
        color="primary"
        type="button"
        leading-icon="i-lucide-paperclip"
        :disabled="blocked"
        :loading="uploading"
        @click="trigger"
      >
        Joindre un document (PDF)
      </UButton>
    </div>

    <input
      ref="inputRef"
      type="file"
      accept="application/pdf"
      class="hidden"
      @change="onFileSelected"
    >

    <p :class="CONTENT_META_CLASS">
      Support pédagogique destiné à vos clientes. N'y placez pas de données de santé ni d'informations nominatives.
    </p>

    <p
      v-if="error"
      role="alert"
      class="text-xs font-medium text-[color:var(--color-error-700)]"
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
import { formatFileSize } from '../../features/contents/domain/file-size'
import { CONTENT_META_CLASS } from '../../features/contents/domain/content-field-ui'

const props = defineProps<{
  modelValue: { assetId: string, filename: string, sizeBytes: number } | null
  disabled?: boolean
  /** AC5: 48 px praticienne/cliente, 40 px admin. */
  controlSize?: 'md' | 'compact'
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
