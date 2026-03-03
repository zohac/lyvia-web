export function useCommonLayoutHead() {
  const faviconHref = useDomainAwareFaviconHref()

  useHead(() => ({
    meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    link: [{ rel: 'icon', href: faviconHref.value }],
    htmlAttrs: { lang: 'fr' }
  }))
}
