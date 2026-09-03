import type { Ref } from 'vue'
import type { PublicProviderProfile } from './api/public-provider-profile.contract'
import { useCoachLink } from '../../composables/useCoachLink'

/**
 * Builds coach page and booking URLs based on platform vs white-label context.
 *
 * P-Y6: route construction is delegated to `useCoachLink` so the coach URL
 * pattern stays defined in a single place (YC2.2).
 */
export function buildCoachUrls(
  origin: string,
  slug: string,
  isPlatform: boolean
): { coachUrl: string, bookingUrl: string } {
  if (!isPlatform) {
    return {
      coachUrl: `${origin}/`,
      bookingUrl: `${origin}/onboarding/discovery`
    }
  }
  const { site, booking } = useCoachLink({ slug, origin })
  return { coachUrl: site, bookingUrl: booking }
}

/**
 * Builds BreadcrumbList items for booking pages.
 *
 * Platform:    Accueil > {displayName} > Appel découverte
 * White-label: Accueil > Appel découverte
 *
 * P-Y6: route construction is delegated to `useCoachLink` (YC2.2).
 */
export function buildBookingBreadcrumbItems(
  origin: string,
  slug: string,
  displayName: () => string,
  isPlatform: boolean
): Array<{ name: string | (() => string), item: string }> {
  if (isPlatform) {
    const { site, booking } = useCoachLink({ slug, origin })
    return [
      { name: 'Accueil', item: `${origin}/` },
      { name: displayName, item: site },
      { name: 'Appel découverte', item: booking }
    ]
  }
  return [
    { name: 'Accueil', item: `${origin}/` },
    { name: 'Appel découverte', item: `${origin}/onboarding/discovery` }
  ]
}

/**
 * Maps a PublicProviderProfile to reactive refs for Schema.org injection.
 * Pure mapping logic — no side effects.
 */
export function mapProfileToSchemaRefs(
  profile: PublicProviderProfile | null,
  refs: {
    name: Ref<string>
    bio: Ref<string | undefined>
    imageUrl: Ref<string | undefined>
    specialties: Ref<string[]>
    credentials: Ref<Array<{ title: string, institution?: string, year?: number }>>
    sameAs: Ref<string[]>
    city: Ref<string | undefined>
    /** Story 0-27 — brand logo URL for Person.logo Schema.org enrichment. */
    logoUrl?: Ref<string | undefined>
    /** Story 0-39 — FAQ items for FAQPage Schema.org enrichment. */
    faqItems?: Ref<Array<{ label: string, content: string }>>
  },
  options?: {
    /** YC2.4: white-label domain to add as sameAs (hub → WL cross-reference) */
    whiteLabeldomain?: string | null
  }
): void {
  if (!profile) return

  refs.name.value = profile.displayName || 'Coach'
  if (profile.bio) refs.bio.value = profile.bio
  if (profile.imageUrl) refs.imageUrl.value = profile.imageUrl
  if (profile.specialties.length > 0) refs.specialties.value = profile.specialties
  // Story 0-27 — Person.logo enrichment when brand logo is set.
  if (refs.logoUrl && profile.logoUrl) refs.logoUrl.value = profile.logoUrl
  // Story 0-39 — FAQPage enrichment when faqJson is set.
  if (refs.faqItems && profile.faqJson?.length) refs.faqItems.value = profile.faqJson

  if (profile.credentials.length > 0) {
    refs.credentials.value = profile.credentials.map(c => ({
      title: c.title,
      ...(c.institution ? { institution: c.institution } : {}),
      ...(c.year ? { year: c.year } : {})
    }))
  }

  const sameAsUrls: string[] = []
  // YC2.4: cross-reference WL domain in Person.sameAs (AC-6)
  const wlDomain = options?.whiteLabeldomain?.trim()
  if (wlDomain) sameAsUrls.push(`https://${wlDomain}`)
  if (profile.socialLinks.linkedin) sameAsUrls.push(profile.socialLinks.linkedin)
  if (profile.socialLinks.instagram) sameAsUrls.push(profile.socialLinks.instagram)
  if (profile.socialLinks.website) sameAsUrls.push(profile.socialLinks.website)
  if (sameAsUrls.length > 0) refs.sameAs.value = sameAsUrls

  if (profile.city) refs.city.value = profile.city
}

/**
 * Builds a Schema.org PostalAddress for Person.address from the provider city.
 * Returns undefined when no city — keeps JSON-LD clean.
 *
 * Convention 5: pure helper testable for composable SEO logic.
 */
export function buildPersonAddress(
  city: string | undefined
): { '@type': string, 'addressLocality': string } | undefined {
  if (!city) return undefined
  return { '@type': 'PostalAddress', 'addressLocality': city }
}

/**
 * Builds a Schema.org ImageObject for Person.logo from the provider brand logo URL.
 * Returns undefined when no logo — keeps JSON-LD clean.
 *
 * Story 0-27 — Convention 5: pure helper testable for composable SEO logic.
 */
export function buildPersonLogo(
  logoUrl: string | undefined
): { '@type': string, 'url': string } | undefined {
  if (!logoUrl) return undefined
  return { '@type': 'ImageObject', 'url': logoUrl }
}

/**
 * Builds Schema.org EducationalOccupationalCredential items for Person.hasCredential.
 * Returns undefined when no credentials — keeps JSON-LD clean.
 *
 * Convention 5: pure helper testable for composable SEO logic.
 */
export function buildCredentialSchemaItems(
  credentials: Array<{ title: string, institution?: string, year?: number }>
): Array<Record<string, unknown>> | undefined {
  if (credentials.length === 0) return undefined
  return credentials.map(c => ({
    '@type': 'EducationalOccupationalCredential',
    'credentialCategory': c.title,
    ...(c.institution ? { recognizedBy: { '@type': 'Organization', 'name': c.institution } } : {}),
    ...(c.year ? { dateCreated: String(c.year) } : {})
  }))
}

/**
 * Builds Schema.org Question / Answer items for FAQPage.mainEntity.
 * Returns undefined when no FAQ items — keeps JSON-LD clean.
 *
 * Story 0-39 — Convention 5: pure helper testable for composable SEO logic.
 */
export function buildFaqSchemaItems(
  faq: Array<{ label: string, content: string }> | undefined | null
): Array<{ '@type': 'Question', 'name': string, 'acceptedAnswer': { '@type': 'Answer', 'text': string } }> | undefined {
  if (!faq || faq.length === 0) return undefined
  return faq.map(item => ({
    '@type': 'Question' as const,
    'name': item.label,
    'acceptedAnswer': {
      '@type': 'Answer' as const,
      'text': item.content
    }
  }))
}
