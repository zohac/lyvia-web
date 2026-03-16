import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
import { getDomainContext } from '#shared/utils/domain-context'
import { apiFetch } from '~/services/api/apiFetch'

// Detection logic is covered by tests/shared/platform-host.test.ts + domain-context.test.ts.
export async function useGlobalSchemaOrg() {
  const requestUrl = useRequestURL()
  const origin = requestUrl.origin
  const hostname = requestUrl.hostname.toLowerCase()

  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
  const { isPlatform } = getDomainContext(hostname, platformDomain)

  if (isPlatform) {
    useSchemaOrg([
      defineOrganization({
        name: 'Keova',
        url: origin,
        logo: `${origin}/images/logo_keova.png`,
        description: 'Trouvez votre spécialiste ménopause et périménopause'
      }),
      defineWebSite({
        name: 'Keova',
        inLanguage: 'fr-FR'
      })
    ])
    return
  }

  // White-label: register WebSite BEFORE await to preserve Nuxt context.
  // Person schema is NOT injected here — useCoachSchemaOrg (T2.3) is the single source
  // for Person data on coach pages (with enriched profile: bio, specialties, image).
  const coachName = ref('Coach')

  useSchemaOrg([
    defineWebSite({
      name: () => coachName.value,
      inLanguage: 'fr-FR'
    })
  ])

  // Override og:site_name for white-label (static "Keova" set in nuxt.config.ts)
  useSeoMeta({
    ogSiteName: () => coachName.value
  })

  // Fetch tenant data AFTER composable registration.
  // Reuses the same cache key as index.vue to avoid a duplicate HTTP request.
  const { data: tenant } = await useAsyncData<PublicTenantResponse | null>('public-tenant-home', async () => {
    try {
      return await apiFetch<PublicTenantResponse>('/public/tenant', {
        method: 'GET',
        withAuth: false
      })
    } catch {
      return null
    }
  }, { default: () => null })

  // Update ref reactively — WebSite name and og:site_name pick up the new value
  watchEffect(() => {
    coachName.value = tenant.value?.brand.displayName?.trim() || 'Coach'
  })
}
