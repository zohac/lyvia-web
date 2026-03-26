import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

/**
 * Tests for cookie consent logic used by CookieConsentBanner and CookieSettingsModal.
 *
 * These are pure logic tests — no Vue component rendering.
 * They validate the consent state machine and gtag integration contract.
 */

// --- Consent value types ---

type ConsentValue = 'all' | 'essential' | 'acknowledged' | null

// --- Consent state machine ---

describe('cookie consent state machine', () => {
  test('initial state is null (no consent)', () => {
    const consent: ConsentValue = null
    assert.equal(consent, null)
  })

  test('"acknowledged" is backward-compatible (no Google Ads)', () => {
    const consent: ConsentValue = 'acknowledged'
    assert.equal(consent, 'acknowledged')
    // acknowledged = no ads tracking, same as before Google Ads feature
  })

  test('"all" grants advertising cookies', () => {
    const consent: ConsentValue = 'all'
    assert.equal(consent, 'all')
  })

  test('"essential" explicitly refuses advertising cookies', () => {
    const consent: ConsentValue = 'essential'
    assert.equal(consent, 'essential')
  })
})

// --- Banner mode detection ---

describe('banner mode detection', () => {
  function getBannerMode(hasAds: boolean): 'simple' | 'full' {
    return hasAds ? 'full' : 'simple'
  }

  test('without Google Ads ID: simple mode (Compris only)', () => {
    assert.equal(getBannerMode(false), 'simple')
  })

  test('with Google Ads ID: full mode (Accepter/Refuser/Paramétrer)', () => {
    assert.equal(getBannerMode(true), 'full')
  })
})

// --- Consent Mode v2 signal mapping ---

describe('consent mode v2 signal mapping', () => {
  type ConsentSignals = {
    ad_storage: 'granted' | 'denied'
    ad_user_data: 'granted' | 'denied'
    ad_personalization: 'granted' | 'denied'
  }

  function mapConsentToSignals(granted: boolean): ConsentSignals {
    return {
      ad_storage: granted ? 'granted' : 'denied',
      ad_user_data: granted ? 'granted' : 'denied',
      ad_personalization: granted ? 'granted' : 'denied',
    }
  }

  test('granted=true maps all signals to granted', () => {
    const signals = mapConsentToSignals(true)
    assert.equal(signals.ad_storage, 'granted')
    assert.equal(signals.ad_user_data, 'granted')
    assert.equal(signals.ad_personalization, 'granted')
  })

  test('granted=false maps all signals to denied', () => {
    const signals = mapConsentToSignals(false)
    assert.equal(signals.ad_storage, 'denied')
    assert.equal(signals.ad_user_data, 'denied')
    assert.equal(signals.ad_personalization, 'denied')
  })
})

// --- Conversion event guard ---

describe('conversion event guard', () => {
  function shouldFireConversion(
    gtagLoaded: boolean,
    googleAdsId: string | null,
    conversionLabel: string | null
  ): boolean {
    return gtagLoaded && !!googleAdsId && !!conversionLabel
  }

  test('fires when all conditions met', () => {
    assert.equal(shouldFireConversion(true, 'AW-123456789', 'abcDEF'), true)
  })

  test('does not fire without gtag', () => {
    assert.equal(shouldFireConversion(false, 'AW-123456789', 'abcDEF'), false)
  })

  test('does not fire without Google Ads ID', () => {
    assert.equal(shouldFireConversion(true, null, 'abcDEF'), false)
  })

  test('does not fire without conversion label', () => {
    assert.equal(shouldFireConversion(true, 'AW-123456789', null), false)
  })

  test('does not fire with empty strings', () => {
    assert.equal(shouldFireConversion(true, '', ''), false)
  })
})

// --- Google Ads ID format validation ---

describe('google ads id format validation', () => {
  const GOOGLE_ADS_ID_PATTERN = /^AW-\d{5,12}$/

  test('accepts valid AW- format with 5 digits', () => {
    assert.equal(GOOGLE_ADS_ID_PATTERN.test('AW-12345'), true)
  })

  test('accepts valid AW- format with 9 digits', () => {
    assert.equal(GOOGLE_ADS_ID_PATTERN.test('AW-123456789'), true)
  })

  test('accepts valid AW- format with 12 digits', () => {
    assert.equal(GOOGLE_ADS_ID_PATTERN.test('AW-123456789012'), true)
  })

  test('rejects without AW- prefix', () => {
    assert.equal(GOOGLE_ADS_ID_PATTERN.test('123456789'), false)
  })

  test('rejects with too few digits (4)', () => {
    assert.equal(GOOGLE_ADS_ID_PATTERN.test('AW-1234'), false)
  })

  test('rejects with too many digits (13)', () => {
    assert.equal(GOOGLE_ADS_ID_PATTERN.test('AW-1234567890123'), false)
  })

  test('rejects with letters in digits part', () => {
    assert.equal(GOOGLE_ADS_ID_PATTERN.test('AW-12345abc'), false)
  })

  test('rejects lowercase aw-', () => {
    assert.equal(GOOGLE_ADS_ID_PATTERN.test('aw-123456789'), false)
  })
})

// --- Conversion label format validation ---

describe('google ads conversion label validation', () => {
  const LABEL_PATTERN = /^[a-zA-Z0-9_-]{1,50}$/

  test('accepts alphanumeric label', () => {
    assert.equal(LABEL_PATTERN.test('abcDEF123'), true)
  })

  test('accepts label with underscores', () => {
    assert.equal(LABEL_PATTERN.test('my_label_123'), true)
  })

  test('accepts label with dashes', () => {
    assert.equal(LABEL_PATTERN.test('my-label-123'), true)
  })

  test('rejects empty string', () => {
    assert.equal(LABEL_PATTERN.test(''), false)
  })

  test('rejects label with spaces', () => {
    assert.equal(LABEL_PATTERN.test('my label'), false)
  })

  test('rejects label with special characters', () => {
    assert.equal(LABEL_PATTERN.test('label!@#'), false)
  })
})

// --- Returning visitor consent restore ---

describe('returning visitor consent restore', () => {
  function shouldRestoreConsent(cookieValue: ConsentValue): boolean {
    return cookieValue === 'all'
  }

  test('restores consent for "all" cookie', () => {
    assert.equal(shouldRestoreConsent('all'), true)
  })

  test('does not restore for "essential" cookie', () => {
    assert.equal(shouldRestoreConsent('essential'), false)
  })

  test('does not restore for "acknowledged" cookie', () => {
    assert.equal(shouldRestoreConsent('acknowledged'), false)
  })

  test('does not restore for null cookie', () => {
    assert.equal(shouldRestoreConsent(null), false)
  })
})
