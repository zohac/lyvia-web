/**
 * Provider contents contracts (Story 5.5).
 *
 * Source of truth: repositories/lyvia-api/openapi.yaml + backend DTOs
 * (`src/features/contents/presentation/dto/**`).
 *
 * Backend `ProviderContentsController` (mounted at `/provider/content`) is the
 * authority. This file mirrors the server DTOs so the UI never invents a
 * second representation.
 */

export type ContentType = 'article' | 'recette' | 'actualite'

export type ContentAudience = 'all' | 'selected'

export type ContentStatusFilter = 'published' | 'draft' | 'all'

export type ContentItem = {
  id: string
  providerId: string
  title: string
  type: ContentType
  slug: string
  body: string | null
  coverImageUrl: string | null
  audience: ContentAudience | null
  document: { filename: string, sizeBytes: number } | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ListContentsParams = {
  type?: ContentType
  status?: ContentStatusFilter
  audience?: ContentAudience
  q?: string
  limit?: number
  cursor?: string
}

export type ListContentsResponse = {
  items: ContentItem[]
  nextCursor: string | null
}

export type CreateContentRequest = {
  title: string
  type: ContentType
  slug?: string
  body?: string | null
  coverImageUrl?: string | null
  audience?: ContentAudience
  documentAssetId?: string | null
}

export type CreateContentResponse = {
  contentId: string
  slug: string
}

export type UpdateContentRequest = {
  title?: string
  type?: ContentType
  slug?: string
  body?: string | null
  coverImageUrl?: string | null
  audience?: ContentAudience
  documentAssetId?: string | null
}

export type UpdateContentResponse = {
  contentId: string
  changedFields: string[]
}

export type ContentIdResponse = {
  contentId: string
}

// ============================================================================
// Content shares (Story 5.6) — verified against openapi.yaml
// ============================================================================

export type ContentShareItem = {
  clientProfileId: string
  firstname: string
  lastname: string
  sharedAt: string
}

export type ListContentSharesResponse = {
  items: ContentShareItem[]
}

/**
 * Body of `POST /provider/content/:id/share`. `clientProfileIds` is capped at
 * 200 by the DTO. `{ all: true }` is **gone** from `ShareContentDto` (diffusion-2
 * AC4): addressing everybody is an *audience* (`PATCH … { audience: 'all' }`),
 * not a share operation, and the API answers 400 if the field is sent.
 */
export type ShareContentRequest = {
  clientProfileIds: string[]
}

/**
 * `count` is the number of shares **created by this call**: a re-share, or a
 * share-all where everybody already had access, answers 0 — never phrase that
 * as an addition.
 */
export type ShareContentResponse = {
  count: number
}

export type UnshareContentResponse = {
  clientProfileId: string
}

// ============================================================================
// Client contents (Story 5.7)
//
// Backend `ClientContentsController` (mounted at `/content`) is the authority:
// `ClientContentListItemResponseDto`, `ClientContentDetailResponseDto` and
// `ListClientContentsResponseDto` in `openapi.yaml`. This block mirrors them,
// and `scripts/contract-check-openapi-contents.mjs` fails when the two drift.
// ============================================================================

export type ContentSource = 'keova' | 'provider'

export type ClientContentListItem = {
  id: string
  title: string
  type: ContentType
  slug: string
  coverImageUrl: string | null
  publishedAt: string | null
  providerName: string | null
  providerSlug: string | null
  source: ContentSource
  document: { filename: string, sizeBytes: number } | null
}

export type ClientContentDetail = {
  id: string
  title: string
  type: ContentType
  slug: string
  body: string | null
  coverImageUrl: string | null
  publishedAt: string | null
  providerName: string | null
  providerSlug: string | null
  source: ContentSource
  document: { filename: string, sizeBytes: number } | null
}

export type ListClientContentsParams = {
  type?: ContentType
  q?: string
  limit?: number
  cursor?: string
}

export type ListClientContentsResponse = {
  items: ClientContentListItem[]
  nextCursor: string | null
}

// ============================================================================
// Platform contents (Story diffusion-8) — verified against openapi.yaml
// Backend `ProviderPlatformContentsController` (mounted at /provider/platform-content).
// ============================================================================

export type PlatformContentItem = {
  id: string
  title: string
  type: ContentType
  slug: string
  body: string | null
  coverImageUrl: string | null
  isPublished: boolean
  publishedAt: string | null
  approved: boolean
}

export type ListPlatformContentsResponse = {
  items: PlatformContentItem[]
  nextCursor: string | null
}

export type PlatformContentApprovalResponse = {
  contentId: string
  approved: boolean
}
