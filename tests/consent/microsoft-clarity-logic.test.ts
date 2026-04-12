import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  CLARITY_ID_REGEX,
  resolveClarityContext,
  shouldLoadClarity,
  shouldFetchClarityProfile,
  type ClarityProfile
} from '../../app/features/clarity/microsoft-clarity-helpers'
import {
  injectClarityTag,
  runMicrosoftClarityMounted
} from '../../app/features/clarity/microsoft-clarity-runtime'

type MockScript = {
  async: boolean
  src: string
}

describe('Microsoft Clarity helpers (real code)', () => {
  describe('CLARITY_ID_REGEX', () => {
    const validIds = ['lz1abc2def', 'abc123', 'abcdef', 'a1b2c3d4e5f6g7h8i9j0']
    for (const id of validIds) {
      it(`accepts valid Clarity ID: ${id}`, () => {
        assert.ok(CLARITY_ID_REGEX.test(id))
      })
    }

    const invalidCases = [
      ['ABC123', 'uppercase'],
      ['abc12', 'too short (5)'],
      ['abc-123', 'hyphen'],
      ['abc_123', 'underscore'],
      ['abc 123', 'space'],
      ['aaaaaaaaaaaaaaaaaaaaa', 'too long (21)']
    ] as const
    for (const [id, reason] of invalidCases) {
      it(`rejects invalid Clarity ID: ${id} (${reason})`, () => {
        assert.ok(!CLARITY_ID_REGEX.test(id))
      })
    }
  })

  describe('resolveClarityContext', () => {
    it('resolves from route profile', () => {
      const result = resolveClarityContext({
        routeSlug: 'sophie',
        routeProfile: { microsoftClarityId: 'abc123', googleAdsId: 'AW-111' },
        tenantHomeSlug: null,
        tenantHomeProfile: null,
        tenantDiscoverySlug: null,
        tenantRouteSlug: null
      })
      assert.deepEqual(result, {
        slug: 'sophie',
        clarityId: 'abc123',
        googleAdsId: 'AW-111',
        profileResolved: true
      })
    })

    it('keeps route slug when profile is not cached yet', () => {
      const result = resolveClarityContext({
        routeSlug: 'sophie',
        routeProfile: null,
        tenantHomeSlug: null,
        tenantHomeProfile: null,
        tenantDiscoverySlug: null,
        tenantRouteSlug: null
      })
      assert.deepEqual(result, {
        slug: 'sophie',
        clarityId: null,
        googleAdsId: null,
        profileResolved: false
      })
    })

    it('resolves from tenant home profile', () => {
      const result = resolveClarityContext({
        routeSlug: null,
        routeProfile: null,
        tenantHomeSlug: 'sophie',
        tenantHomeProfile: { microsoftClarityId: 'def456', googleAdsId: null },
        tenantDiscoverySlug: null,
        tenantRouteSlug: null
      })
      assert.deepEqual(result, {
        slug: 'sophie',
        clarityId: 'def456',
        googleAdsId: null,
        profileResolved: true
      })
    })

    it('resolves slug from discovery tenant but marks profile unresolved', () => {
      const result = resolveClarityContext({
        routeSlug: null,
        routeProfile: null,
        tenantHomeSlug: null,
        tenantHomeProfile: null,
        tenantDiscoverySlug: 'sophie',
        tenantRouteSlug: null
      })
      assert.deepEqual(result, {
        slug: 'sophie',
        clarityId: null,
        googleAdsId: null,
        profileResolved: false
      })
    })

    it('returns null for all fields when no source is available', () => {
      const result = resolveClarityContext({
        routeSlug: null,
        routeProfile: null,
        tenantHomeSlug: null,
        tenantHomeProfile: null,
        tenantDiscoverySlug: null,
        tenantRouteSlug: null
      })
      assert.deepEqual(result, {
        slug: null,
        clarityId: null,
        googleAdsId: null,
        profileResolved: false
      })
    })
  })

  describe('shouldLoadClarity', () => {
    it('loads in simple mode (no Google Ads) regardless of consent', () => {
      assert.ok(shouldLoadClarity(null, null))
      assert.ok(shouldLoadClarity(null, 'essential'))
      assert.ok(shouldLoadClarity(null, 'all'))
      assert.ok(shouldLoadClarity(null, 'acknowledged'))
    })

    it('loads in full mode with all consent', () => {
      assert.ok(shouldLoadClarity('AW-123456789', 'all'))
    })

    it('loads in full mode with acknowledged consent', () => {
      assert.ok(shouldLoadClarity('AW-123456789', 'acknowledged'))
    })

    it('blocks in full mode with null consent (RF1 regression)', () => {
      assert.ok(!shouldLoadClarity('AW-123456789', null))
    })

    it('blocks in full mode with essential consent (RF1 regression)', () => {
      assert.ok(!shouldLoadClarity('AW-123456789', 'essential'))
    })
  })

  describe('shouldFetchClarityProfile', () => {
    it('returns true when slug exists and profile is not resolved yet', () => {
      assert.ok(shouldFetchClarityProfile('sophie', false))
    })

    it('returns false when no slug is known', () => {
      assert.ok(!shouldFetchClarityProfile(null, false))
    })

    it('returns false when profile is already resolved with no Clarity ID', () => {
      assert.ok(!shouldFetchClarityProfile('sophie', true))
    })
  })
})

describe('Microsoft Clarity runtime (real behavior)', () => {
  it('injectClarityTag registers window.clarity and appends the Clarity script', () => {
    const appendedScripts: MockScript[] = []
    const targetWindow: Record<string, unknown> = {}

    injectClarityTag(
      targetWindow,
      () => ({ async: false, src: '' }),
      (element: MockScript) => {
        appendedScripts.push(element)
      },
      'lz1abc2def'
    )

    assert.equal(typeof targetWindow.clarity, 'function')
    assert.ok(Array.isArray((targetWindow.clarity as { q?: unknown[] }).q))
    assert.equal(appendedScripts.length, 1)
  })

  it('injectClarityTag appends exactly one async Clarity script', () => {
    const appendedScripts: MockScript[] = []
    const targetWindow: Record<string, unknown> = {}

    injectClarityTag(
      targetWindow,
      () => ({ async: false, src: '' }),
      (element: MockScript) => {
        appendedScripts.push(element)
      },
      'lz1abc2def'
    )

    assert.equal(appendedScripts.length, 1)
    assert.equal(appendedScripts[0].async, true)
    assert.equal(appendedScripts[0].src, 'https://www.clarity.ms/tag/lz1abc2def')
  })

  it('loads immediately when Clarity ID is resolved in simple mode', async () => {
    const injectedIds: string[] = []
    const fetchCalls: string[] = []

    await runMicrosoftClarityMounted({
      context: {
        slug: 'sophie',
        clarityId: 'lz1abc2def',
        googleAdsId: null,
        profileResolved: true
      },
      cookieConsent: null,
      fetchProfile: async (slug: string) => {
        fetchCalls.push(slug)
        return {}
      },
      injectClarity: (clarityId: string) => {
        injectedIds.push(clarityId)
      }
    })

    assert.deepEqual(injectedIds, ['lz1abc2def'])
    assert.equal(fetchCalls.length, 0)
  })

  it('does not inject in full mode without consent', async () => {
    const injectedIds: string[] = []
    const fetchCalls: string[] = []

    await runMicrosoftClarityMounted({
      context: {
        slug: 'sophie',
        clarityId: 'lz1abc2def',
        googleAdsId: 'AW-123456789',
        profileResolved: true
      },
      cookieConsent: 'essential',
      fetchProfile: async (slug: string) => {
        fetchCalls.push(slug)
        return {}
      },
      injectClarity: (clarityId: string) => {
        injectedIds.push(clarityId)
      }
    })

    assert.equal(injectedIds.length, 0)
    assert.equal(fetchCalls.length, 0)
  })

  it('fetches the public profile only when the slug is known but the profile is not cached', async () => {
    const injectedIds: string[] = []
    const fetchCalls: string[] = []

    await runMicrosoftClarityMounted({
      context: {
        slug: 'sophie',
        clarityId: null,
        googleAdsId: null,
        profileResolved: false
      },
      cookieConsent: 'all',
      fetchProfile: async (slug: string): Promise<ClarityProfile> => {
        fetchCalls.push(slug)
        return {
          microsoftClarityId: 'lz1abc2def',
          googleAdsId: 'AW-123456789'
        }
      },
      injectClarity: (clarityId: string) => {
        injectedIds.push(clarityId)
      }
    })

    assert.deepEqual(fetchCalls, ['sophie'])
    assert.deepEqual(injectedIds, ['lz1abc2def'])
  })

  it('does not fetch again when the profile is already resolved with no Clarity ID', async () => {
    const injectedIds: string[] = []
    const fetchCalls: string[] = []

    await runMicrosoftClarityMounted({
      context: {
        slug: 'sophie',
        clarityId: null,
        googleAdsId: null,
        profileResolved: true
      },
      cookieConsent: null,
      fetchProfile: async (slug: string): Promise<ClarityProfile> => {
        fetchCalls.push(slug)
        return {
          microsoftClarityId: 'should-not-run'
        }
      },
      injectClarity: (clarityId: string) => {
        injectedIds.push(clarityId)
      }
    })

    assert.equal(fetchCalls.length, 0)
    assert.equal(injectedIds.length, 0)
  })

  it('does not inject fetched Clarity when Google Ads exists and consent is essential', async () => {
    const injectedIds: string[] = []

    await runMicrosoftClarityMounted({
      context: {
        slug: 'sophie',
        clarityId: null,
        googleAdsId: null,
        profileResolved: false
      },
      cookieConsent: 'essential',
      fetchProfile: async (): Promise<ClarityProfile> => ({
        microsoftClarityId: 'lz1abc2def',
        googleAdsId: 'AW-123456789'
      }),
      injectClarity: (clarityId: string) => {
        injectedIds.push(clarityId)
      }
    })

    assert.equal(injectedIds.length, 0)
  })
})
