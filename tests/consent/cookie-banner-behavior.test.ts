import * as assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  getAcceptConsentValue,
  getBannerMode,
  getConsentValueFromPreferences,
  shouldShowConsentBanner,
  shouldShowConsentBannerNow,
  toConsentSignals,
  type ConsentValue
} from '../../app/features/consent/consent-logic'

// ─────────────────────────────────────────────────────────────────────────────
// Race condition — hotfix-13 review follow-up #4
// The banner MUST NOT appear until the tracking orchestrator has resolved the
// domain context. Otherwise a white-label visitor may see the `simple` mode
// momentarily and click "Compris", locking in `cookieConsent=acknowledged`
// before Google Ads is even detected.
// ─────────────────────────────────────────────────────────────────────────────

test('banner behavior: hides banner while tracking unresolved (race protection)', () => {
  assert.equal(shouldShowConsentBannerNow(null, false), false)
})

test('banner behavior: shows banner once tracking resolved and no consent stored', () => {
  assert.equal(shouldShowConsentBannerNow(null, true), true)
})

test('banner behavior: never shows banner when consent already set (tracking resolved)', () => {
  const settled: ConsentValue[] = ['all', 'essential', 'acknowledged']
  for (const c of settled) {
    assert.equal(
      shouldShowConsentBannerNow(c, true),
      false,
      `banner must stay hidden when consent='${c}'`
    )
  }
})

test('banner behavior: never shows banner when consent already set (tracking unresolved)', () => {
  // Even in the race window, a returning user with a settled cookie must not
  // see the banner — defence in depth.
  assert.equal(shouldShowConsentBannerNow('all', false), false)
  assert.equal(shouldShowConsentBannerNow('essential', false), false)
  assert.equal(shouldShowConsentBannerNow('acknowledged', false), false)
})

test('banner behavior: shouldShowConsentBannerNow composes shouldShowConsentBanner + tracking gate', () => {
  // The race-aware helper must preserve the original semantics once the
  // tracking is resolved — it only adds the tracking gate.
  for (const c of [null, 'all', 'essential', 'acknowledged'] as ConsentValue[]) {
    assert.equal(
      shouldShowConsentBannerNow(c, true),
      shouldShowConsentBanner(c),
      `parity expected for consent='${c}' when tracking resolved`
    )
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// End-to-end flows — what each button actually does to cookie + consent signals
// ─────────────────────────────────────────────────────────────────────────────

test('banner behavior: full mode "Accepter" → cookieConsent=all + ad signals granted', () => {
  // hasAds = true → mode full → acceptAll()
  const hasAds = true
  assert.equal(getBannerMode(hasAds), 'full')
  assert.equal(getAcceptConsentValue(hasAds), 'all')

  const signals = toConsentSignals(true)
  assert.equal(signals.ad_storage, 'granted')
  assert.equal(signals.ad_user_data, 'granted')
  assert.equal(signals.ad_personalization, 'granted')
})

test('banner behavior: full mode "Refuser" → cookieConsent=essential + ad signals denied', () => {
  const hasAds = true
  assert.equal(getConsentValueFromPreferences(false, hasAds), 'essential')

  const signals = toConsentSignals(false)
  assert.equal(signals.ad_storage, 'denied')
  assert.equal(signals.ad_user_data, 'denied')
  assert.equal(signals.ad_personalization, 'denied')
})

test('banner behavior: simple mode "Compris" → cookieConsent=acknowledged (no ad signals sent)', () => {
  // hasAds = false → mode simple → acknowledge()
  const hasAds = false
  assert.equal(getBannerMode(hasAds), 'simple')
  // The simple acknowledge path posts 'acknowledged' directly — not the
  // acceptance helper (no ads to grant).
  assert.equal(getAcceptConsentValue(hasAds), 'acknowledged')
})

// ─────────────────────────────────────────────────────────────────────────────
// Template ↔ handler coupling — verify the Vue template binds the correct
// handler to each button's click event, so future refactors can't silently
// rewire the cookie-writing logic.
// ─────────────────────────────────────────────────────────────────────────────

const BANNER_SOURCE = readFileSync(
  join(process.cwd(), 'app', 'components', 'organisms', 'CookieConsentBanner.vue'),
  'utf8'
)

test('banner template: simple mode block binds Compris button to acknowledge handler', () => {
  const simpleBlockMatch = BANNER_SOURCE.match(
    /v-if="bannerMode === 'simple'"[\s\S]*?<\/template>/
  )
  if (!simpleBlockMatch) {
    assert.fail('simple mode block must exist in CookieConsentBanner.vue')
  }
  const block: string = simpleBlockMatch[0]

  assert.match(block, /@click="acknowledge"/, 'simple mode must wire acknowledge handler')
  assert.match(block, /Compris/, 'simple mode must expose the "Compris" button')
})

test('banner template: full mode block binds Accepter/Refuser to acceptAll/rejectAds', () => {
  const fullBlockMatch = BANNER_SOURCE.match(
    /<!-- With ads: accept \/ reject \/ settings -->[\s\S]*?<\/template>/
  )
  if (!fullBlockMatch) {
    assert.fail('full mode block must exist in CookieConsentBanner.vue')
  }
  const block: string = fullBlockMatch[0]

  assert.match(block, /@click="acceptAll"[\s\S]*Accepter/, 'Accepter button must call acceptAll')
  assert.match(block, /@click="rejectAds"[\s\S]*Refuser/, 'Refuser button must call rejectAds')
  assert.match(block, /@click="openSettings"/, 'Paramétrer button must call openSettings')
})

test('banner script: uses shouldShowConsentBannerNow gated by trackingResolved', () => {
  // Guardrail: ensure the banner keeps using the race-aware helper and does
  // NOT revert to the plain `shouldShowConsentBanner` (which would re-open
  // the race). If we ever accept the plain helper back, it must be a
  // deliberate edit that also updates this test.
  assert.match(
    BANNER_SOURCE,
    /shouldShowConsentBannerNow\s*\(/,
    'CookieConsentBanner must call shouldShowConsentBannerNow (race-aware)'
  )
  assert.match(
    BANNER_SOURCE,
    /useState<\s*boolean\s*>\s*\(\s*['"]tracking-resolved['"]/,
    'CookieConsentBanner must read the shared tracking-resolved state'
  )
})
