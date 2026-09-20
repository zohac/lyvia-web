/**
 * V2.2b — HTML allowlist sanitizer for Text content blocks (client parity).
 *
 * Port of the server `page-content-sanitizer.ts` (lyvia-api). The API is
 * authoritative, but the editor must apply the SAME allowlist before sending so
 * a paste from Word/Google Docs never silently loses content to the server
 * filter, nor triggers a `PAGE_CONTENT_INVALID`.
 *
 * Enforced:
 * - Allowed tags: p, h2, h3, h4, strong, b, em, i, u, ul, ol, li, br, a, span,
 *   blockquote.
 * - Allowed attributes on <a>: href, target, rel, title.
 * - Allowed protocols: `https:`, `mailto:` and internal relative paths `/…`.
 *   A bare anchor (`#tarifs`) or `javascript:` is rejected.
 * - If `target="_blank"`, `rel="noopener noreferrer"` is guaranteed.
 * - Every other tag, attribute, inline style and comment is stripped.
 */
import { textToHtml } from './text-html'

export const ALLOWED_TAGS: readonly string[] = [
  'p',
  'h2',
  'h3',
  'h4',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'br',
  'a',
  'span',
  'blockquote'
]

const ALLOWED_TAG_SET = new Set(ALLOWED_TAGS)
const VOID_TAGS = new Set(['br'])

/**
 * Validates whether an href is safe:
 * - `https://…`
 * - `mailto:…`
 * - a single-slash relative path (`/…`, never `//…`)
 */
export function isSafeLinkHref(href: string): boolean {
  if (!href || typeof href !== 'string') return false
  const trimmed = href.trim()
  if (trimmed.length === 0) return false

  // Relative path starting with a single '/' (not protocol-relative '//').
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    for (let i = 0; i < trimmed.length; i++) {
      const code = trimmed.charCodeAt(i)
      if (code <= 31 || code === 32 || code === 34 || code === 60 || code === 62) {
        return false
      }
    }
    return true
  }

  if (/^https:\/\/[^\s<>"]+$/i.test(trimmed)) {
    return true
  }

  if (/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(trimmed)) {
    return true
  }

  return false
}

/**
 * Sanitizes an HTML string to only allow permitted tags and attributes.
 * Returns an empty string for falsy/non-string input.
 */
export function sanitizeHtmlContent(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return ''
  }

  // Strip HTML comments.
  let html = rawHtml.replace(/<!--[\s\S]*?-->/g, '')

  // Strip dangerous containers together with their content.
  html = html.replace(
    /<(script|style|iframe|object|embed|svg|math|noscript)[^>]*>[\s\S]*?<\/\1>/gi,
    ''
  )
  html = html.replace(/<(script|style|iframe|object|embed|svg|math|noscript)[^>]*\/>/gi, '')

  const tagRegex = /<\/?([a-zA-Z0-9]+)(\s[^>]*?)?(\/?)>/g
  const aTagStack: boolean[] = []

  const sanitized = html.replace(
    tagRegex,
    (match, rawTagName: string, rawAttrs: string | undefined) => {
      const tagName = rawTagName.toLowerCase()

      const isClosing = match.startsWith('</')

      if (!ALLOWED_TAG_SET.has(tagName)) {
        // Not allowed: strip the tag but keep its inner text.
        return ''
      }

      if (isClosing) {
        if (VOID_TAGS.has(tagName)) return ''
        if (tagName === 'a') {
          const isSafe = aTagStack.pop()
          return isSafe ? '</a>' : ''
        }
        return `</${tagName}>`
      }

      if (tagName === 'br') {
        return '<br>'
      }

      if (tagName === 'a') {
        const parsedAttrs = parseAttributes(rawAttrs || '')
        const href = parsedAttrs.href

        if (!href || !isSafeLinkHref(href)) {
          aTagStack.push(false)
          return ''
        }

        aTagStack.push(true)
        const safeAttrs: string[] = [`href="${escapeHtmlAttribute(href.trim())}"`]

        if (parsedAttrs.target === '_blank') {
          safeAttrs.push('target="_blank"')
          safeAttrs.push('rel="noopener noreferrer"')
        } else if (parsedAttrs.rel) {
          const rel = parsedAttrs.rel
            .split(/\s+/)
            .filter(token => ['nofollow', 'noopener', 'noreferrer'].includes(token.toLowerCase()))
            .join(' ')
          if (rel) {
            safeAttrs.push(`rel="${escapeHtmlAttribute(rel)}"`)
          }
        }

        if (parsedAttrs.title) {
          safeAttrs.push(`title="${escapeHtmlAttribute(parsedAttrs.title.trim())}"`)
        }

        return `<a ${safeAttrs.join(' ')}>`
      }

      // Other allowed tags carry no attributes.
      return `<${tagName}>`
    }
  )

  return sanitized.trim()
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g
  let match: RegExpExecArray | null

  while ((match = attrRegex.exec(attrString)) !== null) {
    const name = match[1]!.toLowerCase()
    const value = match[2] ?? match[3] ?? match[4] ?? ''
    attrs[name] = value
  }

  return attrs
}

function escapeHtmlAttribute(str: string): string {
  return str
    // Escape only BARE ampersands: an href may already carry entities (e.g.
    // `&amp;`) and re-encoding them would corrupt the URL on every save.
    // Keep this regex in sync with the server sanitizer (`page-content-sanitizer.ts`).
    .replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export interface PasteSource {
  html: string
  text: string
}

/**
 * Resolves the clipboard payload of a paste into allowlisted HTML:
 * the rich `text/html` flavour wins, otherwise the plain-text flavour is
 * escaped and newline-converted. Always sanitized, so a paste can never
 * inject a tag/attribute the server would strip or reject.
 */
export function resolvePasteSource(source: PasteSource): string {
  const hasHtml = typeof source.html === 'string' && source.html.trim().length > 0
  const raw = hasHtml ? source.html : textToHtml(source.text ?? '')
  return sanitizeHtmlContent(raw)
}
