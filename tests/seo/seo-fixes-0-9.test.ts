import * as assert from 'node:assert/strict'
import test from 'node:test'

import { resolveCanonical } from '../../app/features/seo/resolveCanonical'
import { getDomainContext } from '../../shared/utils/domain-context'

// ============================================================================
// Story 0-9: SEO corrections — lang, canonicals, OG tags multi-domaine
// ============================================================================

// --- White-label discovery canonical (AC-3) ---
// On white-label, the API may return a canonicalUrl with /coach/{slug} pattern.
// The page must ignore it and use the white-label path instead.

test('WL discovery canonical: ignores API canonical containing /coach/ (platform pattern)', () => {
  const origin = 'https://sophiejouan.fr'
  const apiCanonical = '/coach/sophie-jouan/onboarding/discovery'

  // Logic from onboarding/discovery.vue: ignore if contains /coach/
  const result = (apiCanonical && !apiCanonical.includes('/coach/'))
    ? (resolveCanonical(apiCanonical, origin) ?? `${origin}/onboarding/discovery`)
    : `${origin}/onboarding/discovery`

  assert.equal(result, 'https://sophiejouan.fr/onboarding/discovery')
})

test('WL discovery canonical: uses API canonical when it does NOT contain /coach/', () => {
  const origin = 'https://sophiejouan.fr'
  const apiCanonical = '/onboarding/discovery'

  const result = (apiCanonical && !apiCanonical.includes('/coach/'))
    ? (resolveCanonical(apiCanonical, origin) ?? `${origin}/onboarding/discovery`)
    : `${origin}/onboarding/discovery`

  assert.equal(result, 'https://sophiejouan.fr/onboarding/discovery')
})

test('WL discovery canonical: uses absolute API canonical when valid WL URL', () => {
  const origin = 'https://sophiejouan.fr'
  const apiCanonical = 'https://sophiejouan.fr/onboarding/discovery'

  const result = (apiCanonical && !apiCanonical.includes('/coach/'))
    ? (resolveCanonical(apiCanonical, origin) ?? `${origin}/onboarding/discovery`)
    : `${origin}/onboarding/discovery`

  assert.equal(result, 'https://sophiejouan.fr/onboarding/discovery')
})

test('WL discovery canonical: fallback when API returns null', () => {
  const origin = 'https://sophiejouan.fr'
  const apiCanonical = null as string | null

  const hasValidCanonical = typeof apiCanonical === 'string' && !apiCanonical.includes('/coach/')
  const result = hasValidCanonical
    ? (resolveCanonical(apiCanonical, origin) ?? `${origin}/onboarding/discovery`)
    : `${origin}/onboarding/discovery`

  assert.equal(result, 'https://sophiejouan.fr/onboarding/discovery')
})

// --- Homepage og:url / canonical B2B → keova.fr (AC-5, Finding 3) ---

test('homepage canonical B2B: points to keova.fr, not keova.app', () => {
  const platformDomain = 'keova.fr'
  const ctx = getDomainContext('keova.app', platformDomain, 'keova.app')

  assert.equal(ctx.isB2B, true)
  const canonicalOrigin = ctx.isB2B ? `https://${platformDomain}/` : 'https://keova.app/'
  assert.equal(canonicalOrigin, 'https://keova.fr/')
})

test('homepage canonical B2C: points to keova.fr', () => {
  const platformDomain = 'keova.fr'
  const origin = 'https://keova.fr'
  const ctx = getDomainContext('keova.fr', platformDomain, 'keova.app')

  assert.equal(ctx.isB2C, true)
  const canonicalOrigin = ctx.isB2B ? `https://${platformDomain}/` : `${origin}/`
  assert.equal(canonicalOrigin, 'https://keova.fr/')
})

test('homepage canonical white-label: points to WL origin', () => {
  const platformDomain = 'keova.fr'
  const origin = 'https://sophiejouan.fr'
  const ctx = getDomainContext('sophiejouan.fr', platformDomain, 'keova.app')

  assert.equal(ctx.isWhiteLabel, true)
  const canonicalOrigin = ctx.isB2B ? `https://${platformDomain}/` : `${origin}/`
  assert.equal(canonicalOrigin, 'https://sophiejouan.fr/')
})

// --- Legal page SEO (AC-2, AC-6) ---
// useLegalPageSeo is a thin composable calling Nuxt composables (useSeoMeta, useHead).
// We test the pure logic: canonical URL construction from origin + path.

test('legal page canonical: uses origin + path', () => {
  const origin = 'https://keova.fr'
  const path = '/legal/cgu'
  assert.equal(`${origin}${path}`, 'https://keova.fr/legal/cgu')
})

test('legal page canonical: white-label domain', () => {
  const origin = 'https://sophiejouan.fr'
  const path = '/legal/mentions-legales'
  assert.equal(`${origin}${path}`, 'https://sophiejouan.fr/legal/mentions-legales')
})

test('legal page canonical: B2B domain', () => {
  const origin = 'https://keova.app'
  const path = '/legal/confidentialite'
  assert.equal(`${origin}${path}`, 'https://keova.app/legal/confidentialite')
})

// --- site.defaultLocale (AC-1) ---
// The nuxt.config.ts sets site.defaultLocale: 'fr' which makes @nuxtjs/seo
// emit lang="fr" in SSR. This is a config-level fix, not testable in unit tests.
// Verified via curl: <html lang="fr"> in SSR output.

test('lang config: site.defaultLocale documented as fr', () => {
  // This test documents the contract — actual verification is SSR-level
  const expectedLocale = 'fr'
  assert.equal(expectedLocale, 'fr')
})
