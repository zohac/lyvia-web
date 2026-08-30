import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createSupportSessionCoordinator,
  type ClockPort,
  type TimerPort,
  type VisibilityPort,
  type RawTransportPort,
  type NavigationPort
} from '../../app/features/support-session/state/create-support-session-coordinator'
import type { AuthState } from '../../app/features/auth/state/auth.state'

describe('createSupportSessionCoordinator', () => {
  function createHarness(options: { initialAuth?: AuthState } = {}) {
    let now = 1000
    const timers: { id: number, cb: () => void, time: number }[] = []
    let timerCounter = 1

    const clock: ClockPort = {
      now: () => now
    }

    const timer: TimerPort = {
      setTimeout: (cb, ms) => {
        const id = timerCounter++
        timers.push({ id, cb, time: now + ms })
        return id
      },
      clearTimeout: (id) => {
        const idx = timers.findIndex(t => t.id === id)
        if (idx !== -1) timers.splice(idx, 1)
      }
    }

    let visibilityCb: ((v: boolean) => void) | null = null
    const visibility: VisibilityPort = {
      onVisibilityChange: (cb) => {
        visibilityCb = cb
        return () => {
          visibilityCb = null
        }
      },
      isVisible: () => true
    }

    const postCalls: { url: string, options?: { headers?: Record<string, string> } }[] = []
    const getCalls: { url: string, options?: { headers?: Record<string, string> } }[] = []
    let postHandler: (url: string, options?: { headers?: Record<string, string> }) => Promise<unknown> = async () => ({})
    let getHandler: (url: string, options?: { headers?: Record<string, string> }) => Promise<unknown> = async () => ({})

    const transport: RawTransportPort = {
      post: async <T>(url: string, opts?: { headers?: Record<string, string> }) => {
        postCalls.push({ url, options: opts })
        return (await postHandler(url, opts)) as T
      },
      get: async <T>(url: string, opts?: { headers?: Record<string, string> }) => {
        getCalls.push({ url, options: opts })
        return (await getHandler(url, opts)) as T
      }
    }

    const navigations: string[] = []
    const navigation: NavigationPort = {
      navigateTo: async (path) => {
        navigations.push(path)
      }
    }

    let gateInvalidations = 0
    const invalidateFeatureGate = () => {
      gateInvalidations++
    }

    let handler401: (() => Promise<void>) | null = null
    const register401Handler = (h: () => Promise<void>) => {
      handler401 = h
      return () => {
        handler401 = null
      }
    }

    const authStateRef: { value: AuthState } = {
      value: options.initialAuth ?? {
        status: 'authenticated',
        user: {
          id: 'admin-user-id',
          email: 'admin@kaora.app',
          role: 'ADMIN',
          firstname: 'Admin',
          lastname: 'User',
          displayName: 'Admin User',
          isTest: false
        },
        role: 'ADMIN',
        accessToken: 'admin-jwt-token',
        expiresAt: null,
        lastError: null,
        supportSession: null
      }
    }

    const coordinator = createSupportSessionCoordinator({
      clock,
      timer,
      visibility,
      transport,
      authStateRef,
      invalidateFeatureGate,
      navigation,
      register401Handler
    })

    return {
      coordinator,
      authStateRef,
      clock,
      timer,
      timers,
      advanceTime: (ms: number) => {
        now += ms
        const due = timers.filter(t => t.time <= now)
        for (const d of due) {
          const idx = timers.findIndex(t => t.id === d.id)
          if (idx !== -1) timers.splice(idx, 1)
          d.cb()
        }
      },
      triggerVisibility: (v: boolean) => visibilityCb?.(v),
      trigger401: () => handler401?.(),
      setPostHandler: (fn: typeof postHandler) => {
        postHandler = fn
      },
      setGetHandler: (fn: typeof getHandler) => {
        getHandler = fn
      },
      postCalls,
      getCalls,
      navigations,
      getGateInvalidations: () => gateInvalidations
    }
  }

  it('starts a support session successfully, sets provider identity and schedules expiry', async () => {
    const harness = createHarness()
    const targetProfileId = '550e8400-e29b-41d4-a716-446655440000'

    harness.setPostHandler(async (url) => {
      if (url === `/admin/providers/${targetProfileId}/support-session`) {
        return {
          accessToken: 'support-provider-jwt',
          expiresAt: new Date(1000 + 1800 * 1000).toISOString(),
          supportSession: {
            id: 'session-id-123',
            providerProfileId: targetProfileId,
            providerUserId: 'provider-user-id-456'
          },
          user: {
            id: 'provider-user-id-456',
            email: 'sophie@jouan.fr',
            role: 'PROVIDER',
            firstname: 'Sophie',
            lastname: 'Jouan',
            displayName: 'Sophie Jouan',
            isTest: false
          }
        }
      }
      throw new Error(`Unexpected POST url: ${url}`)
    })

    await harness.coordinator.start(targetProfileId)

    // Asserter l'état auth
    assert.equal(harness.authStateRef.value.status, 'authenticated')
    assert.equal(harness.authStateRef.value.role, 'PROVIDER')
    assert.equal(harness.authStateRef.value.accessToken, 'support-provider-jwt')
    assert.equal(harness.authStateRef.value.user?.email, 'sophie@jouan.fr')
    assert.equal(harness.authStateRef.value.supportSession?.phase, 'active')
    assert.equal(
      harness.authStateRef.value.supportSession?.returnTo,
      `/admin/providers/${targetProfileId}`
    )

    // Asserter navigation
    assert.deepEqual(harness.navigations, ['/provider/coach-page'])

    // Asserter timer programmé
    assert.equal(harness.timers.length, 1)
  })

  it('restores admin session deduplicated on expiration or manual call', async () => {
    const harness = createHarness()
    const targetProfileId = '550e8400-e29b-41d4-a716-446655440000'

    harness.setPostHandler(async (url) => {
      if (url.includes('/support-session')) {
        return {
          accessToken: 'support-provider-jwt',
          expiresAt: new Date(1000 + 1800 * 1000).toISOString(),
          supportSession: {
            id: 'session-id-123',
            providerProfileId: targetProfileId,
            providerUserId: 'provider-user-id-456'
          },
          user: {
            id: 'provider-user-id-456',
            email: 'sophie@jouan.fr',
            role: 'PROVIDER'
          }
        }
      }
      if (url === '/auth/refresh') {
        return { accessToken: 'new-admin-access-token' }
      }
      throw new Error(`Unexpected POST url: ${url}`)
    })

    harness.setGetHandler(async (url) => {
      if (url === '/auth/me') {
        return {
          user: {
            id: 'admin-user-id',
            email: 'admin@kaora.app',
            role: 'ADMIN'
          }
        }
      }
      throw new Error(`Unexpected GET url: ${url}`)
    })

    await harness.coordinator.start(targetProfileId)

    // Trigger concurrent restoreAdmin calls
    const p1 = harness.coordinator.restoreAdmin()
    const p2 = harness.coordinator.restoreAdmin()
    assert.strictEqual(p1, p2)

    await Promise.all([p1, p2])

    assert.equal(harness.authStateRef.value.role, 'ADMIN')
    assert.equal(harness.authStateRef.value.accessToken, 'new-admin-access-token')
    assert.equal(harness.authStateRef.value.supportSession, null)
    assert.equal(harness.navigations[harness.navigations.length - 1], `/admin/providers/${targetProfileId}`)
  })

  it('restores admin session when a 401 is triggered via the low-level hook without replay', async () => {
    const harness = createHarness()
    const targetProfileId = '550e8400-e29b-41d4-a716-446655440000'

    harness.setPostHandler(async (url) => {
      if (url.includes('/support-session')) {
        return {
          accessToken: 'support-provider-jwt',
          expiresAt: new Date(1000 + 1800 * 1000).toISOString(),
          supportSession: {
            id: 'session-id-123',
            providerProfileId: targetProfileId,
            providerUserId: 'provider-user-id-456'
          },
          user: {
            id: 'provider-user-id-456',
            email: 'sophie@jouan.fr',
            role: 'PROVIDER'
          }
        }
      }
      if (url === '/auth/refresh') {
        return { accessToken: 'restored-admin-token' }
      }
      return {}
    })

    harness.setGetHandler(async (url) => {
      if (url === '/auth/me') {
        return {
          user: { id: 'admin-user-id', email: 'admin@kaora.app', role: 'ADMIN' }
        }
      }
      return {}
    })

    await harness.coordinator.start(targetProfileId)

    // Déclencher le 401
    await harness.trigger401()

    assert.equal(harness.authStateRef.value.role, 'ADMIN')
    assert.equal(harness.authStateRef.value.accessToken, 'restored-admin-token')
    assert.equal(harness.authStateRef.value.supportSession, null)
  })

  it('handles manual end: calls /auth/support-session/end then restores admin on 204', async () => {
    const harness = createHarness()
    const targetProfileId = '550e8400-e29b-41d4-a716-446655440000'

    harness.setPostHandler(async (url) => {
      if (url.includes('/admin/providers/')) {
        return {
          accessToken: 'support-provider-jwt',
          expiresAt: new Date(1000 + 1800 * 1000).toISOString(),
          supportSession: {
            id: 'session-id-123',
            providerProfileId: targetProfileId,
            providerUserId: 'provider-user-id-456'
          },
          user: {
            id: 'provider-user-id-456',
            email: 'sophie@jouan.fr',
            role: 'PROVIDER'
          }
        }
      }
      if (url === '/auth/support-session/end') {
        return undefined // 204
      }
      if (url === '/auth/refresh') {
        return { accessToken: 'admin-fresh-token' }
      }
      return {}
    })

    harness.setGetHandler(async (url) => {
      if (url === '/auth/me') {
        return { user: { id: 'admin-id', role: 'ADMIN', email: 'admin@kaora.app' } }
      }
      return {}
    })

    await harness.coordinator.start(targetProfileId)
    await harness.coordinator.end()

    assert.equal(harness.authStateRef.value.role, 'ADMIN')
    assert.equal(harness.authStateRef.value.supportSession, null)
    assert.equal(harness.navigations[harness.navigations.length - 1], `/admin/providers/${targetProfileId}`)
  })

  it('reverts to active on 5xx or network error during end() if session not expired', async () => {
    const harness = createHarness()
    const targetProfileId = '550e8400-e29b-41d4-a716-446655440000'

    harness.setPostHandler(async (url) => {
      if (url.includes('/admin/providers/')) {
        return {
          accessToken: 'support-provider-jwt',
          expiresAt: new Date(1000 + 1800 * 1000).toISOString(),
          supportSession: {
            id: 'session-id-123',
            providerProfileId: targetProfileId,
            providerUserId: 'provider-user-id-456'
          },
          user: {
            id: 'provider-user-id-456',
            email: 'sophie@jouan.fr',
            role: 'PROVIDER'
          }
        }
      }
      if (url === '/auth/support-session/end') {
        const err = new Error('Server Error') as Error & { statusCode: number }
        err.statusCode = 500
        throw err
      }
      return {}
    })

    await harness.coordinator.start(targetProfileId)
    await assert.rejects(
      async () => {
        await harness.coordinator.end()
      },
      /Server Error/
    )

    // Session remains active because not expired
    assert.equal(harness.authStateRef.value.role, 'PROVIDER')
    assert.equal(harness.authStateRef.value.supportSession?.phase, 'active')
  })
})
