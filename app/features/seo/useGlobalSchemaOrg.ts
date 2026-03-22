import { getDomainContext } from '#shared/utils/domain-context'
import { usePublicTenantHome } from '~/composables/usePublicTenantHome'

// Detection logic is covered by tests/shared/platform-host.test.ts + domain-context.test.ts.
export async function useGlobalSchemaOrg() {
  const requestUrl = useRequestURL()
  const origin = requestUrl.origin
  const hostname = requestUrl.hostname.toLowerCase()

  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
  const platformDomainB2B = (runtimeConfig.public.platformDomainB2B as string)?.toLowerCase() || ''
  const { isPlatform } = getDomainContext(hostname, platformDomain, platformDomainB2B || undefined)

  if (isPlatform) {
    useSchemaOrg([
      defineOrganization({
        name: 'Keova',
        url: origin,
        logo: `${origin}/images/keova-logo.png`,
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
  // Shared composable ensures same key + handler as index.vue (no "Incompatible options" warning).
  const { data: tenant } = await usePublicTenantHome()

  // Update ref reactively — WebSite name and og:site_name pick up the new value
  watchEffect(() => {
    coachName.value = tenant.value?.brand.displayName?.trim() || 'Coach'
  })
}
