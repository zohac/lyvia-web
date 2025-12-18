import type { FetchOptions } from 'ofetch'
import { ApiFetchError, isErrorResponse } from './api-error'
import type { RefreshResponse } from '../../features/auth/api/auth.contract'
import { useAuthState } from '../../features/auth/state/auth.state'

type ApiFetchOptions<T> = FetchOptions<'json'> & {
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

function resolveAccessToken(options: ApiFetchOptions<unknown>): string | null {
  if (typeof options.accessToken !== 'undefined') return options.accessToken
  const authState = useAuthState()
  return authState.value.accessToken ?? null
}

async function refreshAccessTokenOnce(baseURL: string): Promise<string | null> {
  if (import.meta.server) return null

  const nuxtApp = useNuxtApp()
  const key = '__lyvia_refresh_in_flight__' as const
  const existing = (nuxtApp as any)[key] as Promise<string | null> | null | undefined
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
      ;(nuxtApp as any)[key] = null
    }
  })()

  ;(nuxtApp as any)[key] = promise
  return promise
}

/**
 * Standardized API client for the whole frontend.
 *
 * - `baseURL` comes from `runtimeConfig.public.apiBase`
 * - `credentials: 'include'` is always enabled (refresh token cookie)
 * - errors are normalized to `ApiFetchError` with `ErrorResponse` support
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions<T> = {}): Promise<T> {
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
    const anyErr = err as Record<string, unknown>
    const statusCode = Number(anyErr.statusCode ?? (anyErr as any)?.response?.status ?? 0) || 0
    const data = (anyErr.data ?? (anyErr as any)?.response?._data) as unknown

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
