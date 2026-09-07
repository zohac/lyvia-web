import { resolveAlternateHref } from '#shared/utils/resolve-alternate-href'

export function useCommonLayoutHead(options?: { noindex?: boolean }) {
  const faviconHref = useDomainAwareFaviconHref()
  const canonicalState = usePublicCanonicalState()
  const requestUrl = useRequestURL()

  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
  const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''

  const hreflangHref = computed(() => {
    return resolveAlternateHref({
      hostname: requestUrl.hostname,
      pathname: requestUrl.pathname,
      platformDomain,
      platformDomainB2B: platformDomainB2B || undefined,
      canonicalHref: canonicalState.value
    })
  })

  useHead(() => {
    const meta = [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    if (options?.noindex) {
      meta.push({ name: 'robots', content: 'noindex, nofollow' })
    }
    return {
      meta,
      link: [
        { rel: 'icon', href: faviconHref.value },
        { rel: 'alternate', hreflang: 'fr', href: hreflangHref.value },
        { rel: 'alternate', hreflang: 'x-default', href: hreflangHref.value }
      ],
      htmlAttrs: { lang: 'fr' }
    }
  })
}
