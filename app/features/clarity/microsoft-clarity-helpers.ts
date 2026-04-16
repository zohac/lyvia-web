/**
 * Pure helpers for the Microsoft Clarity plugin.
 * Extracted per convention 5 (pure helpers testables pour composables/plugins).
 */

export const CLARITY_ID_REGEX = /^[a-z0-9]{6,20}$/

export type ClarityProfile = {
  microsoftClarityId?: string | null
  googleAdsId?: string | null
}

export type ClarityResolution = {
  slug: string | null
  clarityId: string | null
  googleAdsId: string | null
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
 * Returns both clarityId AND googleAdsId from the same profile
 * to avoid the race condition where Google Ads state hasn't been set yet.
 */
export function resolveClarityContext(input: ClarityNuxtDataSources): ClarityResolution {
  if (input.routeSlug) {
    if (input.routeProfile) {
      return {
        slug: input.routeSlug,
        clarityId: input.routeProfile.microsoftClarityId ?? null,
        googleAdsId: input.routeProfile.googleAdsId ?? null,
        profileResolved: true
      }
    }

    return {
      slug: input.routeSlug,
      clarityId: null,
      googleAdsId: null,
      profileResolved: false
    }
  }

  if (input.tenantHomeSlug) {
    if (input.tenantHomeProfile) {
      return {
        slug: input.tenantHomeSlug,
        clarityId: input.tenantHomeProfile.microsoftClarityId ?? null,
        googleAdsId: input.tenantHomeProfile.googleAdsId ?? null,
        profileResolved: true
      }
    }

    return {
      slug: input.tenantHomeSlug,
      clarityId: null,
      googleAdsId: null,
      profileResolved: false
    }
  }

  if (input.tenantDiscoverySlug) {
    if (input.tenantDiscoveryProfile) {
      return {
        slug: input.tenantDiscoverySlug,
        clarityId: input.tenantDiscoveryProfile.microsoftClarityId ?? null,
        googleAdsId: input.tenantDiscoveryProfile.googleAdsId ?? null,
        profileResolved: true
      }
    }

    return {
      slug: input.tenantDiscoverySlug,
      clarityId: null,
      googleAdsId: null,
      profileResolved: false
    }
  }

  if (input.tenantRouteSlug) {
    return {
      slug: input.tenantRouteSlug,
      clarityId: null,
      googleAdsId: null,
      profileResolved: false
    }
  }

  return { slug: null, clarityId: null, googleAdsId: null, profileResolved: false }
}

/**
 * Decide whether Clarity should load based on the consent context.
 *
 * - Simple mode (no Google Ads): Clarity loads directly (analytics/functional).
 * - Full mode (Google Ads present): Clarity loads only with 'all' or 'acknowledged' consent.
 *
 * CRITICAL: googleAdsId MUST come from the same profile resolution as clarityId,
 * NOT from useState('googleAdsId') which may not be populated yet on booking pages.
 */
export function shouldLoadClarity(
  googleAdsId: string | null,
  cookieConsent: string | null
): boolean {
  if (!googleAdsId) {
    // Simple mode: no Google Ads → load Clarity directly
    return true
  }
  // Full mode: Google Ads present → respect cookie consent
  return cookieConsent === 'all' || cookieConsent === 'acknowledged'
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
