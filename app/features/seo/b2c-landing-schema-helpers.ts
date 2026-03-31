import type { FeaturedProvider } from './api/featured-provider.contract'

/**
 * Pure helpers for B2C landing Schema.org — testable without Nuxt context.
 * Convention 5 (retro T2): pure helper for provider mapping.
 */

/** Map a provider to a Schema.org ListItem. */
export function buildProviderListItem(provider: FeaturedProvider, index: number, origin: string) {
  return {
    '@type': 'ListItem' as const,
    'position': index + 1,
    'item': {
      '@type': 'Person' as const,
      'name': provider.displayName,
      'jobTitle': 'Spécialiste ménopause',
      ...(provider.profilePhotoUrl ? { image: provider.profilePhotoUrl } : {}),
      ...(provider.city ? { address: { '@type': 'PostalAddress' as const, 'addressLocality': provider.city } } : {}),
      ...(provider.specialties?.length ? { knowsAbout: provider.specialties } : {}),
      ...(provider.customDomain ? { url: `https://${provider.customDomain}` } : { url: `${origin}/coach/${provider.slug}` })
    }
  }
}

/** Build ProfessionalService schema node. */
export function buildProfessionalService(origin: string) {
  return {
    '@type': 'ProfessionalService' as const,
    '@id': `${origin}/#service`,
    'name': 'Keova — Accompagnement ménopause',
    'description': 'Mise en relation avec des spécialistes bien-être vérifiées pour un accompagnement personnalisé de la périménopause et de la ménopause.',
    'serviceType': 'Accompagnement périménopause et ménopause',
    'areaServed': { '@type': 'Country' as const, 'name': 'France' },
    'url': origin,
    'provider': { '@id': `${origin}/#organization` }
  }
}
