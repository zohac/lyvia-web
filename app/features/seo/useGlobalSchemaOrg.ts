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
        logo: {
          '@type': 'ImageObject',
          '@id': `${origin}/#logo`,
          'url': `${origin}/images/keova-logo.png`,
          'contentUrl': `${origin}/images/keova-logo.png`,
          'caption': 'Keova',
          'width': 512,
          'height': 512
        },
        description: 'Keova réunit agenda, paiements et suivi client dans un espace pro conçu pour les spécialistes ménopause et bien-être.',
        foundingDate: '2026',
        areaServed: { '@type': 'Country', 'name': 'France' },
        contactPoint: { '@type': 'ContactPoint', 'contactType': 'customer support', 'availableLanguage': 'fr' },
        sameAs: []
      }),
      defineWebSite({
        name: 'Keova',
        inLanguage: 'fr-FR'
      }),
      defineWebPage({
        inLanguage: 'fr-FR'
      }),
      // SoftwareApplication with Review (AC-14)
      {
        '@type': 'SoftwareApplication',
        'name': 'Keova',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web',
        'url': origin,
        'description': 'Logiciel tout-en-un pour spécialistes ménopause : agenda en ligne, paiements automatiques, suivi client.',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'EUR',
          'description': 'Beta privée gratuite'
        },
        'review': {
          '@type': 'Review',
          'author': {
            '@type': 'Person',
            'name': 'Sophie Jouan',
            'jobTitle': 'Spécialiste ménopause',
            'address': { '@type': 'PostalAddress', 'addressLocality': 'Valognes', 'addressRegion': 'Normandie' }
          },
          'reviewBody': 'Keova a remplacé mes 5 outils par un seul espace. Ma page pro était en ligne en quelques minutes.',
          'reviewRating': { '@type': 'Rating', 'ratingValue': '5', 'bestRating': '5' }
        }
      }
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
