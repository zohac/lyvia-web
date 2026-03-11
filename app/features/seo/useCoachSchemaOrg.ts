import type { PublicProviderProfile } from '~/features/seo/api/public-provider-profile.contract'
import { apiFetch } from '~/services/api/apiFetch'

/**
 * Injects Person + ProfessionalService + BreadcrumbList schemas for coach pages.
 *
 * All useSchemaOrg() calls happen BEFORE await to preserve Nuxt context.
 * Reactive refs bridge post-await data updates into the schema nodes.
 *
 * @param slug - Coach slug (API fetch + URL construction)
 * @param options.isPlatform - Platform domain vs white-label
 */
export async function useCoachSchemaOrg(
  slug: string,
  options: { isPlatform: boolean }
) {
  const origin = useRequestURL().origin
  const { isPlatform } = options

  const coachUrl = isPlatform ? `${origin}/coach/${slug}` : `${origin}/`
  const bookingUrl = isPlatform
    ? `${origin}/coach/${slug}/onboarding/discovery`
    : `${origin}/onboarding/discovery`

  // Reactive refs — registered BEFORE await to preserve Nuxt context
  const name = ref('Coach')
  const bio = ref<string | undefined>(undefined)
  const imageUrl = ref<string | undefined>(undefined)
  const specialties = ref<string[]>([])

  // Person schema (AC-1, AC-2)
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

  // ProfessionalService — uses defineLocalBusiness with @type override (AC-1, AC-2)
  // ProfessionalService extends LocalBusiness in Schema.org hierarchy
  useSchemaOrg([
    defineLocalBusiness({
      '@type': 'ProfessionalService',
      'name': () => `${name.value} — Accompagnement Ménopause`,
      'serviceType': 'Accompagnement périménopause et ménopause',
      'areaServed': 'France',
      'availableChannel': {
        '@type': 'ServiceChannel',
        'serviceUrl': bookingUrl
      }
    })
  ])

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
    const p = profile.value
    if (!p) return

    name.value = p.displayName || 'Coach'
    if (p.bio) bio.value = p.bio
    if (p.imageUrl) imageUrl.value = p.imageUrl
    if (p.specialties.length > 0) specialties.value = p.specialties
  })
}
