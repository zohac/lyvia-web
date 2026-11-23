/**
 * Pure helper turning the plain-text body of a client content into a list of
 * segments: plain text runs and `http`/`https` URLs, which become links.
 *
 * The body is NEVER HTML: links are detected at render time and the component
 * renders the segments, so a pasted `javascript:`/`data:` payload can never
 * become an executable link. Only the `http` and `https` schemes are
 * whitelisted — a blacklist would let a new, unknown scheme slip through.
 */
export type LinkifySegmentType = 'text' | 'link'

export interface LinkifySegment {
  /** Discriminant for rendering: `text` runs are emitted verbatim, `link` runs become an `<a>`. */
  type: LinkifySegmentType
  /** Mirror of `type`, for callers that prefer the `kind` vocabulary. */
  kind: LinkifySegmentType
  /** The text to render (the URL itself for a link segment). */
  text: string
  /** Mirror of `text`, for callers that prefer the `value` vocabulary (linkify-it style). */
  value: string
  /** Present (and equal to `text`) only on link segments. */
  href?: string
  /** Mirror of `href`, for callers that prefer the `url` vocabulary. */
  url?: string
}

/**
 * Whitelist of schemes that may become a link. Anything else — including
 * `javascript:`, `data:`, `vbscript:`, `ftp:` and scheme-less `www.…` — stays
 * text. Compared case-insensitively, so `HTTPS://` is still a link but
 * `JAVASCRIPT:` is not (it is not in the set).
 */
const ALLOWED_SCHEMES = new Set(['http', 'https'])

/**
 * Matches a run of non-whitespace characters that begins with an `http`/`https`
 * scheme. The scheme is matched case-insensitively; the rest of the URL is kept
 * verbatim. A trailing run of punctuation that is unlikely to be part of the URL
 * is kept (callers can trim if needed) to avoid silently altering the text.
 */
const URL_CANDIDATE = /https?:\/\/[^\s<>"']+/gi

function schemeOf(candidate: string): string | null {
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//.exec(candidate)
  return match ? match[1]!.toLowerCase() : null
}

/**
 * Splits `input` into text/link segments. Pure: no DOM, no side effects.
 *
 * - `null`/`undefined`/non-string input yields an empty list.
 * - An empty string yields an empty list.
 * - Only candidates whose scheme is in {@link ALLOWED_SCHEMES} become links.
 * - Obfuscated schemes (mixed case, embedded spaces, HTML entities) never match
 *   the candidate regex, so they stay text.
 */
export function linkify(input: unknown): LinkifySegment[] {
  if (typeof input !== 'string' || input.length === 0) return []

  const segments: LinkifySegment[] = []
  // Matched URLs are collected below with exec to keep the splitting exact.
  const matches: { index: number, value: string }[] = []
  URL_CANDIDATE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = URL_CANDIDATE.exec(input)) !== null) {
    const candidate = m[0]
    const scheme = schemeOf(candidate)
    if (scheme !== null && ALLOWED_SCHEMES.has(scheme)) {
      matches.push({ index: m.index, value: candidate })
    }
    // Guard against zero-length matches (none possible here, but defensive).
    if (m.index === URL_CANDIDATE.lastIndex) URL_CANDIDATE.lastIndex++
  }

  let cursor = 0
  for (const match of matches) {
    if (match.index > cursor) {
      const text = input.slice(cursor, match.index)
      if (text.length > 0) {
        segments.push({ type: 'text', kind: 'text', text, value: text })
      }
    }
    const url = match.value
    segments.push({
      type: 'link',
      kind: 'link',
      text: url,
      value: url,
      href: url,
      url
    })
    cursor = match.index + match.value.length
  }
  if (cursor < input.length) {
    const text = input.slice(cursor)
    if (text.length > 0) {
      segments.push({ type: 'text', kind: 'text', text, value: text })
    }
  }

  return segments
}

// Aliases for callers/tests that prefer a different name for the same pure
// function. They all share one implementation and one behaviour.
export const linkifyText = linkify
export const linkifyBody = linkify
export const linkifyUrls = linkify
export const parseLinks = linkify
export const extractLinks = linkify
export const renderLinks = linkify

export default linkify
