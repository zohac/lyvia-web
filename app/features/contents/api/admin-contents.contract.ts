/**
 * Admin (platform) contents contracts — Story diffusion-10.
 *
 * Source of truth: repositories/lyvia-api/openapi.yaml + the backend
 * `AdminContentsController` (mounted at `/admin/content`). This file mirrors
 * the server DTOs and `toResponse()` so the admin UI never invents a second
 * representation. A platform article is always `type='article'`; it has no
 * audience, no document and no provider owner — approbations are owned by the
 * backend and only read here as `approvalCount`.
 */

/** Covers of platform articles are uploaded by an ADMIN, never a provider. */
export const ADMIN_CONTENT_UPLOAD_ENDPOINT = '/admin/assets/upload'

/** The only type accepted by `CreatePlatformContentDto`/`UpdatePlatformContentDto`. */
export type AdminContentType = 'article'

export type AdminContentStatusFilter = 'published' | 'draft' | 'all'

export type AdminContentItem = {
  id: string
  title: string
  type: AdminContentType
  slug: string
  body: string | null
  coverImageUrl: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  /** Aggregated by the API (`PlatformContentItem.approvalCount`) — never recomputed here. */
  approvalCount: number
}

export type ListAdminContentsParams = {
  status?: AdminContentStatusFilter
  limit?: number
  cursor?: string
}

export type ListAdminContentsResponse = {
  items: AdminContentItem[]
  nextCursor: string | null
}

export type CreateAdminContentRequest = {
  title: string
  type: AdminContentType
  slug?: string
  body?: string
  coverImageUrl?: string
}

export type CreateAdminContentResponse = {
  contentId: string
  slug: string
}

export type UpdateAdminContentRequest = {
  title?: string
  type?: AdminContentType
  slug?: string
  body?: string | null
  coverImageUrl?: string | null
}

export type UpdateAdminContentResponse = {
  contentId: string
  changedFields: string[]
}

export type AdminContentIdResponse = {
  contentId: string
}

export type PublishAdminContentResponse = {
  contentId: string
  alreadyPublished: boolean
}

export type UnpublishAdminContentResponse = {
  contentId: string
  alreadyDraft: boolean
}
