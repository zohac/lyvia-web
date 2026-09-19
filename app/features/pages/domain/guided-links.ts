/**
 * V2.2b — Pure guided-link catalogue + validation.
 *
 * The modal never lets the coach type an internal URL by hand: destinations are
 * resolved from the real public site (`useCoachLink().site` /
 * `.booking` + published pages) so a guided link can never be a dead 404.
 *
 * Locked decisions (spec V2.2b):
 * - A bare anchor (`#tarifs`) is rejected by the server → always prefix with the
 *   coach site, producing `https://domain/#tarifs` or `/coach/{slug}/#tarifs`.
 * - Discovery is the booking route (no `#decouverte` anchor exists).
 * - Programmes has no dedicated public route → a single entry pointing at
 *   `/#tarifs`.
 */
import { isSafeLinkHref } from './paste-sanitizer'

export const GUIDED_PRICING_ANCHOR = '/#tarifs'

export const EXTERNAL_LINK_REQUIRED_MESSAGE = 'L\'adresse du lien est obligatoire.'
export const EXTERNAL_LINK_INVALID_MESSAGE = 'Utilisez une adresse https:// ou mailto:.'

export interface GuidedPageOption {
  slug: string
  title: string
}

/** Minimal shape of a provider page needed to build a guided destination. */
export interface GuidedPageSource {
  id: string
  slug: string
  title: string
  status: 'draft' | 'published'
}

/**
 * Selects the pages that may be linked: published only, and never the page
 * currently being edited (self-links are pointless and confusing).
 */
export function selectGuidedPages(
  pages: readonly GuidedPageSource[],
  currentPageId: string
): GuidedPageOption[] {
  return pages
    .filter(page => page.status === 'published' && page.id !== currentPageId)
    .map(page => ({ slug: page.slug, title: page.title }))
}

export interface GuidedDestinationsInput {
  /** Public site base, e.g. `https://sophiejouan.fr` or `/coach/sophie`. */
  site: string
  /** Discovery booking route returned by `useCoachLink().booking`. */
  booking: string
  /** Published provider pages (already filtered by the caller). */
  pages: readonly GuidedPageOption[]
}

export interface GuidedDestination {
  id: string
  label: string
  description: string
  href: string
}

/** Payload emitted by `GuidedLinkModal` when the coach confirms an insertion. */
export interface GuidedLinkInsert {
  href: string
  label: string
  target?: '_blank'
  rel?: 'noopener noreferrer'
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

/**
 * Joins the coach site with a root-relative path. The result always starts with
 * `https://…` or `/…`, so the server-side allowlist accepts it.
 */
export function buildSiteHref(site: string, path: string): string {
  const base = stripTrailingSlash(site.trim())
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

export function buildPageHref(site: string, pageSlug: string): string {
  return buildSiteHref(site, `/${pageSlug}`)
}

/**
 * Builds the ordered catalogue of safe destinations: discovery, pricing,
 * programmes (single `/#tarifs` entry) and every published page.
 */
export function buildGuidedDestinations(
  input: GuidedDestinationsInput
): GuidedDestination[] {
  const destinations: GuidedDestination[] = [
    {
      id: 'discovery',
      label: 'Séance Découverte',
      description: 'Réserver une séance découverte',
      href: input.booking
    },
    {
      id: 'pricing',
      label: 'Formules & Tarifs',
      description: 'Voir les formules et les tarifs',
      href: buildSiteHref(input.site, GUIDED_PRICING_ANCHOR)
    },
    {
      id: 'programs',
      label: 'Mes programmes',
      description: 'Voir la présentation des programmes',
      href: buildSiteHref(input.site, GUIDED_PRICING_ANCHOR)
    }
  ]

  for (const page of input.pages) {
    destinations.push({
      id: `page:${page.slug}`,
      label: page.title,
      description: 'Page de votre site',
      href: buildPageHref(input.site, page.slug)
    })
  }

  return destinations
}

export interface ExternalLinkInput {
  url: string
  newTab: boolean
}

export type ExternalLinkValidation
  = | { ok: true, href: string, target?: '_blank', rel?: 'noopener noreferrer' }
    | { ok: false, message: string }

/**
 * Validates a free external URL. Only `https:` and `mailto:` pass (reusing the
 * server-parity `isSafeLinkHref`); `http:` and `javascript:` are refused with an
 * explicit field message. Internal relative paths are excluded here — those go
 * through the guided destinations. `target="_blank"` always carries
 * `rel="noopener noreferrer"` and is never applied to `mailto:` (a mail client
 * is not a browser tab).
 */
export function validateExternalLink(input: ExternalLinkInput): ExternalLinkValidation {
  const url = input.url.trim()
  if (url.length === 0) {
    return { ok: false, message: EXTERNAL_LINK_REQUIRED_MESSAGE }
  }

  const isMailto = /^mailto:/i.test(url)
  if (url.startsWith('/') || !isSafeLinkHref(url)) {
    return { ok: false, message: EXTERNAL_LINK_INVALID_MESSAGE }
  }

  if (input.newTab && !isMailto) {
    return { ok: true, href: url, target: '_blank', rel: 'noopener noreferrer' }
  }
  return { ok: true, href: url }
}
