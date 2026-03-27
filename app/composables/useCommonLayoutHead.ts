import { getDomainContext, getSeoReferenceOrigin } from '#shared/utils/domain-context'

export function useCommonLayoutHead() {
  const faviconHref = useDomainAwareFaviconHref()
  const requestUrl = useRequestURL()

  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
  const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''

  const hreflangHref = computed(() => {
    const ctx = getDomainContext(requestUrl.hostname, platformDomain, platformDomainB2B || undefined)
    const seoOrigin = getSeoReferenceOrigin(ctx, platformDomain)
    const path = requestUrl.pathname
    return `${seoOrigin}${path}`
  })

  useHead(() => ({
    meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    link: [
      { rel: 'icon', href: faviconHref.value },
      { rel: 'alternate', hreflang: 'fr', href: hreflangHref.value }
    ],
    htmlAttrs: { lang: 'fr' }
  }))
}
