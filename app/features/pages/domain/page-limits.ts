/**
 * V2.2a — Page limit rules (mirror of the API `page-limits.ts`).
 *
 * The API enforces `MAX_PROVIDER_PAGES` authoritatively (422
 * `PAGE_LIMIT_REACHED`). The UI duplicates the constant so it can disable the
 * create CTA and explain the limit BEFORE a forbidden request goes out.
 */

export const MAX_PROVIDER_PAGES = 10

/** Human-readable limit copy, shared by the counter, the badge and the toasts. */
export const PAGE_LIMIT_BADGE_LABEL = 'Limite de 10 pages atteinte'
export const PAGE_LIMIT_REACHED_MESSAGE = 'Vous avez atteint la limite de 10 pages.'

export function remainingPageSlots(activeCount: number): number {
  return Math.max(MAX_PROVIDER_PAGES - activeCount, 0)
}

export function isPageLimitReached(activeCount: number): boolean {
  return activeCount >= MAX_PROVIDER_PAGES
}
