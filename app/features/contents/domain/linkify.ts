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
  /** The text to render (the URL itself for a link segment). */
  text: string
  /** Present (and equal to `text`) only on link segments. */
  href?: string
}

/**
 * Whitelist of schemes that may become a link. Anything else — `javascript:`,
 * `data:`, `vbscript:`, `ftp:`, `file:` and every scheme not written here —
 * stays text. The set is the *only* decision: {@link URL_CANDIDATE} matches
 * every `scheme://` form, precisely so that this set is the code that decides.
 */
const ALLOWED_SCHEMES = new Set(['http', 'https'])

/**
 * Any `scheme://` run of URL characters, whatever the scheme. Capturing the
 * scheme (rather than only matching `https?`) is what makes
 * {@link ALLOWED_SCHEMES} load-bearing: `ftp://`, `file://` and an unknown
 * `foo://` are matched here and then rejected by name.
 *
 * `<`, `>`, `"` and `'` end a candidate: they are markup or quoting, never part
 * of a URL pasted in a text body.
 */
const URL_CANDIDATE = /([a-zA-Z][a-zA-Z0-9+.-]*):\/\/[^\s<>"']+/g

/** Closing punctuation a sentence puts after a URL, and its opening pair. */
const BRACKET_PAIRS: [close: string, open: string][] = [
  [')', '('],
  [']', '['],
  ['}', '{']
]

function countOf(value: string, char: string): number {
  let count = 0
  for (const current of value) {
    if (current === char) count += 1
  }
  return count
}

/**
 * Removes one trailing character that belongs to the sentence rather than to
 * the URL: sentence punctuation, or a closing bracket the URL does not open.
 * Returns the value unchanged when nothing qualifies.
 */
function stripOneSentenceTrailer(value: string): string {
  const last = value.charAt(value.length - 1)
  if (last === '') return value
  if ('.,;:!?'.includes(last)) return value.slice(0, -1)
  for (const [close, open] of BRACKET_PAIRS) {
    if (last === close && countOf(value, close) > countOf(value, open)) {
      return value.slice(0, -1)
    }
  }
  return value
}

/**
 * Trims the punctuation a sentence glues to a URL — `Voir https://x.fr/a.`,
 * `(https://x.fr/a)` — while keeping the characters that are part of it:
 * `https://fr.wikipedia.org/wiki/Foo_(bar)` keeps its `)`, and a query string
 * keeps its `&`, `?` and `=`.
 */
function trimSentenceTrailers(value: string): string {
  let trimmed = value
  for (;;) {
    const next = stripOneSentenceTrailer(trimmed)
    if (next === trimmed) return trimmed
    trimmed = next
  }
}

/** `true` when `value` still carries a scheme and a non-empty rest after `//`. */
function isUsableUrl(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s<>"']/.test(value)
}

/**
 * Splits `input` into text/link segments. Pure: no DOM, no side effects, no
 * module-level state — the candidate regex is rebuilt on every call so two
 * renders can never share a `lastIndex`.
 *
 * - `null`/`undefined`/non-string input yields an empty list.
 * - An empty string yields an empty list.
 * - Only candidates whose scheme is in {@link ALLOWED_SCHEMES} become links.
 * - Obfuscated schemes (mixed case, embedded spaces, HTML entities) either do
 *   not match the scheme grammar or are rejected by the whitelist, so they stay
 *   text.
 * - Trailing sentence punctuation stays text, so `https://x.fr/a.` links to
 *   `https://x.fr/a` and keeps its full stop.
 */
export function linkify(input: unknown): LinkifySegment[] {
  if (typeof input !== 'string' || input.length === 0) return []

  const segments: LinkifySegment[] = []
  const matches: { index: number, value: string }[] = []
  const candidatePattern = new RegExp(URL_CANDIDATE.source, URL_CANDIDATE.flags)

  let match: RegExpExecArray | null
  while ((match = candidatePattern.exec(input)) !== null) {
    const url = trimSentenceTrailers(match[0])
    const scheme = match[1]!.toLowerCase()
    if (ALLOWED_SCHEMES.has(scheme) && isUsableUrl(url)) {
      matches.push({ index: match.index, value: url })
    }
  }

  let cursor = 0
  for (const found of matches) {
    if (found.index > cursor) {
      const text = input.slice(cursor, found.index)
      if (text.length > 0) segments.push({ type: 'text', text })
    }
    segments.push({ type: 'link', text: found.value, href: found.value })
    cursor = found.index + found.value.length
  }
  if (cursor < input.length) {
    const text = input.slice(cursor)
    if (text.length > 0) segments.push({ type: 'text', text })
  }

  return segments
}
