import * as assert from 'node:assert/strict'
import test from 'node:test'

import { resolveCanonical } from '../../app/features/seo/resolveCanonical'

// --- resolveCanonical contract ---

test('resolveCanonical: returns undefined when canonicalPath is null', () => {
  assert.equal(resolveCanonical(null, 'https://kaora.fr'), undefined)
})

test('resolveCanonical: returns undefined when canonicalPath is undefined', () => {
  assert.equal(resolveCanonical(undefined, 'https://kaora.fr'), undefined)
})

test('resolveCanonical: returns undefined when canonicalPath is empty string', () => {
  assert.equal(resolveCanonical('', 'https://kaora.fr'), undefined)
})

test('resolveCanonical: returns absolute URL as-is when starts with http', () => {
  const url = 'https://sophie-jouan.fr/onboarding/discovery'
  assert.equal(resolveCanonical(url, 'https://kaora.fr'), url)
})

test('resolveCanonical: returns absolute URL for https', () => {
  const url = 'https://example.com/path'
  assert.equal(resolveCanonical(url, 'https://kaora.fr'), url)
})

test('resolveCanonical: returns absolute URL for http', () => {
  const url = 'http://example.com/path'
  assert.equal(resolveCanonical(url, 'https://kaora.fr'), url)
})

test('resolveCanonical: prepends origin to relative path', () => {
  assert.equal(
    resolveCanonical('/coach/sophie-jouan', 'https://kaora.fr'),
    'https://kaora.fr/coach/sophie-jouan'
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
  const origin = 'https://kaora.fr'
  const slug = 'sophie-jouan'
  const result = resolveCanonical(undefined, origin) ?? `${origin}/coach/${slug}/onboarding/discovery`
  assert.equal(result, 'https://kaora.fr/coach/sophie-jouan/onboarding/discovery')
})

test('canonical fallback pattern: platform booking uses DB relative path when configured', () => {
  const origin = 'https://kaora.fr'
  const slug = 'sophie-jouan'
  const result = resolveCanonical('/coach/sophie-jouan/onboarding/discovery', origin) ?? `${origin}/coach/${slug}/onboarding/discovery`
  assert.equal(result, 'https://kaora.fr/coach/sophie-jouan/onboarding/discovery')
})

test('canonical fallback pattern: platform profile uses ?? when resolveCanonical returns undefined', () => {
  const origin = 'https://kaora.fr'
  const slug = 'sophie-jouan'
  const result = resolveCanonical(undefined, origin) ?? `${origin}/coach/${slug}`
  assert.equal(result, 'https://kaora.fr/coach/sophie-jouan')
})

test('canonical fallback pattern: platform profile uses DB value when configured', () => {
  const origin = 'https://kaora.fr'
  const slug = 'sophie-jouan'
  const dbCanonical = 'https://kaora.fr/coach/sophie-jouan'
  const result = resolveCanonical(dbCanonical, origin) ?? `${origin}/coach/${slug}`
  assert.equal(result, 'https://kaora.fr/coach/sophie-jouan')
})
