export function useCommonLayoutHead() {
  const faviconHref = useDomainAwareFaviconHref()
  const requestUrl = useRequestURL()
  const hreflangHref = computed(() => requestUrl.href.split('?')[0])

  useHead(() => ({
    meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    link: [
      { rel: 'icon', href: faviconHref.value },
      { rel: 'alternate', hreflang: 'fr', href: hreflangHref.value }
    ],
    htmlAttrs: { lang: 'fr' }
  }))
}
