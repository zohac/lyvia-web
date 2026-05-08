import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { buildPageViewPayload } from '../../app/features/analytics/helpers/build-page-view-payload'

const TENANT = '11111111-1111-1111-1111-111111111111'
const HOSTNAME = 'sophiejouan.fr'
const UA_DESKTOP = 'Mozilla/5.0 (Macintosh) AppleWebKit Chrome/120 Safari/537.36'

function payload(overrides: Partial<Parameters<typeof buildPageViewPayload>[0]> = {}) {
  return buildPageViewPayload({
    tenantId: TENANT,
    pathname: '/',
    search: '',
    referrer: '',
    hostname: HOSTNAME,
    userAgent: UA_DESKTOP,
    ...overrides
  })
}

/**
 * Story 0-32 R1-F3 — behavioural coverage of buildPageViewPayload.
 *
 * The composable usePageTracking is a thin wrapper over this pure function;
 * testing it directly is the only way to prove the *real* outgoing payload
 * (rather than the source-text matching the previous wiring tests did).
 */

describe('0-32 buildPageViewPayload — required fields', () => {
  test('always sets tenantId, pagePath, deviceType', () => {
    const body = payload({ pathname: '/coach/sophie-jouan' })
    assert.equal(body.tenantId, TENANT)
    assert.equal(body.pagePath, '/coach/sophie-jouan')
    assert.equal(body.deviceType, 'desktop')
  })

  test('detects mobile from userAgent', () => {
    const body = payload({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148'
    })
    assert.equal(body.deviceType, 'mobile')
  })
})

describe('0-32 buildPageViewPayload — UTM passthrough (independent of click IDs)', () => {
  test('captures utm_source / utm_medium / utm_campaign', () => {
    const body = payload({
      search: '?utm_source=linkedin&utm_medium=social&utm_campaign=spring-2026'
    })
    assert.equal(body.utmSource, 'linkedin')
    assert.equal(body.utmMedium, 'social')
    assert.equal(body.utmCampaign, 'spring-2026')
  })
})

describe('0-32 buildPageViewPayload — paidClickIds branch (AC-6)', () => {
  test('AC-6 branch present: ?gclid=ABC → body.paidClickIds = { gclid: "ABC" }', () => {
    const body = payload({ search: '?gclid=ABC' })
    assert.deepEqual(body.paidClickIds, { gclid: 'ABC' })
  })

  test('AC-6 branch present: ?msclkid=XYZ → body.paidClickIds = { msclkid: "XYZ" }', () => {
    const body = payload({ search: '?msclkid=XYZ' })
    assert.deepEqual(body.paidClickIds, { msclkid: 'XYZ' })
  })

  test('AC-6 branch present: combo gclid + fbclid + utm', () => {
    const body = payload({
      search: '?gclid=ABC&fbclid=DEF&utm_source=facebook'
    })
    assert.deepEqual(body.paidClickIds, { gclid: 'ABC', fbclid: 'DEF' })
    // UTM still propagated independently
    assert.equal(body.utmSource, 'facebook')
  })

  test('AC-6 branch absent: empty search → paidClickIds key NOT in payload (not null, not {})', () => {
    const body = payload({ search: '' })
    assert.equal(
      Object.prototype.hasOwnProperty.call(body, 'paidClickIds'),
      false,
      'paidClickIds key must be absent (not null, not {})'
    )
  })

  test('AC-6 branch absent: only UTM (no click ID) → paidClickIds key NOT in payload', () => {
    const body = payload({ search: '?utm_source=newsletter' })
    assert.equal(
      Object.prototype.hasOwnProperty.call(body, 'paidClickIds'),
      false
    )
    // utm still captured though
    assert.equal(body.utmSource, 'newsletter')
  })

  test('AC-6 branch absent: ?gclid= (empty value) → paidClickIds NOT in payload', () => {
    const body = payload({ search: '?gclid=' })
    assert.equal(
      Object.prototype.hasOwnProperty.call(body, 'paidClickIds'),
      false
    )
  })
})

describe('0-32 buildPageViewPayload — referrer behaviour', () => {
  test('extracts external referrer domain', () => {
    const body = payload({
      referrer: 'https://www.google.com/search?q=menopause'
    })
    assert.equal(body.referrerDomain, 'www.google.com')
  })

  test('drops same-origin referrer (internal navigation)', () => {
    const body = payload({
      referrer: `https://${HOSTNAME}/onboarding/discovery`
    })
    assert.equal(body.referrerDomain, undefined)
  })
})
