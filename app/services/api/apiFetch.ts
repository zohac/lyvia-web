import type { FetchOptions } from 'ofetch'
import { ApiFetchError, isErrorResponse } from './api-error'
import type { RefreshResponse } from '../../features/auth/api/auth.contract'
import { useAuthState } from '../../features/auth/state/auth.state'

type ApiFetchOptions = FetchOptions<'json'> & {
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
  if (!apiBase) return 'http://localhost:3001'
  return normalizeBaseUrl(apiBase)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function resolveAccessToken(options: ApiFetchOptions): string | null {
  if (typeof options.accessToken !== 'undefined') return options.accessToken
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
 * - `credentials: 'include'` is always enabled (refresh token cookie)
 * - errors are normalized to `ApiFetchError` with `ErrorResponse` support
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const baseURL = getDefaultApiBase()
  const withAuth = options.withAuth ?? true
  const retryOn401 = options.retryOn401 ?? withAuth
  const accessToken = withAuth ? resolveAccessToken(options) : null

  const headers = new Headers(options.headers as HeadersInit | undefined)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  try {
    return await $fetch<T>(path, {
      ...options,
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
