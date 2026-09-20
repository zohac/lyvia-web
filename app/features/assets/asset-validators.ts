/**
 * Pure asset upload validators + error formatters — split from
 * `use-asset-upload.ts` so they can be unit-tested without dragging the
 * Nuxt `apiFetch` runtime into the test compilation graph.
 *
 * Story 0-27 — Convention 5 (pure helpers testable for SEO logic) extended
 * to the asset upload feature for the same reason.
 *
 * V2.2c — The `UploadAssetType` union and page_image limits are imported from
 * the single asset contract (`./api/asset.contract`) so there is no second
 * union to drift (review 1, BH16).
 */

import {
  PAGE_IMAGE_ALLOWED_MIME_TYPES,
  PAGE_IMAGE_MAX_BYTES,
  PAGE_IMAGE_MAX_DIMENSION,
  PAGE_IMAGE_MAX_PIXELS,
  type UploadAssetType
} from './api/asset.contract'

export type { UploadAssetType } from './api/asset.contract'

/**
 * Map upload errors to French user-facing messages.
 * Specialized for `brand_logo` / `page_image` to surface asset-specific copy.
 */
export function formatUploadError(e: unknown, assetType?: UploadAssetType): string {
  const msg = e instanceof Error ? e.message : ''

  if (assetType === 'page_image') {
    if (msg.includes('INVALID_MIME')) {
      return 'Format d\'image non reconnu. Utilisez un fichier JPEG, PNG ou WebP valide.'
    }
    if (msg.includes('DIMENSIONS_EXCEEDED')) {
      return 'L\'image ne doit pas dépasser 4 000 px de côté.'
    }
    if (msg.includes('PIXELS_EXCEEDED')) {
      return 'L\'image est trop grande (maximum 10 mégapixels).'
    }
    if (msg.includes('TOO_LARGE')) {
      return 'L\'image doit faire moins de 5 Mo.'
    }
    return 'Erreur lors de l\'upload de l\'image.'
  }

  if (msg.includes('INVALID_MIME')) {
    return assetType === 'brand_logo'
      ? 'Format de logo non reconnu. Utilisez un fichier JPEG, PNG ou WebP valide.'
      : 'Format d\'image non reconnu. Utilisez un fichier JPEG, PNG ou WebP valide.'
  }
  if (msg.includes('TOO_LARGE')) {
    return assetType === 'brand_logo'
      ? 'Le logo doit faire moins de 1 Mo.'
      : 'Le fichier est trop volumineux.'
  }
  return assetType === 'brand_logo'
    ? 'Erreur lors de l\'upload du logo.'
    : 'Erreur lors de l\'upload de la photo.'
}

/**
 * Pure client-side pre-upload validation. Returns null when the file passes,
 * a French error message otherwise.
 */
export function validateFileUpload(
  file: File,
  maxBytes: number,
  allowedTypes: string[]
): string | null {
  if (file.size > maxBytes) {
    return `La taille maximale est de ${Math.round(maxBytes / 1024 / 1024)} Mo.`
  }
  if (!allowedTypes.includes(file.type)) {
    return `Formats acceptés : ${allowedTypes
      .map(t => t.split('/')[1]?.toUpperCase())
      .join(', ')}.`
  }
  return null
}

/** Story 0-27 — brand logo upload constraints. */
export const BRAND_LOGO_MAX_BYTES = 1 * 1024 * 1024
export const BRAND_LOGO_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp'
] as const

/**
 * Brand logo specific validator — returns null on success, French error
 * message otherwise. AC-5 verbatim copy.
 */
export function validateBrandLogoFile(file: File): string | null {
  if (file.size > BRAND_LOGO_MAX_BYTES) {
    return 'Le logo doit faire moins de 1 Mo.'
  }
  if (
    !(BRAND_LOGO_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)
  ) {
    return 'Format accepté : PNG, JPEG ou WebP.'
  }
  return null
}

// ── V2.2c — page_image client validation ───────────────────────────────────

/**
 * Synchronous size + MIME pre-check for a page image (AC: refus avant
 * insertion). Dimension checks require decoding the file and are handled by
 * `validatePageImageDimensions` after `readImageDimensions`.
 */
export function validatePageImageFile(file: File): string | null {
  if (file.size > PAGE_IMAGE_MAX_BYTES) {
    return 'L\'image doit faire moins de 5 Mo.'
  }
  if (
    !(PAGE_IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)
  ) {
    return 'Formats acceptés : JPEG, PNG, WEBP.'
  }
  return null
}

/** Pure dimension guard mirroring the server (4000 px/side, 10 MP). */
export function validatePageImageDimensions(
  width: number,
  height: number
): string | null {
  if (width > PAGE_IMAGE_MAX_DIMENSION || height > PAGE_IMAGE_MAX_DIMENSION) {
    return 'L\'image ne doit pas dépasser 4 000 px de côté.'
  }
  if (width * height > PAGE_IMAGE_MAX_PIXELS) {
    return 'L\'image est trop grande (maximum 10 mégapixels).'
  }
  return null
}
