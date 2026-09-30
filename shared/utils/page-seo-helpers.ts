export interface ContentBlock {
  id?: string
  type: string
  data?: unknown
}

export function resolvePageTitle(
  title: string,
  seoTitle?: string | null,
  brandName?: string | null
): string {
  if (seoTitle && seoTitle.trim()) {
    return seoTitle.trim()
  }
  const cleanTitle = title ? title.trim() : ''
  const cleanBrand = brandName ? brandName.trim() : ''
  if (!cleanBrand) {
    return cleanTitle
  }
  return cleanTitle ? `${cleanTitle} — ${cleanBrand}` : cleanBrand
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function resolvePageDescription(
  contentBlocks: ContentBlock[],
  seoDescription?: string | null,
  brandName?: string | null,
  pageTitle?: string | null
): string {
  if (seoDescription && seoDescription.trim()) {
    return seoDescription.trim()
  }

  const cleanBrand = brandName?.trim() || 'votre praticienne'
  const cleanTitle = pageTitle?.trim() || 'dédiée'

  for (const block of contentBlocks) {
    if (
      block.type === 'text'
      && block.data
      && typeof block.data === 'object'
      && 'html' in block.data
      && typeof (block.data as { html?: unknown }).html === 'string'
    ) {
      const plainText = stripHtml((block.data as { html: string }).html)
      if (plainText) {
        if (plainText.length <= 160) {
          return plainText
        }
        const sliced = plainText.slice(0, 159).trim()
        return `${sliced}…`
      }
    }
  }

  return `Découvrez la page ${cleanTitle} de ${cleanBrand}.`
}

export function resolvePageOgImage(
  contentBlocks: ContentBlock[],
  brandLogo?: string | null,
  defaultLogo: string = '/images/keova-logo-white-label.webp',
  origin?: string
): string | null {
  let resolvedUrl: string | null = null

  for (const block of contentBlocks) {
    if (
      block.type === 'image'
      && block.data
      && typeof block.data === 'object'
      && 'url' in block.data
      && typeof (block.data as { url?: unknown }).url === 'string'
    ) {
      const url = ((block.data as { url: string }).url || '').trim()
      if (url) {
        resolvedUrl = url
        break
      }
    }
  }

  if (!resolvedUrl && brandLogo && brandLogo.trim()) {
    resolvedUrl = brandLogo.trim()
  }

  if (!resolvedUrl) {
    resolvedUrl = defaultLogo
  }

  if (resolvedUrl && origin && resolvedUrl.startsWith('/')) {
    try {
      return new URL(resolvedUrl, origin).href
    } catch {
      return resolvedUrl
    }
  }

  return resolvedUrl
}

export interface ResolvePageCanonicalOptions {
  hostname: string
  pageSlug: string
  isWhiteLabel: boolean
  verifiedDomain?: string | null
  platformDomain: string
  providerSlug?: string
}

export function resolvePageCanonical(opts: ResolvePageCanonicalOptions): string {
  const cleanSlug = opts.pageSlug ? opts.pageSlug.trim() : ''

  if (opts.isWhiteLabel) {
    return `https://${opts.hostname}/${cleanSlug}`
  }

  if (opts.verifiedDomain && opts.verifiedDomain.trim()) {
    return `https://${opts.verifiedDomain.trim()}/${cleanSlug}`
  }

  const provSlug = opts.providerSlug ? opts.providerSlug.trim() : ''
  return `https://${opts.platformDomain}/coach/${provSlug}/${cleanSlug}`
}

export interface BuildPageBreadcrumbsOptions {
  pageTitle: string
  pageSlug: string
  isWhiteLabel: boolean
  origin: string
  brandName: string
  providerSlug?: string
}

export function buildPageBreadcrumbs(opts: BuildPageBreadcrumbsOptions): Array<{ name: string, item: string }> {
  const cleanOrigin = opts.origin.replace(/\/+$/, '')
  const cleanSlug = opts.pageSlug.trim()
  const cleanBrand = opts.brandName.trim()
  const cleanTitle = opts.pageTitle.trim()

  if (opts.isWhiteLabel) {
    return [
      { name: cleanBrand, item: `${cleanOrigin}/` },
      { name: cleanTitle, item: `${cleanOrigin}/${cleanSlug}` }
    ]
  }

  const provSlug = opts.providerSlug ? opts.providerSlug.trim() : ''
  return [
    { name: 'Accueil', item: `${cleanOrigin}/` },
    { name: 'Spécialistes', item: `${cleanOrigin}/#specialistes` },
    { name: cleanBrand, item: `${cleanOrigin}/coach/${provSlug}` },
    { name: cleanTitle, item: `${cleanOrigin}/coach/${provSlug}/${cleanSlug}` }
  ]
}

export function formatPageNavLinks(
  pages: Array<{ slug: string, title: string, menuLabel?: string | null }>,
  prefix?: string
): Array<{ label: string, href: string }> {
  const cleanPrefix = prefix ? prefix.replace(/\/+$/, '') : ''
  return pages.map(p => ({
    label: (p.menuLabel && p.menuLabel.trim()) || p.title,
    href: cleanPrefix ? `${cleanPrefix}/${p.slug}` : `/${p.slug}`
  }))
}

export function adjustHomeAnchorLinks(
  existingLinks: Array<{ label: string, href: string }>,
  isHomePage: boolean,
  homePath: string = '/'
): Array<{ label: string, href: string }> {
  if (isHomePage) {
    return existingLinks
  }

  const prefix = homePath.endsWith('/') && homePath !== '/' ? homePath.slice(0, -1) : homePath

  return existingLinks.map((link) => {
    if (link.href.startsWith('#')) {
      return {
        ...link,
        href: prefix === '/' ? `/${link.href}` : `${prefix}${link.href}`
      }
    }
    return link
  })
}
