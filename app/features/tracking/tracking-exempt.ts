/**
 * Routes where the third-party tracking SDKs must NOT be mounted.
 *
 * Why a rule and not a flag: the tracking orchestrator mounts Google Ads and
 * Microsoft Clarity on every page (`app:mounted` and `page:finish`). Both send
 * the page's URL to a third party — gtag's `config` carries `page_location`,
 * Clarity records `document.location.href` — and a URL can carry a bearer
 * token.
 *
 * `/preferences` is exactly that page: the token travels in the query string
 * (the no-JS fallback posts the form, so the server must be able to render it
 * back into a hidden field). The API says the same thing about it
 * (`update-consent-by-token.dto.ts`): « the token travels in the BODY, never in
 * the API URL: a URL ends up in access logs, proxy logs and Referer headers ».
 *
 * The rule lives here, in a pure module, because the orchestrator itself
 * cannot be executed by the test runner (it needs a Nuxt runtime). A pure
 * `isTrackingExemptPath` can be run by the tests, and the wiring — the
 * orchestrator consulting it BEFORE mounting anything — is asserted by
 * reading the source, like the other wiring tests of the repo.
 */

/**
 * The exempt paths, matched on `route.path` (never on the query string: the
 * path is what identifies the page).
 */
export const TRACKING_EXEMPT_PATHS: readonly string[] = ['/preferences']

/**
 * Whether a route must be left free of any tracking SDK.
 *
 * The comparison is exact on the normalized path: a trailing slash is
 * tolerated, but a prefix match is NOT — `/preferences-autre` is a different
 * page and must keep its analytics.
 */
export function isTrackingExemptPath(path: string | null | undefined): boolean {
  if (typeof path !== 'string' || path.length === 0) return false

  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path

  return TRACKING_EXEMPT_PATHS.some(exempt => exempt === normalized)
}
