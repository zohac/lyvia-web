import type { AuthState } from '../../auth/state/auth.state'
import type { AuthUser } from '../../auth/api/auth.contract'
import {
  buildSupportReturnTo,
  validateStartSupportSessionResponse,
  type StartSupportSessionResponse,
  type SupportSessionState
} from '../api/support-session.contract'

export type ClockPort = {
  now(): number
}

export type TimerPort = {
  setTimeout(callback: () => void, ms: number): unknown
  clearTimeout(handle: unknown): void
}

export type VisibilityPort = {
  onVisibilityChange(callback: (isVisible: boolean) => void): () => void
  isVisible(): boolean
}

export type RawTransportPort = {
  post<T>(url: string, options?: { headers?: Record<string, string>, credentials?: RequestCredentials }): Promise<T>
  get<T>(url: string, options?: { headers?: Record<string, string>, credentials?: RequestCredentials }): Promise<T>
}

export type NavigationPort = {
  navigateTo(path: string, options?: { query?: Record<string, string> }): Promise<void>
}

export type NotificationPort = {
  notify(message: string, type?: 'info' | 'warning' | 'error' | 'success'): void
}

export type SupportSessionCoordinatorDependencies = {
  clock?: ClockPort
  timer?: TimerPort
  visibility?: VisibilityPort
  transport: RawTransportPort
  authStateRef: { value: AuthState }
  invalidateFeatureGate: () => void
  navigation: NavigationPort
  notification?: NotificationPort
  register401Handler?: (handler: () => Promise<void>) => () => void
}

export type SupportSessionCoordinator = {
  start(providerProfileId: string): Promise<void>
  end(): Promise<void>
  restoreAdmin(): Promise<void>
  destroy(): void
  getInFlightRestore(): Promise<void> | null
}

export function createSupportSessionCoordinator(
  deps: SupportSessionCoordinatorDependencies
): SupportSessionCoordinator {
  const clock = deps.clock ?? { now: () => Date.now() }
  const timer = deps.timer ?? {
    setTimeout: (cb, ms) => setTimeout(cb, ms),
    clearTimeout: handle => clearTimeout(handle as NodeJS.Timeout)
  }
  const visibility = deps.visibility
  const transport = deps.transport
  const authStateRef = deps.authStateRef
  const invalidateFeatureGate = deps.invalidateFeatureGate
  const navigation = deps.navigation
  const notification = deps.notification

  let expiryTimerHandle: unknown = null
  let unregisterVisibility: (() => void) | null = null
  let unregister401: (() => void) | null = null
  let inFlightRestorePromise: Promise<void> | null = null
  let isDestroyed = false

  function clearTimer() {
    if (expiryTimerHandle !== null) {
      timer.clearTimeout(expiryTimerHandle)
      expiryTimerHandle = null
    }
  }

  function scheduleExpiryCheck(expiresAt: string) {
    clearTimer()
    const expiryMs = new Date(expiresAt).getTime()
    const nowMs = clock.now()
    const delayMs = Math.max(0, expiryMs - nowMs)

    if (delayMs <= 0) {
      // Déjà expiré
      restoreAdmin()
      return
    }

    expiryTimerHandle = timer.setTimeout(() => {
      expiryTimerHandle = null
      restoreAdmin()
    }, delayMs)
  }

  function handleVisibilityChange(isVisible: boolean) {
    if (!isVisible) return
    const session = authStateRef.value.supportSession
    if (!session || session.phase !== 'active') return

    const expiryMs = new Date(session.expiresAt).getTime()
    if (clock.now() >= expiryMs) {
      restoreAdmin()
    }
  }

  function setupListeners(expiresAt: string) {
    scheduleExpiryCheck(expiresAt)

    if (visibility && !unregisterVisibility) {
      unregisterVisibility = visibility.onVisibilityChange(handleVisibilityChange)
    }

    if (deps.register401Handler && !unregister401) {
      unregister401 = deps.register401Handler(async () => {
        await restoreAdmin()
      })
    }
  }

  function cleanupSessionResources() {
    clearTimer()
    if (unregisterVisibility) {
      unregisterVisibility()
      unregisterVisibility = null
    }
    if (unregister401) {
      unregister401()
      unregister401 = null
    }
  }

  function restoreAdmin(): Promise<void> {
    if (isDestroyed) return Promise.resolve()

    if (inFlightRestorePromise) {
      return inFlightRestorePromise
    }

    const currentSession = authStateRef.value.supportSession
    const returnTo = currentSession?.returnTo || '/admin/providers'

    // Passage en phase restoring
    if (currentSession) {
      authStateRef.value = {
        ...authStateRef.value,
        supportSession: {
          ...currentSession,
          phase: 'restoring'
        }
      }
    }

    cleanupSessionResources()

    const promise = (async () => {
      try {
        invalidateFeatureGate()

        // 1. Refresh admin cookie
        const refreshRes = await transport.post<{ accessToken: string }>('/auth/refresh', {
          credentials: 'include'
        })

        if (!refreshRes || !refreshRes.accessToken) {
          throw new Error('Refresh failed during admin restoration')
        }

        const newAdminAccessToken = refreshRes.accessToken

        // 2. Fetch /auth/me with new token
        const meRes = await transport.get<{ user: AuthUser }>('/auth/me', {
          headers: {
            Authorization: `Bearer ${newAdminAccessToken}`
          }
        })

        if (!meRes || !meRes.user || meRes.user.role !== 'ADMIN') {
          throw new Error('Invalid user or role after admin restoration: expected ADMIN')
        }

        // 3. Atomically publish Admin AuthState
        authStateRef.value = {
          status: 'authenticated',
          user: meRes.user,
          role: 'ADMIN',
          accessToken: newAdminAccessToken,
          expiresAt: null,
          lastError: null,
          supportSession: null
        }

        invalidateFeatureGate()

        // 4. Navigate back to returnTo
        await navigation.navigateTo(returnTo)
      } catch {
        // Fallback login redirect
        authStateRef.value = {
          status: 'guest',
          user: null,
          role: null,
          accessToken: null,
          expiresAt: null,
          lastError: 'Session expired or restoration failed',
          supportSession: null
        }
        invalidateFeatureGate()
        const redirectEncoded = encodeURIComponent(returnTo)
        await navigation.navigateTo(`/login?redirect=${redirectEncoded}`)
      } finally {
        inFlightRestorePromise = null
      }
    })()

    inFlightRestorePromise = promise
    return promise
  }

  async function start(providerProfileId: string): Promise<void> {
    if (isDestroyed) throw new Error('Coordinator is destroyed')
    if (inFlightRestorePromise) throw new Error('Cannot start support session while restore is in progress')

    const currentSession = authStateRef.value.supportSession
    if (currentSession && (currentSession.phase === 'active' || currentSession.phase === 'ending')) {
      throw new Error('A support session is already active')
    }

    const trimmedId = providerProfileId?.trim()
    if (!trimmedId) {
      throw new Error('Invalid providerProfileId')
    }

    const returnTo = buildSupportReturnTo(trimmedId)

    // Call POST /admin/providers/:id/support-session with admin token
    const currentAdminToken = authStateRef.value.accessToken
    if (!currentAdminToken) {
      throw new Error('Admin authentication required to start support session')
    }

    const rawResponse = await transport.post<StartSupportSessionResponse>(
      `/admin/providers/${trimmedId}/support-session`,
      {
        headers: {
          Authorization: `Bearer ${currentAdminToken}`
        }
      }
    )

    const validated = validateStartSupportSessionResponse(rawResponse, trimmedId)

    // Invalidate feature gate before publishing new identity
    invalidateFeatureGate()

    // Setup recovery listeners
    setupListeners(validated.expiresAt)

    // Atomically update auth state
    const newSupportSession: SupportSessionState = {
      id: validated.supportSession.id,
      providerProfileId: validated.supportSession.providerProfileId,
      providerUserId: validated.supportSession.providerUserId,
      expiresAt: validated.expiresAt,
      returnTo,
      phase: 'active'
    }

    authStateRef.value = {
      status: 'authenticated',
      user: validated.user,
      role: 'PROVIDER',
      accessToken: validated.accessToken,
      expiresAt: validated.expiresAt,
      lastError: null,
      supportSession: newSupportSession
    }

    // Invalidate again for provider features
    invalidateFeatureGate()

    // Navigate to coach-page in same tab
    await navigation.navigateTo('/provider/coach-page')
  }

  async function end(): Promise<void> {
    if (isDestroyed) throw new Error('Coordinator is destroyed')
    if (inFlightRestorePromise) return inFlightRestorePromise

    const currentSession = authStateRef.value.supportSession
    if (!currentSession || currentSession.phase !== 'active') {
      throw new Error('No active support session to end')
    }

    const supportBearer = authStateRef.value.accessToken
    if (!supportBearer) {
      return restoreAdmin()
    }

    // Transition to ending phase atomically
    authStateRef.value = {
      ...authStateRef.value,
      supportSession: {
        ...currentSession,
        phase: 'ending'
      }
    }

    try {
      await transport.post<undefined>('/auth/support-session/end', {
        headers: {
          Authorization: `Bearer ${supportBearer}`
        }
      })
      // 204 or successful termination -> restore Admin
      await restoreAdmin()
    } catch (err: unknown) {
      const statusCode = typeof err === 'object' && err !== null && 'statusCode' in err
        ? Number((err as { statusCode?: unknown }).statusCode)
        : typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : typeof err === 'object' && err !== null && 'response' in err && typeof (err as { response?: { status?: unknown } }).response?.status === 'number'
            ? (err as { response: { status: number } }).response.status
            : 0

      if (statusCode === 401) {
        // Token already expired/revoked -> restore Admin
        await restoreAdmin()
        return
      }

      // Network error or 5xx or other non-terminal -> revert to active if not expired
      const expiryMs = new Date(currentSession.expiresAt).getTime()
      if (clock.now() < expiryMs) {
        authStateRef.value = {
          ...authStateRef.value,
          supportSession: {
            ...currentSession,
            phase: 'active'
          }
        }
        if (notification) {
          notification.notify('Échec de la fermeture de session. Vous pouvez réessayer.', 'error')
        }
        throw err
      } else {
        // Already expired -> restore
        await restoreAdmin()
      }
    }
  }

  function destroy() {
    isDestroyed = true
    cleanupSessionResources()
  }

  return {
    start,
    end,
    restoreAdmin,
    destroy,
    getInFlightRestore: () => inFlightRestorePromise
  }
}
