/**
 * Provider contents contracts (Story 5.5).
 *
 * Source of truth: repositories/lyvia-api/openapi.yaml + backend DTOs
 * (`src/features/content/presentation/dto/**`).
 *
 * Backend `ProviderContentsController` (mounted at `/provider/content`) is the
 * authority. This file mirrors the server DTOs so the UI never invents a
 * second representation.
 */

export type ContentType = 'article' | 'recette' | 'actualite'

export type ContentVisibility = 'public' | 'private'

export type ContentStatusFilter = 'published' | 'draft' | 'all'

export type ContentItem = {
  id: string
  providerId: string
  title: string
  type: ContentType
  slug: string
  body: string | null
  coverImageUrl: string | null
  visibility: ContentVisibility
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ListContentsParams = {
  type?: ContentType
  status?: ContentStatusFilter
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
  visibility?: ContentVisibility
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
  visibility?: ContentVisibility
}

export type UpdateContentResponse = {
  contentId: string
  changedFields: string[]
}

export type ContentIdResponse = {
  contentId: string
}
