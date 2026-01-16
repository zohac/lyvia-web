/**
 * Unit tests for checkout return URLs domain logic.
 *
 * These tests ensure RF7 compliance: returnUrls respect custom domains (white-label).
 *
 * @see Ticket RF7 - Front : returnUrls respectent le domaine (white-label)
 */
import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCheckoutReturnUrls,
  isValidReturnUrl,
  CHECKOUT_SESSION_ID_PLACEHOLDER,
  DEFAULT_CONSULTATION_PATHS
} from '../../app/features/consultation/domain/return-urls'

// =============================================================================
// buildCheckoutReturnUrls() - Core RF7 tests
// =============================================================================

test('buildCheckoutReturnUrls: uses platform domain correctly', () => {
  const urls = buildCheckoutReturnUrls('https://kaora.app')

  assert.equal(
    urls.success,
    `https://kaora.app/client/consultation/success?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`
  )
  assert.equal(urls.cancel, 'https://kaora.app/client/consultation/cancelled')
})

test('buildCheckoutReturnUrls: uses custom domain correctly (RF7 white-label)', () => {
  const urls = buildCheckoutReturnUrls('https://sophie-coaching.com')

  assert.equal(
    urls.success,
    `https://sophie-coaching.com/client/consultation/success?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`
  )
  assert.equal(urls.cancel, 'https://sophie-coaching.com/client/consultation/cancelled')
})

test('buildCheckoutReturnUrls: uses localhost for development', () => {
  const urls = buildCheckoutReturnUrls('http://localhost:3000')

  assert.equal(
    urls.success,
    `http://localhost:3000/client/consultation/success?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`
  )
  assert.equal(urls.cancel, 'http://localhost:3000/client/consultation/cancelled')
})

test('buildCheckoutReturnUrls: handles subdomains correctly', () => {
  const urls = buildCheckoutReturnUrls('https://coach.example.org')

  assert.equal(
    urls.success,
    `https://coach.example.org/client/consultation/success?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`
  )
  assert.equal(urls.cancel, 'https://coach.example.org/client/consultation/cancelled')
})

test('buildCheckoutReturnUrls: handles ports correctly', () => {
  const urls = buildCheckoutReturnUrls('https://dev.kaora.app:8443')

  assert.equal(
    urls.success,
    `https://dev.kaora.app:8443/client/consultation/success?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`
  )
  assert.equal(urls.cancel, 'https://dev.kaora.app:8443/client/consultation/cancelled')
})

test('buildCheckoutReturnUrls: allows custom success path', () => {
  const urls = buildCheckoutReturnUrls('https://example.com', {
    success: `/booking/confirmed?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`
  })

  assert.equal(
    urls.success,
    `https://example.com/booking/confirmed?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`
  )
  assert.equal(urls.cancel, 'https://example.com/client/consultation/cancelled')
})

test('buildCheckoutReturnUrls: allows custom cancel path', () => {
  const urls = buildCheckoutReturnUrls('https://example.com', {
    cancel: '/booking/cancelled'
  })

  assert.equal(
    urls.success,
    `https://example.com/client/consultation/success?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`
  )
  assert.equal(urls.cancel, 'https://example.com/booking/cancelled')
})

test('buildCheckoutReturnUrls: allows both custom paths', () => {
  const urls = buildCheckoutReturnUrls('https://example.com', {
    success: `/custom/success?sid=${CHECKOUT_SESSION_ID_PLACEHOLDER}`,
    cancel: '/custom/cancel'
  })

  assert.equal(
    urls.success,
    `https://example.com/custom/success?sid=${CHECKOUT_SESSION_ID_PLACEHOLDER}`
  )
  assert.equal(urls.cancel, 'https://example.com/custom/cancel')
})

test('buildCheckoutReturnUrls: handles empty origin gracefully (SSR context)', () => {
  const urls = buildCheckoutReturnUrls('')

  assert.equal(
    urls.success,
    `/client/consultation/success?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`
  )
  assert.equal(urls.cancel, '/client/consultation/cancelled')
})

// =============================================================================
// isValidReturnUrl() - Validation tests
// =============================================================================

test('isValidReturnUrl: accepts valid HTTPS URL', () => {
  assert.equal(isValidReturnUrl('https://example.com/success'), true)
})

test('isValidReturnUrl: accepts valid HTTP URL (for dev)', () => {
  assert.equal(isValidReturnUrl('http://localhost:3000/success'), true)
})

test('isValidReturnUrl: rejects relative URL', () => {
  assert.equal(isValidReturnUrl('/success'), false)
})

test('isValidReturnUrl: rejects empty string', () => {
  assert.equal(isValidReturnUrl(''), false)
})

test('isValidReturnUrl: rejects malformed URL', () => {
  assert.equal(isValidReturnUrl('not-a-url'), false)
})

test('isValidReturnUrl: rejects javascript protocol', () => {
  assert.equal(isValidReturnUrl('javascript:alert(1)'), false)
})

test('isValidReturnUrl: rejects data protocol', () => {
  assert.equal(isValidReturnUrl('data:text/html,<h1>test</h1>'), false)
})

// =============================================================================
// Constants tests
// =============================================================================

test('CHECKOUT_SESSION_ID_PLACEHOLDER has expected value', () => {
  assert.equal(CHECKOUT_SESSION_ID_PLACEHOLDER, '{CHECKOUT_SESSION_ID}')
})

test('DEFAULT_CONSULTATION_PATHS has expected values', () => {
  assert.equal(
    DEFAULT_CONSULTATION_PATHS.success,
    '/client/consultation/success?session_id={CHECKOUT_SESSION_ID}'
  )
  assert.equal(DEFAULT_CONSULTATION_PATHS.cancel, '/client/consultation/cancelled')
})

// =============================================================================
// RF7 DoD compliance tests
// =============================================================================

test('RF7 DoD: no hardcoded kaora.app in return URLs', () => {
  // Using a custom domain should NOT produce kaora.app URLs
  const urls = buildCheckoutReturnUrls('https://custom-domain.com')

  assert.equal(urls.success.includes('kaora.app'), false)
  assert.equal(urls.cancel.includes('kaora.app'), false)
})

test('RF7 DoD: no hardcoded localhost in return URLs', () => {
  // Using a production domain should NOT produce localhost URLs
  const urls = buildCheckoutReturnUrls('https://production.com')

  assert.equal(urls.success.includes('localhost'), false)
  assert.equal(urls.cancel.includes('localhost'), false)
})

test('RF7 DoD: return URLs stay on same domain (no cross-domain)', () => {
  const origin = 'https://sophie-coaching.com'
  const urls = buildCheckoutReturnUrls(origin)

  // Parse URLs and verify they match the origin
  const successUrl = new URL(urls.success)
  const cancelUrl = new URL(urls.cancel)

  assert.equal(successUrl.origin, origin)
  assert.equal(cancelUrl.origin, origin)
})
