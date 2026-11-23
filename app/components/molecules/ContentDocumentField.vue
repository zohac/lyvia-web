<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-3">
      <UButton
        size="sm"
        variant="soft"
        color="primary"
        type="button"
        :disabled="disabled || uploading"
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
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref<string | null>(null)

const document = computed(() => props.modelValue)

function trigger() {
  inputRef.value?.click()
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

// Map server error codes to French messages per interfaces.md
function mapDocumentError(err: unknown): string {
  const msg = err instanceof Error ? err.message : ''
  if (msg.includes('CONTENT_DOCUMENT_QUOTA_EXCEEDED')) {
    return 'Votre espace de documents est plein (500 Mo). Supprimez un document pour en ajouter un nouveau.'
  }
  if (msg.includes('TOO_LARGE')) {
    return 'Le document dépasse 10 Mo.'
  }
  if (msg.includes('INVALID_MIME')) {
    return 'Seuls les PDF sont acceptés.'
  }
  return formatUploadError(err)
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return

  error.value = null
  const message = validateFileUpload(
    file,
    CONTENT_DOCUMENT_MAX_BYTES,
    [...CONTENT_DOCUMENT_ALLOWED_MIME_TYPES]
  )
  if (message) {
    // Local size/format messages per interfaces.md
    if (file.size > CONTENT_DOCUMENT_MAX_BYTES) {
      error.value = 'Le document dépasse 10 Mo.'
    } else {
      error.value = 'Seuls les PDF sont acceptés.'
    }
    return
  }

  uploading.value = true
  try {
    const result = await uploadAsset('content_document', file)
    emit('update:modelValue', {
      assetId: result.assetId,
      filename: result.filename ?? file.name,
      sizeBytes: result.sizeBytes ?? file.size
    })
  } catch (e: unknown) {
    const apiErr = e as { apiError?: { code?: string } }
    const code = apiErr?.apiError?.code
    if (code === 'CONTENT_DOCUMENT_QUOTA_EXCEEDED') {
      error.value = 'Votre espace de documents est plein (500 Mo). Supprimez un document pour en ajouter un nouveau.'
    } else {
      error.value = mapDocumentError(e as Error)
    }
  } finally {
    uploading.value = false
  }
}

function remove() {
  emit('update:modelValue', null)
}
</script>
