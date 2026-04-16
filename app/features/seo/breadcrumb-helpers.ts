/**
 * Pure helpers for building visible breadcrumb items.
 * Convention 5: testable, no side effects.
 * Synchronized with Schema.org BreadcrumbList (T2.3).
 */
import { useCoachLink } from '../../composables/useCoachLink'

export type BreadcrumbItem = {
  label: string
  to?: string
}

/**
 * Breadcrumbs for coach profile page.
 * Platform: Accueil > {displayName}
 * White-label: empty (home = coach profile, no breadcrumb on root page)
 */
export function buildCoachBreadcrumbs(
  displayName: string,
  isPlatform: boolean
): BreadcrumbItem[] {
  if (!isPlatform) return []
  return [
    { label: 'Accueil', to: '/' },
    { label: displayName }
  ]
}

/**
 * Breadcrumbs for booking/discovery page.
 * Platform: Accueil > {displayName} > Appel découverte
 * White-label: Accueil > Appel découverte
 */
export function buildBookingBreadcrumbs(
  displayName: string,
  slug: string,
  isPlatform: boolean
): BreadcrumbItem[] {
  if (isPlatform) {
    // P-Y6: centralised route building via useCoachLink.
    const { site } = useCoachLink({ slug })
    return [
      { label: 'Accueil', to: '/' },
      { label: displayName, to: site },
      { label: 'Appel découverte' }
    ]
  }
  return [
    { label: 'Accueil', to: '/' },
    { label: 'Appel découverte' }
  ]
}

/**
 * Breadcrumbs for legal pages.
 * Always: Accueil > {pageTitle}
 */
export function buildLegalBreadcrumbs(
  pageTitle: string
): BreadcrumbItem[] {
  return [
    { label: 'Accueil', to: '/' },
    { label: pageTitle }
  ]
}
