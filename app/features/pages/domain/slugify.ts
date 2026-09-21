import { SLUG_REGEX } from '../../../utils/validation-regex'

/**
 * V2.2a — Pure slug helpers for provider pages.
 *
 * `slugify` mirrors `PageSlug.normalize` from the API
 * (`lyvia-api/src/features/pages/domain/page-slug.ts`) so a slug suggested in
 * the UI is accepted server-side without a round-trip. `RESERVED_PAGE_SLUGS`
 * mirrors the API reserved set for client-side collision feedback.
 */

export const MAX_SLUG_LENGTH = 200

/**
 * Kebab-case normalizer — accents stripped, non-alphanumerics collapsed to a
 * single dash, leading/trailing dashes removed, truncated to 200 characters.
 *
 * @example slugify('Mon approche de la périménopause') // 'mon-approche-de-la-perimenopause'
 */
export function slugify(title: string): string {
  const normalized = title
    .trim()
    .toLowerCase()
    // NFD does not decompose œ/æ ligatures — transliterate them explicitly.
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (normalized.length <= MAX_SLUG_LENGTH) return normalized

  return normalized.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, '')
}

/**
 * A slug is valid when it matches the kebab-case pattern and stays within the
 * API length limit. An empty slug is invalid (callers should fall back to
 * `slugify(title)` first).
 */
export function isValidPageSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false
  const trimmed = slug.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_SLUG_LENGTH) return false
  return SLUG_REGEX.test(trimmed)
}

/**
 * Mirror of `RESERVED_PAGE_SLUGS` (API). Keep in sync manually — the two Git
 * repositories have no shared build.
 */
export const RESERVED_PAGE_SLUGS: ReadonlySet<string> = new Set([
  'admin',
  'api',
  'auth',
  'docs',
  'login',
  'onboarding',
  'providers',
  'public',
  'swagger',
  'legal',
  'articles',
  'coach',
  'tarifs',
  'programmes',
  'decouverte',
  'rendez-vous',
  'mon-compte',
  'dashboard',
  'settings',
  'favicon',
  'favicon-ico',
  'robots',
  'robots-txt',
  'sitemap',
  'sitemap-xml',
  'health',
  'profile',
  'contact'
])

export function isReservedPageSlug(slug: string): boolean {
  return RESERVED_PAGE_SLUGS.has(slug.trim().toLowerCase())
}
