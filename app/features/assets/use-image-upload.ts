import { computed, onBeforeUnmount, ref } from 'vue'

import type { UploadAssetType } from './api/asset.contract'
import { formatUploadError, uploadAsset, validateFileUpload } from './use-asset-upload'

/**
 * CPD.2 — mécanique d'upload d'image partagée par les cartes d'édition.
 *
 * Le triptyque `trigger` / `onFileSelected` / `upload` était recopié à
 * l'identique dans `coach-page.vue` puis dans les deux cartes extraites. Il vit
 * désormais ici pour que `cpd-3`…`cpd-7` n'en ajoutent pas huit copies.
 *
 * L'aperçu d'un fichier choisi est un object URL local (blob:) : il est révoqué
 * dès qu'il est remplacé ou que la carte est démontée. Un URL serveur (`https:`)
 * n'est jamais révoqué.
 */
export interface UseImageUploadOptions {
  assetType: UploadAssetType
  maxBytes: number
  allowedMimeTypes?: string[]
}

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function isBlobUrl(url: string | null): boolean {
  return typeof url === 'string' && url.startsWith('blob:')
}

export function useImageUpload(options: UseImageUploadOptions) {
  const file = ref<File | null>(null)
  const preview = ref<string | null>(null)
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const inputRef = ref<HTMLInputElement | null>(null)

  function revokePreview(): void {
    if (isBlobUrl(preview.value)) URL.revokeObjectURL(preview.value as string)
  }

  function setPreview(url: string | null): void {
    revokePreview()
    preview.value = url
  }

  function clearPreview(): void {
    setPreview(null)
  }

  function trigger(): void {
    inputRef.value?.click()
  }

  function onFileSelected(event: Event): string | null {
    error.value = null
    const target = event.target as HTMLInputElement
    const picked = target.files?.[0]
    if (!picked) return null

    const message = validateFileUpload(
      picked,
      options.maxBytes,
      options.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES
    )
    if (message) {
      error.value = message
      return null
    }

    file.value = picked
    const objectUrl = URL.createObjectURL(picked)
    setPreview(objectUrl)
    return objectUrl
  }

  async function upload(): Promise<string | null> {
    if (!file.value) return null

    uploading.value = true
    error.value = null
    try {
      const result = await uploadAsset(options.assetType, file.value)
      setPreview(result.url)
      file.value = null
      return result.url
    } catch (e: unknown) {
      error.value = formatUploadError(e)
      return null
    } finally {
      uploading.value = false
    }
  }

  onBeforeUnmount(revokePreview)

  return {
    file,
    preview,
    uploading,
    error,
    inputRef,
    hasSelection: computed(() => file.value !== null),
    trigger,
    onFileSelected,
    upload,
    setPreview,
    clearPreview
  }
}
