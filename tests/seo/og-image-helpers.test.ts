import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { resolveOgImageStrategy } from '../../app/features/seo/og-image-helpers'

describe('resolveOgImageStrategy', () => {
  const baseInput = {
    customOgImageUrl: null as string | null,
    displayName: 'Sophie Jouan',
    specialties: ['naturopathie', 'nutrition'],
    domain: 'keova.fr',
    isPlatform: true
  }

  test('returns custom strategy when customOgImageUrl is provided', () => {
    const result = resolveOgImageStrategy({
      ...baseInput,
      customOgImageUrl: 'https://cdn.example.com/og.png'
    })

    assert.equal(result.kind, 'custom')
    assert.equal(result.kind === 'custom' && result.url, 'https://cdn.example.com/og.png')
  })

  test('returns satori strategy when no custom image', () => {
    const result = resolveOgImageStrategy(baseInput)

    assert.equal(result.kind, 'satori')
    if (result.kind === 'satori') {
      assert.equal(result.props.component, 'CoachProfile')
      assert.equal(result.props.displayName, 'Sophie Jouan')
      assert.equal(result.props.speciality, 'naturopathie')
      assert.equal(result.props.domain, 'keova.fr')
      assert.equal(result.props.isPlatform, true)
    }
  })

  test('uses first specialty for satori', () => {
    const result = resolveOgImageStrategy({
      ...baseInput,
      specialties: ['sophrologie']
    })

    assert.equal(result.kind, 'satori')
    if (result.kind === 'satori') {
      assert.equal(result.props.speciality, 'sophrologie')
    }
  })

  test('falls back to "ménopause" when specialties empty', () => {
    const result = resolveOgImageStrategy({
      ...baseInput,
      specialties: []
    })

    assert.equal(result.kind, 'satori')
    if (result.kind === 'satori') {
      assert.equal(result.props.speciality, 'ménopause')
    }
  })

  test('white-label: isPlatform is false', () => {
    const result = resolveOgImageStrategy({
      ...baseInput,
      isPlatform: false,
      domain: 'sophie-jouan.fr'
    })

    assert.equal(result.kind, 'satori')
    if (result.kind === 'satori') {
      assert.equal(result.props.isPlatform, false)
      assert.equal(result.props.domain, 'sophie-jouan.fr')
    }
  })

  test('treats null customOgImageUrl as no custom image', () => {
    const result = resolveOgImageStrategy({
      ...baseInput,
      customOgImageUrl: null
    })

    assert.equal(result.kind, 'satori')
  })

  test('treats undefined customOgImageUrl as no custom image', () => {
    const result = resolveOgImageStrategy({
      ...baseInput,
      customOgImageUrl: undefined
    })

    assert.equal(result.kind, 'satori')
  })

  test('treats empty string customOgImageUrl as no custom image', () => {
    const result = resolveOgImageStrategy({
      ...baseInput,
      customOgImageUrl: ''
    })

    assert.equal(result.kind, 'satori')
  })

  // --- Page-level wiring simulation (CR1 Finding #3) ---

  test('wiring: custom image from seo_metadata takes priority over Satori', () => {
    const seoOgImageUrl = 'https://cdn.example.com/custom-og.png'
    const result = resolveOgImageStrategy({
      customOgImageUrl: seoOgImageUrl,
      displayName: 'Sophie Jouan',
      specialties: ['naturopathie'],
      domain: 'keova.fr',
      isPlatform: true
    })

    assert.equal(result.kind, 'custom')
    if (result.kind === 'custom') {
      assert.equal(result.url, seoOgImageUrl)
    }
  })

  test('wiring: real specialties from profile are used (not fallback)', () => {
    const result = resolveOgImageStrategy({
      customOgImageUrl: null,
      displayName: 'Sophie Jouan',
      specialties: ['sophrologie', 'yoga'],
      domain: 'keova.fr',
      isPlatform: true
    })

    assert.equal(result.kind, 'satori')
    if (result.kind === 'satori') {
      assert.equal(result.props.speciality, 'sophrologie')
    }
  })

  test('wiring: all Satori props are set correctly for defineOgImage spread', () => {
    const result = resolveOgImageStrategy({
      customOgImageUrl: null,
      displayName: 'Marie Dupont',
      specialties: ['nutrition'],
      domain: 'sophie-jouan.fr',
      isPlatform: false
    })

    assert.equal(result.kind, 'satori')
    if (result.kind === 'satori') {
      assert.equal(result.props.component, 'CoachProfile')
      assert.equal(result.props.displayName, 'Marie Dupont')
      assert.equal(result.props.speciality, 'nutrition')
      assert.equal(result.props.domain, 'sophie-jouan.fr')
      assert.equal(result.props.isPlatform, false)
    }
  })
})
