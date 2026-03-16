import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import { getDomainContext } from '#shared/utils/domain-context'
import { apiFetch } from '~/services/api/apiFetch'
import { buildCoachUrls, mapProfileToSchemaRefs } from '~/features/seo/schema-helpers'

/**
 * Injects Person + ProfessionalService + BreadcrumbList schemas for coach pages.
 *
 * All useSchemaOrg() calls happen BEFORE await to preserve Nuxt context.
 * Reactive refs bridge post-await data updates into the schema nodes.
 *
 * @param slug - Coach slug (API fetch + URL construction)
 */
export async function useCoachSchemaOrg(slug: string) {
  const requestUrl = useRequestURL()
  const origin = requestUrl.origin
  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'keova.fr'
  const { isPlatform } = getDomainContext(requestUrl.hostname, platformDomain)

  const { coachUrl, bookingUrl } = buildCoachUrls(origin, slug, isPlatform)

  // Reactive refs — registered BEFORE await to preserve Nuxt context
  const name = ref('Coach')
  const bio = ref<string | undefined>(undefined)
  const imageUrl = ref<string | undefined>(undefined)
  const specialties = ref<string[]>([])

  // Person schema (AC-1, AC-2) — single source of Person data on white-label
  // (useGlobalSchemaOrg no longer injects Person to avoid duplicates)
  useSchemaOrg([
    definePerson({
      name: () => name.value,
      jobTitle: 'Spécialiste accompagnement périménopause et ménopause',
      url: coachUrl,
      image: () => imageUrl.value,
      description: () => bio.value,
      knowsAbout: () => specialties.value
    })
  ])

  // ProfessionalService as raw JSON-LD (AC-1, AC-2)
  // Raw object avoids defineLocalBusiness injecting unwanted LocalBusiness defaults
  // (address, geo, openingHours). availableChannel omitted — it's a Service property,
  // not valid on ProfessionalService (schema.org).
  useSchemaOrg([{
    '@type': 'ProfessionalService',
    'name': () => `${name.value} — Accompagnement Ménopause`,
    'serviceType': 'Accompagnement périménopause et ménopause',
    'areaServed': 'France',
    'url': bookingUrl
  }])

  // BreadcrumbList — platform only (AC-1: Accueil > {displayName})
  // White-label: page racine, pas de breadcrumb (AC-2)
  if (isPlatform) {
    useSchemaOrg([
      defineBreadcrumb({
        itemListElement: [
          { name: 'Accueil', item: `${origin}/` },
          { name: () => name.value, item: coachUrl }
        ]
      })
    ])
  }

  // Fetch enriched profile data (T2.1 endpoint)
  const { data: profile } = await useAsyncData<PublicProviderProfile | null>(
    `public-provider-profile:${slug}`,
    async () => {
      try {
        return await apiFetch<PublicProviderProfile>(`/public/provider/${slug}/profile`, {
          method: 'GET',
          withAuth: false
        })
      } catch {
        return null
      }
    },
    { default: () => null }
  )

  // Update refs reactively — schemas pick up new values automatically
  watchEffect(() => {
    mapProfileToSchemaRefs(profile.value, { name, bio, imageUrl, specialties })
  })
}
