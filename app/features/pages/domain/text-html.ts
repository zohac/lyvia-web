/**
 * V2.2b — Pure helpers converting plain text to allowlisted HTML.
 *
 * Used by the editor (a `text/plain` clipboard fallback, and the label of an
 * inserted link). Kept in `domain/` so the escaping is unit-tested without a
 * DOM. Plain text is NOT assumed to contain entities, so every `&` is escaped.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Escapes plain text and turns newlines into allowlisted `<br>` breaks. */
export function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\r?\n/g, '<br>')
}
