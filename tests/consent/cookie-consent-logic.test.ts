import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAcceptConsentValue,
  getAdsEnabledFromConsent,
  getBannerMode,
  getConsentValueFromPreferences,
  GOOGLE_ADS_CONVERSION_LABEL_REGEX,
  GOOGLE_ADS_ID_REGEX,
  GOOGLE_TAG_ID_REGEX,
  resolveAdsContext,
  resolvePrimaryGoogleTagId,
  shouldFetchAdsProfile,
  shouldFireConversion,
  shouldMountGoogleAdsTag,
  shouldRestoreConsent,
  shouldShowConsentBanner,
  toGoogleAdsConversionPayload,
  toConsentSignals,
  type ConsentValue
} from '../../app/features/consent/consent-logic'

test('cookie consent state helpers: shows banner when consent is null', () => {
  assert.equal(shouldShowConsentBanner(null), true)
})

test('cookie consent state helpers: shows banner when consent is undefined (fresh browser)', () => {
  assert.equal(shouldShowConsentBanner(undefined as unknown as ConsentValue), true)
})

test('cookie consent state helpers: does not show banner for acknowledged consent', () => {
  assert.equal(shouldShowConsentBanner('acknowledged'), false)
})

test('cookie consent state helpers: accepting consent with ads enabled stores all', () => {
  assert.equal(getAcceptConsentValue(true), 'all')
})

test('cookie consent state helpers: accepting consent without ads keeps backward-compatible acknowledged', () => {
  assert.equal(getAcceptConsentValue(false), 'acknowledged')
})

test('cookie consent state helpers: banner mode is simple without ads', () => {
  assert.equal(getBannerMode(false), 'simple')
})

test('cookie consent state helpers: banner mode is full with ads', () => {
  assert.equal(getBannerMode(true), 'full')
})

test('cookie settings modal helpers: ads toggle is enabled only for all consent', () => {
  assert.equal(getAdsEnabledFromConsent('all'), true)
  assert.equal(getAdsEnabledFromConsent('essential'), false)
  assert.equal(getAdsEnabledFromConsent('acknowledged'), false)
  assert.equal(getAdsEnabledFromConsent(null), false)
})

test('cookie settings modal helpers: saving enabled ads with ads configured stores all', () => {
  assert.equal(getConsentValueFromPreferences(true, true), 'all')
})

test('cookie settings modal helpers: saving disabled ads stores essential', () => {
  assert.equal(getConsentValueFromPreferences(false, true), 'essential')
})

test('cookie settings modal helpers: saving preferences without ads configured stores essential', () => {
  assert.equal(getConsentValueFromPreferences(true, false), 'essential')
})

test('consent mode v2 signal mapping: maps granted consent to all granted signals', () => {
  assert.deepStrictEqual(toConsentSignals(true), {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  })
})

test('consent mode v2 signal mapping: maps denied consent to all denied signals', () => {
  assert.deepStrictEqual(toConsentSignals(false), {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  })
})

test('conversion event guard: fires when gtag, ads id and conversion label are present', () => {
  assert.equal(shouldFireConversion(true, 'AW-123456789', 'abcDEF'), true)
})

test('conversion event guard: does not fire without gtag', () => {
  assert.equal(shouldFireConversion(false, 'AW-123456789', 'abcDEF'), false)
})

test('conversion event guard: does not fire without Google Ads ID', () => {
  assert.equal(shouldFireConversion(true, null, 'abcDEF'), false)
})

test('conversion event guard: does not fire without conversion label', () => {
  assert.equal(shouldFireConversion(true, 'AW-123456789', null), false)
})

test('conversion event guard: does not fire with empty strings', () => {
  assert.equal(shouldFireConversion(true, '', ''), false)
})

test('google ads id validation: accepts valid ids from 5 to 12 digits', () => {
  assert.equal(GOOGLE_ADS_ID_REGEX.test('AW-12345'), true)
  assert.equal(GOOGLE_ADS_ID_REGEX.test('AW-123456789'), true)
  assert.equal(GOOGLE_ADS_ID_REGEX.test('AW-123456789012'), true)
})

test('google ads id validation: rejects invalid ids', () => {
  assert.equal(GOOGLE_ADS_ID_REGEX.test('123456789'), false)
  assert.equal(GOOGLE_ADS_ID_REGEX.test('AW-1234'), false)
  assert.equal(GOOGLE_ADS_ID_REGEX.test('AW-1234567890123'), false)
  assert.equal(GOOGLE_ADS_ID_REGEX.test('AW-12345abc'), false)
  assert.equal(GOOGLE_ADS_ID_REGEX.test('aw-123456789'), false)
})

test('google ads conversion label validation: accepts valid labels', () => {
  assert.equal(GOOGLE_ADS_CONVERSION_LABEL_REGEX.test('abcDEF123'), true)
  assert.equal(GOOGLE_ADS_CONVERSION_LABEL_REGEX.test('my_label_123'), true)
  assert.equal(GOOGLE_ADS_CONVERSION_LABEL_REGEX.test('my-label-123'), true)
})

test('google ads conversion label validation: rejects invalid labels', () => {
  assert.equal(GOOGLE_ADS_CONVERSION_LABEL_REGEX.test(''), false)
  assert.equal(GOOGLE_ADS_CONVERSION_LABEL_REGEX.test('my label'), false)
  assert.equal(GOOGLE_ADS_CONVERSION_LABEL_REGEX.test('label!@#'), false)
})

test('google tag id validation: accepts GT IDs and rejects AW IDs', () => {
  assert.equal(GOOGLE_TAG_ID_REGEX.test('GT-NFDCLRLC'), true)
  assert.equal(GOOGLE_TAG_ID_REGEX.test('AW-17979105489'), false)
})

test('google tag id resolution: uses known Sophie GT tag for current AW config', () => {
  assert.equal(resolvePrimaryGoogleTagId({ googleAdsId: 'AW-17979105489' }), 'GT-NFDCLRLC')
})

test('google tag mount guard: requires a Google Ads destination', () => {
  assert.equal(shouldMountGoogleAdsTag({ id: 'AW-17979105489', label: null, tagId: null }), true)
  assert.equal(shouldMountGoogleAdsTag({ id: null, label: null, tagId: null }), false)
})

test('google ads conversion payload: send_to stays AW ID plus conversion label', () => {
  assert.deepStrictEqual(
    toGoogleAdsConversionPayload('AW-17979105489', '1E9OCP6wkZAcENHBjf1C'),
    {
      send_to: 'AW-17979105489/1E9OCP6wkZAcENHBjf1C',
      value: 1.0,
      currency: 'EUR'
    }
  )
})

const consentRestoreCases: Array<{ consent: ConsentValue, expected: boolean }> = [
  { consent: 'all', expected: true },
  { consent: 'essential', expected: false },
  { consent: 'acknowledged', expected: false },
  { consent: null, expected: false }
]

for (const { consent, expected } of consentRestoreCases) {
  test(`returning visitor consent restore: ${String(consent)} -> ${expected}`, () => {
    assert.equal(shouldRestoreConsent(consent), expected)
  })
}

test('ads context resolution: prefers route profile when route slug already has ads config', () => {
  const result = resolveAdsContext({
    routeSlug: 'sophie-jouan',
    routeProfile: { id: 'AW-123456789', label: 'abcDEF123', tagId: 'GT-NFDCLRLC' },
    tenantHomeSlug: 'ignored-home',
    tenantHomeProfile: { id: 'AW-99999', label: 'ignored' }
  })

  assert.deepStrictEqual(result, {
    slug: 'sophie-jouan',
    ads: { id: 'AW-123456789', label: 'abcDEF123', tagId: 'GT-NFDCLRLC' }
  })
})

test('ads context resolution: returns route slug with empty ads when route profile has no id yet', () => {
  const result = resolveAdsContext({
    routeSlug: 'sophie-jouan',
    routeProfile: { id: null, label: null }
  })

  assert.deepStrictEqual(result, {
    slug: 'sophie-jouan',
    ads: { id: null, label: null }
  })
})

test('ads context resolution: uses tenant home profile when route slug is absent', () => {
  const result = resolveAdsContext({
    tenantHomeSlug: 'sophie-jouan',
    tenantHomeProfile: { id: 'AW-123456789', label: 'abcDEF123' }
  })

  assert.deepStrictEqual(result, {
    slug: 'sophie-jouan',
    ads: { id: 'AW-123456789', label: 'abcDEF123' }
  })
})

test('ads context resolution: falls back to booking tenant slug when only public-tenant-discovery is loaded', () => {
  const result = resolveAdsContext({
    tenantDiscoverySlug: 'sophie-jouan'
  })

  assert.deepStrictEqual(result, {
    slug: 'sophie-jouan',
    ads: { id: null, label: null }
  })
})

test('ads context resolution: uses preloaded discovery profile when booking tenant profile is cached', () => {
  const result = resolveAdsContext({
    tenantDiscoverySlug: 'sophie-jouan',
    tenantDiscoveryProfile: { id: 'AW-123456789', label: 'abcDEF123' }
  })

  assert.deepStrictEqual(result, {
    slug: 'sophie-jouan',
    ads: { id: 'AW-123456789', label: 'abcDEF123' }
  })
})

test('ads context resolution: falls back to platform booking tenant slug when public-tenant route data is loaded', () => {
  const result = resolveAdsContext({
    tenantRouteSlug: 'sophie-jouan'
  })

  assert.deepStrictEqual(result, {
    slug: 'sophie-jouan',
    ads: { id: null, label: null }
  })
})

test('ads context resolution: returns null context when nothing is available', () => {
  const result = resolveAdsContext({})

  assert.deepStrictEqual(result, {
    slug: null,
    ads: { id: null, label: null }
  })
})

test('profile fallback fetch guard: fetches profile when slug exists but ads id is missing', () => {
  assert.equal(shouldFetchAdsProfile('sophie-jouan', null), true)
})

test('profile fallback fetch guard: does not fetch profile when ads id is already known', () => {
  assert.equal(shouldFetchAdsProfile('sophie-jouan', 'AW-123456789'), false)
})

test('profile fallback fetch guard: does not fetch profile without slug', () => {
  assert.equal(shouldFetchAdsProfile(null, null), false)
})
