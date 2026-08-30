import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createSupportSessionCoordinator } from '../../app/features/support-session/state/create-support-session-coordinator'
import type { StartSupportSessionResponse } from '../../app/features/support-session/api/support-session.contract'
import type { AuthState } from '../../app/features/auth/state/auth.state'
import type { AuthUser } from '../../app/features/auth/api/auth.contract'

describe('support session behavioral mutations & isolation proofs', () => {
  const targetProfileId = '550e8400-e29b-41d4-a716-446655440000'

  function createMockEnvironment() {
    let now = 100000
    const timers: { callback: () => void, delayMs: number }[] = []
    const invalidations: string[] = []
    const events: string[] = []
    const navigations: string[] = []

    let authState: AuthState = {
      status: 'authenticated',
      role: 'ADMIN',
      user: { id: 'admin-1', role: 'ADMIN', email: 'admin@kaora.app' } as unknown as AuthUser,
      accessToken: 'admin-init-jwt',
      supportSession: null,
      expiresAt: null,
      lastError: null
    }

    const clock = {
      now: () => now,
      advance: (ms: number) => {
        now += ms
      }
    }

    const timerPort = {
      setTimeout: (cb: () => void, ms: number) => {
        const entry = { callback: cb, delayMs: ms }
        timers.push(entry)
        return entry
      },
      clearTimeout: (t: unknown) => {
        const idx = timers.indexOf(t as { callback: () => void, delayMs: number })
        if (idx !== -1) timers.splice(idx, 1)
      }
    }

    let postHandler = async (_url: string, _opts?: { headers?: Record<string, string> }): Promise<unknown> => ({})
    let getHandler = async (_url: string, _opts?: { headers?: Record<string, string> }): Promise<unknown> => ({})

    const transport = {
      post: async <T>(url: string, options?: { headers?: Record<string, string> }) => {
        events.push(`POST:${url}`)
        return (await postHandler(url, options)) as T
      },
      get: async <T>(url: string, options?: { headers?: Record<string, string> }) => {
        events.push(`GET:${url}`)
        return (await getHandler(url, options)) as T
      }
    }

    const navigation = {
      navigateTo: async (path: string) => {
        events.push(`NAVIGATE:${path}`)
        navigations.push(path)
      }
    }

    let support401Handler: (() => Promise<void>) | null = null
    const support401Port = {
      register: (handler: () => Promise<void>) => {
        support401Handler = handler
        return () => {
          if (support401Handler === handler) support401Handler = null
        }
      }
    }

    const authStateRef: { value: AuthState } = {
      get value(): AuthState {
        return authState
      },
      set value(v: AuthState) {
        const role = v?.role ?? 'unknown'
        events.push(`AUTH_STATE_SET:${role}`)
        authState = v
      }
    }

    const coordinator = createSupportSessionCoordinator({
      clock,
      timer: timerPort,
      visibility: {
        onVisibilityChange: () => () => {},
        isVisible: () => true
      },
      transport,
      invalidateFeatureGate: () => {
        events.push('INVALIDATE_GATE')
        invalidations.push('invalidated')
      },
      navigation,
      register401Handler: support401Port.register,
      authStateRef
    })

    return {
      clock,
      timers,
      invalidations,
      events,
      navigations,
      get authState() {
        return authState
      },
      setPostHandler: (h: (_url: string, _opts?: { headers?: Record<string, string> }) => Promise<unknown>) => {
        postHandler = h
      },
      setGetHandler: (h: (_url: string, _opts?: { headers?: Record<string, string> }) => Promise<unknown>) => {
        getHandler = h
      },
      trigger401: async () => {
        if (support401Handler) await support401Handler()
      },
      coordinator
    }
  }

  const validStartPayload: StartSupportSessionResponse = {
    accessToken: 'support-provider-jwt-xyz',
    expiresAt: new Date(100000 + 1800 * 1000).toISOString(),
    supportSession: {
      id: 'session-id-001',
      providerProfileId: targetProfileId,
      providerUserId: 'provider-user-456'
    },
    user: {
      id: 'provider-user-456',
      email: 'provider@domain.test',
      role: 'PROVIDER',
      firstname: 'Sophie',
      lastname: 'Jouan',
      displayName: 'Sophie Jouan',
      isTest: false
    }
  }

  it('proves gate invalidation occurs strictly BEFORE publishing provider identity', async () => {
    const env = createMockEnvironment()
    env.setPostHandler(async () => validStartPayload)

    await env.coordinator.start(targetProfileId)

    const invalidateIdx = env.events.indexOf('INVALIDATE_GATE')
    const authPublishIdx = env.events.indexOf('AUTH_STATE_SET:PROVIDER')

    assert.ok(invalidateIdx !== -1, 'Feature gate must be invalidated')
    assert.ok(authPublishIdx !== -1, 'Provider auth state must be published')
    assert.ok(
      invalidateIdx < authPublishIdx,
      'Mutation proof: gate invalidation MUST happen before auth publishing'
    )
  })

  it('proves gate invalidation occurs strictly BEFORE publishing restored ADMIN identity', async () => {
    const env = createMockEnvironment()
    env.setPostHandler(async (url: string) => {
      if (url.includes('/support-session')) return validStartPayload
      if (url === '/auth/support-session/end') return undefined
      if (url === '/auth/refresh') return { accessToken: 'admin-new-jwt' }
      throw new Error(`Unexpected POST ${url}`)
    })
    env.setGetHandler(async (url: string) => {
      if (url === '/auth/me') return { user: { id: 'admin-1', role: 'ADMIN', email: 'admin@kaora.app' } }
      throw new Error(`Unexpected GET ${url}`)
    })

    await env.coordinator.start(targetProfileId)
    env.events.length = 0 // Clear start events

    await env.coordinator.end()

    const invalidateIdx = env.events.indexOf('INVALIDATE_GATE')
    const authPublishIdx = env.events.indexOf('AUTH_STATE_SET:ADMIN')

    assert.ok(invalidateIdx !== -1, 'Feature gate must be invalidated on restore')
    assert.ok(authPublishIdx !== -1, 'Admin auth state must be published on restore')
    assert.ok(
      invalidateIdx < authPublishIdx,
      'Mutation proof: gate invalidation MUST happen before admin auth restoration'
    )
  })

  it('proves whole-object atomic publication without leaking intermediate states', async () => {
    const env = createMockEnvironment()
    env.setPostHandler(async () => validStartPayload)

    await env.coordinator.start(targetProfileId)

    // Verify whole object properties
    assert.equal(env.authState.status, 'authenticated')
    assert.equal(env.authState.role, 'PROVIDER')
    assert.equal(env.authState.accessToken, 'support-provider-jwt-xyz')
    assert.equal(env.authState.user?.email, 'provider@domain.test')
    assert.equal(env.authState.supportSession?.phase, 'active')
    assert.equal(env.authState.supportSession?.providerProfileId, targetProfileId)
    assert.equal(env.authState.supportSession?.returnTo, `/admin/providers/${targetProfileId}`)
  })

  it('proves that restoreAdmin verifies user.role === ADMIN and redirects to login if non-admin', async () => {
    const env = createMockEnvironment()
    env.setPostHandler(async (url: string) => {
      if (url.includes('/support-session')) return validStartPayload
      if (url === '/auth/refresh') return { accessToken: 'some-jwt' }
      throw new Error(`Unexpected POST ${url}`)
    })
    env.setGetHandler(async (url: string) => {
      if (url === '/auth/me') {
        // Unexpectedly returned a CLIENT instead of ADMIN
        return { user: { id: 'user-2', role: 'CLIENT', email: 'client@domain.test' } }
      }
      throw new Error(`Unexpected GET ${url}`)
    })

    await env.coordinator.start(targetProfileId)
    await env.coordinator.restoreAdmin()

    // Must reset to unauthenticated (guest) and redirect to /login
    assert.equal(env.authState.status, 'guest')
    assert.equal(env.authState.supportSession, null)
    assert.ok(
      env.navigations[env.navigations.length - 1].startsWith('/login?redirect='),
      'Must navigate to /login when restored role is not ADMIN'
    )
  })

  it('proves timer expiration triggers automatic restoration and redirection to returnTo', async () => {
    const env = createMockEnvironment()
    env.setPostHandler(async (url: string) => {
      if (url.includes('/support-session')) return validStartPayload
      if (url === '/auth/refresh') return { accessToken: 'admin-restored-jwt' }
      throw new Error(`Unexpected POST ${url}`)
    })
    env.setGetHandler(async (url: string) => {
      if (url === '/auth/me') return { user: { id: 'admin-1', role: 'ADMIN', email: 'admin@kaora.app' } }
      throw new Error(`Unexpected GET ${url}`)
    })

    await env.coordinator.start(targetProfileId)
    assert.equal(env.timers.length, 1, 'Timer must be scheduled')

    // Advance clock and fire timer
    env.clock.advance(1800 * 1000)
    env.timers[0].callback()
    await env.coordinator.getInFlightRestore()

    assert.equal(env.authState.role, 'ADMIN')
    assert.equal(env.authState.supportSession, null)
    assert.equal(env.navigations[env.navigations.length - 1], `/admin/providers/${targetProfileId}`)
  })
})
