import type { FeaturedProvider } from '~/components/organisms/SpecialistCard.vue'

/**
 * B2C landing Schema.org: ProfessionalService + ItemList(providers) + BreadcrumbList
 * Called from MarketingLandingB2C.vue with the fetched providers array.
 *
 * Convention 4 (retro T2): raw JSON-LD for types without defineXxx() helper.
 * Convention 5 (retro T2): pure helper for provider mapping, testable.
 */
export function useB2CLandingSchemaOrg(providers: Ref<FeaturedProvider[]>) {
  const origin = useRequestURL().origin

  useSchemaOrg([
    // ProfessionalService — Keova as a menopause support hub
    {
      '@type': 'ProfessionalService',
      '@id': `${origin}/#service`,
      'name': 'Keova — Accompagnement ménopause',
      'description': 'Mise en relation avec des spécialistes bien-être vérifiées pour un accompagnement personnalisé de la périménopause et de la ménopause.',
      'serviceType': 'Accompagnement périménopause et ménopause',
      'areaServed': { '@type': 'Country', 'name': 'France' },
      'url': origin,
      'provider': { '@id': `${origin}/#organization` }
    },
    // ItemList — featured specialists (dynamic)
    {
      '@type': 'ItemList',
      '@id': `${origin}/#specialists`,
      'name': 'Spécialistes ménopause sur Keova',
      'description': 'Professionnelles formées à l\'accompagnement de la ménopause et de la périménopause.',
      'numberOfItems': () => providers.value.length,
      'itemListElement': () => providers.value.map((p, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'item': {
          '@type': 'Person',
          'name': p.displayName,
          'jobTitle': 'Spécialiste ménopause',
          ...(p.profilePhotoUrl ? { image: p.profilePhotoUrl } : {}),
          ...(p.city ? { address: { '@type': 'PostalAddress', 'addressLocality': p.city } } : {}),
          ...(p.specialties?.length ? { knowsAbout: p.specialties } : {}),
          ...(p.customDomain ? { url: `https://${p.customDomain}` } : { url: `${origin}/coach/${p.slug}` })
        }
      }))
    },
    // BreadcrumbList — homepage only (single item)
    defineBreadcrumb({
      itemListElement: [
        { name: 'Accueil', item: origin }
      ]
    })
  ])
}
