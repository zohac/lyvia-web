import { apiFetch } from '~/services/api/apiFetch'

import type { UploadAssetType } from './asset-validators'

/**
 * Shared asset upload network helper — extracted from account.vue +
 * coach-page.vue (Story 0-27, Convention A25 DRY).
 *
 * Pure validators / formatters live in `./asset-validators.ts` so they can
 * be unit-tested without dragging `apiFetch` (Nuxt globals) into the test
 * compilation graph.
 */

export type { UploadAssetType } from './asset-validators'
export {
  formatUploadError,
  validateFileUpload,
  validateBrandLogoFile,
  BRAND_LOGO_MAX_BYTES,
  BRAND_LOGO_ALLOWED_MIME_TYPES
} from './asset-validators'

export type UploadAssetResult = {
  url: string
  thumbnailUrl?: string
}

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
