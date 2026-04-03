import { getDomainContext } from '#shared/utils/domain-context'
import { shouldInjectBrandColor, applyBrandColors, removeBrandColors } from '#shared/utils/brand-color-helpers'
import { usePublicTenantHome } from '~/composables/usePublicTenantHome'

/**
 * Injects --color-brand-primary, --color-brand-primary-light, and
 * --color-brand-primary-dark CSS custom properties on white-label domains
 * when the provider has configured a brandColor.
 *
 * Call this in dashboard layouts (provider, client) only.
 * Public pages are NOT impacted — isolation is guaranteed by layout boundary.
 *
 * On unmount (layout change), the overrides are removed so the CSS defaults
 * from main.css (Crépuscule palette) take over.
 */
export function useBrandColorInjection() {
  const requestUrl = useRequestURL()
  const hostname = requestUrl.hostname.toLowerCase()
  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
  const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''
  const ctx = getDomainContext(hostname, platformDomain, platformDomainB2B || undefined)

  // RF5: early return BEFORE any network fetch on platform domains
  if (!ctx.isWhiteLabel) return

  const { data: tenant } = usePublicTenantHome()

  watch(
    () => tenant.value?.brand?.brandColor,
    (brandColor) => {
      if (import.meta.server) return
      const style = document.documentElement.style
      if (shouldInjectBrandColor(true, brandColor)) {
        applyBrandColors(style, brandColor)
      } else {
        removeBrandColors(style)
      }
    },
    { immediate: true }
  )

  if (import.meta.client) {
    onScopeDispose(() => {
      removeBrandColors(document.documentElement.style)
    })
  }
}
