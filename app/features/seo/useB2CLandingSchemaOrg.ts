import type { FeaturedProvider } from '~/features/seo/api/featured-provider.contract'
import { buildProfessionalService, buildProviderListItem } from '~/features/seo/b2c-landing-schema-helpers'

/**
 * B2C landing Schema.org: ProfessionalService + ItemList(providers) + BreadcrumbList
 * Called from MarketingLandingB2C.vue with the fetched providers array.
 *
 * Convention 4 (retro T2): raw JSON-LD for types without defineXxx() helper.
 * Convention 5 (retro T2): pure helpers in b2c-landing-schema-helpers.ts, testable.
 */
export function useB2CLandingSchemaOrg(providers: Ref<FeaturedProvider[]>) {
  const origin = useRequestURL().origin

  useSchemaOrg([
    buildProfessionalService(origin),
    // ItemList — featured specialists (dynamic)
    {
      '@type': 'ItemList',
      '@id': `${origin}/#specialists`,
      'name': 'Spécialistes ménopause sur Keova',
      'description': 'Professionnelles formées à l\'accompagnement de la ménopause et de la périménopause.',
      'numberOfItems': () => providers.value.length,
      'itemListElement': () => providers.value.map((p, i) => buildProviderListItem(p, i, origin))
    },
    // BreadcrumbList — homepage only (single item)
    defineBreadcrumb({
      itemListElement: [
        { name: 'Accueil', item: origin }
      ]
    })
  ])
}
