/**
 * Pure helpers for the Microsoft Clarity plugin.
 * Extracted per convention 5 (pure helpers testables pour composables/plugins).
 *
 * Consent policy (story 0.23):
 * Microsoft Clarity is classified as analytics/functional tracking — IP anonymised
 * by default, no advertising data sharing, automatic input masking. CNIL considers
 * this category exempt from explicit consent (similar to cookieless Matomo).
 *
 * Therefore Clarity loads whenever a Clarity ID is configured, regardless of the
 * cookie banner state or the presence of Google Ads. The Google Ads plugin keeps
 * its own consent gate on `ad_storage`/`ad_user_data`/`ad_personalization`.
 */

export const CLARITY_ID_REGEX = /^[a-z0-9]{6,20}$/

export type ClarityProfile = {
  microsoftClarityId?: string | null
  googleAdsId?: string | null
}

export type ClarityResolution = {
  slug: string | null
  clarityId: string | null
  profileResolved: boolean
}

export type ClarityNuxtDataSources = {
  routeSlug: string | null
  routeProfile: ClarityProfile | null
  tenantHomeSlug: string | null
  tenantHomeProfile: ClarityProfile | null
  tenantDiscoverySlug: string | null
  tenantDiscoveryProfile: ClarityProfile | null
  tenantRouteSlug: string | null
}

/**
 * Resolve Clarity config from NuxtData sources.
 */
export function resolveClarityContext(input: ClarityNuxtDataSources): ClarityResolution {
  if (input.routeSlug) {
    if (input.routeProfile) {
      return {
        slug: input.routeSlug,
        clarityId: input.routeProfile.microsoftClarityId ?? null,
        profileResolved: true
      }
    }

    return {
      slug: input.routeSlug,
      clarityId: null,
      profileResolved: false
    }
  }

  if (input.tenantHomeSlug) {
    if (input.tenantHomeProfile) {
      return {
        slug: input.tenantHomeSlug,
        clarityId: input.tenantHomeProfile.microsoftClarityId ?? null,
        profileResolved: true
      }
    }

    return {
      slug: input.tenantHomeSlug,
      clarityId: null,
      profileResolved: false
    }
  }

  if (input.tenantDiscoverySlug) {
    if (input.tenantDiscoveryProfile) {
      return {
        slug: input.tenantDiscoverySlug,
        clarityId: input.tenantDiscoveryProfile.microsoftClarityId ?? null,
        profileResolved: true
      }
    }

    return {
      slug: input.tenantDiscoverySlug,
      clarityId: null,
      profileResolved: false
    }
  }

  if (input.tenantRouteSlug) {
    return {
      slug: input.tenantRouteSlug,
      clarityId: null,
      profileResolved: false
    }
  }

  return { slug: null, clarityId: null, profileResolved: false }
}

/**
 * Check if we need to fetch the profile to get Clarity config.
 */
export function shouldFetchClarityProfile(
  slug: string | null,
  profileResolved: boolean
): boolean {
  return Boolean(slug) && !profileResolved
}
