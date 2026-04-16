import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCoachHubDescription,
  buildCoachHubTitle,
  normalizeVerifiedWhiteLabelDomain,
  resolveCoachProfileCanonical,
  resolveCoachProfilePageVariant
} from '../../app/features/seo/coach-profile-seo'

test('resolveCoachProfilePageVariant: platform + verified WL domain => hub', () => {
  assert.equal(resolveCoachProfilePageVariant(true, 'sophie-jouan.fr'), 'hub')
})

test('resolveCoachProfilePageVariant: platform + null verified WL domain => full', () => {
  assert.equal(resolveCoachProfilePageVariant(true, null), 'full')
})

test('resolveCoachProfilePageVariant: white-label host => full even with verified WL domain', () => {
  assert.equal(resolveCoachProfilePageVariant(false, 'sophie-jouan.fr'), 'full')
})

test('normalizeVerifiedWhiteLabelDomain: trims and lowercases domain', () => {
  assert.equal(normalizeVerifiedWhiteLabelDomain('  Sophie-Jouan.FR '), 'sophie-jouan.fr')
})

test('resolveCoachProfileCanonical: hub forces keova.fr even when SEO override points to WL domain', () => {
  const result = resolveCoachProfileCanonical({
    variant: 'hub',
    isB2B: false,
    platformDomain: 'keova.fr',
    slug: 'sophie-jouan',
    seoCanonicalUrl: 'https://sophie-jouan.fr/',
    origin: 'https://keova.fr'
  })

  assert.equal(result, 'https://keova.fr/coach/sophie-jouan')
})

test('resolveCoachProfileCanonical: full page keeps explicit SEO canonical when not hub', () => {
  const result = resolveCoachProfileCanonical({
    variant: 'full',
    isB2B: false,
    platformDomain: 'keova.fr',
    slug: 'sophie-jouan',
    seoCanonicalUrl: 'https://sophie-jouan.fr/',
    origin: 'https://keova.fr'
  })

  assert.equal(result, 'https://sophie-jouan.fr/')
})

test('buildCoachHubTitle: includes specialty when present', () => {
  assert.equal(
    buildCoachHubTitle('Sophie Jouan', 'Nutrition'),
    'Sophie Jouan — Coach Nutrition — Keova'
  )
})

test('buildCoachHubDescription: truncates long bio to 160 chars max', () => {
  const result = buildCoachHubDescription('Sophie Jouan', 'a'.repeat(200))
  assert.equal(result.length, 160)
  assert.equal(result.endsWith('...'), true)
})
