/**
 * Provider pages contracts (V2.2a — list & draft creation, extended in V2.2b).
 *
 * Source of truth: repositories/lyvia-api/openapi.yaml +
 * `src/features/pages/presentation/dto/**` +
 * `src/features/pages/domain/content-blocks.ts`.
 *
 * The backend `ProviderPagesController` is the authority: `GET /provider/pages`
 * returns `ProviderPageListItemDto[]`, `POST /provider/pages` returns a
 * `ProviderPageResponseDto` and `PUT /provider/pages/:id` returns an updated
 * `ProviderPageResponseDto`. The block typings below mirror the server
 * `content-blocks.ts` so the editor never introduces a second representation.
 */

export type ProviderPageStatus = 'draft' | 'published'

export interface TextBlockLink {
  href: string
  label?: string
  target?: string
}

export interface TextBlockData {
  html: string
  links?: TextBlockLink[]
}

export interface TextContentBlock {
  type: 'text'
  data: TextBlockData
}

export interface ImageBlockData {
  assetId: string
  url?: string | null
  alt?: string
  caption?: string
  width?: number | null
  height?: number | null
}

export interface ImageContentBlock {
  type: 'image'
  data: ImageBlockData
}

/** Union mirroring the server `ContentBlock` (V2.2b only edits `text`). */
export type ContentBlock = TextContentBlock | ImageContentBlock

/**
 * Published snapshot embedded in a page response.
 * Not consumed by V2.2a — typed to keep the mirror honest.
 */
export type ProviderPagePublishedSnapshot = {
  title: string
  contentBlocks: ContentBlock[]
  includeInMenu: boolean
  menuLabel: string | null
  sortOrder: number
  publishedAt: string
  version: number
  seoTitle?: string | null
  seoDescription?: string | null
}

/**
 * Item returned by `GET /provider/pages` (list screen).
 */
export type ProviderPageListItem = {
  id: string
  title: string
  slug: string
  status: ProviderPageStatus
  hasUnpublishedChanges: boolean
  includeInMenu: boolean
  menuLabel: string | null
  sortOrder: number
  version: number
  firstPublishedAt: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Body for `POST /provider/pages`.
 * `slug` is optional: the API derives it from the title when omitted.
 */
export type CreateProviderPageRequest = {
  title: string
  slug?: string
  contentBlocks?: ContentBlock[]
  includeInMenu?: boolean
  menuLabel?: string
  sortOrder?: number
}

/**
 * Body for `PUT /provider/pages/:id`.
 *
 * `title`, `slug`, menu and SEO fields are preserved from the loaded page and
 * sent unchanged (V2.2b only edits content blocks). `expectedVersion` drives the
 * API optimistic locking — a stale value yields `409
 * PAGE_CONCURRENT_MODIFICATION`. The name mirrors the server
 * `UpdateProviderPageDto`.
 */
export type UpdateProviderPageRequest = {
  title: string
  slug?: string
  contentBlocks: ContentBlock[]
  includeInMenu?: boolean
  menuLabel?: string | null
  sortOrder?: number
  seoTitle?: string | null
  seoDescription?: string | null
  expectedVersion: number
}

/**
 * Full page returned by `POST /provider/pages`, `GET /provider/pages/:id` and
 * `PUT /provider/pages/:id`.
 */
export type ProviderPageResponse = {
  id: string
  slug: string
  title: string
  contentBlocks: ContentBlock[]
  publishedSnapshot: ProviderPagePublishedSnapshot | null
  includeInMenu: boolean
  menuLabel: string | null
  sortOrder: number
  status: ProviderPageStatus
  firstPublishedAt: string | null
  publishedAt: string | null
  seoTitle: string | null
  seoDescription: string | null
  hasUnpublishedChanges: boolean
  version: number
  createdAt: string
  updatedAt: string
}
