import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SUPPORT_NAVIGATION_ITEMS,
  isAllowedSupportPath,
  buildSupportReturnTo,
  calculateSupportRemainingSeconds,
  formatSupportRemainingTime,
  validateStartSupportSessionResponse,
  type StartSupportSessionResponse
} from '../../app/features/support-session/api/support-session.contract'

describe('support-session.contract & routing', () => {
  describe('SUPPORT_NAVIGATION_ITEMS', () => {
    it('contains exactly 6 items in the exact required order', () => {
      assert.equal(SUPPORT_NAVIGATION_ITEMS.length, 6)
      const expectedPaths = [
        '/provider/account',
        '/provider/coach-page',
        '/provider/scheduling',
        '/provider/availability',
        '/provider/programs',
        '/provider/seo'
      ]
      assert.deepEqual(
        SUPPORT_NAVIGATION_ITEMS.map(i => i.to),
        expectedPaths
      )
    })
  })

  describe('isAllowedSupportPath', () => {
    it('allows exact authorized paths', () => {
      assert.equal(isAllowedSupportPath('/provider/account'), true)
      assert.equal(isAllowedSupportPath('/provider/coach-page'), true)
      assert.equal(isAllowedSupportPath('/provider/scheduling'), true)
      assert.equal(isAllowedSupportPath('/provider/availability'), true)
      assert.equal(isAllowedSupportPath('/provider/programs'), true)
      assert.equal(isAllowedSupportPath('/provider/seo'), true)
    })

    it('allows child routes ONLY for /provider/programs', () => {
      assert.equal(isAllowedSupportPath('/provider/programs/new'), true)
      assert.equal(isAllowedSupportPath('/provider/programs/123-abc'), true)
      assert.equal(isAllowedSupportPath('/provider/programs/123-abc/edit'), true)
    })

    it('rejects prefix attacks and unauthorized child routes', () => {
      assert.equal(isAllowedSupportPath('/provider/programs-malicious'), false)
      assert.equal(isAllowedSupportPath('/provider/programs_fake'), false)
      assert.equal(isAllowedSupportPath('/provider/account/security'), false)
      assert.equal(isAllowedSupportPath('/provider/account/password'), false)
      assert.equal(isAllowedSupportPath('/provider/coach-page/edit'), false)
    })

    it('rejects sensitive and out-of-scope provider paths', () => {
      assert.equal(isAllowedSupportPath('/provider/dashboard'), false)
      assert.equal(isAllowedSupportPath('/provider/clients'), false)
      assert.equal(isAllowedSupportPath('/provider/calendar'), false)
      assert.equal(isAllowedSupportPath('/provider/discovery'), false)
      assert.equal(isAllowedSupportPath('/provider/requests'), false)
      assert.equal(isAllowedSupportPath('/provider/finance'), false)
      assert.equal(isAllowedSupportPath('/provider/analytics'), false)
      assert.equal(isAllowedSupportPath('/provider/settings/payments'), false)
    })

    it('handles query strings, hashes, and trailing slashes correctly', () => {
      assert.equal(isAllowedSupportPath('/provider/coach-page?tab=preview'), true)
      assert.equal(isAllowedSupportPath('/provider/coach-page#section-hero'), true)
      assert.equal(isAllowedSupportPath('/provider/coach-page/'), true)
      assert.equal(isAllowedSupportPath('/provider/programs/123/?from=list#header'), true)
    })
  })

  describe('buildSupportReturnTo', () => {
    it('constructs local admin path from providerProfileId', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000'
      assert.equal(buildSupportReturnTo(id), `/admin/providers/${id}`)
    })

    it('throws if providerProfileId is empty or invalid', () => {
      assert.throws(() => buildSupportReturnTo(''), /Invalid providerProfileId/)
      assert.throws(() => buildSupportReturnTo('   '), /Invalid providerProfileId/)
    })
  })

  describe('calculateSupportRemainingSeconds & formatSupportRemainingTime', () => {
    it('calculates remaining seconds accurately', () => {
      const now = new Date('2026-08-29T20:00:00.000Z').getTime()
      const expiresAt = '2026-08-29T20:30:00.000Z'
      assert.equal(calculateSupportRemainingSeconds(expiresAt, now), 1800)
    })

    it('returns 0 if already expired', () => {
      const now = new Date('2026-08-29T20:31:00.000Z').getTime()
      const expiresAt = '2026-08-29T20:30:00.000Z'
      assert.equal(calculateSupportRemainingSeconds(expiresAt, now), 0)
    })

    it('formats mm:ss properly', () => {
      assert.equal(formatSupportRemainingTime(1800), '30:00')
      assert.equal(formatSupportRemainingTime(125), '02:05')
      assert.equal(formatSupportRemainingTime(9), '00:09')
      assert.equal(formatSupportRemainingTime(0), '00:00')
    })
  })

  describe('validateStartSupportSessionResponse', () => {
    const validResponse: StartSupportSessionResponse = {
      accessToken: 'jwt.token.valid',
      expiresAt: '2026-08-29T20:30:00.000Z',
      supportSession: {
        id: 'session-uuid-1',
        providerProfileId: 'target-profile-id',
        providerUserId: 'user-id-1'
      },
      user: {
        id: 'user-id-1',
        email: 'coach@example.com',
        role: 'PROVIDER',
        firstname: 'Sophie',
        lastname: 'Jouan',
        displayName: 'Sophie Jouan',
        isTest: false
      }
    }

    it('accepts a valid start response', () => {
      const validated = validateStartSupportSessionResponse(validResponse, 'target-profile-id')
      assert.deepEqual(validated, validResponse)
    })

    it('rejects if requested providerProfileId mismatches response', () => {
      assert.throws(
        () => validateStartSupportSessionResponse(validResponse, 'other-profile-id'),
        /providerProfileId mismatch/
      )
    })

    it('rejects if supportSession.providerUserId mismatches user.id', () => {
      const invalid = {
        ...validResponse,
        user: { ...validResponse.user, id: 'different-user-id' }
      }
      assert.throws(
        () => validateStartSupportSessionResponse(invalid, 'target-profile-id'),
        /providerUserId mismatch/
      )
    })

    it('rejects if user role is not PROVIDER', () => {
      const invalid = {
        ...validResponse,
        user: { ...validResponse.user, role: 'ADMIN' as unknown as 'PROVIDER' }
      }
      assert.throws(
        () => validateStartSupportSessionResponse(invalid, 'target-profile-id'),
        /Invalid user role/
      )
    })

    it('rejects invalid or missing expiresAt', () => {
      const invalid = {
        ...validResponse,
        expiresAt: 'not-a-date'
      }
      assert.throws(
        () => validateStartSupportSessionResponse(invalid, 'target-profile-id'),
        /Invalid expiresAt/
      )
    })
  })
})
