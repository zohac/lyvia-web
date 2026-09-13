/**
 * Pure helper for securing external links in rich text / HTML.
 *
 * Convention A30 / Anti-pattern: all links with target="_blank" must strictly
 * include rel="noopener noreferrer".
 */
export function secureBlankLinks(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  return html.replace(/<a\b([^>]*)>/gi, (match, attributes: string) => {
    const hasTargetBlank = /target\s*=\s*["']?_blank["']?/i.test(attributes)
    if (!hasTargetBlank) {
      return match
    }

    const relMatch = /rel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attributes)
    if (relMatch) {
      const existingRel = relMatch[1] ?? relMatch[2] ?? relMatch[3] ?? ''
      const parts = existingRel.split(/\s+/).filter(Boolean)
      if (!parts.includes('noopener')) parts.push('noopener')
      if (!parts.includes('noreferrer')) parts.push('noreferrer')
      return match.replace(relMatch[0], `rel="${parts.join(' ')}"`)
    }
    return `<a${attributes} rel="noopener noreferrer">`
  })
}
