/**
 * V2.2c — Single source of truth for the provider asset upload contract.
 *
 * Mirrors `repositories/lyvia-api/src/features/assets/application/types/
 * asset-type.ts` and the `POST /provider/assets/upload` OpenAPI enum. The
 * `UploadAssetType` union lives HERE only — validators and the page editor
 * import it so the two can never drift (review 1, BH16).
 */

export type UploadAssetType
  = | 'profile_photo'
    | 'secondary_photo'
    | 'problem_statement_photo'
    | 'og_image'
    | 'favicon'
    | 'lead_magnet'
    | 'brand_logo'
    | 'page_image'

/** Response of `POST /provider/assets/upload`. */
export type UploadAssetResult = {
  /** `uploaded_assets.id` — referenced by page image blocks. */
  assetId: string
  url: string
  thumbnailUrl?: string | null
  heroUrl?: string | null
  appleTouchUrl?: string | null
  /** Bounded WebP variant (page_image). Render prefers `optimizedUrl ?? url`. */
  optimizedUrl?: string | null
}

// ── page_image limits (mirror ASSET_LIMITS.page_image) ──────────────────────
export const PAGE_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const PAGE_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
] as const
export const PAGE_IMAGE_MAX_DIMENSION = 4000
export const PAGE_IMAGE_MAX_PIXELS = 10_000_000
export const PAGE_IMAGE_OPTIMIZED_WIDTH = 1600
