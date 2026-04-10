import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  CLARITY_ID_REGEX,
  resolveClarityContext,
  shouldLoadClarity,
  shouldFetchClarityProfile
} from '../../app/plugins/microsoft-clarity-helpers'

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
      assert.deepEqual(result, { slug: 'sophie', clarityId: 'abc123', googleAdsId: 'AW-111' })
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
      assert.deepEqual(result, { slug: 'sophie', clarityId: 'def456', googleAdsId: null })
    })

    it('returns null for all fields when no source available', () => {
      const result = resolveClarityContext({
        routeSlug: null,
        routeProfile: null,
        tenantHomeSlug: null,
        tenantHomeProfile: null,
        tenantDiscoverySlug: null,
        tenantRouteSlug: null
      })
      assert.deepEqual(result, { slug: null, clarityId: null, googleAdsId: null })
    })

    it('resolves slug from discovery tenant but no profile', () => {
      const result = resolveClarityContext({
        routeSlug: null,
        routeProfile: null,
        tenantHomeSlug: null,
        tenantHomeProfile: null,
        tenantDiscoverySlug: 'sophie',
        tenantRouteSlug: null
      })
      assert.deepEqual(result, { slug: 'sophie', clarityId: null, googleAdsId: null })
    })

    it('carries googleAdsId from the same profile as clarityId', () => {
      const result = resolveClarityContext({
        routeSlug: 'sophie',
        routeProfile: { microsoftClarityId: 'abc123', googleAdsId: 'AW-999' },
        tenantHomeSlug: null,
        tenantHomeProfile: null,
        tenantDiscoverySlug: null,
        tenantRouteSlug: null
      })
      assert.equal(result.googleAdsId, 'AW-999')
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
    it('returns true when slug exists but no clarity ID', () => {
      assert.ok(shouldFetchClarityProfile('sophie', null))
    })

    it('returns false when no slug', () => {
      assert.ok(!shouldFetchClarityProfile(null, null))
    })

    it('returns false when clarity ID already resolved', () => {
      assert.ok(!shouldFetchClarityProfile('sophie', 'abc123'))
    })
  })
})
