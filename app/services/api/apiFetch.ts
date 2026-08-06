import { ApiFetchError, isErrorResponse } from './api-error'
import type { RefreshResponse } from '../../features/auth/api/auth.contract'
import { useAuthState } from '../../features/auth/state/auth.state'
import { notifyFeatureGate } from '../../features/plans/feature-gate-toast'

type NitroFetchOptions = NonNullable<Parameters<typeof $fetch>[1]>

type ApiFetchOptions = Omit<NitroFetchOptions, 'baseURL' | 'credentials' | 'headers'> & {
  headers?: HeadersInit
  /**
   * Whether to attach the `Authorization: Bearer ...` header when an access
   * token is available.
   *
   * Defaults to `true`.
   */
  withAuth?: boolean
  /**
   * Override access token source (mainly for tests).
   */
  accessToken?: string | null
  /**
   * If the request fails with 401, try to refresh once and replay the request.
   *
   * Defaults to `true` when `withAuth=true`.
   */
  retryOn401?: boolean
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

function getDefaultApiBase(): string {
  const config = useRuntimeConfig()
  const apiBase = (config.public as { apiBase?: string }).apiBase
  if (!apiBase) return '/api'
  return normalizeBaseUrl(apiBase)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Returns a fetch function that propagates request headers during SSR.
 * On the client, this is just $fetch. On the server, it uses useRequestFetch()
 * to forward headers like Host, Cookie, etc. from the original browser request.
 */
function getContextualFetch(): typeof $fetch {
  if (import.meta.server) {
    try {
      return useRequestFetch() as typeof $fetch
    } catch {
      // Fallback if called outside request context
      return $fetch
    }
  }
  return $fetch
}

function resolveAccessToken(accessTokenOverride: string | null | undefined): string | null {
  if (typeof accessTokenOverride !== 'undefined') return accessTokenOverride
  const authState = useAuthState()
  return authState.value.accessToken ?? null
}

async function refreshAccessTokenOnce(baseURL: string): Promise<string | null> {
  if (import.meta.server) return null

  type NuxtAppWithRefreshInFlight = ReturnType<typeof useNuxtApp> & {
    __lyvia_refresh_in_flight__?: Promise<string | null> | null
  }

  const nuxtApp = useNuxtApp() as NuxtAppWithRefreshInFlight
  const existing = nuxtApp.__lyvia_refresh_in_flight__
  if (existing) return existing

  const promise = (async () => {
    try {
      const response = await $fetch<RefreshResponse>('/auth/refresh', {
        baseURL,
        method: 'POST',
        credentials: 'include'
      })

      const authState = useAuthState()
      authState.value.accessToken = response.accessToken
      return response.accessToken
    } catch {
      const authState = useAuthState()
      authState.value.accessToken = null
      return null
    } finally {
      nuxtApp.__lyvia_refresh_in_flight__ = null
    }
  })()

  nuxtApp.__lyvia_refresh_in_flight__ = promise
  return promise
}

function getFetchErrorStatusCode(err: unknown): number {
  if (!isRecord(err)) return 0

  const statusCode = err.statusCode
  if (typeof statusCode === 'number') return statusCode
  if (typeof statusCode === 'string') return Number(statusCode) || 0

  const response = err.response
  if (isRecord(response)) {
    const status = response.status
    if (typeof status === 'number') return status
    if (typeof status === 'string') return Number(status) || 0
  }

  return 0
}

/**
 * Story 18.2 — Capture l'instance Nuxt AVANT le `try` d'`apiFetch`.
 *
 * `useNuxtApp()` lève « instance unavailable » dès qu'il est appelé après un
 * `await` : le `catch` qui déclenche le toast 403 ne peut donc pas la récupérer
 * lui-même. Le `try` interne couvre les appels hors cycle Nuxt (tests, scripts).
 */
function captureNuxtApp(): ReturnType<typeof useNuxtApp> | null {
  if (!import.meta.client) return null
  try {
    return useNuxtApp()
  } catch {
    return null
  }
}

function getFetchErrorData(err: unknown): unknown {
  if (!isRecord(err)) return undefined
  if ('data' in err) return err.data

  const response = err.response
  if (isRecord(response) && '_data' in response) return response._data

  return undefined
}

/**
 * Standardized API client for the whole frontend.
 *
 * - `baseURL` comes from `runtimeConfig.public.apiBase`
 * - `credentials: 'include'` is always set for same-origin cookie handling (httpOnly refresh token)
 * - `withAuth` controls the `Authorization: Bearer` header and 401 retry, not credentials
 * - errors are normalized to `ApiFetchError` with `ErrorResponse` support
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const baseURL = getDefaultApiBase()
  const {
    withAuth = true,
    accessToken: accessTokenOverride,
    retryOn401: retryOn401Override,
    headers: headersInit,
    ...fetchOptions
  } = options

  const retryOn401 = retryOn401Override ?? withAuth
  const accessToken = withAuth ? resolveAccessToken(accessTokenOverride) : null

  const headers = new Headers(headersInit)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const contextFetch = getContextualFetch()
  const nuxtApp = captureNuxtApp()

  try {
    return await contextFetch<T>(path, {
      ...fetchOptions,
      baseURL,
      credentials: 'include',
      headers
    })
  } catch (err: unknown) {
    const statusCode = getFetchErrorStatusCode(err)
    const data = getFetchErrorData(err)

    if (statusCode === 401 && withAuth && retryOn401) {
      const refreshed = await refreshAccessTokenOnce(baseURL)
      if (refreshed) {
        return await apiFetch<T>(path, {
          ...options,
          accessToken: refreshed,
          retryOn401: false
        })
      }

      throw new ApiFetchError({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token'
      })
    }

    // Story 18.2 — Feature gating : un 403 `FEATURE_NOT_AVAILABLE` (guard 18.1
    // ou use-cases 18.3a) déclenche un toast global.
    //
    // L'erreur est TOUJOURS relancée juste en dessous : le flux d'erreur de
    // chaque appelant (mappers `*-error.ts`, états de formulaire) est inchangé.
    if (
      import.meta.client
        && statusCode === 403
        && isErrorResponse(data)
        && data.code === 'FEATURE_NOT_AVAILABLE'
    ) {
      notifyFeatureGate(nuxtApp)
    }

    if (isErrorResponse(data)) {
      throw new ApiFetchError({
        statusCode,
        code: data.code,
        message: data.message,
        details: data.details
      })
    }

    throw new ApiFetchError({
      statusCode,
      code: 'UNKNOWN_ERROR',
      message: 'Une erreur est survenue. Veuillez réessayer.'
    })
  }
}
