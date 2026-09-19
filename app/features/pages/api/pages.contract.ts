/**
 * Provider pages contracts (V2.2a — list & draft creation).
 *
 * Source of truth: repositories/lyvia-api/openapi.yaml +
 * `src/features/pages/presentation/dto/**`.
 *
 * The backend `ProviderPagesController` is the authority: `GET /provider/pages`
 * returns `ProviderPageListItemDto[]` and `POST /provider/pages` returns a
 * `ProviderPageResponseDto`. These mirrors carry ONLY the fields V2.2a consumes;
 * the editor (V2.2b) will extend the content-block typing.
 */

export type ProviderPageStatus = 'draft' | 'published'

/**
 * Published snapshot embedded in a page response.
 * Not consumed by V2.2a — typed to keep the mirror honest.
 */
export type ProviderPagePublishedSnapshot = {
  title: string
  contentBlocks: unknown[]
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
  contentBlocks?: unknown[]
  includeInMenu?: boolean
  menuLabel?: string
  sortOrder?: number
}

/**
 * Full page returned by `POST /provider/pages` (and `GET /provider/pages/:id`).
 */
export type ProviderPageResponse = {
  id: string
  slug: string
  title: string
  contentBlocks: unknown[]
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
