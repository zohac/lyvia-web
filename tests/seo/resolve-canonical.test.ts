import * as assert from 'node:assert/strict'
import test from 'node:test'

import { resolveCanonical } from '../../app/features/seo/resolveCanonical'

// --- resolveCanonical contract ---

test('resolveCanonical: returns undefined when canonicalPath is null', () => {
  assert.equal(resolveCanonical(null, 'https://keova.fr'), undefined)
})

test('resolveCanonical: returns undefined when canonicalPath is undefined', () => {
  assert.equal(resolveCanonical(undefined, 'https://keova.fr'), undefined)
})

test('resolveCanonical: returns undefined when canonicalPath is empty string', () => {
  assert.equal(resolveCanonical('', 'https://keova.fr'), undefined)
})

test('resolveCanonical: returns absolute URL as-is when starts with http', () => {
  const url = 'https://sophie-jouan.fr/onboarding/discovery'
  assert.equal(resolveCanonical(url, 'https://keova.fr'), url)
})

test('resolveCanonical: returns absolute URL for https', () => {
  const url = 'https://example.com/path'
  assert.equal(resolveCanonical(url, 'https://keova.fr'), url)
})

test('resolveCanonical: returns absolute URL for http', () => {
  const url = 'http://example.com/path'
  assert.equal(resolveCanonical(url, 'https://keova.fr'), url)
})

test('resolveCanonical: prepends origin to relative path', () => {
  assert.equal(
    resolveCanonical('/coach/sophie-jouan', 'https://keova.fr'),
    'https://keova.fr/coach/sophie-jouan'
  )
})

test('resolveCanonical: prepends origin to root path', () => {
  assert.equal(
    resolveCanonical('/', 'https://sophie-jouan.fr'),
    'https://sophie-jouan.fr/'
  )
})

// --- fallback pattern (used by calling pages via ??) ---

test('canonical fallback pattern: white-label booking uses ?? when resolveCanonical returns undefined', () => {
  const origin = 'https://sophie-jouan.fr'
  const result = resolveCanonical(undefined, origin) ?? `${origin}/onboarding/discovery`
  assert.equal(result, 'https://sophie-jouan.fr/onboarding/discovery')
})

test('canonical fallback pattern: white-label booking uses DB value when configured', () => {
  const origin = 'https://sophie-jouan.fr'
  const dbCanonical = 'https://sophie-jouan.fr/custom-booking'
  const result = resolveCanonical(dbCanonical, origin) ?? `${origin}/onboarding/discovery`
  assert.equal(result, 'https://sophie-jouan.fr/custom-booking')
})

test('canonical fallback pattern: platform booking uses ?? when resolveCanonical returns undefined', () => {
  const origin = 'https://keova.fr'
  const slug = 'sophie-jouan'
  const result = resolveCanonical(undefined, origin) ?? `${origin}/coach/${slug}/onboarding/discovery`
  assert.equal(result, 'https://keova.fr/coach/sophie-jouan/onboarding/discovery')
})

test('canonical fallback pattern: platform booking uses DB relative path when configured', () => {
  const origin = 'https://keova.fr'
  const slug = 'sophie-jouan'
  const result = resolveCanonical('/coach/sophie-jouan/onboarding/discovery', origin) ?? `${origin}/coach/${slug}/onboarding/discovery`
  assert.equal(result, 'https://keova.fr/coach/sophie-jouan/onboarding/discovery')
})

test('canonical fallback pattern: platform profile uses ?? when resolveCanonical returns undefined', () => {
  const origin = 'https://keova.fr'
  const slug = 'sophie-jouan'
  const result = resolveCanonical(undefined, origin) ?? `${origin}/coach/${slug}`
  assert.equal(result, 'https://keova.fr/coach/sophie-jouan')
})

test('canonical fallback pattern: platform profile uses DB value when configured', () => {
  const origin = 'https://keova.fr'
  const slug = 'sophie-jouan'
  const dbCanonical = 'https://keova.fr/coach/sophie-jouan'
  const result = resolveCanonical(dbCanonical, origin) ?? `${origin}/coach/${slug}`
  assert.equal(result, 'https://keova.fr/coach/sophie-jouan')
})

// --- B2B cross-domaine canonical (MD.2b CR1-RFU-1) ---
// On B2B, the page forces canonical to keova.fr regardless of seo_metadata content.
// This mirrors the exact logic in coach/[slug]/index.vue.

test('B2B canonical: forced to keova.fr even when seo_metadata has no canonical', () => {
  const isB2B = true
  const platformDomain = 'keova.fr'
  const slug = 'sophie-jouan'
  const canonicalOrigin = isB2B ? `https://${platformDomain}` : 'https://keova.app'
  const b2bCanonical = `${canonicalOrigin}/coach/${slug}`
  const seoCanonical: string | null = null

  const result = isB2B ? b2bCanonical : (resolveCanonical(seoCanonical, canonicalOrigin) ?? b2bCanonical)
  assert.equal(result, 'https://keova.fr/coach/sophie-jouan')
})

test('B2B canonical: forced to keova.fr even when seo_metadata has absolute keova.app URL', () => {
  const isB2B = true
  const platformDomain = 'keova.fr'
  const slug = 'sophie-jouan'
  const canonicalOrigin = isB2B ? `https://${platformDomain}` : 'https://keova.app'
  const b2bCanonical = `${canonicalOrigin}/coach/${slug}`
  const seoCanonical = 'https://keova.app/coach/sophie-jouan'

  const result = isB2B ? b2bCanonical : (resolveCanonical(seoCanonical, canonicalOrigin) ?? b2bCanonical)
  assert.equal(result, 'https://keova.fr/coach/sophie-jouan')
})

test('non-B2B canonical: respects absolute seo_metadata canonical', () => {
  const isB2B = false
  const platformDomain = 'keova.fr'
  const slug = 'sophie-jouan'
  const canonicalOrigin = isB2B ? `https://${platformDomain}` : 'https://keova.fr'
  const b2bCanonical = `${canonicalOrigin}/coach/${slug}`
  const seoCanonical = 'https://sophie-jouan.fr/'

  const result = isB2B ? b2bCanonical : (resolveCanonical(seoCanonical, canonicalOrigin) ?? b2bCanonical)
  assert.equal(result, 'https://sophie-jouan.fr/')
})
