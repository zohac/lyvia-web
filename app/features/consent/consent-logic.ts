export type ConsentValue = 'all' | 'essential' | 'acknowledged' | null

export type ConsentSignals = {
  ad_storage: 'granted' | 'denied'
  ad_user_data: 'granted' | 'denied'
  ad_personalization: 'granted' | 'denied'
}

export type AdsConfig = {
  id: string | null
  label: string | null
  tagId?: string | null
}

export type AdsContext = {
  routeSlug?: string | null
  routeProfile?: AdsConfig | null
  tenantHomeSlug?: string | null
  tenantHomeProfile?: AdsConfig | null
  tenantDiscoverySlug?: string | null
  tenantDiscoveryProfile?: AdsConfig | null
  tenantRouteSlug?: string | null
}

export const COOKIE_CONSENT_NAME = 'cookieConsent'
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Options de cookie pour `useCookie(COOKIE_CONSENT_NAME, ...)`.
 *
 * `secure` est désactivé en dev pour que le cookie fonctionne sur HTTP local
 * (`http://keova-local.fr:3000`). En production le cookie est servi via HTTPS
 * et la flag est activée. Centralisé pour éviter la duplication entre
 * `CookieConsentBanner.vue` et `CookieSettingsModal.vue`.
 *
 * Le flag `isDev` est injecté par l'appelant (via `import.meta.dev` côté Nuxt)
 * pour garder ce fichier 100% pur et compilable par la config tsc des tests
 * (qui utilise `module: CommonJS`, incompatible avec `import.meta`).
 */
export function getConsentCookieOptions(isDev: boolean): {
  maxAge: number
  sameSite: 'lax'
  secure: boolean
} {
  return {
    maxAge: COOKIE_CONSENT_MAX_AGE,
    sameSite: 'lax',
    secure: !isDev
  }
}

export const GOOGLE_ADS_ID_REGEX = /^AW-\d{5,12}$/
export const GOOGLE_ADS_CONVERSION_LABEL_REGEX = /^[a-zA-Z0-9_-]{1,50}$/
export const GOOGLE_TAG_ID_REGEX = /^GT-[A-Z0-9]{5,15}$/

const GOOGLE_TAG_ID_BY_ADS_ID: Record<string, string> = {
  // Temporary bridge for story 0-29: Sophie's conversion action is attached to
  // the Google Tag while the public API only exposes the legacy AW destination.
  'AW-17979105489': 'GT-NFDCLRLC'
}

const GOOGLE_ADS_ID_BY_TAG_ID: Record<string, string> = Object.fromEntries(
  Object.entries(GOOGLE_TAG_ID_BY_ADS_ID).map(([adsId, tagId]) => [tagId, adsId])
)

export function hasGoogleAdsConfig(googleAdsId: string | null | undefined): boolean {
  return Boolean(googleAdsId)
}

export function hasGoogleTagConfig(googleTagId: string | null | undefined): boolean {
  return Boolean(googleTagId)
}

export function resolvePrimaryGoogleTagId(input: {
  googleAdsId: string | null | undefined
  googleTagId?: string | null | undefined
}): string | null {
  if (input.googleTagId && GOOGLE_TAG_ID_REGEX.test(input.googleTagId)) return input.googleTagId
  if (!input.googleAdsId) return null
  return GOOGLE_TAG_ID_BY_ADS_ID[input.googleAdsId] ?? input.googleAdsId
}

export function resolveGoogleAdsConversionId(
  googleAdsId: string | null | undefined
): string | null {
  if (!googleAdsId) return null
  if (GOOGLE_ADS_ID_REGEX.test(googleAdsId)) return googleAdsId
  if (GOOGLE_TAG_ID_REGEX.test(googleAdsId)) return GOOGLE_ADS_ID_BY_TAG_ID[googleAdsId] ?? null
  return null
}

export function shouldMountGoogleAdsTag(config: AdsConfig): config is AdsConfig & { id: string } {
  return Boolean(config.id)
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
  return consent == null
}

// Race-aware: avoid showing the banner in `simple` mode before the tracking
// orchestrator has resolved the domain context (platform vs white-label).
// A white-label visitor should see the `full` (accept/reject) mode, not the
// `simple` (acknowledge) mode — which would irreversibly post cookieConsent=acknowledged
// before Google Ads is detected. See hotfix-13 review follow-up #4.
export function shouldShowConsentBannerNow(
  consent: ConsentValue,
  trackingResolved: boolean
): boolean {
  if (!trackingResolved) return false
  return shouldShowConsentBanner(consent)
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
  return gtagLoaded && Boolean(resolveGoogleAdsConversionId(googleAdsId)) && Boolean(conversionLabel)
}

export type GoogleAdsConversionPayload = {
  send_to: string
  value: 1.0
  currency: 'EUR'
  transaction_id?: string
  event_callback?: () => void
  event_timeout?: number
}

export const GOOGLE_ADS_CONVERSION_FALLBACK_TIMEOUT_MS = 2000

export function toGoogleAdsConversionPayload(
  googleAdsId: string | null | undefined,
  conversionLabel: string | null | undefined,
  transactionId?: string | null | undefined
): GoogleAdsConversionPayload | null {
  const conversionId = resolveGoogleAdsConversionId(googleAdsId)
  if (!conversionId || !conversionLabel) return null
  const payload: GoogleAdsConversionPayload = {
    send_to: `${conversionId}/${conversionLabel}`,
    value: 1.0,
    currency: 'EUR'
  }
  if (transactionId) payload.transaction_id = transactionId
  return payload
}

export function shouldFireConversionPixel(
  consent: ConsentValue,
  googleAdsId: string | null | undefined,
  conversionLabel: string | null | undefined
): boolean {
  return consent === 'all' && Boolean(resolveGoogleAdsConversionId(googleAdsId)) && Boolean(conversionLabel)
}

export function toGoogleAdsConversionPixelUrl(
  googleAdsId: string | null | undefined,
  conversionLabel: string | null | undefined,
  random: number
): string | null {
  const conversionId = resolveGoogleAdsConversionId(googleAdsId)
  if (!conversionId || !conversionLabel) return null

  const accountId = conversionId.replace(/^AW-/, '')
  const params = new URLSearchParams({
    label: conversionLabel,
    value: '1.0',
    currency_code: 'EUR',
    guid: 'ON',
    script: '0',
    random: String(random)
  })

  return `https://googleads.g.doubleclick.net/pagead/conversion/${accountId}/?${params.toString()}`
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
    return {
      slug: input.tenantDiscoverySlug,
      ads: input.tenantDiscoveryProfile?.id ? input.tenantDiscoveryProfile : { id: null, label: null }
    }
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
