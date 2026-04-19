import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  CLARITY_ID_REGEX,
  resolveClarityContext,
  shouldFetchClarityProfile
} from '../../app/features/clarity/microsoft-clarity-helpers'
import {
  injectClarityTag,
  mountMicrosoftClarity
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
        tenantDiscoveryProfile: null,
        tenantRouteSlug: null
      })
      assert.deepEqual(result, {
        slug: 'sophie',
        clarityId: 'abc123',
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
        tenantDiscoveryProfile: null,
        tenantRouteSlug: null
      })
      assert.deepEqual(result, {
        slug: 'sophie',
        clarityId: null,
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
        tenantDiscoveryProfile: null,
        tenantRouteSlug: null
      })
      assert.deepEqual(result, {
        slug: 'sophie',
        clarityId: 'def456',
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
        tenantDiscoveryProfile: null,
        tenantRouteSlug: null
      })
      assert.deepEqual(result, {
        slug: 'sophie',
        clarityId: null,
        profileResolved: false
      })
    })

    it('resolves discovery profile when booking tenant profile is preloaded', () => {
      const result = resolveClarityContext({
        routeSlug: null,
        routeProfile: null,
        tenantHomeSlug: null,
        tenantHomeProfile: null,
        tenantDiscoverySlug: 'sophie',
        tenantDiscoveryProfile: { microsoftClarityId: 'def456', googleAdsId: 'AW-111' },
        tenantRouteSlug: null
      })
      assert.deepEqual(result, {
        slug: 'sophie',
        clarityId: 'def456',
        profileResolved: true
      })
    })

    it('returns null for all fields when no source is available', () => {
      const result = resolveClarityContext({
        routeSlug: null,
        routeProfile: null,
        tenantHomeSlug: null,
        tenantHomeProfile: null,
        tenantDiscoverySlug: null,
        tenantDiscoveryProfile: null,
        tenantRouteSlug: null
      })
      assert.deepEqual(result, {
        slug: null,
        clarityId: null,
        profileResolved: false
      })
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
})

describe('Microsoft Clarity mountMicrosoftClarity — consent-independent (story 0-23)', () => {
  function runMount(input: {
    clarityId: string | null
    windowHasClarity?: boolean
  }): {
    scriptAppended: boolean
    clarityInstalled: boolean
  } {
    const originalDocument = globalThis.document
    const originalWindow = globalThis.window

    const existingClarity = input.windowHasClarity ? () => undefined : undefined
    const mockWindow: Record<string, unknown> = existingClarity
      ? { clarity: existingClarity }
      : {}
    let scriptAppended = false
    const mockDocument = {
      createElement: (_tag: string) => ({ async: false, src: '' }),
      head: {
        appendChild: (_el: unknown) => {
          scriptAppended = true
        }
      }
    }

    ;(globalThis as { window?: unknown }).window = mockWindow
    ;(globalThis as { document?: unknown }).document = mockDocument

    try {
      mountMicrosoftClarity({
        context: {
          slug: 'sophie',
          clarityId: input.clarityId,
          profileResolved: true
        }
      })
    } finally {
      ;(globalThis as { window?: unknown }).window = originalWindow
      ;(globalThis as { document?: unknown }).document = originalDocument
    }

    return {
      scriptAppended,
      clarityInstalled: typeof mockWindow.clarity === 'function'
    }
  }

  it('injects Clarity when ID is present (no consent required)', () => {
    const result = runMount({ clarityId: 'lz1abc2def' })
    assert.equal(result.scriptAppended, true)
    assert.equal(result.clarityInstalled, true)
  })

  it('does NOT inject when clarityId is null', () => {
    const result = runMount({ clarityId: null })
    assert.equal(result.scriptAppended, false)
    assert.equal(result.clarityInstalled, false)
  })

  it('does NOT re-inject when window.clarity already exists (idempotent)', () => {
    const result = runMount({ clarityId: 'lz1abc2def', windowHasClarity: true })
    assert.equal(result.scriptAppended, false)
    assert.equal(result.clarityInstalled, true)
  })
})
