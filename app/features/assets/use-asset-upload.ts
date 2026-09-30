import { apiFetch } from '~/services/api/apiFetch'

import type {
  UploadAssetResult,
  UploadAssetType
} from './api/asset.contract'

/**
 * Shared asset upload network helper — extracted from account.vue +
 * coach-page.vue (Story 0-27, Convention A25 DRY).
 *
 * Pure validators / formatters live in `./asset-validators.ts` so they can
 * be unit-tested without dragging `apiFetch` (Nuxt globals) into the test
 * compilation graph. The asset contract lives in `./api/asset.contract.ts`.
 */

export type { UploadAssetType, UploadAssetResult } from './api/asset.contract'
export {
  formatUploadError,
  validateFileUpload,
  validateBrandLogoFile,
  validatePageImageFile,
  validatePageImageDimensions,
  BRAND_LOGO_MAX_BYTES,
  BRAND_LOGO_ALLOWED_MIME_TYPES
} from './asset-validators'
export {
  PAGE_IMAGE_MAX_BYTES,
  PAGE_IMAGE_ALLOWED_MIME_TYPES,
  PAGE_IMAGE_MAX_DIMENSION,
  PAGE_IMAGE_MAX_PIXELS,
  PAGE_IMAGE_OPTIMIZED_WIDTH
} from './api/asset.contract'

/**
 * POST a file to the provider assets endpoint. Uses apiFetch for auth retry +
 * normalized error envelope.
 */
export async function uploadAsset(
  type: UploadAssetType,
  file: File
): Promise<UploadAssetResult> {
  const formData = new FormData()
  formData.append('type', type)
  formData.append('file', file)
  return apiFetch<UploadAssetResult>('/provider/assets/upload', {
    method: 'POST',
    body: formData
  })
}

export interface ImageDimensions {
  width: number
  height: number
}

/**
 * Reads the natural dimensions of an image file before upload. Always closes
 * the decoded bitmap to avoid leaking GPU memory on repeated uploads
 * (review 1, BH15).
 */
export async function readImageDimensions(file: File): Promise<ImageDimensions> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      try {
        return { width: bitmap.width, height: bitmap.height }
      } finally {
        bitmap.close()
      }
    } catch {
      // Unsupported format/engine: fall through to the <img> fallback.
    }
  }
  return readImageDimensionsViaImg(file)
}

/** Fallback for environments where `createImageBitmap` is missing or fails. */
function readImageDimensionsViaImg(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    if (typeof URL === 'undefined' || typeof Image === 'undefined') {
      reject(new Error('Image dimension reading is not supported'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to read image dimensions'))
    }
    image.src = objectUrl
  })
}
