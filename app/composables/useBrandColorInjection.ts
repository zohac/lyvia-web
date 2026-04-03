import { getDomainContext } from '#shared/utils/domain-context'
import { usePublicTenantHome } from '~/composables/usePublicTenantHome'

/**
 * Injects --color-brand-primary CSS custom property on white-label domains
 * when the provider has configured a brandColor.
 *
 * Call this in dashboard layouts (provider, client) only.
 * Public pages are NOT impacted — isolation is guaranteed by layout boundary.
 *
 * On unmount (layout change), the override is removed so the CSS default
 * from main.css (var(--color-crepuscule-600)) takes over.
 */
export function useBrandColorInjection() {
  const { data: tenant } = usePublicTenantHome()

  const requestUrl = useRequestURL()
  const hostname = requestUrl.hostname.toLowerCase()
  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
  const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''
  const ctx = getDomainContext(hostname, platformDomain, platformDomainB2B || undefined)

  if (!ctx.isWhiteLabel) return

  watch(
    () => tenant.value?.brand?.brandColor,
    (brandColor) => {
      if (import.meta.server) return
      if (brandColor) {
        document.documentElement.style.setProperty('--color-brand-primary', brandColor)
      } else {
        document.documentElement.style.removeProperty('--color-brand-primary')
      }
    },
    { immediate: true }
  )

  if (import.meta.client) {
    onScopeDispose(() => {
      document.documentElement.style.removeProperty('--color-brand-primary')
    })
  }
}
