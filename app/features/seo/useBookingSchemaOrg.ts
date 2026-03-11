/**
 * Injects Service + BreadcrumbList schemas for booking/discovery pages.
 *
 * All useSchemaOrg() calls happen BEFORE any await to preserve Nuxt context.
 *
 * @param slug - Coach slug (URL construction)
 * @param displayName - Coach display name (for breadcrumb)
 * @param options.isPlatform - Platform domain vs white-label
 */
export function useBookingSchemaOrg(
  slug: string,
  displayName: () => string,
  options: { isPlatform: boolean }
) {
  const origin = useRequestURL().origin
  const { isPlatform } = options

  // Service schema — Appel découverte gratuit (AC-3, AC-4)
  useSchemaOrg([
    defineService({
      name: 'Appel découverte gratuit',
      serviceType: 'Consultation découverte',
      offers: {
        '@type': 'Offer',
        'price': 0,
        'priceCurrency': 'EUR',
        'availability': 'https://schema.org/InStock'
      }
    })
  ])

  // BreadcrumbList (AC-3, AC-4)
  if (isPlatform) {
    // Plateforme: Accueil > {displayName} > Appel découverte
    useSchemaOrg([
      defineBreadcrumb({
        itemListElement: [
          { name: 'Accueil', item: `${origin}/` },
          { name: displayName, item: `${origin}/coach/${slug}` },
          { name: 'Appel découverte', item: `${origin}/coach/${slug}/onboarding/discovery` }
        ]
      })
    ])
  } else {
    // White-label: Accueil > Appel découverte
    useSchemaOrg([
      defineBreadcrumb({
        itemListElement: [
          { name: 'Accueil', item: `${origin}/` },
          { name: 'Appel découverte', item: `${origin}/onboarding/discovery` }
        ]
      })
    ])
  }
}
