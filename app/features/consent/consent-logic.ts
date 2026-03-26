export type ConsentValue = 'all' | 'essential' | 'acknowledged' | null

export type ConsentSignals = {
  ad_storage: 'granted' | 'denied'
  ad_user_data: 'granted' | 'denied'
  ad_personalization: 'granted' | 'denied'
}

export type AdsConfig = {
  id: string | null
  label: string | null
}

export type AdsContext = {
  routeSlug?: string | null
  routeProfile?: AdsConfig | null
  tenantHomeSlug?: string | null
  tenantHomeProfile?: AdsConfig | null
  tenantDiscoverySlug?: string | null
  tenantRouteSlug?: string | null
}

export const COOKIE_CONSENT_NAME = 'cookieConsent'
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 365

export const GOOGLE_ADS_ID_REGEX = /^AW-\d{5,12}$/
export const GOOGLE_ADS_CONVERSION_LABEL_REGEX = /^[a-zA-Z0-9_-]{1,50}$/

export function hasGoogleAdsConfig(googleAdsId: string | null | undefined): boolean {
  return Boolean(googleAdsId)
}

export function getBannerMode(hasAds: boolean): 'simple' | 'full' {
  return hasAds ? 'full' : 'simple'
}

export function toConsentSignals(granted: boolean): ConsentSignals {
  return {
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied'
  }
}

export function shouldShowConsentBanner(consent: ConsentValue): boolean {
  return consent === null
}

export function getAcceptConsentValue(hasAds: boolean): ConsentValue {
  return hasAds ? 'all' : 'acknowledged'
}

export function getAdsEnabledFromConsent(consent: ConsentValue): boolean {
  return consent === 'all'
}

export function getConsentValueFromPreferences(
  adsEnabled: boolean,
  hasAds: boolean
): ConsentValue {
  return adsEnabled && hasAds ? 'all' : 'essential'
}

export function shouldRestoreConsent(consent: ConsentValue): boolean {
  return consent === 'all'
}

export function shouldFireConversion(
  gtagLoaded: boolean,
  googleAdsId: string | null | undefined,
  conversionLabel: string | null | undefined
): boolean {
  return gtagLoaded && Boolean(googleAdsId) && Boolean(conversionLabel)
}

export function resolveAdsContext(input: AdsContext): { slug: string | null, ads: AdsConfig } {
  if (input.routeSlug) {
    return {
      slug: input.routeSlug,
      ads: input.routeProfile?.id ? input.routeProfile : { id: null, label: null }
    }
  }

  if (input.tenantHomeSlug) {
    return {
      slug: input.tenantHomeSlug,
      ads: input.tenantHomeProfile?.id ? input.tenantHomeProfile : { id: null, label: null }
    }
  }

  if (input.tenantDiscoverySlug) {
    return { slug: input.tenantDiscoverySlug, ads: { id: null, label: null } }
  }

  if (input.tenantRouteSlug) {
    return { slug: input.tenantRouteSlug, ads: { id: null, label: null } }
  }

  return { slug: null, ads: { id: null, label: null } }
}

export function shouldFetchAdsProfile(
  slug: string | null,
  adsId: string | null | undefined
): boolean {
  return Boolean(slug) && !adsId
}
