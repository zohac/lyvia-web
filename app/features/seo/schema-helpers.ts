import type { Ref } from 'vue'
import type { PublicProviderProfile } from './api/public-provider-profile.contract'

/**
 * Builds coach page and booking URLs based on platform vs white-label context.
 */
export function buildCoachUrls(
  origin: string,
  slug: string,
  isPlatform: boolean
): { coachUrl: string, bookingUrl: string } {
  return isPlatform
    ? {
        coachUrl: `${origin}/coach/${slug}`,
        bookingUrl: `${origin}/coach/${slug}/onboarding/discovery`
      }
    : {
        coachUrl: `${origin}/`,
        bookingUrl: `${origin}/onboarding/discovery`
      }
}

/**
 * Builds BreadcrumbList items for booking pages.
 *
 * Platform:    Accueil > {displayName} > Appel découverte
 * White-label: Accueil > Appel découverte
 */
export function buildBookingBreadcrumbItems(
  origin: string,
  slug: string,
  displayName: () => string,
  isPlatform: boolean
): Array<{ name: string | (() => string), item: string }> {
  if (isPlatform) {
    return [
      { name: 'Accueil', item: `${origin}/` },
      { name: displayName, item: `${origin}/coach/${slug}` },
      { name: 'Appel découverte', item: `${origin}/coach/${slug}/onboarding/discovery` }
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
  }
): void {
  if (!profile) return

  refs.name.value = profile.displayName || 'Coach'
  if (profile.bio) refs.bio.value = profile.bio
  if (profile.imageUrl) refs.imageUrl.value = profile.imageUrl
  if (profile.specialties.length > 0) refs.specialties.value = profile.specialties

  if (profile.credentials.length > 0) {
    refs.credentials.value = profile.credentials.map(c => ({
      title: c.title,
      ...(c.institution ? { institution: c.institution } : {}),
      ...(c.year ? { year: c.year } : {})
    }))
  }

  const sameAsUrls: string[] = []
  if (profile.socialLinks.linkedin) sameAsUrls.push(profile.socialLinks.linkedin)
  if (profile.socialLinks.instagram) sameAsUrls.push(profile.socialLinks.instagram)
  if (profile.socialLinks.website) sameAsUrls.push(profile.socialLinks.website)
  if (sameAsUrls.length > 0) refs.sameAs.value = sameAsUrls

  if (profile.city) refs.city.value = profile.city
}
