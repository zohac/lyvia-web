/**
 * Pure asset upload validators + error formatters — split from
 * `use-asset-upload.ts` so they can be unit-tested without dragging the
 * Nuxt `apiFetch` runtime into the test compilation graph.
 *
 * Story 0-27 — Convention 5 (pure helpers testable for SEO logic) extended
 * to the asset upload feature for the same reason.
 */

export type UploadAssetType
  = | 'profile_photo'
    | 'secondary_photo'
    | 'og_image'
    | 'favicon'
    | 'lead_magnet'
    | 'brand_logo'

/**
 * Map upload errors to French user-facing messages.
 * Specialized for `brand_logo` to surface logo-specific copy when known.
 */
export function formatUploadError(e: unknown, assetType?: UploadAssetType): string {
  const msg = e instanceof Error ? e.message : ''
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
