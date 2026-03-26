import { isPlatformHost } from '#shared/utils/platform-host'

const PLATFORM_FAVICON = '/favicon.ico'
const WHITE_LABEL_FAVICON = '/favicon-keova.ico'

export function useDomainAwareFaviconHref() {
  const requestUrl = useRequestURL()
  const runtimeConfig = useRuntimeConfig()

  const hostname = requestUrl.hostname || ''
  const platformDomain = String(runtimeConfig.public.platformDomain || 'keova.fr')

  return computed(() =>
    isPlatformHost(hostname, platformDomain) ? PLATFORM_FAVICON : WHITE_LABEL_FAVICON
  )
}
