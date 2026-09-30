import type { UpdateProviderPageRequest } from './pages.contract'

export interface UpdateProviderPageCall {
  path: string
  options: {
    method: 'PUT'
    withAuth: true
    body: UpdateProviderPageRequest
  }
}

export interface GetProviderPagePreviewCall {
  path: string
  options: {
    method: 'GET'
    withAuth: true
  }
}

export interface PublishProviderPageCall {
  path: string
  options: {
    method: 'PATCH'
    withAuth: true
  }
}

export interface UnpublishProviderPageCall {
  path: string
  options: {
    method: 'PATCH'
    withAuth: true
  }
}

/**
 * V2.2b — Pure request builder for the page draft PUT.
 *
 * Extracted from the transport so the path/method/body contract is covered by
 * the Node test runner: the service itself imports Nuxt-bound `apiFetch` and
 * cannot be executed in `tests/`, so a wrong method or path would otherwise
 * ship green (VG-1).
 */
export function buildUpdateProviderPageCall(
  id: string,
  payload: UpdateProviderPageRequest
): UpdateProviderPageCall {
  return {
    path: `/provider/pages/${id}`,
    options: { method: 'PUT', withAuth: true, body: payload }
  }
}

/**
 * V2.2e — Pure request builders for the publication cycle. Same rationale as
 * the PUT builder: the V2.1 endpoints (`GET /preview`, `PATCH /publish`,
 * `PATCH /unpublish`) must be pinned to their exact verb + path.
 */
export function buildProviderPagePreviewCall(id: string): GetProviderPagePreviewCall {
  return {
    path: `/provider/pages/${id}/preview`,
    options: { method: 'GET', withAuth: true }
  }
}

export function buildPublishProviderPageCall(id: string): PublishProviderPageCall {
  return {
    path: `/provider/pages/${id}/publish`,
    options: { method: 'PATCH', withAuth: true }
  }
}

export function buildUnpublishProviderPageCall(id: string): UnpublishProviderPageCall {
  return {
    path: `/provider/pages/${id}/unpublish`,
    options: { method: 'PATCH', withAuth: true }
  }
}
