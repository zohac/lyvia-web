import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { useCoachLink } from '../../app/composables/useCoachLink'

describe('YC2.2 — useCoachLink (pure composable)', () => {
  describe('with custom domain', () => {
    test('returns absolute HTTPS URLs for site and booking', () => {
      const result = useCoachLink({ slug: 'sophie-jouan', domain: 'sophie-jouan.fr' })
      assert.equal(result.site, 'https://sophie-jouan.fr')
      assert.equal(result.booking, 'https://sophie-jouan.fr/onboarding/discovery')
    })

    test('trims whitespace around the domain', () => {
      const result = useCoachLink({ slug: 'sophie-jouan', domain: '  sophie-jouan.fr  ' })
      assert.equal(result.site, 'https://sophie-jouan.fr')
      assert.equal(result.booking, 'https://sophie-jouan.fr/onboarding/discovery')
    })

    test('domain takes precedence over origin', () => {
      const result = useCoachLink({
        slug: 'sophie-jouan',
        domain: 'sophie-jouan.fr',
        origin: 'https://keova.fr'
      })
      assert.equal(result.site, 'https://sophie-jouan.fr')
      assert.equal(result.booking, 'https://sophie-jouan.fr/onboarding/discovery')
    })
  })

  describe('without custom domain, without origin (relative paths)', () => {
    test('returns relative /coach/{slug} paths', () => {
      const result = useCoachLink({ slug: 'sophie-jouan' })
      assert.equal(result.site, '/coach/sophie-jouan')
      assert.equal(result.booking, '/coach/sophie-jouan/onboarding/discovery')
    })

    test('null domain is treated as absent', () => {
      const result = useCoachLink({ slug: 'marie', domain: null })
      assert.equal(result.site, '/coach/marie')
      assert.equal(result.booking, '/coach/marie/onboarding/discovery')
    })

    test('undefined domain is treated as absent', () => {
      const result = useCoachLink({ slug: 'marie', domain: undefined })
      assert.equal(result.site, '/coach/marie')
      assert.equal(result.booking, '/coach/marie/onboarding/discovery')
    })

    test('empty string domain is treated as absent', () => {
      const result = useCoachLink({ slug: 'marie', domain: '' })
      assert.equal(result.site, '/coach/marie')
      assert.equal(result.booking, '/coach/marie/onboarding/discovery')
    })

    test('whitespace-only domain is treated as absent', () => {
      const result = useCoachLink({ slug: 'marie', domain: '   ' })
      assert.equal(result.site, '/coach/marie')
      assert.equal(result.booking, '/coach/marie/onboarding/discovery')
    })
  })

  describe('without custom domain, with origin (absolute platform paths)', () => {
    test('prefixes relative paths with origin', () => {
      const result = useCoachLink({ slug: 'sophie-jouan', origin: 'https://keova.fr' })
      assert.equal(result.site, 'https://keova.fr/coach/sophie-jouan')
      assert.equal(result.booking, 'https://keova.fr/coach/sophie-jouan/onboarding/discovery')
    })

    test('strips trailing slash from origin', () => {
      const result = useCoachLink({ slug: 'sophie-jouan', origin: 'https://keova.fr/' })
      assert.equal(result.site, 'https://keova.fr/coach/sophie-jouan')
      assert.equal(result.booking, 'https://keova.fr/coach/sophie-jouan/onboarding/discovery')
    })

    test('null origin falls back to relative paths', () => {
      const result = useCoachLink({ slug: 'sophie-jouan', origin: null })
      assert.equal(result.site, '/coach/sophie-jouan')
      assert.equal(result.booking, '/coach/sophie-jouan/onboarding/discovery')
    })
  })

  describe('determinism', () => {
    test('same input produces same output (pure fn)', () => {
      const a = useCoachLink({ slug: 'marie', domain: 'marie.fr' })
      const b = useCoachLink({ slug: 'marie', domain: 'marie.fr' })
      assert.deepEqual(a, b)
    })
  })
})
