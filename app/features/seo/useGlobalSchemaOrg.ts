import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'
// isPlatformHost used directly (only isPlatform needed here, not robotsDisallowPaths).
// getDomainContext would be overkill — standardize in T2.3 if more context is needed.
import { isPlatformHost } from '#shared/utils/platform-host'
import { apiFetch } from '~/services/api/apiFetch'

// No unit test for this composable: useSchemaOrg/useAsyncData require full Nuxt runtime mocks.
// Detection logic is covered by tests/shared/platform-host.test.ts.
export async function useGlobalSchemaOrg() {
  const requestUrl = useRequestURL()
  const origin = requestUrl.origin
  const hostname = requestUrl.hostname.toLowerCase()

  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'kaora.app'
  const isPlatform = isPlatformHost(hostname, platformDomain)

  if (isPlatform) {
    useSchemaOrg([
      defineOrganization({
        name: 'Kaora',
        url: origin,
        logo: `${origin}/images/logo_kaora.png`,
        description: 'Trouvez votre spécialiste ménopause et périménopause'
      }),
      defineWebSite({
        name: 'Kaora',
        inLanguage: 'fr-FR'
      })
    ])
    return
  }

  // White-label: fetch tenant data for Person schema.
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

  const coachName = computed(() => tenant.value?.brand.displayName?.trim() || 'Coach')

  useSchemaOrg([
    definePerson({
      name: () => coachName.value,
      jobTitle: 'Spécialiste accompagnement ménopause',
      url: origin
    }),
    defineWebSite({
      name: () => coachName.value,
      inLanguage: 'fr-FR'
    })
  ])

  // Override og:site_name for white-label (static "Kaora" set in nuxt.config.ts)
  useSeoMeta({
    ogSiteName: () => coachName.value
  })
}
