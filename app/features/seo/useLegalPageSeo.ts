/**
 * Composable for legal pages SEO: canonical, OG tags, title/description.
 * Ensures correct domain-aware URLs on B2C, B2B, and white-label.
 */
export function useLegalPageSeo(opts: {
  pageTitle: string
  description: string
  path: string
}) {
  const origin = useRequestURL().origin
  const canonicalUrl = `${origin}${opts.path}`

  useSeoMeta({
    title: `${opts.pageTitle} - Keova`,
    description: opts.description,
    ogTitle: `${opts.pageTitle} - Keova`,
    ogDescription: opts.description,
    ogUrl: canonicalUrl,
    ogType: 'website'
  })

  usePublicCanonicalHead(canonicalUrl)
}
