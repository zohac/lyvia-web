import { getDomainContext } from '#shared/utils/domain-context'
import { bindBrandColorScope } from '#shared/utils/brand-color-scope'
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'

/**
 * Injects --color-brand-primary, --color-brand-accent, and derived CSS custom
 * properties into the document root whenever a coach tenant has configured brand colors.
 *
 * Resolves tenant from available Nuxt data sources:
 * - 'public-tenant-home' (custom domain / home)
 * - 'public-tenant-discovery' (white-label discovery booking)
 * - `public-tenant:${route.params.slug}` (platform coach page / booking)
 *
 * On unmount (layout / route change), the overrides are removed so default CSS
 * variables take over.
 */
export function useBrandColorInjection() {
  const route = useRoute()
  const requestUrl = useRequestURL()
  const hostname = requestUrl.hostname.toLowerCase()
  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
  const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''
  const ctx = getDomainContext(hostname, platformDomain, platformDomainB2B || undefined)

  const routeSlug = computed(() => (typeof route.params.slug === 'string' ? route.params.slug.trim() : ''))

  const tenantHome = useNuxtData<PublicTenantResponse | null>('public-tenant-home')
  const tenantDiscovery = useNuxtData<PublicTenantResponse | null>('public-tenant-discovery')
  const tenantRoute = computed(() => {
    if (!routeSlug.value) return null
    return useNuxtData<PublicTenantResponse | null>(`public-tenant:${routeSlug.value}`).data.value
  })

  const tenant = computed<PublicTenantResponse | null>(() => {
    return tenantHome.data.value || tenantDiscovery.data.value || tenantRoute.value || null
  })

  // If on platform domain and not on a coach route / no tenant data, early return
  if (!ctx.isWhiteLabel && !routeSlug.value && !tenant.value) return

  if (import.meta.server) return

  bindBrandColorScope(
    document.documentElement.style,
    () => tenant.value?.brand?.brandColor,
    true,
    () => tenant.value?.brand?.brandAccentColor
  )
}
