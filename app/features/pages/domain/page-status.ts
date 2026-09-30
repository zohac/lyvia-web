import type { ProviderPageStatus } from '../api/pages.contract'

/**
 * V2.2a — Single source of truth for page status labels and badge styling.
 *
 * `draft` and `published` come straight from the API; `published_with_changes`
 * is DERIVED from `status === 'published' && hasUnpublishedChanges`, because the
 * API only stores `draft | published`.
 */
export type PageStatus = ProviderPageStatus | 'published_with_changes'

export type PageStatusColor = 'warning' | 'success'

export interface PageStatusMeta {
  label: string
  color: PageStatusColor
  /** Full badge class list (base + token colors). */
  badge: string
}

const BADGE_BASE = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium'

export const PAGE_STATUS_META: Record<PageStatus, PageStatusMeta> = {
  draft: {
    label: 'Brouillon',
    color: 'warning',
    badge: `${BADGE_BASE} bg-[color:var(--color-gold-200)] text-[color:var(--color-gold-700)]`
  },
  published_with_changes: {
    label: 'Modifications non publiées',
    color: 'warning',
    badge: `${BADGE_BASE} bg-[color:var(--color-sunset-100)] text-[color:var(--color-sunset-700)]`
  },
  published: {
    label: 'En ligne',
    color: 'success',
    badge: `${BADGE_BASE} bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]`
  }
}

export function resolvePageStatus(page: {
  status: ProviderPageStatus
  hasUnpublishedChanges: boolean
}): PageStatus {
  if (page.status === 'draft') return 'draft'
  return page.hasUnpublishedChanges ? 'published_with_changes' : 'published'
}
