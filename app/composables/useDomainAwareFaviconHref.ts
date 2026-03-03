import { isPlatformHost } from '../features/public/domain/platform-host'

const PLATFORM_FAVICON = '/favicon.ico'
const WHITE_LABEL_FAVICON = '/favicon-aurea.ico'

export function useDomainAwareFaviconHref() {
  const requestUrl = useRequestURL()
  const runtimeConfig = useRuntimeConfig()

  const hostname = requestUrl.hostname || ''
  const platformDomain = String(runtimeConfig.public.platformDomain || 'kaora.app')

  return computed(() =>
    isPlatformHost(hostname, platformDomain) ? PLATFORM_FAVICON : WHITE_LABEL_FAVICON
  )
}
