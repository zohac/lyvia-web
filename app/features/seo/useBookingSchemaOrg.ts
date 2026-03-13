import { getDomainContext } from '#shared/utils/domain-context'
import { buildBookingBreadcrumbItems } from '~/features/seo/schema-helpers'

/**
 * Injects Service + BreadcrumbList schemas for booking/discovery pages.
 *
 * @param slug - Coach slug (URL construction for platform breadcrumb)
 * @param displayName - Coach display name getter (for breadcrumb)
 */
export function useBookingSchemaOrg(
  slug: string,
  displayName: () => string
) {
  const requestUrl = useRequestURL()
  const origin = requestUrl.origin
  const runtimeConfig = useRuntimeConfig()
  const platformDomain = runtimeConfig.public.platformDomain?.toLowerCase() || 'kaora.app'
  const { isPlatform } = getDomainContext(requestUrl.hostname, platformDomain)

  // Service schema — Appel découverte gratuit (AC-3, AC-4)
  // Convention 4: raw JSON-LD for types without defineXxx() helper
  useSchemaOrg([
    {
      '@type': 'Service',
      'name': 'Appel découverte gratuit',
      'serviceType': 'Consultation découverte',
      'offers': {
        '@type': 'Offer',
        'price': 0,
        'priceCurrency': 'EUR',
        'availability': 'https://schema.org/InStock'
      }
    }
  ])

  // BreadcrumbList (AC-3, AC-4)
  const items = buildBookingBreadcrumbItems(origin, slug, displayName, isPlatform)
  useSchemaOrg([
    defineBreadcrumb({ itemListElement: items })
  ])
}
